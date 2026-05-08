import { Resend } from 'resend';
import type { ReactElement } from 'react';

const FROM = process.env.RESEND_FROM ?? 'Factory <noreply@factory.app>';

let _client: Resend | null = null;
function client(): Resend | null {
  if (_client) return _client;
  if (!process.env.RESEND_API_KEY) return null;
  _client = new Resend(process.env.RESEND_API_KEY);
  return _client;
}

export type SendResult =
  | { ok: true; id: string }
  | { ok: false; reason: 'no_api_key' | 'send_failed'; error?: string };

/**
 * Envia email transacional via Resend. Se RESEND_API_KEY não está configurada,
 * retorna { ok: false, reason: 'no_api_key' } e loga o conteúdo no console
 * (em dev). Não-bloqueante — caller decide se trata como erro.
 */
export async function sendEmail({
  to,
  subject,
  react,
  replyTo,
}: {
  to: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
}): Promise<SendResult> {
  const c = client();
  if (!c) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[email] RESEND_API_KEY não configurada, email não enviado:', { to, subject });
    }
    return { ok: false, reason: 'no_api_key' };
  }

  try {
    const result = await c.emails.send({
      from: FROM,
      to,
      subject,
      react,
      replyTo: replyTo ?? FROM,
    });
    if (result.error) {
      return { ok: false, reason: 'send_failed', error: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? 'unknown' };
  } catch (e) {
    return {
      ok: false,
      reason: 'send_failed',
      error: e instanceof Error ? e.message : 'unknown',
    };
  }
}
