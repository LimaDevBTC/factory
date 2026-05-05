export type OrgRole = 'super_admin' | 'org_admin' | 'operator';
export type BillingJurisdiction = 'br_pj' | 'it_partner' | 'it_srl';
export type LeadSource = 'direct' | 'referral' | 'platform';

export type Organization = {
  id: string;
  slug: string;
  brand_name: string;
  root_domain: string;
  billing_jurisdiction: BillingJurisdiction;
  enabled_pitch_langs: string[];
  stripe_account_id: string | null;
  created_at: string;
  updated_at: string;
};

export type OrgMember = {
  organization_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
};

export type TenantStatus = 'draft' | 'live' | 'suspended' | 'expired';
export type PaymentStatus = 'unpaid' | 'paid_setup_only' | 'active' | 'past_due' | 'refunded';
export type PaymentMethod = 'cash' | 'stripe' | 'satispay' | null;
export type BillingPeriod = '3mo' | '6mo' | '12mo' | 'lifetime';
export type Plan = 'starter' | 'growth' | 'pro' | 'lifetime_legacy';

export type Tenant = {
  id: string;
  organization_id: string;
  slug: string;
  custom_domain: string | null;
  business_name: string;
  vibe: string;
  status: TenantStatus;

  default_locale: string;
  enabled_locales: string[];
  owner_locale: string;

  primary_color: string | null;
  secondary_color: string | null;
  font_pairing: string | null;
  logo_url: string | null;

  p_iva: string | null;
  contact_email: string | null;
  public_email: string | null;
  billing_email: string | null;
  contact_email_verified_at: string | null;

  plan: Plan | null;
  billing_period: BillingPeriod | null;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  cash_collected_at: string | null;
  cash_collected_amount: number | null;
  cash_collected_by: string | null;
  cash_receipt_pdf_url: string | null;

  service_period_starts_at: string | null;
  service_period_ends_at: string | null;
  withdrawal_window_ends_at: string | null;
  withdrawal_waived_at: string | null;
  withdrawal_exercised_at: string | null;

  lead_source: LeadSource;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PitchStage =
  | 'approach' | 'consent' | 'capture' | 'processing'
  | 'ready' | 'present' | 'pricing' | 'close';

export type PitchOutcome = 'won' | 'lost' | 'thinking' | 'no_show' | 'archived' | null;

export type PitchSession = {
  id: string;
  organization_id: string;
  operator_id: string;
  tenant_id: string | null;
  current_stage: PitchStage;
  target_lang: string;

  outcome: PitchOutcome;
  outcome_reason: string | null;
  outcome_notes: string | null;
  follow_up_at: string | null;
  client_satisfied: boolean | null;
  operator_self_rating: number | null;

  consent_audio_url: string | null;
  owner_voice_url: string | null;

  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  tenant_id: string;
  name_it: string;
  name_en: string | null;
  name_de: string | null;
  display_order: number;
  created_at: string;
};

export type Item = {
  id: string;
  tenant_id: string;
  category_id: string;
  name_it: string;
  name_en: string | null;
  name_de: string | null;
  description_it: string | null;
  description_en: string | null;
  description_de: string | null;
  description_ai_generated: boolean;
  price_cents: number;
  allergens: string[];
  dietary: string[];
  image_url: string | null;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};
