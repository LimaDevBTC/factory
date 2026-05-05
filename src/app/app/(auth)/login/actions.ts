'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

const ALLOWED = (process.env.OPERATOR_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

type ActionResult = { ok: true } | { ok: false; message: string };

export async function sendMagicLinkAction(email: string): Promise<ActionResult> {
  const normalized = email.trim().toLowerCase();

  if (!normalized || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
    return { ok: false, message: 'Email inválido.' };
  }

  if (!ALLOWED.includes(normalized)) {
    return {
      ok: false,
      message: 'Esse email não está autorizado. Contate o administrador.',
    };
  }

  const h = headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('host') ?? 'app.lvh.me:3000';
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
