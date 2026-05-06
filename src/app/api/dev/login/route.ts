import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Dev-only fast-login bypass. Pula o magic link via email (Supabase free SMTP +
 * Proton spam classifier = combinação ruim em dev).
 *
 * Fluxo:
 *   1. Admin gera magic link → captura `email_otp` (6 dígitos)
 *   2. Cliente anon verifica o OTP → session com access/refresh tokens
 *   3. SSR helper grava os cookies sb-* na response
 *   4. Redirect pra /pipeline
 *
 * O email tem que existir em auth.users (já existe; criado no pre-flight T1).
 * O email tem que estar em OPERATOR_EMAILS pra entrar no /app/(protected).
 *
 * GET pra colar no browser direto: /api/dev/login?email=foo@bar.com
 * Não funciona em produção (NODE_ENV check).
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'dev only' }, { status: 404 });
  }

  const url = new URL(req.url);
  const email = url.searchParams.get('email')?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json(
      { error: 'missing email query param. Try /api/dev/login?email=you@host' },
      { status: 400 },
    );
  }

  const allowed = (process.env.OPERATOR_EMAILS ?? '')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (!allowed.includes(email)) {
    return NextResponse.json(
      { error: `${email} não está em OPERATOR_EMAILS` },
      { status: 403 },
    );
  }

  const admin = createAdminClient();
  const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 400 });

  const otp = linkData.properties?.email_otp;
  if (!otp) return NextResponse.json({ error: 'no otp generated' }, { status: 500 });

  // req.url usa o host interno do server (localhost) — usa Host header pra
  // que o redirect aterre no mesmo domínio do cookie sb-* (app.lvh.me).
  const hostHeader = req.headers.get('host') ?? url.host;
  const origin = `${url.protocol}//${hostHeader}`;
  const res = NextResponse.redirect(`${origin}/pipeline`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          res.cookies.set({ name, value: '', ...options, maxAge: 0 });
        },
      },
    },
  );

  const { error: otpErr } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'email',
  });
  if (otpErr) {
    return NextResponse.json({ error: otpErr.message }, { status: 400 });
  }

  return res;
}
