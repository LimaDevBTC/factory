import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

const StatusSchema = z.enum([
  'pending', 'confirmed', 'declined', 'cancelled', 'no_show', 'completed',
]);

const Body = z.object({
  status: StatusSchema,
});

/**
 * Owner/operator atualiza status de uma prenotação. Auth: requer sessão.
 * Autorização: user é tenant_users do tenant_id da booking OU org_member da
 * organização dona do tenant.
 */
export async function PATCH(req: NextRequest, { params }: { params: { bookingId: string } }) {
  const ssr = createClient();
  const { data: userData } = await ssr.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const userId = userData.user.id;

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'invalid_body' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('id, tenant_id, tenants!inner(organization_id)')
    .eq('id', params.bookingId)
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: 'booking_not_found' }, { status: 404 });

  const orgId = Array.isArray(booking.tenants)
    ? (booking.tenants[0] as { organization_id: string } | undefined)?.organization_id
    : (booking.tenants as { organization_id: string } | undefined)?.organization_id;

  const [{ data: tenantUser }, { data: orgMember }] = await Promise.all([
    admin.from('tenant_users').select('role').eq('tenant_id', booking.tenant_id).eq('user_id', userId).maybeSingle(),
    orgId
      ? admin.from('org_members').select('role').eq('organization_id', orgId).eq('user_id', userId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  if (!tenantUser && !orgMember) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { error } = await admin
    .from('bookings')
    .update({ status: parsed.status })
    .eq('id', params.bookingId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
