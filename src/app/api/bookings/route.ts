import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOrganizationByRootDomain, getTenantBySlug, getTenantByCustomDomain } from '@/lib/tenant';

const Body = z.object({
  customer_name: z.string().trim().min(2).max(120),
  customer_email: z.string().trim().email().max(200).optional().or(z.literal('')),
  customer_phone: z.string().trim().min(4).max(40),
  party_size: z.number().int().min(1).max(50),
  requested_at: z.string().datetime(),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
  locale: z.string().trim().min(2).max(8).optional(),
  consent: z.literal(true),
  marketing: z.boolean().optional(),
});

const KNOWN_ROOTS = (process.env.KNOWN_ROOT_DOMAINS ?? 'lvh.me,factory.app')
  .split(',').map((d) => d.trim().toLowerCase()).filter(Boolean);

function resolveRootDomain(host: string): string | null {
  if (KNOWN_ROOTS.includes(host)) return host;
  for (const root of KNOWN_ROOTS) {
    if (host.endsWith('.' + root)) return root;
  }
  return null;
}

async function resolveTenantId(req: NextRequest): Promise<string | null> {
  const rawHost = req.headers.get('host') ?? '';
  const host = rawHost.replace(/:\d+$/, '').toLowerCase();
  if (!host) return null;

  const rootDomain = resolveRootDomain(host);
  if (!rootDomain) {
    const tenant = await getTenantByCustomDomain(host);
    return tenant?.id ?? null;
  }

  if (host === rootDomain || host === `www.${rootDomain}`) return null;
  if (host === `app.${rootDomain}`) return null;

  if (host.endsWith(`.${rootDomain}`)) {
    const slug = host.slice(0, -1 - rootDomain.length);
    const org = await getOrganizationByRootDomain(rootDomain);
    if (!org) return null;
    const tenant = await getTenantBySlug(org.id, slug);
    return tenant?.id ?? null;
  }
  return null;
}

function hashSource(ip: string, ua: string): string {
  const salt = process.env.CONSENT_HASH_SALT ?? 'unsalted-dev-only';
  return createHash('sha256').update(`${ip}|${ua}|${salt}`).digest('hex');
}

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  const tenantId = await resolveTenantId(req);
  if (!tenantId) {
    return NextResponse.json({ ok: false, error: 'tenant_not_found' }, { status: 404 });
  }

  const ua = req.headers.get('user-agent') ?? '';
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
  const source_ip_hash = hashSource(ip, ua);

  const supabase = createAdminClient();
  const { error } = await supabase.from('bookings').insert({
    tenant_id: tenantId,
    customer_name: parsed.customer_name,
    customer_email: parsed.customer_email || null,
    customer_phone: parsed.customer_phone,
    party_size: parsed.party_size,
    requested_at: parsed.requested_at,
    notes: parsed.notes || null,
    locale: parsed.locale ?? 'it',
    status: 'pending',
    consent_marketing: !!parsed.marketing,
    source_ip_hash,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: 'persist_failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
