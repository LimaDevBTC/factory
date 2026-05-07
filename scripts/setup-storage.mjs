// Cria o bucket `factory-media` na Supabase Storage com policies RLS pra:
//   - Service role: full read/write (operator uploads via Server Actions)
//   - Anon: read público (sites tenant servem fotos publicamente)
//   - Authenticated: read próprio (donos veem tudo do próprio tenant)
//
// Estrutura de paths:
//   sessions/{session_id}/consent.webm
//   sessions/{session_id}/owner-voice.webm
//   sessions/{session_id}/photos/{uuid}.jpg
//   tenants/{tenant_id}/items/{uuid}.jpg
//   tenants/{tenant_id}/hero.jpg
//
// Run: pnpm setup:storage
// Idempotente — atualiza bucket existente.

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const BUCKET = 'factory-media';
const supabase = createClient(url, key, { auth: { persistSession: false } });

const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
if (listErr) { console.error(listErr); process.exit(1); }

const exists = buckets.some((b) => b.name === BUCKET);
if (!exists) {
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true, // leituras públicas pros sites tenant
    fileSizeLimit: 25 * 1024 * 1024, // 25MB — fotos comprimidas + áudio curto
    allowedMimeTypes: [
      'image/jpeg', 'image/png', 'image/webp', 'image/heic',
      'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg',
    ],
  });
  if (error) { console.error('createBucket:', error); process.exit(1); }
  console.log(`✓ bucket "${BUCKET}" criado (público)`);
} else {
  const { error } = await supabase.storage.updateBucket(BUCKET, {
    public: true,
    fileSizeLimit: 25 * 1024 * 1024,
    allowedMimeTypes: [
      'image/jpeg', 'image/png', 'image/webp', 'image/heic',
      'audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg',
    ],
  });
  if (error) { console.error('updateBucket:', error); process.exit(1); }
  console.log(`✓ bucket "${BUCKET}" já existia, config atualizada`);
}

console.log('storage OK');
