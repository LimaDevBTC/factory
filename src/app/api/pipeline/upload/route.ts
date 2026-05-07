import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getCurrentUserOrgMembership } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';
import { uploadToStorage, sessionMediaPath } from '@/lib/storage';

const FieldSchema = z.enum(['consent_audio', 'owner_voice', 'photo']);

/**
 * Upload de mídia da pipeline (consent audio, owner voice, photos do menu).
 * Operator-authenticated. Persiste URL na tabela `media` + atualiza
 * `pitch_sessions` quando relevante (consent_audio_url / owner_voice_url).
 */
export async function POST(req: NextRequest) {
  const session = await getCurrentUserOrgMembership();
  if (!session) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_form' }, { status: 400 });
  }

  const sessionId = formData.get('session_id');
  const fieldRaw = formData.get('field');
  const file = formData.get('file');

  if (typeof sessionId !== 'string' || typeof fieldRaw !== 'string' || !(file instanceof File)) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
  }

  const fieldParse = FieldSchema.safeParse(fieldRaw);
  if (!fieldParse.success) {
    return NextResponse.json({ error: 'invalid_field' }, { status: 400 });
  }
  const field = fieldParse.data;

  const admin = createAdminClient();
  const { data: pitch, error: pitchErr } = await admin
    .from('pitch_sessions')
    .select('id, operator_id, tenant_id')
    .eq('id', sessionId)
    .eq('operator_id', session.user.id)
    .maybeSingle();
  if (pitchErr) return NextResponse.json({ error: pitchErr.message }, { status: 500 });
  if (!pitch) return NextResponse.json({ error: 'session_not_found' }, { status: 404 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || (field === 'photo' ? 'image/jpeg' : 'audio/webm');
  const ext = contentType.startsWith('image/') ? extFromMime(contentType) : 'webm';

  let path: string;
  if (field === 'consent_audio') {
    path = sessionMediaPath(sessionId, 'consent');
  } else if (field === 'owner_voice') {
    path = sessionMediaPath(sessionId, 'owner_voice');
  } else {
    path = sessionMediaPath(sessionId, 'photo', `${crypto.randomUUID()}.${ext}`);
  }

  let uploaded;
  try {
    uploaded = await uploadToStorage({ path, body: buffer, contentType, upsert: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upload_failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // Atualiza pitch_session quando aplicável
  if (field === 'consent_audio') {
    await admin.from('pitch_sessions').update({
      consent_audio_url: uploaded.url,
      updated_at: new Date().toISOString(),
    }).eq('id', sessionId);
  } else if (field === 'owner_voice') {
    await admin.from('pitch_sessions').update({
      owner_voice_url: uploaded.url,
      updated_at: new Date().toISOString(),
    }).eq('id', sessionId);
  }

  // Photos: registra em `media` table se já tem tenant_id criado; senão fica
  // só como URL no storage até o capture criar o tenant.
  if (field === 'photo' && pitch.tenant_id) {
    await admin.from('media').insert({
      tenant_id: pitch.tenant_id,
      storage_key: uploaded.storage_key,
      url: uploaded.url,
      kind: 'menu_photo',
      size_bytes: file.size,
    });
  }

  return NextResponse.json({ ok: true, url: uploaded.url, storage_key: uploaded.storage_key });
}

function extFromMime(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/heic') return 'heic';
  return 'jpg';
}
