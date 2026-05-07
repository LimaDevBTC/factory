import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserOrgMembership } from '@/lib/tenant';

/**
 * Cria nova pitch_session pro operador atual e redireciona pra primeira stage
 * (approach). target_lang é hard-coded em 'it-IT' em v1 — Cosenza italianófona,
 * sem language picker; multilíngue diáspora é deferido (ver CLAUDE.md decisões
 * 2026-05-06).
 */
export async function GET(request: NextRequest) {
  const session = await getCurrentUserOrgMembership();
  if (!session) {
    return NextResponse.redirect(new URL('/login', browserBase(request)));
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('pitch_sessions')
    .insert({
      organization_id: session.organization.id,
      operator_id: session.user.id,
      current_stage: 'approach',
      target_lang: 'it-IT',
      metadata: {},
    })
    .select('id')
    .single();

  if (error || !data) {
    return NextResponse.redirect(
      new URL(`/pipeline?error=${encodeURIComponent(error?.message ?? 'create_failed')}`, browserBase(request)),
    );
  }

  return NextResponse.redirect(new URL(`/pipeline/${data.id}/approach`, browserBase(request)));
}

function browserBase(request: NextRequest): string {
  const url = new URL(request.url);
  const host = request.headers.get('host') ?? url.host;
  const proto = request.headers.get('x-forwarded-proto') ?? url.protocol.replace(':', '');
  return `${proto}://${host}`;
}
