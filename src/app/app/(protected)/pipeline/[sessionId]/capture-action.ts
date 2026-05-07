'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUserOrgMembership } from '@/lib/tenant';
import { VIBES, VIBE_CONFIG, type Vibe } from '@/lib/verticals';
import { pickUniqueSlug } from '@/lib/slug';
import type { HoursJson } from '@/lib/supabase/types';

const HoursPresetSchema = z.enum(['lunch_dinner', 'lunch_only', 'dinner_only', 'all_day', 'cafe_morning']);
type HoursPreset = z.infer<typeof HoursPresetSchema>;

const HOURS_PRESETS: Record<HoursPreset, HoursJson> = {
  lunch_dinner: {
    mon: [{ open: '12:00', close: '15:00' }, { open: '19:30', close: '23:00' }],
    tue: [{ open: '12:00', close: '15:00' }, { open: '19:30', close: '23:00' }],
    wed: [{ open: '12:00', close: '15:00' }, { open: '19:30', close: '23:00' }],
    thu: [{ open: '12:00', close: '15:00' }, { open: '19:30', close: '23:00' }],
    fri: [{ open: '12:00', close: '15:00' }, { open: '19:30', close: '23:30' }],
    sat: [{ open: '12:00', close: '15:00' }, { open: '19:30', close: '23:30' }],
    sun: [{ open: '12:00', close: '15:30' }],
  },
  lunch_only: {
    mon: [{ open: '12:00', close: '15:00' }],
    tue: [{ open: '12:00', close: '15:00' }],
    wed: [{ open: '12:00', close: '15:00' }],
    thu: [{ open: '12:00', close: '15:00' }],
    fri: [{ open: '12:00', close: '15:00' }],
    sat: [{ open: '12:00', close: '15:00' }],
    sun: [],
  },
  dinner_only: {
    mon: [{ open: '19:30', close: '23:00' }],
    tue: [{ open: '19:30', close: '23:00' }],
    wed: [{ open: '19:30', close: '23:00' }],
    thu: [{ open: '19:30', close: '23:00' }],
    fri: [{ open: '19:30', close: '23:30' }],
    sat: [{ open: '19:30', close: '23:30' }],
    sun: [{ open: '19:30', close: '23:00' }],
  },
  all_day: {
    mon: [{ open: '08:00', close: '23:00' }],
    tue: [{ open: '08:00', close: '23:00' }],
    wed: [{ open: '08:00', close: '23:00' }],
    thu: [{ open: '08:00', close: '23:00' }],
    fri: [{ open: '08:00', close: '24:00' }],
    sat: [{ open: '08:00', close: '24:00' }],
    sun: [{ open: '09:00', close: '23:00' }],
  },
  cafe_morning: {
    mon: [{ open: '07:00', close: '13:00' }],
    tue: [{ open: '07:00', close: '13:00' }],
    wed: [{ open: '07:00', close: '13:00' }],
    thu: [{ open: '07:00', close: '13:00' }],
    fri: [{ open: '07:00', close: '13:00' }],
    sat: [{ open: '07:30', close: '13:30' }],
    sun: [],
  },
};

const Body = z.object({
  name: z.string().trim().min(2).max(120),
  vibe: z.enum(VIBES as readonly [Vibe, ...Vibe[]]),
  address: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().max(100).optional().or(z.literal('')),
  postal_code: z.string().trim().max(20).optional().or(z.literal('')),
  province: z.string().trim().max(10).optional().or(z.literal('')),
  partita_iva: z.string().trim().max(20).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  whatsapp: z.string().trim().max(40).optional().or(z.literal('')),
  contact_email: z.string().trim().email().max(200),
  public_email: z.string().trim().email().max(200).optional().or(z.literal('')),
  enabled_locales: z.array(z.enum(['it', 'en', 'de'])).min(1),
  hours_preset: HoursPresetSchema,
});

export async function submitCaptureAction(sessionId: string, formData: FormData) {
  const session = await getCurrentUserOrgMembership();
  if (!session) return { ok: false, message: 'not_authenticated' };

  const supabase = createAdminClient();

  const { data: pitch } = await supabase
    .from('pitch_sessions')
    .select('id, tenant_id, organization_id, operator_id, owner_voice_url, consent_audio_url')
    .eq('id', sessionId)
    .eq('operator_id', session.user.id)
    .maybeSingle();
  if (!pitch) return { ok: false, message: 'session_not_found' };

  const enabledRaw = formData.getAll('enabled_locales').map(String);

  const parsed = Body.safeParse({
    name: formData.get('name'),
    vibe: formData.get('vibe'),
    address: formData.get('address') ?? '',
    city: formData.get('city') ?? '',
    postal_code: formData.get('postal_code') ?? '',
    province: formData.get('province') ?? '',
    partita_iva: formData.get('partita_iva') ?? '',
    phone: formData.get('phone') ?? '',
    whatsapp: formData.get('whatsapp') ?? '',
    contact_email: formData.get('contact_email'),
    public_email: formData.get('public_email') ?? '',
    enabled_locales: enabledRaw,
    hours_preset: formData.get('hours_preset'),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
  }
  const data = parsed.data;

  const vibe = VIBE_CONFIG[data.vibe];
  const hours = HOURS_PRESETS[data.hours_preset];

  // upsert do tenant: cria novo se pitch.tenant_id é null, senão atualiza
  let tenantId = pitch.tenant_id;
  if (!tenantId) {
    const slug = await pickUniqueSlug(data.name, pitch.organization_id, async (s) => {
      const { data: row } = await supabase
        .from('tenants')
        .select('id')
        .eq('organization_id', pitch.organization_id)
        .eq('slug', s)
        .maybeSingle();
      return !!row;
    });

    const { data: newTenant, error: createErr } = await supabase
      .from('tenants')
      .insert({
        organization_id: pitch.organization_id,
        slug,
        name: data.name,
        vibe: data.vibe,
        status: 'draft',
        address: data.address || null,
        city: data.city || null,
        postal_code: data.postal_code || null,
        province: data.province || null,
        country: 'IT',
        partita_iva: data.partita_iva || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        contact_email: data.contact_email,
        public_email: data.public_email || null,
        default_locale: 'it',
        enabled_locales: data.enabled_locales,
        owner_locale: 'it',
        hours_json: hours,
        primary_color: vibe.defaultColors.primary,
        secondary_color: vibe.defaultColors.secondary,
        font_pairing: vibe.fontPairing,
        owner_voice_audio_url: pitch.owner_voice_url,
        owner_voice_consent_at: pitch.consent_audio_url ? new Date().toISOString() : null,
      })
      .select('id')
      .single();
    if (createErr || !newTenant) {
      return { ok: false, message: createErr?.message ?? 'create_tenant_failed' };
    }
    tenantId = newTenant.id;

    await supabase
      .from('pitch_sessions')
      .update({ tenant_id: tenantId, updated_at: new Date().toISOString() })
      .eq('id', sessionId);
  } else {
    const { error: updErr } = await supabase
      .from('tenants')
      .update({
        name: data.name,
        vibe: data.vibe,
        address: data.address || null,
        city: data.city || null,
        postal_code: data.postal_code || null,
        province: data.province || null,
        partita_iva: data.partita_iva || null,
        phone: data.phone || null,
        whatsapp: data.whatsapp || null,
        contact_email: data.contact_email,
        public_email: data.public_email || null,
        enabled_locales: data.enabled_locales,
        hours_json: hours,
        owner_voice_audio_url: pitch.owner_voice_url,
        owner_voice_consent_at: pitch.consent_audio_url ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tenantId);
    if (updErr) return { ok: false, message: updErr.message };
  }

  // Avança stage pra processing — T5 vai pegar daqui
  await supabase
    .from('pitch_sessions')
    .update({ current_stage: 'processing', updated_at: new Date().toISOString() })
    .eq('id', sessionId);

  redirect(`/pipeline/${sessionId}/processing`);
}
