export type OrgRole = 'super_admin' | 'org_admin' | 'operator';
export type BillingJurisdiction = 'br_pj' | 'it_partner' | 'it_srl';
export type LeadSource = 'direct' | 'platform_inbound' | 'referral' | 'partner' | 'other';

export type Vibe =
  | 'trattoria_familiare' | 'osteria_tipica' | 'ristorante_elegante'
  | 'agriturismo' | 'pizzeria_moderna'
  | 'caffetteria' | 'panineria_street_food' | 'bar_aperitivo'
  | 'gelateria_artigianale' | 'pasticceria'
  | 'enoteca_wine_bar' | 'birreria_pub';

export type Locale =
  | 'it' | 'en' | 'de' | 'fr' | 'es' | 'pt' | 'zh' | 'ar' | 'hi'
  | 'pa' | 'ro' | 'ru' | 'uk' | 'tr' | 'ja' | 'ko'
  | 'sq' | 'bn' | 'am' | 'tl' | 'vi' | 'ur';

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

export type TenantStatus = 'draft' | 'live' | 'suspended' | 'deleted';
export type Plan = 'starter' | 'growth' | 'pro';
export type BillingPeriod =
  | 'monthly' | 'prepaid_3mo' | 'prepaid_6mo' | 'prepaid_12mo' | 'lifetime_legacy';
export type PaymentStatus =
  | 'pending' | 'paid_setup_only' | 'active' | 'past_due' | 'cancelled' | 'refunded';
export type PaymentMethod =
  | 'cash' | 'stripe_checkout' | 'stripe_link' | 'satispay' | 'sepa' | 'manual_invoice'
  | null;

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type HoursSlot = { open: string; close: string };
export type HoursJson = Partial<Record<DayOfWeek, HoursSlot[]>>;

export type Tenant = {
  id: string;
  organization_id: string;
  slug: string;
  custom_domain: string | null;

  name: string;
  partita_iva: string | null;
  codice_fiscale: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  region: string | null;
  postal_code: string | null;
  country: string;
  phone: string | null;
  whatsapp: string | null;

  contact_email: string | null;
  contact_email_verified_at: string | null;
  public_email: string | null;
  billing_email: string | null;
  website_legacy: string | null;

  vibe: Vibe;

  primary_color: string | null;
  secondary_color: string | null;
  font_pairing: string | null;
  logo_url: string | null;
  hero_image_url: string | null;

  tagline_it: string | null;
  tagline_en: string | null;
  tagline_de: string | null;
  description_it: string | null;
  description_en: string | null;
  description_de: string | null;

  default_locale: Locale;
  enabled_locales: Locale[];
  owner_locale: Locale;

  hours_json: HoursJson | null;

  status: TenantStatus;
  lead_source: LeadSource;
  lead_source_detail: string | null;

  plan: Plan;
  billing_period: BillingPeriod;
  service_period_starts_at: string | null;
  service_period_ends_at: string | null;

  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  cash_collected_at: string | null;
  cash_collected_amount: number | null;
  cash_collected_by: string | null;
  cash_receipt_pdf_url: string | null;

  withdrawal_window_ends_at: string | null;
  withdrawal_waived_at: string | null;
  withdrawal_exercised_at: string | null;

  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  tenant_id: string;
  slug: string;
  name_it: string;
  name_en: string | null;
  name_de: string | null;
  description_it: string | null;
  display_order: number;
  created_at: string;
};

export type Item = {
  id: string;
  tenant_id: string;
  category_id: string | null;
  slug: string | null;
  name_it: string;
  name_en: string | null;
  name_de: string | null;
  description_it: string | null;
  description_en: string | null;
  description_de: string | null;
  description_ai_generated: boolean;
  price_cents: number;
  currency: string;
  image_url: string | null;
  allergens: Allergen[];
  dietary: Dietary[];
  is_available: boolean;
  display_order: number;
  vintage_year: number | null;
  origin: string | null;
  abv: number | null;
  volume_ml: number | null;
  created_at: string;
  updated_at: string;
};

export const ALLERGENS = [
  'glutine','crostacei','uova','pesce','arachidi','soia','latte',
  'frutta_a_guscio','sedano','senape','sesamo','anidride_solforosa',
  'lupini','molluschi',
] as const;
export type Allergen = (typeof ALLERGENS)[number];

export const DIETARY = [
  'vegetariano','vegano','senza_glutine','senza_lattosio',
  'piccante','bio','km_zero','halal','kosher',
] as const;
export type Dietary = (typeof DIETARY)[number];

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

export type Booking = {
  id: string;
  tenant_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  party_size: number;
  requested_at: string;
  notes: string | null;
  locale: string;
  status: 'pending' | 'confirmed' | 'declined' | 'cancelled' | 'no_show' | 'completed';
  consent_marketing: boolean;
  source_ip_hash: string | null;
  created_at: string;
};
