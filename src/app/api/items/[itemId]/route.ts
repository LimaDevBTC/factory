import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { getCurrentUserOrgMembership } from '@/lib/tenant';
import { createAdminClient } from '@/lib/supabase/admin';

const Body = z.object({
  name_it: z.string().trim().min(1).max(200).optional(),
  description_it: z.string().trim().max(1000).nullable().optional(),
  price_cents: z.number().int().nonnegative().optional(),
  is_available: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { itemId: string } }) {
  const session = await getCurrentUserOrgMembership();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    const message = e instanceof Error ? e.message : 'invalid_body';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verifica que o item pertence a um tenant da org do operator
  const { data: item } = await supabase
    .from('items')
    .select('id, tenant_id, tenants!inner(organization_id)')
    .eq('id', params.itemId)
    .maybeSingle();
  if (!item) return NextResponse.json({ error: 'item_not_found' }, { status: 404 });

  const tenantOrgId = Array.isArray(item.tenants)
    ? (item.tenants[0] as { organization_id: string } | undefined)?.organization_id
    : (item.tenants as { organization_id: string } | undefined)?.organization_id;
  if (tenantOrgId !== session.organization.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { error } = await supabase.from('items').update(parsed).eq('id', params.itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { itemId: string } }) {
  const session = await getCurrentUserOrgMembership();
  if (!session) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const supabase = createAdminClient();
  const { data: item } = await supabase
    .from('items')
    .select('id, tenant_id, tenants!inner(organization_id)')
    .eq('id', params.itemId)
    .maybeSingle();
  if (!item) return NextResponse.json({ error: 'item_not_found' }, { status: 404 });

  const tenantOrgId = Array.isArray(item.tenants)
    ? (item.tenants[0] as { organization_id: string } | undefined)?.organization_id
    : (item.tenants as { organization_id: string } | undefined)?.organization_id;
  if (tenantOrgId !== session.organization.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { error } = await supabase.from('items').delete().eq('id', params.itemId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
