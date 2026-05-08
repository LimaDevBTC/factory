import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Builds origin from the Host header — `request.url` em Next 14 dev usa o
 * socket interno (localhost:3000) e não o host browser-facing (app.lvh.me),
 * o que faria redirects caírem no domínio errado e o middleware reescrever
 * `/login` pra `/marketing/login` (404).
 */
function browserOrigin(request: NextRequest): string {
  const url = new URL(request.url);
  const host = request.headers.get('host') ?? url.host;
  const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  return `${proto}://${host}`;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const origin = browserOrigin(request);

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { data: sessData, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Decide o destino: operator → /pipeline; tenant owner → /dashboard/<tid>;
  // ambos vazios → /pipeline com erro de membership.
  const userId = sessData.user?.id;
  if (!userId) return NextResponse.redirect(`${origin}/pipeline`);

  const admin = createAdminClient();
  const [{ data: orgMember }, { data: tenantUser }] = await Promise.all([
    admin.from('org_members').select('role').eq('user_id', userId).maybeSingle(),
    admin
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (orgMember) {
    return NextResponse.redirect(`${origin}/pipeline`);
  }
  if (tenantUser) {
    return NextResponse.redirect(`${origin}/dashboard/${tenantUser.tenant_id}`);
  }
  return NextResponse.redirect(`${origin}/pipeline?error=no_membership`);
}
