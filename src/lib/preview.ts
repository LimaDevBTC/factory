import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';

export const PREVIEW_COOKIE_PREFIX = 'factory-preview-';

/**
 * Valida um preview token (pitch_session_id) contra o tenant slug. Retorna
 * true se a session existe, está em uma das stages internas do pipeline, e
 * tem tenant_id que linka ao tenant com o slug dado.
 */
export async function isValidPreviewToken(
  token: string,
  tenantId: string,
): Promise<boolean> {
  if (!token || !tenantId) return false;
  // UUID format básico — evita query inutil
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return false;
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('pitch_sessions')
    .select('id, tenant_id, current_stage')
    .eq('id', token)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  if (!data) return false;
  // Permite preview enquanto o pitch tá nas stages internas (ready/present/pricing/close)
  return ['ready', 'present', 'pricing', 'close'].includes(
    data.current_stage as string,
  );
}

/**
 * Resolve preview token de query param OU cookie. Query param tem precedência
 * (vem da URL inicial do iframe); cookie persiste entre subpáginas após o
 * primeiro hit.
 */
export function readPreviewToken(
  slug: string,
  searchParams: Record<string, string | string[] | undefined>,
): string | null {
  const fromQuery = typeof searchParams.preview === 'string' ? searchParams.preview : null;
  if (fromQuery) return fromQuery;
  const cookieVal = cookies().get(PREVIEW_COOKIE_PREFIX + slug)?.value;
  return cookieVal ?? null;
}
