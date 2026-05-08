'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const Body = z.object({
  name: z.string().trim().min(2).max(120),
  contact_email: z.string().trim().email().max(200),
  public_email: z.string().trim().email().max(200).optional().or(z.literal('')),
  billing_email: z.string().trim().email().max(200).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  whatsapp: z.string().trim().max(40).optional().or(z.literal('')),
  address: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().max(100).optional().or(z.literal('')),
  postal_code: z.string().trim().max(20).optional().or(z.literal('')),
  province: z.string().trim().max(10).optional().or(z.literal('')),
  enabled_locales: z.array(z.enum(['it', 'en', 'de'])).min(1),
});

async function authorizeTenant(tenantId: string) {
  const ssr = createClient();
  const { data: userData } = await ssr.auth.getUser();
  if (!userData.user) return null;

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from('tenants')
    .select('id, organization_id')
    .eq('id', tenantId)
    .maybeSingle();
  if (!tenant) return null;

  const [{ data: tu }, { data: om }] = await Promise.all([
    admin
      .from('tenant_users')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', userData.user.id)
      .maybeSingle(),
    admin
      .from('org_members')
      .select('role')
      .eq('organization_id', tenant.organization_id)
      .eq('user_id', userData.user.id)
      .maybeSingle(),
  ]);
  if (!tu && !om) return null;
  return admin;
}

export async function saveSettingsAction(
  tenantId: string,
  formData: FormData,
): Promise<{ ok: boolean; message?: string }> {
  const admin = await authorizeTenant(tenantId);
  if (!admin) return { ok: false, message: 'forbidden' };

  const enabledRaw = formData.getAll('enabled_locales').map(String);
  const parsed = Body.safeParse({
    name: formData.get('name'),
    contact_email: formData.get('contact_email'),
    public_email: formData.get('public_email') ?? '',
    billing_email: formData.get('billing_email') ?? '',
    phone: formData.get('phone') ?? '',
    whatsapp: formData.get('whatsapp') ?? '',
    address: formData.get('address') ?? '',
    city: formData.get('city') ?? '',
    postal_code: formData.get('postal_code') ?? '',
    province: formData.get('province') ?? '',
    enabled_locales: enabledRaw,
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
  }
  const d = parsed.data;

  const { error } = await admin
    .from('tenants')
    .update({
      name: d.name,
      contact_email: d.contact_email,
      public_email: d.public_email || null,
      billing_email: d.billing_email || null,
      phone: d.phone || null,
      whatsapp: d.whatsapp || null,
      address: d.address || null,
      city: d.city || null,
      postal_code: d.postal_code || null,
      province: d.province || null,
      enabled_locales: d.enabled_locales,
    })
    .eq('id', tenantId);
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/app/dashboard/${tenantId}`, 'layout');
  return { ok: true };
}
