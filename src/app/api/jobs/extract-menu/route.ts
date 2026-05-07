import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getCurrentUserOrgMembership } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';
import { extractMenu, generateItemCopy } from '@/lib/claude';
import { isValidVibe, type Vibe } from '@/lib/verticals';
import { STORAGE_BUCKET } from '@/lib/storage';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

const Body = z.object({
  pitch_session_id: z.string().uuid(),
});

type Job = {
  id: string;
  pitch_session_id: string;
  tenant_id: string | null;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  job_type: 'extract_menu' | 'generate_copy' | 'build_site' | 'full_pipeline';
};

export async function POST(req: NextRequest) {
  const session = await getCurrentUserOrgMembership();
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: pitch, error: pitchErr } = await supabase
    .from('pitch_sessions')
    .select('id, operator_id, tenant_id, target_lang')
    .eq('id', parsed.pitch_session_id)
    .eq('operator_id', session.user.id)
    .maybeSingle();
  if (pitchErr) return NextResponse.json({ error: pitchErr.message }, { status: 500 });
  if (!pitch) return NextResponse.json({ error: 'session_not_found' }, { status: 404 });
  if (!pitch.tenant_id) {
    return NextResponse.json({ error: 'tenant_not_created' }, { status: 400 });
  }

  // Idempotência: se já tem job ready/processing pra essa session, retorna ele.
  const { data: existing } = await supabase
    .from('factory_jobs')
    .select('id, status')
    .eq('pitch_session_id', parsed.pitch_session_id)
    .eq('job_type', 'extract_menu')
    .in('status', ['queued', 'processing', 'ready'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ ok: true, job_id: existing.id, status: existing.status, reused: true });
  }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, vibe')
    .eq('id', pitch.tenant_id)
    .maybeSingle();
  if (!tenant || !isValidVibe(tenant.vibe)) {
    return NextResponse.json({ error: 'invalid_tenant_vibe' }, { status: 400 });
  }
  const vibe = tenant.vibe as Vibe;

  // Photo URLs vêm do storage da session; também deve ter sido salvo em `media`
  // se tinha tenant_id durante o upload (T4 upload route já faz isso).
  const { data: storageList } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(`sessions/${parsed.pitch_session_id}/photos`, { limit: 30 });
  const photoUrls = (storageList ?? [])
    .filter((f) => !f.name.startsWith('.'))
    .map((f) => {
      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(`sessions/${parsed.pitch_session_id}/photos/${f.name}`);
      return data.publicUrl;
    });

  if (photoUrls.length === 0) {
    return NextResponse.json({ error: 'no_photos_uploaded' }, { status: 400 });
  }

  const { data: job, error: jobErr } = await supabase
    .from('factory_jobs')
    .insert({
      pitch_session_id: parsed.pitch_session_id,
      tenant_id: tenant.id,
      job_type: 'extract_menu',
      status: 'queued',
      input_data: { vibe, photo_urls: photoUrls },
    })
    .select('id')
    .single();
  if (jobErr || !job) {
    return NextResponse.json({ error: jobErr?.message ?? 'job_create_failed' }, { status: 500 });
  }

  // Roda síncrono — Vercel free tier não tem queue, e como o user fica na
  // página /processing polling, é OK levar 30-60s. Pra escalar move pra
  // edge worker / supabase function depois.
  runExtractionJob({ jobId: job.id, pitchSessionId: parsed.pitch_session_id, tenantId: tenant.id, vibe, photoUrls })
    .catch(async (e) => {
      await supabase
        .from('factory_jobs')
        .update({
          status: 'failed',
          error_message: e instanceof Error ? e.message : 'unknown_error',
          completed_at: new Date().toISOString(),
        })
        .eq('id', job.id);
    });

  return NextResponse.json({ ok: true, job_id: job.id, status: 'queued' });
}

async function runExtractionJob({
  jobId,
  pitchSessionId,
  tenantId,
  vibe,
  photoUrls,
}: {
  jobId: string;
  pitchSessionId: string;
  tenantId: string;
  vibe: Vibe;
  photoUrls: string[];
}) {
  const supabase = createAdminClient();

  await supabase
    .from('factory_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', jobId);

  const result = await extractMenu({ photoUrls, vibe, tenantId, pitchSessionId });

  // Cria categorias
  const categoryNameToId = new Map<string, string>();
  for (const cat of result.categories) {
    const slug = slugify(cat.name_it);
    const { data, error } = await supabase
      .from('categories')
      .insert({
        tenant_id: tenantId,
        slug: await uniqueCategorySlug(supabase, tenantId, slug),
        name_it: cat.name_it,
        display_order: cat.display_order,
      })
      .select('id')
      .single();
    if (error || !data) throw new Error(`category insert failed: ${error?.message}`);
    categoryNameToId.set(cat.name_it, data.id);
  }

  // Cria items
  const itemRows = result.items.map((item, idx) => ({
    tenant_id: tenantId,
    category_id: categoryNameToId.get(item.category_name_it) ?? null,
    slug: slugify(item.name_it),
    name_it: item.name_it,
    description_it: item.description_it,
    description_ai_generated: false, // foram extraídas, não geradas
    price_cents: item.price_cents,
    currency: 'EUR',
    allergens: item.allergens,
    dietary: item.dietary,
    is_available: true,
    display_order: idx,
  }));
  if (itemRows.length > 0) {
    const { error: itemErr } = await supabase.from('items').insert(itemRows);
    if (itemErr) throw new Error(`items insert failed: ${itemErr.message}`);
  }

  // Translation pass: pra cada item sem description_it ou novos, gera EN/DE
  // Skip por enquanto pra reduzir custo do primeiro test. Re-enable depois.
  void generateItemCopy;

  await supabase
    .from('factory_jobs')
    .update({
      status: 'ready',
      completed_at: new Date().toISOString(),
      output_data: {
        categories_count: result.categories.length,
        items_count: result.items.length,
      },
    })
    .eq('id', jobId);

  await supabase
    .from('pitch_sessions')
    .update({ current_stage: 'ready', ready_at: new Date().toISOString() })
    .eq('id', pitchSessionId);
}

function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'item';
}

async function uniqueCategorySlug(
  supabase: ReturnType<typeof createAdminClient>,
  tenantId: string,
  base: string,
): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await supabase
      .from('categories')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('slug', candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}

// GET retorna status do job mais recente da session
export async function GET(req: NextRequest) {
  const session = await getCurrentUserOrgMembership();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const url = new URL(req.url);
  const sessionId = url.searchParams.get('pitch_session_id');
  if (!sessionId) return NextResponse.json({ error: 'missing_session_id' }, { status: 400 });

  const supabase = createAdminClient();
  const { data: pitch } = await supabase
    .from('pitch_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('operator_id', session.user.id)
    .maybeSingle();
  if (!pitch) return NextResponse.json({ error: 'session_not_found' }, { status: 404 });

  const { data: job } = await supabase
    .from('factory_jobs')
    .select('id, status, error_message, output_data, started_at, completed_at')
    .eq('pitch_session_id', sessionId)
    .eq('job_type', 'extract_menu')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ ok: true, job: job ?? null });
}
