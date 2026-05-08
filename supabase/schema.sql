-- Factory — Supabase schema
-- Run on a fresh Supabase project (region: Frankfurt eu-central-1)
-- Author: Edson + Claude Code, 2026-05

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ============================================================================
-- Organizations — agencies/operators that resell Factory
-- v1: only one (Edson's). Architecture is SaaS-ready: more orgs join later.
-- Each org has its own root domain, branding, Stripe Connect account.
-- ============================================================================
create table public.organizations (
  id              uuid primary key default gen_random_uuid(),
  slug            citext unique not null,            -- 'factory-edson', 'webfacil-br', 'primapagina-it'
  brand_name      text not null,                     -- shown in operator UI and tenant dashboards
  logo_url        text,
  primary_color   text default '#0F172A',
  -- Domain config — middleware reads this to resolve hostnames per org
  root_domain     citext unique not null,            -- 'thefactory.life' (Edson), 'webfacil.com.br' (operador BR)
  app_subdomain   text default 'app',                -- e.g. 'app' → app.thefactory.life
  -- Billing — Stripe Connect Express
  stripe_account_id text,                            -- acct_xxx of the connected Stripe of the operator
  stripe_charges_enabled boolean default false,
  stripe_payouts_enabled boolean default false,
  -- Plan (Factory charges the org, not the org's clients)
  platform_plan   text default 'founder'
                  check (platform_plan in ('founder','starter','growth','enterprise')),
  platform_subscription_id text,
  -- Operational
  status          text default 'active' check (status in ('active','suspended','closed')),
  country         text default 'IT',
  default_pitch_lang text default 'it-IT',           -- the org's primary market language
  enabled_pitch_langs text[] default array['it-IT','en-US']::text[],
  -- Billing jurisdiction: which entity issues invoices and receives payments.
  -- 'br_pj': Brazilian PJ (Edson's existing CNPJ via Stripe Brasil + Wise EUR)
  --          → invoice as export of services, EU B2B reverse charge applies
  -- 'it_partner': Italian partner P.IVA (e.g. Vavà's regime forfettario via Stripe Italy)
  --          → fattura italiana semplificata, no SDI required at low volumes
  -- 'it_srl': Edson's Italian SRL once registered (Stripe Italy + Tax + SDI Invoicing)
  --          → full fattura elettronica with SDI submission, IVA 22%
  billing_jurisdiction text default 'br_pj'
                       check (billing_jurisdiction in ('br_pj','it_partner','it_srl')),
  billing_jurisdiction_message_it text,             -- shown to client at checkout, e.g.
                                                    -- "La fattura sarà emessa dal Brasile (esportazione di servizi)..."
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_organizations_slug on public.organizations(slug);
create index idx_organizations_root_domain on public.organizations(root_domain);

-- Bootstrap row for Edson's organization
insert into public.organizations (slug, brand_name, root_domain, country, default_pitch_lang, enabled_pitch_langs)
values ('factory-edson', 'Factory', 'thefactory.life', 'IT', 'it-IT', array['it-IT','en-US']::text[])
on conflict (slug) do nothing;

-- ============================================================================
-- Org members — who works at each organization, with what role
-- ============================================================================
create table public.org_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null
                  check (role in ('super_admin','org_admin','operator')),
  -- super_admin: Factory platform team (Edson v1)
  -- org_admin: manages an organization, invites operators, sees all org tenants
  -- operator: field salesperson, sees only their own pitches/tenants
  created_at      timestamptz default now(),
  primary key (organization_id, user_id)
);

create index idx_org_members_user on public.org_members(user_id);

-- ============================================================================
-- Tenants — one row per business (the agency's clients).
-- Now scoped to an organization.
-- ============================================================================
create table public.tenants (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  slug            citext not null,                   -- subdomain, lowercase, [a-z0-9-]
  custom_domain   citext unique,                     -- 'trattoriadaluigi.it'
  name            text not null,
  partita_iva     text,
  codice_fiscale  text,
  address         text,
  city            text,
  province        text,                              -- 'CS' for Cosenza
  region          text,                              -- 'Calabria'
  postal_code     text,
  country         text default 'IT',
  phone           text,
  whatsapp        text,
  -- Three distinct email roles (one person may use the same address for all three):
  --   contact_email: admin/owner — receives magic links, support, account-related emails
  --   public_email: shown on the public site (footer, contact page) — may be info@ alias
  --   billing_email: receives Stripe invoices — may be the commercialista
  -- contact_email is REQUIRED before tenant goes live (enforced via check below).
  -- public_email and billing_email default to contact_email at read time if null.
  contact_email   citext,
  contact_email_verified_at timestamptz,           -- when owner clicked confirmation link
  public_email    citext,
  billing_email   citext,
  website_legacy  text,
  vibe            text default 'trattoria_familiare'
                  check (vibe in (
                    -- sit-down meals
                    'trattoria_familiare',
                    'osteria_tipica',
                    'ristorante_elegante',
                    'agriturismo',
                    'pizzeria_moderna',
                    -- cafés & quick
                    'caffetteria',
                    'panineria_street_food',
                    'bar_aperitivo',
                    -- sweets
                    'gelateria_artigianale',
                    'pasticceria',
                    -- beverage-led
                    'enoteca_wine_bar',
                    'birreria_pub'
                  )),
  primary_color   text default '#8B0000',
  secondary_color text default '#F5E6D3',
  font_pairing    text default 'cinzel_inter',
  logo_url        text,
  hero_image_url  text,
  tagline_it      text,
  tagline_en      text,
  tagline_de      text,
  description_it  text,
  description_en  text,
  description_de  text,
  default_locale  text default 'it'
                  check (default_locale in (
                    'it','en','de','fr','es','pt','zh','ar','hi','pa','ro','ru','uk','tr','ja','ko','sq','bn','am','tl','vi','ur'
                  )),
  enabled_locales text[] default array['it','en']::text[],
  -- Owner's preferred language for the dashboard (may differ from default_locale)
  owner_locale    text default 'it',
  hours_json      jsonb,                             -- { mon: [{open: "12:00", close: "15:00"}, ...], ... }
  -- Owner voice capture (consent + persona seed for future WhatsApp agent)
  owner_voice_audio_url    text,
  owner_voice_transcript   text,
  owner_voice_consent_at   timestamptz,
  status          text default 'draft'
                  check (status in ('draft','live','suspended','deleted')),
  -- Lead source (Model 3 future-proofing): how did this client arrive?
  -- 'direct': operator pitched in person (Model 1/2)
  -- 'platform_inbound': client requested service via platform (Model 3, future)
  -- 'referral': existing client referred them
  -- 'partner': partner channel (e.g. local chamber of commerce, association)
  lead_source     text default 'direct'
                  check (lead_source in ('direct','platform_inbound','referral','partner','other')),
  lead_source_detail text,                          -- e.g. referrer's tenant_id, or campaign name
  plan            text default 'starter'
                  check (plan in ('starter','growth','pro')),
  -- Billing period: monthly (post-Stripe), prepaid packages (cash-first launch)
  billing_period  text default 'prepaid_6mo'
                  check (billing_period in (
                    'monthly',           -- post-Stripe monthly recurring (future)
                    'prepaid_3mo',       -- €50 Starter — trial pago, entry-level
                    'prepaid_6mo',       -- €99 Starter — default sweet spot
                    'prepaid_12mo',      -- €179 Starter — lock-in convicto, custom domain incluso
                    'lifetime_legacy'    -- €690 single payment — never promote, exception only
                  )),
  -- Service period (for prepaid packages — when the prepaid period ends)
  service_period_starts_at timestamptz,
  service_period_ends_at   timestamptz,
  -- Renewal reminder schedule
  renewal_reminder_30d_sent_at timestamptz,
  renewal_reminder_7d_sent_at  timestamptz,
  renewal_reminder_1d_sent_at  timestamptz,
  stripe_customer_id     text,
  stripe_subscription_id text,
  -- Terms acceptance (legally binding under D.Lgs 70/2003 + Codice Civile)
  terms_accepted_at      timestamptz,
  terms_version          text,                         -- e.g. '2026-05-01'
  privacy_accepted_at    timestamptz,
  privacy_version        text,
  dpa_accepted_at        timestamptz,
  dpa_version            text,
  marketing_consent      boolean default false,        -- optional, separate
  acceptance_ip_hash     text,                         -- sha256(ip + salt) for audit
  acceptance_user_agent  text,
  -- Right of withdrawal (Italian law: 14 days for online service contracts)
  withdrawal_window_ends_at timestamptz,
  withdrawal_exercised_at   timestamptz,
  -- Explicit waiver of right of withdrawal (only valid if service was completed immediately,
  -- e.g. site was published live during the in-person sale). Codice del Consumo art. 59.
  -- Without this waiver, prepaid cash sales must allow refund within 14 days regardless.
  withdrawal_waived_at      timestamptz,
  withdrawal_waiver_text    text,                    -- exact text shown when waived
  -- Payment lifecycle (separate from `status` which is publication state)
  payment_status  text default 'pending'
                  check (payment_status in (
                    'pending',           -- not yet paid
                    'paid_setup_only',   -- setup paid, recurring not started (pre_srl_mode org)
                    'active',            -- recurring subscription active
                    'past_due',          -- payment failed, retry in progress
                    'cancelled',         -- subscription ended
                    'refunded'           -- withdrawn within 14-day window
                  )),
  payment_method  text check (payment_method in (
                    'cash',              -- in-loco cash collection (operator confirms manually)
                    'stripe_checkout',   -- standard Stripe Checkout via QR
                    'stripe_link',       -- Stripe payment link sent via WhatsApp/email
                    'satispay',          -- Italian Satispay (post-SRL)
                    'sepa',              -- SEPA Direct Debit
                    'manual_invoice'     -- bank transfer with manual reconciliation
                  )),
  -- Cash collection specific (when payment_method = 'cash')
  cash_collected_at      timestamptz,           -- when operator confirmed cash received
  cash_collected_amount  int,                   -- amount in cents, may differ from plan setup if discount/promo
  cash_collected_by      uuid references auth.users(id),  -- which operator collected
  cash_receipt_pdf_url   text,                  -- generated receipt sent to client
  -- Recurring opt-in (when setup was cash but recurring will be Stripe later)
  recurring_invitation_sent_at timestamptz,      -- when "active your subscription" email went out
  recurring_activated_at       timestamptz,      -- when client confirmed recurring via Stripe
  published_at    timestamptz,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_tenants_slug on public.tenants(organization_id, slug);
-- Slug must be unique within an organization, not globally
-- (different orgs can have a tenant called 'da-luigi' on their own domains)
create unique index idx_tenants_slug_unique_per_org on public.tenants(organization_id, slug);
create index idx_tenants_custom_domain on public.tenants(custom_domain) where custom_domain is not null;
create index idx_tenants_status on public.tenants(status);
create index idx_tenants_organization on public.tenants(organization_id);

-- Live tenants MUST have contact_email (enforced at status transition)
alter table public.tenants add constraint tenants_live_requires_email
  check (status != 'live' or contact_email is not null);

-- ============================================================================
-- Tenant users — links Supabase auth.users to tenants
-- ============================================================================
create table public.tenant_users (
  tenant_id  uuid not null references public.tenants(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'owner'
             check (role in ('owner','staff','operator')),
  created_at timestamptz default now(),
  primary key (tenant_id, user_id)
);

create index idx_tenant_users_user on public.tenant_users(user_id);

-- ============================================================================
-- Categories — menu sections per tenant
-- ============================================================================
create table public.categories (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id) on delete cascade,
  slug          text not null,                      -- 'antipasti', 'primi', 'pizze', 'vini'
  name_it       text not null,
  name_en       text,
  name_de       text,
  description_it text,
  display_order int default 0,
  created_at    timestamptz default now(),
  unique (tenant_id, slug)
);

create index idx_categories_tenant on public.categories(tenant_id);

-- ============================================================================
-- Items — menu items (dishes, drinks, gusti, coppe, panini, vini, ...)
-- Generic across all F&B verticals: a gelateria has gusti, a trattoria has piatti,
-- an enoteca has vini. All are `items` from the schema's perspective.
-- ============================================================================
create table public.items (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  category_id     uuid references public.categories(id) on delete set null,
  slug            text,
  name_it         text not null,
  name_en         text,
  name_de         text,
  description_it  text,
  description_en  text,
  description_de  text,
  description_ai_generated boolean default false,   -- AI Act flag
  price_cents     int not null default 0,            -- €12.50 = 1250, €0.90 (caffè) = 90
  currency        text default 'EUR',
  image_url       text,
  allergens       text[] default array[]::text[],   -- EU 14 allergens, snake_case IT
  dietary         text[] default array[]::text[],   -- 'vegetariano','vegano','senza_glutine'
  is_available    boolean default true,
  display_order   int default 0,
  -- vertical-specific fields (nullable, used only by relevant vibes)
  vintage_year    int,                              -- enoteca: anno
  origin          text,                             -- enoteca: regione/cantina; gelateria: provenienza ingrediente
  abv             numeric(4,2),                     -- enoteca/birreria: gradazione
  volume_ml       int,                              -- bevande: volume in ml
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index idx_items_tenant on public.items(tenant_id);
create index idx_items_category on public.items(category_id);

-- Enforce that allergens only contain values from the EU 14 list
alter table public.items add constraint items_allergens_valid
  check (allergens <@ array[
    'glutine','crostacei','uova','pesce','arachidi','soia','latte',
    'frutta_a_guscio','sedano','senape','sesamo','anidride_solforosa',
    'lupini','molluschi'
  ]::text[]);

-- ============================================================================
-- Media — uploaded images (R2-backed)
-- ============================================================================
create table public.media (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid not null references public.tenants(id) on delete cascade,
  storage_key text not null,                         -- R2 path
  url         text not null,
  kind        text check (kind in ('menu_photo','hero','logo','item','facade','interior')),
  width       int,
  height      int,
  size_bytes  bigint,
  alt_text_it text,
  created_at  timestamptz default now()
);

create index idx_media_tenant on public.media(tenant_id);

-- ============================================================================
-- Bookings — reservation requests (v1: form submissions, no calendar)
-- ============================================================================
create table public.bookings (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  customer_name  text not null,
  customer_email citext,
  customer_phone text not null,
  party_size     int not null check (party_size > 0 and party_size <= 50),
  requested_at   timestamptz not null,
  notes          text,
  locale         text default 'it',
  status         text default 'pending'
                 check (status in ('pending','confirmed','declined','cancelled','no_show','completed')),
  consent_marketing boolean default false,
  source_ip_hash text,
  created_at     timestamptz default now()
);

create index idx_bookings_tenant on public.bookings(tenant_id, requested_at desc);

-- ============================================================================
-- Consents — GDPR cookie consent records (pseudonymous)
-- ============================================================================
create table public.consents (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid not null references public.tenants(id) on delete cascade,
  visitor_hash   text not null,                     -- sha256(ip + user_agent + salt)
  necessary      boolean default true,
  analytics      boolean default false,
  marketing      boolean default false,
  granted_at     timestamptz default now(),
  expires_at     timestamptz default (now() + interval '13 months'),
  user_agent     text,
  locale         text
);

create index idx_consents_tenant on public.consents(tenant_id);
create index idx_consents_hash on public.consents(visitor_hash);

-- ============================================================================
-- Audit log — every meaningful action
-- ============================================================================
create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references public.tenants(id) on delete cascade,
  actor_type  text check (actor_type in ('admin','tenant_owner','operator','system','public')),
  actor_id    text,
  action      text not null,                        -- 'tenant.create', 'menu.extract', 'gdpr.delete', ...
  entity_type text,
  entity_id   text,
  metadata    jsonb,
  created_at  timestamptz default now()
);

create index idx_audit_tenant on public.audit_log(tenant_id, created_at desc);
create index idx_audit_action on public.audit_log(action);

-- ============================================================================
-- AI calls log — EU AI Act traceability
-- ============================================================================
create table public.ai_calls (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid references public.tenants(id) on delete cascade,
  model         text not null,
  purpose       text not null,                      -- 'menu_extraction','copy_generation','translation'
  input_tokens  int,
  output_tokens int,
  cost_usd_cents int,
  prompt_hash   text,                               -- sha256, not the prompt itself
  metadata      jsonb,
  created_at    timestamptz default now()
);

create index idx_ai_calls_tenant on public.ai_calls(tenant_id, created_at desc);

-- ============================================================================
-- GDPR deletion requests
-- ============================================================================
create table public.gdpr_deletion_requests (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  requested_by    text not null,                    -- email of requester
  verification_token text not null unique,
  verified_at     timestamptz,
  scheduled_for   timestamptz not null,             -- now() + 30 days
  executed_at     timestamptz,
  created_at      timestamptz default now()
);

-- ============================================================================
-- Pitch sessions — sales pipeline tracking, one row per pitch attempt
-- A session may or may not become a tenant. Tracks every stage outcome.
-- ============================================================================
create table public.pitch_sessions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  operator_id     uuid not null references auth.users(id),
  tenant_id       uuid references public.tenants(id) on delete set null, -- nullable until capture stage
  -- Language Edson picked for THIS pitch (drives TTS scripts shown).
  -- Italian by default; switch when pitching to non-Italian-speaking owner (Chinese, Arab, Indian, etc.)
  target_lang     text not null default 'it-IT',
  current_stage   text not null default 'approach'
                  check (current_stage in (
                    'approach','consent','capture','processing',
                    'ready','present','pricing','close',
                    'won','lost','thinking','no_show','archived'
                  )),
  -- Stage timestamps
  approach_at     timestamptz default now(),
  consent_at      timestamptz,
  capture_at      timestamptz,
  processing_at   timestamptz,
  ready_at        timestamptz,
  presented_at    timestamptz,
  outcome_at      timestamptz,
  -- Outcome
  outcome         text check (outcome in ('won','lost','thinking','no_show','archived')),
  outcome_reason  text,                              -- 'price','timing','already_has_site','no_decision_maker',...
  outcome_notes   text,
  follow_up_at    timestamptz,                       -- when to nudge again
  -- Quality signals (Model 3 future-proofing): used to compute operator ratings
  -- in a future marketplace. Captured from outcome but stored separately so
  -- they survive even if outcome_reason changes.
  client_satisfied boolean,                          -- did the client like the product?
  operator_self_rating int check (operator_self_rating between 1 and 5),  -- how did the pitch go (operator's own assessment)?
  -- Captured artifacts
  consent_audio_url text,
  metadata          jsonb,
  created_at      timestamptz default now()
);

create index idx_pitch_sessions_operator on public.pitch_sessions(operator_id, created_at desc);
create index idx_pitch_sessions_stage on public.pitch_sessions(current_stage);
create index idx_pitch_sessions_outcome on public.pitch_sessions(outcome) where outcome is not null;

-- ============================================================================
-- Factory jobs — background processing queue (extract menu, generate copy, build site)
-- ============================================================================
create table public.factory_jobs (
  id              uuid primary key default gen_random_uuid(),
  pitch_session_id uuid references public.pitch_sessions(id) on delete cascade,
  tenant_id       uuid references public.tenants(id) on delete cascade,
  status          text not null default 'queued'
                  check (status in ('queued','processing','ready','failed')),
  job_type        text not null
                  check (job_type in ('extract_menu','generate_copy','build_site','full_pipeline')),
  input_data      jsonb,                              -- photo URLs, vibe, voice transcript
  output_data     jsonb,                              -- extracted items, generated copy
  error_message   text,
  retries         int default 0,
  started_at      timestamptz,
  completed_at    timestamptz,
  created_at      timestamptz default now()
);

create index idx_factory_jobs_status on public.factory_jobs(status, created_at);
create index idx_factory_jobs_session on public.factory_jobs(pitch_session_id);

-- ============================================================================
-- Updated-at trigger
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trg_tenants_updated_at
  before update on public.tenants
  for each row execute function public.set_updated_at();

create trigger trg_items_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.organizations enable row level security;
alter table public.org_members   enable row level security;
alter table public.tenants        enable row level security;
alter table public.tenant_users   enable row level security;
alter table public.categories     enable row level security;
alter table public.items          enable row level security;
alter table public.media          enable row level security;
alter table public.bookings       enable row level security;
alter table public.consents       enable row level security;
alter table public.audit_log      enable row level security;
alter table public.ai_calls       enable row level security;
alter table public.gdpr_deletion_requests enable row level security;
alter table public.pitch_sessions enable row level security;
alter table public.factory_jobs   enable row level security;

-- ── Organizations ────────────────────────────────────────────────────────
-- Members can read their own org
create policy "members_read_own_org" on public.organizations
  for select to authenticated
  using (exists (
    select 1 from public.org_members om
    where om.organization_id = organizations.id and om.user_id = auth.uid()
  ));

-- Org admins can update their own org (branding, domain settings)
create policy "admins_update_own_org" on public.organizations
  for update to authenticated
  using (exists (
    select 1 from public.org_members om
    where om.organization_id = organizations.id
      and om.user_id = auth.uid()
      and om.role in ('super_admin','org_admin')
  ));

-- ── Org members ──────────────────────────────────────────────────────────
create policy "members_read_own_membership" on public.org_members
  for select to authenticated
  using (user_id = auth.uid());

-- Org admins can read all members of their org
create policy "admins_read_all_org_members" on public.org_members
  for select to authenticated
  using (exists (
    select 1 from public.org_members me
    where me.organization_id = org_members.organization_id
      and me.user_id = auth.uid()
      and me.role in ('super_admin','org_admin')
  ));

-- ── Pitch sessions: operators see their own; org_admins see all org sessions ──
create policy "operators_own_sessions" on public.pitch_sessions
  for all to authenticated
  using (
    operator_id = auth.uid()
    or exists (
      select 1 from public.org_members om
      where om.organization_id = pitch_sessions.organization_id
        and om.user_id = auth.uid()
        and om.role in ('super_admin','org_admin')
    )
  )
  with check (operator_id = auth.uid());

-- Factory jobs visible to the session's operator OR org admins
create policy "operators_own_jobs" on public.factory_jobs
  for select to authenticated
  using (exists (
    select 1 from public.pitch_sessions ps
    where ps.id = factory_jobs.pitch_session_id
      and (
        ps.operator_id = auth.uid()
        or exists (
          select 1 from public.org_members om
          where om.organization_id = ps.organization_id
            and om.user_id = auth.uid()
            and om.role in ('super_admin','org_admin')
        )
      )
  ));

-- Public can read live tenants
create policy "public_read_live_tenants" on public.tenants
  for select to anon, authenticated
  using (status = 'live');

-- Public can read categories of live tenants
create policy "public_read_live_categories" on public.categories
  for select to anon, authenticated
  using (exists (
    select 1 from public.tenants t
    where t.id = categories.tenant_id and t.status = 'live'
  ));

-- Public can read available items of live tenants
create policy "public_read_live_items" on public.items
  for select to anon, authenticated
  using (
    is_available = true and exists (
      select 1 from public.tenants t
      where t.id = items.tenant_id and t.status = 'live'
    )
  );

-- Public can read media of live tenants
create policy "public_read_live_media" on public.media
  for select to anon, authenticated
  using (exists (
    select 1 from public.tenants t
    where t.id = media.tenant_id and t.status = 'live'
  ));

-- Public can insert bookings
create policy "public_insert_bookings" on public.bookings
  for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.tenants t
      where t.id = tenant_id and t.status = 'live'
    )
  );

-- Public can insert consents
create policy "public_insert_consents" on public.consents
  for insert to anon, authenticated with check (true);

-- Tenant owners/staff can read their own tenant
create policy "owners_read_own_tenant" on public.tenants
  for select to authenticated
  using (exists (
    select 1 from public.tenant_users tu
    where tu.tenant_id = tenants.id and tu.user_id = auth.uid()
  ));

-- Tenant owners can update their own tenant
create policy "owners_update_own_tenant" on public.tenants
  for update to authenticated
  using (exists (
    select 1 from public.tenant_users tu
    where tu.tenant_id = tenants.id
      and tu.user_id = auth.uid()
      and tu.role in ('owner','operator')
  ));

-- Tenant owners can manage their own items/categories/media/bookings
create policy "owners_manage_items" on public.items
  for all to authenticated
  using (exists (
    select 1 from public.tenant_users tu
    where tu.tenant_id = items.tenant_id and tu.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.tenant_users tu
    where tu.tenant_id = items.tenant_id and tu.user_id = auth.uid()
  ));

create policy "owners_manage_categories" on public.categories
  for all to authenticated
  using (exists (
    select 1 from public.tenant_users tu
    where tu.tenant_id = categories.tenant_id and tu.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.tenant_users tu
    where tu.tenant_id = categories.tenant_id and tu.user_id = auth.uid()
  ));

create policy "owners_manage_media" on public.media
  for all to authenticated
  using (exists (
    select 1 from public.tenant_users tu
    where tu.tenant_id = media.tenant_id and tu.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.tenant_users tu
    where tu.tenant_id = media.tenant_id and tu.user_id = auth.uid()
  ));

create policy "owners_read_bookings" on public.bookings
  for select to authenticated
  using (exists (
    select 1 from public.tenant_users tu
    where tu.tenant_id = bookings.tenant_id and tu.user_id = auth.uid()
  ));

create policy "owners_update_bookings" on public.bookings
  for update to authenticated
  using (exists (
    select 1 from public.tenant_users tu
    where tu.tenant_id = bookings.tenant_id and tu.user_id = auth.uid()
  ));

-- Tenant_users self-read
create policy "users_read_own_membership" on public.tenant_users
  for select to authenticated
  using (user_id = auth.uid());

-- Service role bypasses RLS by default; admin operations use service role.
-- audit_log, ai_calls, consents, gdpr_deletion_requests are service-role only for writes.

-- ============================================================================
-- Seed: Operator user role marker (Edson)
-- ============================================================================
-- After creating the auth user, run manually:
-- insert into public.tenant_users (tenant_id, user_id, role)
-- values ('<some-marker-tenant-id>', '<edson-auth-uid>', 'operator');
-- Better: create a separate `operators` table for global operators. TODO v1.1.
