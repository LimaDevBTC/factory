'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const OPERATOR_EMAILS = (process.env.OPERATOR_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

type ActionResult = { ok: true } | { ok: false; message: string };

/**
 * Magic link self-serve. Aceita:
 *  1. Operator emails (lista em OPERATOR_EMAILS env)
 *  2. Tenant owners (email = contact_email de algum tenant 'live' onde eles
 *     têm row em tenant_users)
 */
export async function sendMagicLinkAction(email: string): Promise<ActionResult> {
  const normalized = email.trim().toLowerCase();

  if (!normalized || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
    return { ok: false, message: 'Email inválido.' };
  }

  let allowed = OPERATOR_EMAILS.includes(normalized);

  // Não é operator? Verifica se é tenant owner — looking up via auth.users
  // (que existe se cashCloseAction provisionou) + tenant_users link.
  if (!allowed) {
    try {
      const admin = createAdminClient();
      const { data: users } = await admin.auth.admin.listUsers();
      const user = users.users.find((u) => u.email?.toLowerCase() === normalized);
      if (user) {
        const { data: tu } = await admin
          .from('tenant_users')
          .select('tenant_id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();
        if (tu) allowed = true;
      }
    } catch {
      // se falhar lookup, segue como não-allowed
    }
  }

  if (!allowed) {
    return {
      ok: false,
      message:
        'Esse email não está autorizado. Se você é cliente, use o email que cadastrou no momento da compra. Se é operador, contate o administrador.',
    };
  }

  const h = headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('host') ?? 'app.lvh.me:3001';
  const redirect = `${proto}://${host}/callback`;

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: normalized,
    options: { emailRedirectTo: redirect },
  });

  if (error) {
    return { ok: false, message: `Falha ao enviar: ${error.message}` };
  }
  return { ok: true };
}
