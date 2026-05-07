import { createAdminClient } from '@/lib/supabase/admin';

export const STORAGE_BUCKET = 'factory-media';

/**
 * Sobe um arquivo (audio/imagem) usando service role. Path é tenant/session
 * scoped. Retorna a URL pública (bucket é public-read).
 */
export async function uploadToStorage({
  path,
  body,
  contentType,
  upsert = false,
}: {
  path: string;
  body: Blob | ArrayBuffer | Buffer | Uint8Array;
  contentType: string;
  upsert?: boolean;
}): Promise<{ url: string; storage_key: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, body, {
      contentType,
      upsert,
      cacheControl: '3600',
    });
  if (error) throw error;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, storage_key: path };
}

export function sessionMediaPath(sessionId: string, kind: 'consent' | 'owner_voice' | 'photo', filename?: string): string {
  if (kind === 'consent') return `sessions/${sessionId}/consent.webm`;
  if (kind === 'owner_voice') return `sessions/${sessionId}/owner-voice.webm`;
  return `sessions/${sessionId}/photos/${filename ?? `${crypto.randomUUID()}.jpg`}`;
}
