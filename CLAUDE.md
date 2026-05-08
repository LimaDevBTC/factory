# Factory — CLAUDE.md

> Final project name: **Factory**. Brand committed.
> This file is the source of truth for Claude Code when continuing this project. Read it fully before any task.

---

## Mission

A white-label, multi-tenant SaaS that lets a single operator (Edson, in person, on a phone) onboard any **food & beverage hospitality business** and ship a live, multilingual, GDPR-compliant website **in under 10 minutes** — at the venue, while the owner watches.

Target verticals (all share the same engine, differentiated by vibe):
- Sit-down meals: trattoria, osteria, ristorante, agriturismo, pizzeria
- Cafés & quick: caffetteria, panineria/street food, bar aperitivo
- Sweets: gelateria artigianale, pasticceria
- Beverage-led: enoteca/wine bar, birreria/pub

The hook is identical across verticals: photograph the physical menu (or gusti board, or cocktail list) → AI extracts items, prices, allergens → site renders → owner pays via Satispay → site goes live on `<slug>.thefactory.life` (custom domain plugged in within 24h via Cloudflare for SaaS).

The WhatsApp agent layer is **NOT in v1**. It is the upsell, sold 2-4 weeks after the site is live. v1 ships **only the site**.

---

## Strategic context

- **Geography**: Cosenza, Calabria, Italy. Mezzogiorno. Lower ticket sizes than Milan/Rome. Higher technology gap. Heavy EU/state digitalization grants available (PNRR, Voucher Digitalizzazione, Resto al Sud, Transizione 5.0).
- **Vertical**: Food & beverage hospitality — restaurants, trattorias, pizzerias, gelaterias, caffetterias, pasticcerie, panini bars, enoteche, bar aperitivo, birrerie. Same site engine, vibe-driven differentiation. Architecture is generic enough to extend later to non-F&B SMB (parrucchiere, fiorista, calzature).
- **Beachhead**: gelaterie + caffetterie. Higher density in Cosenza centro than restaurants, faster decision cycle (single owner decides), and the multilingual demo is visually devastating (gusti in IT/EN/DE for German/British tourists). Restaurants come second once we have 5-10 reference customers in the easier verticals.
- **Pricing (v1, cash-first, prepaid packages only)**: Sem mensal recurring na v1. Cliente compra pacote pré-pago à vista, decide no fim se renova.
  - **Starter 3 meses**: €50 cash — trial pago, entry-level (€16,67/mês equiv.)
  - **Starter 6 meses**: €99 cash — sweet spot (€16,50/mês equiv.)
  - **Starter 12 meses** ⭐: €179 cash — "scelta più popolare", custom domain incluso (€14,92/mês equiv.)
  - **Growth 3/6/12 meses**: €120 / €170 / €299 (custom domain de fábrica, reservas, +idiomas, suporte prioritário)
  - **Pro 6/12 meses**: €490 / €890 (WhatsApp agent v2 quando lançar, ERP, analytics)
  - Cliente assina **renúncia explícita ao direito de arrependimento** (Codice del Consumo art. 59) já que site vai live imediatamente. Mesmo assim, refund honrado nos 14 dias se solicitado — goodwill > €99 retido.
  - Voucher Digitalizzazione (50% subsidy) usado como objection-handler em Growth/Pro.
  - Lifetime €690 só sob pedido explícito, nunca promovido.
  - **Mensal Stripe é roadmap, não v1.** Sem recurring elimina dependência de webhook/dunning/failed payments na primeira versão.
- **Cash flow expectation**: mix realista 30/50/20 (3mo/6mo/12mo) → cash médio por venda **€113**. 5 vendas Cosenza = ~€565. 30 vendas em 3 meses = ~€3.390.
- **Billing v1**: **Cash collection in-loco** com pacotes 3/6/12 meses pré-pagos. Sem recurring, sem Stripe necessário, sem MEI obrigatório no dia 1. Renovação no fim do período já com infra digital pronta (Stripe Standard ativo até lá).
- **Sales model**: Edson sits at the venue (gelato, espresso, aperitivo — cheaper than dinner, more reps per day), pitches, closes. Founder-led sales until repeatable. Each closed deal pays for the consumption 50x over.
- **Legal entity**: Italian SRL via `Italia Startup Visa` track. Co-founder Vavà (Italian citizen, Cosenza). Setup happens in parallel with this product build.

---

## Strategic roadmap — three business models

Factory's architecture supports three progressively bigger business models. v1 implements only Model 1; the schema is prepared for Models 2 and 3 to avoid future refactor.

### Model 1 — Founder-led sales (v1, current)

- Edson is the only operator. Plataforma é a ferramenta dele.
- Vai a campo, vende em pessoa, executa o produto in loco.
- Receita: 100% das vendas tuas.
- Validação: Cosenza, 6 dias de viagem em Maio 2026.

### Model 2 — Multi-org SaaS for agencies/freelance operators

- N organizações se cadastram (agências locais, freelancers individuais).
- Cada org traz seus próprios leads.
- Plataforma cobra mensalidade da org + take rate via Stripe Connect Express.
- Branding por org: cliente final vê a marca da agência, não Factory.
- Trigger pra ativar: 3-5 operadores externos pedindo acesso após validação Model 1.

### Model 3 — Managed marketplace ("Uber dos sites")

- Cliente final descobre Factory diretamente, solicita serviço na plataforma.
- Plataforma faz match com operador disponível geograficamente.
- Operador atende em pessoa, executa o pitch + produção.
- Plataforma garante qualidade (rating, refund, SLA), padroniza preço, lida com pagamento.
- Cliente final vê Factory como produto; operador é capacidade.
- Receita: take rate (25-40%) por transação.
- Trigger pra ativar: ~50 operadores ativos no Modelo 2 numa cidade dada, com unit economics provadas. Provavelmente Roma ou Milão antes de qualquer outra cidade.
- Nunca antes da Série A — chicken-and-egg de marketplace requer capital.

### What's preserved in schema for Model 3 (without implementing)

- `tenants.lead_source` — distinguir cliente direto (Model 1/2) de cliente vindo da plataforma (Model 3)
- `pitch_sessions.client_satisfied` and `operator_self_rating` — base pra rating de operador
- `pitch_sessions.organization_id` — já permite distribuir leads pra múltiplas orgs
- `organizations.brand_name` separado de potencial `platforms.brand_name` — Model 3 vai precisar dessa segunda camada

### What's NOT in schema yet (Model 3 only, defer until needed)

- `leads` (pre-tenant inbound from platform)
- `operator_profiles` (public-facing operator card with rating, specialties)
- `assignments` (lead → operator match with SLA)
- `reviews` (bidirectional rating)
- Take-rate split logic across platform + operator + tax authority

---

## Architecture

### Multi-org (SaaS-ready from day 1)

Factory is architected as a **multi-tenant SaaS for operators** from the schema level, even though v1 has only one operator (Edson).

Three levels of tenancy:

1. **Platform** = Factory (the SaaS Edson is building)
2. **Organization** = an operator/agency reselling Factory (Edson is the first; later: other field-sales operators in different cities/countries with their own brand)
3. **Tenant** = an end client of an organization (a restaurant, gelateria, café)

Each organization has:
- Its own **root domain** (`thefactory.life`, `webfacil.com.br`, `primapagina.it`)
- Its own **brand** (logo, color, name shown in operator UI and tenant dashboards)
- Its own **Stripe Connect Express account** (cobra do cliente direto, Factory não fica no meio)
- Its own **set of operators** with role-based access (`super_admin`, `org_admin`, `operator`)
- Its own **enabled pitch languages** (a Brazilian operator might enable only PT/EN; an Italian operator IT/ZH/AR)

This is a **one-time architectural cost**. Once in place, adding the second org is a database insert + DNS config, no code change.

### What's deferred (don't build yet)

| Deferred | When to revisit |
|---|---|
| Operator self-onboarding flow | When org #2 wants to join |
| Org-admin UI (`/admin/orgs`) | When org #3 joins |
| Multi-region beyond EU | When first non-EU customer asks |
| Marketplace of templates between orgs | At ~100 orgs |
| Public API for integrators | When asked by a real customer |
| Org-level branding customization UI | When org #2 has different colors |
| White-label SMTP per org | Enterprise plan |
| Volume discounts, trials, coupons | When pricing matures |

Until those triggers fire, those features are mato. v1 has hardcoded values where appropriate (Edson is the only `super_admin`, the only `organization`).

### v1 hardcoded vs. dynamic

| Aspect | v1 reality | SaaS reality (later) |
|---|---|---|
| Organizations | One row, seeded via SQL | Self-onboarding flow |
| Org members | Only Edson (super_admin) | Multi-user with invites |
| Root domain | `thefactory.life` in env var | Lookup from `organizations.root_domain` |
| Stripe | Edson's Stripe directly | Stripe Connect Express |
| Branding in UI | Hardcoded "Factory" | Read from `organizations.brand_name` |
| Pitch languages | All available, single config | Per-org `enabled_pitch_langs` |
| Custom domains | Via Cloudflare for SaaS | Same, but per org |

The schema reflects the **SaaS reality**. The UI reflects **v1 reality**. Refactor cost when transitioning: small, because the data is already shaped right.

---

## Architecture (legacy section name — kept for back-compat with prior prompts)

### Multi-tenancy strategy

Three hostname patterns resolved by `middleware.ts`:

1. **Marketing root** — `thefactory.life` and `www.thefactory.life` → static landing page selling the product to restaurants
2. **SaaS app** — `app.thefactory.life` → operator factory (Edson's onboarding wizard) + tenant dashboards (restaurant owners)
3. **Tenant sites** — `<slug>.thefactory.life` (subdomain) OR `<custom-domain>.it` (custom domain via Cloudflare for SaaS) → public-facing restaurant website

Tenant resolution flow:
- Strip port from hostname (local dev)
- Match against root → `/marketing/*`
- Match against `app.` → `/app/*`
- Match `*.thefactory.life` → extract slug, rewrite to `/sites/<slug>/*`
- Anything else → assume custom domain, rewrite to `/sites/__custom__/*` with hostname in `x-custom-domain` header, page does DB lookup

### Stack (decided, not negotiable for v1)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 14 App Router | SSR for SEO, edge middleware for tenant resolution |
| Styling | Tailwind + shadcn/ui | Speed, consistency, mobile-first |
| Database | Supabase (Postgres) — **EU region: Frankfurt** | RLS, fast, auth bundled, GDPR data residency |
| Auth | Supabase Auth, magic link only | No password fatigue for restaurant owners |
| Storage | Cloudflare R2 (EU jurisdiction) | Cheap, no egress fees, GDPR-friendly |
| Custom domains | Cloudflare for SaaS | One-click custom domain per tenant |
| Hosting | Vercel, region `fra1` (Frankfurt) | EU data residency, edge functions |
| AI | Claude API (Anthropic) | Vision for menu extraction, text for copy generation |
| Payments | Stripe + Satispay link | Stripe for subscriptions, Satispay culturally expected in IT for one-time |
| Email | Resend (EU region) | Magic links, booking notifications, welcome flow |
| Analytics | Plausible | GDPR-compliant by default, no cookie banner needed for it |
| i18n | next-intl | IT/EN/DE locales |

### Folder structure

```
factory/
├── CLAUDE.md                          ← this file
├── README.md                          ← human-facing setup
├── .env.example
├── package.json
├── next.config.mjs
├── middleware.ts                      ← tenant resolution (lives at root, not in src/)
├── tailwind.config.ts
├── tsconfig.json
├── supabase/
│   ├── schema.sql                     ← run this on a fresh Supabase project
│   └── migrations/                    ← future migrations go here
├── public/
│   └── allergens/                     ← icons for the 14 EU allergens
└── src/
    ├── app/
    │   ├── layout.tsx                 ← root layout (locale-aware)
    │   ├── globals.css
    │   ├── marketing/                 ← thefactory.life landing
    │   │   └── page.tsx
    │   ├── legal/                     ← public legal pages (Italian default)
    │   │   ├── terms/page.tsx        ← Termini di Servizio (versioned)
    │   │   ├── privacy/page.tsx      ← Informativa Privacy
    │   │   └── dpa/page.tsx          ← Data Processing Agreement (SCC)
    │   ├── app/                       ← app.thefactory.life
    │   │   ├── layout.tsx
    │   │   ├── (auth)/
    │   │   │   ├── login/page.tsx     ← magic link
    │   │   │   └── callback/route.ts
    │   │   ├── factory/               ← OPERATOR area (Edson only) — PORTUGUESE UI
    │   │   │   ├── page.tsx           ← pipeline dashboard: pitches em curso, won/lost stats
    │   │   │   ├── new/
    │   │   │   │   └── page.tsx       ← creates a new pitch_session, redirects to first stage
    │   │   │   └── [sessionId]/
    │   │   │       └── [stage]/
    │   │   │           └── page.tsx   ← stage-aware UI: approach/consent/capture/processing/ready/present/pricing/close
    │   │   └── dashboard/             ← TENANT OWNER area — ITALIAN UI
    │   │       └── [tenantId]/
    │   │           ├── page.tsx       ← overview
    │   │           ├── menu/page.tsx  ← edit dishes
    │   │           ├── bookings/page.tsx
    │   │           └── settings/page.tsx
    │   ├── sites/                     ← public tenant sites
    │   │   ├── [slug]/
    │   │   │   ├── layout.tsx
    │   │   │   ├── page.tsx           ← home
    │   │   │   ├── menu/page.tsx
    │   │   │   ├── prenota/page.tsx
    │   │   │   └── contatti/page.tsx
    │   │   └── __custom__/            ← custom-domain handler, looks up by hostname
    │   │       └── [...path]/page.tsx
    │   └── api/
    │       ├── factory/
    │       │   ├── extract-menu/route.ts   ← Claude vision
    │       │   ├── generate-copy/route.ts  ← Claude text
    │       │   └── publish/route.ts        ← flip status to 'live'
    │       ├── bookings/
    │       │   └── route.ts                ← POST creates booking, notifies owner
    │       ├── stripe/
    │       │   ├── checkout/route.ts
    │       │   └── webhook/route.ts
    │       └── gdpr/
    │           └── delete/route.ts         ← right to erasure
    ├── components/
    │   ├── pipeline/                  ← operator UI (PT)
    │   │   ├── RecordButton.tsx       ← captures audio (consent, owner voice)
    │   │   ├── PhotoUploader.tsx
    │   │   ├── StageHeader.tsx        ← shows current stage in pipeline
    │   │   ├── ScriptCard.tsx         ← renders PT coaching + IT cheat-sheet text
    │   │   ├── MenuReview.tsx
    │   │   ├── BrandPicker.tsx
    │   │   └── PreviewFrame.tsx
    │   ├── site/                      ← public site building blocks
    │   │   ├── Hero.tsx
    │   │   ├── MenuSection.tsx
    │   │   ├── DishCard.tsx
    │   │   ├── AllergenBadges.tsx
    │   │   ├── BookingForm.tsx
    │   │   ├── CookieBanner.tsx
    │   │   └── Footer.tsx              ← P.IVA, GDPR, AI disclosure
    │   └── ui/                        ← shadcn primitives
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts              ← browser client (anon key)
    │   │   ├── server.ts              ← RSC/route handler client (cookies)
    │   │   └── admin.ts               ← service role, server-only
    │   ├── tenant.ts                  ← getTenantBySlug, getTenantByHost
    │   ├── claude.ts                  ← Anthropic API wrapper
    │   ├── verticals.ts               ← vibe definitions, category hints
    │   ├── allergens.ts               ← EU 14 allergens, translated
    │   ├── scripts/                   ← pipeline playbook: PT coaching + IT cheat-sheet
    │   ├── stripe.ts
    │   ├── email.ts                   ← Resend wrapper, locale-aware send
    │   └── i18n.ts
    ├── messages/
    │   ├── it.json
    │   ├── en.json
    │   └── de.json
    └── emails/                        ← React Email templates (Resend)
        ├── welcome.it.tsx             ← post-checkout welcome (italian, all-in-one)
        ├── welcome.en.tsx
        ├── booking-notification.it.tsx  ← sent to owner when guest books
        ├── booking-confirmation.it.tsx  ← sent to guest
        ├── payment-failed.it.tsx        ← Stripe payment failure
        └── withdrawal-reminder.it.tsx   ← day-12 reminder of 14-day window
```

---

## Data model (Postgres / Supabase)

See `supabase/schema.sql` for the canonical version. Key tables:

- `tenants` — one row per business. Holds slug, custom_domain, brand colors, P.IVA, vibe, status (`draft`/`live`/`suspended`), plan, Stripe IDs.
- `tenant_users` — links Supabase `auth.users` to tenants with role (`owner`, `staff`, `operator`).
- `categories` — menu categories per tenant. Vibe-specific (gelateria has gusti/coppe/granite, trattoria has antipasti/primi/secondi, enoteca has rossi/bianchi/bollicine).
- `items` — menu items (dishes, drinks, gusti, coppe, panini, vini — anything sold). Trilingual fields. Price stored in cents. Allergens as text[]. Dietary as text[]. **Note**: table is named `items` (generic), not `dishes`.
- `media` — uploaded images, kind = `menu_photo` | `hero` | `logo` | `item` | `facade` | `interior`.
- `bookings` — reservation requests (only relevant for sit-down vibes; gelateria/caffetteria typically don't use this).
- `consents` — GDPR cookie consent records, pseudonymous (hash of IP+UA).
- `audit_log` — every meaningful action, for GDPR compliance and debugging.
- `ai_calls` — every Claude API call logged for AI Act traceability.

RLS is enabled on all tenant-scoped tables. Public `select` policies only expose tenants where `status = 'live'`.

---

## The factory pipeline (the operator product)

This is `/app/pipeline/*` — a **sales pipeline machine**, not a wizard. It guides Edson stage-by-stage through each pitch, in **Portuguese**, with **Italian cheat-sheet text** ele lê/improvisa com o dono. Mobile-first, PWA-installable, works on bad network.

### Critical UI separation — THREE layers

| Layer | For whom | Language(s) |
|---|---|---|
| 1. Operator UI (`/app/pipeline/*`) | Edson | **pt-BR always** (com sugestão IT inline pra ler ao dono) |
| 2. Owner dashboard (`/app/dashboard/*`) | Owner managing their site post-sale | **Owner's native language** (set on tenant, default `it`) |
| 3. Public site (`/sites/[slug]`) | End consumers of the business | **Italian default** + tenant-enabled locales (EN/DE/etc) |

Italian appears in operator UI **as plain text inside PT cards** — `italian_hint` per stage, `italian_variants` pra contextos diferentes. Edson lê e improvisa com naturalidade. Sem TTS, sem botão 🔊, sem detecção de idioma.

Layer 2 follows the tenant's `owner_locale` field (separate from `default_locale` which controls the public site).

Never mix layers. Edson reads PT (and improvisa em italiano com a cheat-sheet); o cliente nunca vê português.

### Pipeline language: italian-only in v1

V1 ataca Cosenza, mercado italianófono. Sem suporte a outros idiomas pro pitch (chinês, árabe, hindi pra diáspora) na primeira versão. Esse trabalho fica deferido pra v1.x quando Edson decidir abrir o diaspora play. Quando voltar, é tarefa nova: novo schema de scripts multilíngue, novo SpeakButton component, native-speaker review per language. Git history preserva a versão multilíngue anterior (commit `feat(t1-c): tenant/org resolution helpers` e adjacentes).

### Pipeline stages

Cada pitch é uma `pitch_session` row que evolui pelos states:

| Stage | O que acontece | UI |
|---|---|---|
| `approach` | Edson aborda o dono. Lê coaching PT + cheat-sheet IT. | ScriptCard (PT coaching + texto IT + variantes), botão "Aceitou ouvir" |
| `consent` | Grava consentimento verbal antes de fotos. | ScriptCard, RecordButton, botão "Consentimento gravado" |
| `capture` | Coleta dados, fotos, voz do dono. | Form PT + camera + RecordButton + variantes IT pra cada pergunta |
| `processing` | Background job: Claude vision extrai menu, gera cópia, monta tenant + items. | Spinner, ETA, "Volta pra mesa" |
| `ready` | Push notification — site pronto. Edson revisa rápido (30s). | Quick-edit interface |
| `present` | Edson mostra site ao dono. | ScriptCard com cheat-sheet IT, full-screen preview iframe |
| `pricing` | Edson revela preço. Variantes pra objeções (voucher, upsell). | ScriptCard com main IT + variantes condicionais |
| `close` | Edson pede a venda. | ScriptCard, outcome buttons (won/thinking/lost/no_show) |

Outcomes recorded:
- `won` — paid, site goes live, welcome email triggered
- `thinking` — preview link valid 30 days, auto follow-up email at day 3 + day 14
- `lost` — archived with optional reason; learn from it
- `no_show` — owner left mid-pitch; rare, but tracked

### Why pipeline > wizard

A wizard assumes happy path. A pipeline assumes **failure is data**: half the pitches won't close, and you need to know why. After 20 pitches in Cosenza, Edson can see: "gelaterias close 60%, trattorias 20%, aperitivo bars 50%; main loss reason is price". That data drives v1.1 product decisions.

### Scripts source

`src/lib/scripts/index.ts` exporta `PIPELINE_PLAYBOOK: Record<Stage, StagePlaybook>`. Cada stage tem `coaching_pt`, `italian_hint?` e `italian_variants?`. Pra editar um script, mexe nesse arquivo — nunca hardcode strings em components. Isso facilita auditoria e A/B test futuro.

---

## Public site (the deliverable)

Single Next.js layout per tenant, rendered at `/sites/[slug]`. Pages:

- `/` — Hero (photo, name, vibe-driven tagline), highlights, CTA "Vedi il menu" / "Vedi i gusti" / "Vedi la carta" (label adapts to vibe)
- `/menu` — Full menu/listing, category navigation, allergen filters, dietary filters, multilingual. Label adapts to vibe (`Menu`, `Gusti`, `Carta dei vini`, etc.)
- `/prenota` — Booking form. **Hidden for vibes that don't take reservations** (gelateria, caffetteria, panineria, bar). Visible for trattoria, ristorante, agriturismo, enoteca, pizzeria. Posts to `/api/bookings`, sends WhatsApp/email to owner.
- `/contatti` — Address, phone, hours, Google Maps embed (lazy-loaded for GDPR)

Footer (every page) MUST include:
- Business name + P.IVA + indirizzo
- Cookie preferences link (opens `<CookieBanner>`)
- Privacy policy link
- AI Act disclosure: *"Alcune descrizioni di questo sito sono state generate con assistenza di intelligenza artificiale."*
- Powered-by line (optional, removable on higher plans)

Allergen icons MUST appear next to every item that has them. The 14 EU allergens are non-negotiable — Italian law requires disclosure for any business serving food or beverages.

---

## Constraints (read these before any code change)

### GDPR (hard requirement)

- Data residency: Supabase EU region, Vercel `fra1`, Cloudflare R2 EU jurisdiction. **Never** spin up US-region resources.
- Cookie banner must be functional: `Necessary` (always on) / `Analytics` / `Marketing`. Default: only Necessary. Plausible loads regardless. Google Maps loads only on consent.
- `/api/gdpr/delete` accepts a tenant ID + verification email and zeros out the tenant's data after a 30-day grace window. Implement properly, not as theater.
- Privacy policy page lists sub-processors: Anthropic, Supabase, Vercel, Cloudflare, Stripe, Resend.
- DPA template (Italian) shipped with each new tenant onboarding email.

### EU AI Act (hard requirement)

- Disclosure in footer (above) is not optional.
- AI-generated dish descriptions are flagged in DB (`description_ai_generated: boolean`) and surface a small badge on hover (admin only).
- Logging: every Claude API call is logged with prompt, response, tenant_id, timestamp, in `audit_log`.

### Italian fiscal (don't break this)

- The site does NOT process payments to the restaurant (no order checkout in v1). Bookings are non-paid; menu is read-only display.
- This means we don't trigger `Registratore Telematico` obligations. Stay out of that scope until v2 with proper RT integration.
- We DO charge the restaurant directly via Stripe. That's our SaaS revenue, our SRL invoices it, fine.

### Payment flow — in-loco closing

The "close" stage of the pipeline supports **three payment methods**, in order of v1 priority:

**1. Cash (default for v1, no infrastructure needed)**
- Operator opens checkbox UI on phone, client checks ToS/Privacy/DPA boxes (timestamp + hash recorded)
- Client hands over physical cash for setup amount (€20/€49/€149)
- Operator taps "Confirma ricevuto" → tenant goes live, receipt PDF generated and sent via WhatsApp/email
- Recurring is **opt-in via separate Stripe link** sent later (1-4 weeks after) when Stripe Standard is wired
- `payment_method = 'cash'`, `cash_collected_at`, `cash_collected_amount`, `cash_collected_by`, `cash_receipt_pdf_url` populated

**2. Stripe Checkout (when Stripe Standard active, post-MEI/post-CNPJ)**
- Generated via `stripe.checkout.sessions.create` with `mode: 'subscription'` for the chosen tier
- QR code is the `session.url`, rendered client-side via `qrcode` lib
- Stripe-hosted page handles cards, Apple Pay, Google Pay, SEPA Direct Debit, 3DSecure
- `consent_collection: { terms_of_service: 'required' }` enforces ToS acceptance
- `metadata` carries tenant_id, pitch_session_id, plan, legal_versions for the webhook

**3. Stripe Link via WhatsApp** (fallback when client prefers paying later)
- Same Stripe Checkout session, but URL sent via WhatsApp/email instead of QR
- Tenant stays in `preview` status until webhook confirms

**Satispay** comes later when `billing_jurisdiction = 'it_partner'` or `it_srl` (requires Italian P.IVA).

### Cash-first launch strategy with prepaid packages

For Edson's first Cosenza trip (no MEI/CNPJ active yet, no Stripe live yet), the model is **cash up front for a fixed service period — no monthly recurring in v1**:

1. **In Cosenza**: cash collection for 3, 6, or 12 month prepaid packages (€50, €99, or €179 Starter)
2. **Site goes live immediately**, valid for the full prepaid period
3. **Right of withdrawal explicitly waived** at acceptance (Codice del Consumo art. 59 — site published live = service fully rendered)
4. **No recurring obligation** — cliente decides at end of period whether to renew
5. **Renewal reminders** at 30/7/1 days before expiration via email
6. **Renewal flow** uses Stripe Checkout (digital) post-MEI activation, OR repeat in-person cash sale if Edson revisits

This **eliminates infrastructure dependencies for v1**:
- ✗ No Stripe Standard needed for first sales
- ✗ No MEI/CNPJ needed for cash collection (declared retroactively)
- ✗ No SDI fattura needed
- ✗ No subscription webhooks needed
- ✗ No dunning, no failed payment retry, no recurring billing complexity
- ✓ Just: paper money + receipt PDF + service period schedule + renewal reminder cron

### The three-option pricing presentation

The pricing stage offers three options simultaneously, **anchoring the 12mo as "popular" with custom domain bonus**:

```
┌──────────────────────────────────────────────┐
│  3 mesi           €50 in contanti            │
│                   €16,67/mese equiv.         │
│                                              │
│  6 mesi           €99 in contanti            │
│                   €16,50/mese equiv.         │
│                                              │
│  12 mesi  ⭐      €179 in contanti           │
│                   dominio personalizzato     │
│                   incluso (vale €40)         │
│                   €14,92/mese equiv.         │
└──────────────────────────────────────────────┘
```

Empirical expectation: 30% choose 3mo, 50% choose 6mo, 20% choose 12mo. Cash flow per closed deal: €50-179, average ~€113. Cosenza trip with 5 closes = ~€565 in pocket.

**Why no monthly option in v1:** Eliminates dependency on Stripe webhooks, dunning, failed payment retry logic. Renewal becomes a fresh sale (cash or digital depending on infra at the time). Trade-off: less predictable MRR, but cleaner architecture and faster v1 launch.

### Service period lifecycle

- `service_period_starts_at` = cash_collected_at
- `service_period_ends_at` = starts + (6 or 12 months depending on `billing_period`)
- At `ends_at - 30 days`: send renewal email with Stripe Checkout link (post-MEI infrastructure)
- At `ends_at - 7 days`: reminder
- At `ends_at - 1 day`: final reminder + offer to extend
- At `ends_at`: site flagged `expired`, returns soft-404 with renewal CTA. Data retained 30 days, then GDPR deletion.

### Right of withdrawal — handling the 14-day rule

Codice del Consumo art. 52 grants 14-day right of withdrawal for online services. For our cash prepaid model:

**Default position**: cliente assina renúncia explícita ao direito de arrependimento porque o serviço foi imediatamente prestado (site publicado live). Codice del Consumo art. 59(1)(a) explicitly allows this for services completed within the withdrawal period with consumer's prior consent.

The waiver checkbox text (in Italian, separate from ToS checkbox, must be highlighted):

> *"Acconsento all'esecuzione immediata del servizio (pubblicazione del sito) e riconosco di perdere il diritto di recesso una volta che il sito sia online. Codice del Consumo art. 59."*

Stored in `tenants.withdrawal_waived_at` + `withdrawal_waiver_text` for audit.

**Practical position**: even with the waiver, refund honored within 14 days if requested politely. Goodwill > €110 retained. The waiver protects Factory from abuse; the practice protects Factory's reputation. This is the right tradeoff.

### Billing jurisdiction (where the money lands and which entity invoices)

The platform supports three billing modes via `organizations.billing_jurisdiction`:

**`br_pj` (default for v1)** — Brazilian PJ (Edson's existing CNPJ)
- Stripe Brasil titular = Edson's CNPJ
- EUR charged to Italian client → BRL deposited (or EUR via Wise Business)
- Edson emits NFS-e Brasil for **export of services**
- Italian client (B2B) applies EU reverse charge automatically — no Italian VAT due on the invoice
- Pros: works TODAY without Italian incorporation, fastest cash flow
- Cons: Italian commercialista has to handle reverse charge bookkeeping (standard but unusual for tiny SMB), MEI revenue cap (~R$81k/ano) hits fast — plan to upgrade to ME within 6-8 months

**`it_partner`** — Italian partner P.IVA (e.g. Vavà's regime forfettario)
- Stripe Italy titular = partner's P.IVA
- Cliente recebe fattura italiana semplificata (forfettario = no SDI required up to €85k/anno)
- Money flows through partner → repassed to Edson via co-founder agreement
- Pros: local legitimacy, Satispay habilitado (cultural fit)
- Cons: dependence on partner reliability, dual accounting

**`it_srl`** — Edson's SRL (post-registration)
- Stripe Italy titular = SRL with full P.IVA
- Stripe Tax + Invoicing + SDI submission (~0.4% extra fee)
- Fattura elettronica obrigatória via SDI for B2B
- Pros: full Italian fiscal compliance, professional positioning
- Cons: requires SRL registration (30-60d) + commercialista relationship

### Recommendation (v1)

**Default: `br_pj`** — Edson's existing CNPJ via Stripe Brasil. Charges setup + recurring from day 1. Honest disclosure to clients at checkout via `billing_jurisdiction_message_it`:

> *"La fattura sarà emessa dalla mia società in Brasile (esportazione di servizi). Il tuo commercialista applica il reverse charge UE — è la procedura standard. Se preferisci una fattura italiana, posso organizzare con il mio partner italiano."*

When a client specifically requests Italian fattura, switch that tenant to a separate organization with `billing_jurisdiction = 'it_partner'`. Eventually all migrate to `it_srl` post-registration.

This eliminates the "pre-SRL paralysis" — you can sell, charge, and grow during the SRL setup window without fiscal irregularity.

### Where the money lands (operational steps)

For `br_pj` mode (v1):
1. Existing Brazilian CNPJ (Edson already has from Bitflow contracting)
2. Stripe Brasil account linked to that CNPJ
3. **Wise Business** account with EUR IBAN (avoids FX loss when receiving EUR payments)
4. Stripe payouts → Wise EUR account → keep balance in EUR until needed
5. NFS-e municipal (depends on Edson's município) for each invoice — automate later via API integration with município
6. Brazilian taxes (Simples Nacional) declared on monthly receipts

### Legal docs (required, click-to-accept at checkout)

Three documents the cliente accepts at checkout (no PDF signature needed for plans up to Pro under D.Lgs. 70/2003 + Codice Civile art. 1341):

1. **Termini di Servizio** (`/legal/terms`) — what Factory delivers and doesn't, content ownership, license to use, SLA per plan, refund policy (14-day mandatory under Italian law for online services), cancellation, price adjustment with 60-day notice, liability cap (last 12 months paid), governing law (Italia, foro Cosenza or wherever SRL is registered), AI Act disclosure.

2. **Informativa sulla Privacy** (`/legal/privacy`) — sub-processors list (Anthropic, Supabase, Vercel, Cloudflare, Stripe, Resend, Plausible), data retention, user rights (access, rectification, erasure, portability, restriction), DPO contact if applicable.

3. **DPA — Data Processing Agreement** (`/legal/dpa`) — Standard Contractual Clauses (SCC) template from European Commission. Cliente is controller, Factory is processor. Required separately under GDPR Art. 28.

At checkout (Stripe-hosted page custom-extended OR custom checkout):
- Checkbox 1 (mandatory): "Accetto i Termini di Servizio"
- Checkbox 2 (mandatory): "Accetto l'informativa privacy e firmo il DPA"
- Checkbox 3 (optional, separate): "Voglio ricevere comunicazioni commerciali"

Each acceptance writes to `tenants` table: `terms_accepted_at`, `terms_version`, `privacy_accepted_at`, `privacy_version`, `dpa_accepted_at`, `dpa_version`, `acceptance_ip_hash` (sha256 of IP+salt), `acceptance_user_agent`. Versioning matters: when ToS changes, force re-acceptance for active tenants.

For physical signed PDF (Pro corporate clients, paranoid clients, disputes): use **Yousign** (European, GDPR-friendly, €9/mo). Generate same ToS as PDF via API, send for signature. Store signed PDF in R2.

### Email handling — three roles, one welcome flow

Every tenant has three email fields with distinct purposes:

| Field | Purpose | Required | Visibility |
|---|---|---|---|
| `contact_email` | Admin/owner — magic links, support, account-related | Yes (before going live) | Private to platform |
| `public_email` | Shown on public site footer/contact page | No (defaults to contact_email) | Public on the site |
| `billing_email` | Stripe sends invoices here | No (defaults to contact_email) | Private |

Why three: trattoria owner Marco might use `marco.rossi@gmail.com` personally, `info@trattoriadamarco.it` for public-facing, and `studio@commercialista.it` for invoices. One field can't serve all three.

At checkout: capture `contact_email` (mandatory), `public_email` (optional, hint to use `info@` if exists), `billing_email` (optional, default to contact, prompt only if "Pro" plan or if owner mentions accountant).

**Email validation at capture**: client-side typo detection via Mailcheck (lightweight JS, no API). If user types `gmial.com`, suggest `gmail.com`. Confirma duas vezes a digitação no Pro tier; single field with typo-suggest no Starter/Growth.

**Verification flow**: `contact_email` is unverified by default. The welcome email contains a magic link — clicking it sets `contact_email_verified_at`. Until verified, suporte só pode ser solicitado por reply ao welcome email (não por nova solicitação anônima).

### Welcome email (post-checkout)

Single email, sent immediately after Stripe webhook confirms payment. Contains everything cliente needs:

- Site URL (`{slug}.thefactory.life`)
- Magic link to dashboard (24h expiry, sets `contact_email_verified_at` on click)
- Plan summary (tier, setup paid, next billing date)
- 14-day right-of-withdrawal countdown with cancel link
- Links to ToS / Privacy / DPA versions accepted
- Stripe invoice PDF link
- Support reply-to address with SLA per plan ("rispondi entro 48h" Starter, 24h Growth, 4h Pro)

Localized per `tenants.owner_locale`. v1: only `it` and `en` templates. Other languages added as customer base demands.

Resend handles delivery. React Email components in `src/emails/` for the templates. Versioned with the legal docs.

### Why a single welcome email (not a chain)

Cliente do Starter paga €20 e some no email. Quanto mais emails você manda na primeira hora, maior chance dele marcar como spam. **Tudo num email só** maximiza chance de leitura, reduz suporte ("não recebi acesso"), e respeita o tempo do cliente.

Drip de onboarding (email no dia 3, dia 7, dia 14) só pra Growth e Pro — quem paga mais tolera mais comunicação.

### Right of withdrawal (Italian law)

Per Codice del Consumo, Italian online service contracts have **14-day right of withdrawal**. The `tenants.withdrawal_window_ends_at` field is set on payment confirmation. Cliente can cancel within 14 days for full refund — implement properly:
- Email confirmation includes plain-language right-of-withdrawal notice
- Dashboard has visible "Cancella entro {date} per rimborso completo" banner during the window
- Cancel endpoint refunds via Stripe automatically if within window
- After window, cancellation = no refund, but next billing cycle not charged

### Italian language

- Default locale `it`. Tone: warm but professional. Use formal `Lei` in operator-facing UI, informal `tu` in customer-facing site copy (matches modern Italian hospitality web style).
- Calabria-specific hooks welcome: `'nduja`, `bergamotto`, `caciocavallo silano DOP`, `vino di Cirò`, `liquirizia di Calabria`, `cipolla rossa di Tropea IGP`, `gelato al fico dottato`. The agent should recognize these, not flag as errors.
- Currency formatting: `€ 12,50` (comma decimal, space after symbol). For low-ticket items (gelato, caffè) sub-euro is normal: `€ 1,50`, `€ 0,90`.

---

## The 14 EU allergens (always handle)

```
glutine, crostacei, uova, pesce, arachidi, soia, latte, frutta_a_guscio,
sedano, senape, sesamo, anidride_solforosa, lupini, molluschi
```

Stored as `text[]` in `dishes.allergens`. Translations and icons in `src/lib/allergens.ts` and `public/allergens/`.

---

## Claude API usage

Wrapper at `src/lib/claude.ts`. Uses `claude-opus-4-7` for menu extraction (vision-heavy), `claude-haiku-4-5` for copy generation and translation (fast and cheap).

### Menu extraction prompt

```
You are extracting a food & beverage menu from photographs.
The business type is: {vibe} (e.g. gelateria_artigianale, caffetteria, trattoria_familiare).
Common categories for this vibe: {category_hints}.

Return ONLY valid JSON matching this schema:
{
  "categories": [{ "name_it": string, "display_order": number }],
  "items": [{
    "category_name_it": string,
    "name_it": string,
    "description_it": string | null,
    "price_cents": number,
    "allergens": string[],   // from the 14 EU allergens, in Italian, snake_case
    "dietary": string[]      // "vegetariano" | "vegano" | "senza_glutine" | "senza_lattosio" | ...
  }]
}

Rules:
- Prices are integers in cents (€2.50 = 250, €12.50 = 1250).
- If an item has no description in the photo, set description_it to null. Do NOT invent.
- Allergens: only include those visible in the menu (asterisks, footnotes, or explicit mention). Do NOT guess from name.
- If a price is unreadable, set price_cents to 0 and the operator will fix it.
- Respect the menu's category structure. If absent, use the category_hints for the vibe as fallback.
- For gelaterie: each gusto is one item. Coppe and granite are separate categories.
- For caffetterie: differentiate caffetteria (espresso/cappuccino) from pasticceria (croissant/cornetti) from panini.
- For enoteche: respect wine list structure (region, vintage, vintner if present).
```

### Copy generation prompt (per item, optional pass)

```
The owner asked you to enrich descriptions for the website.
For the item below, write a 1-2 sentence description in Italian.
Tone: {vibe}. Length: max 25 words.
Stay factual: only describe ingredients/method/origin that are evident from the item name.
Do NOT invent ingredients. If unsure, return the original description unchanged.

Then translate to English and German with the same constraints.

Return JSON: { "description_it": string, "description_en": string, "description_de": string }
```

---

## Build plan — tasks, not days

There is no fixed schedule. The build is a **task graph** with explicit dependencies. Edson decides pace — could be a 10-hour rajada, could be 3 weeks de janelas curtas. What matters is that tasks ship in correct dependency order and that Claude Code never starts a task whose dependencies aren't met.

### Task graph

```
T1 (Foundation)
 ├─→ T2 (Public site template)
 │    └─→ T3 (Menu extraction)
 │         └─→ T4 (Pipeline UI: stages 1-3 — approach, consent, capture)
 │              └─→ T5 (Pipeline UI: stages 4-6 — processing, ready, present)
 │                   └─→ T6 (Pipeline UI: stages 7-8 — pricing, close)
 │                        └─→ T7 (Stripe + legal + welcome email)
 │                             └─→ T8 (Owner dashboard, post-purchase)
 └─→ T9 (Demos + pitch dry-run, can run in parallel with T2+)
```

### Task definitions

**T1 — Foundation** (~4-6h)
- Next.js 14 + TS + Tailwind + shadcn scaffold
- Supabase EU project linked, schema pushed
- Middleware multi-org wired
- Magic-link auth with `OPERATOR_EMAILS` whitelist
- PWA manifest + iOS-installable
- Marketing landing placeholder (italian)
- `/app/pipeline` placeholder (portuguese)
- `/sites/[slug]` placeholder (italian "in costruzione")
- `pnpm build && lint && typecheck` all green
- Acceptance: routes work on `lvh.me:3001`, login flow completes, schema deployed

**T2 — Public site template** (~6-10h)
- Single vibe-aware template at `/sites/[slug]/*`
- Pages: home, menu, prenota (conditional), contatti
- Hero with vibe-specific photo treatment
- Menu/Gusti/Carta with category nav, allergen filters, dietary filters
- i18n IT/EN switcher (uses `tenants.enabled_locales`)
- Footer: P.IVA, cookie banner stub, AI disclosure
- Renders from real DB data (seed a test tenant manually for now)
- Mobile-first, brilho no máximo, alto contraste pra mostrar in loco
- Acceptance: navigate a seeded tenant on the phone, looks polished, all vibes render correctly with their distinct treatment
- Depends on: T1

**T3 — Menu extraction** (~4-6h)
- `POST /api/jobs/extract-menu` — accepts photo URLs + vibe
- Calls Claude vision with the prompt + category hints from `verticals.ts`
- Validates response with Zod
- Inserts categories + items + AI flags into Supabase
- Logs to `ai_calls` table
- Returns `{tenantId, jobId, categoriesCount, itemsCount}`
- Side: `POST /api/jobs/generate-copy` for translation pass
- Acceptance: upload 3 real menu photos, extracted JSON matches reality 90%+, allergens captured when written
- Depends on: T1, partial T2 (needs DB)

**T4 — Pipeline UI: stages 1-3** (~5-7h)
- `/app/pipeline` — list of in-flight `pitch_sessions` + KPIs (won/lost/thinking) + "+ Novo pitch" button
- `/app/pipeline/new` — creates a new session (italian-only em v1, sem language picker), redirects to first stage
- `/app/pipeline/[sessionId]/approach` — `<ScriptCard>` com coaching PT + texto IT inline + variantes (collapse), botão "Próximo"
- `/app/pipeline/[sessionId]/consent` — `<ScriptCard>` + `<RecordButton>` capturing consent audio to R2
- `/app/pipeline/[sessionId]/capture` — form (PT) for nome/indirizzo/p_iva/contact_email/etc, photo uploaders, owner voice recorder, vibe picker, language enable list for the site
- All stages write to `pitch_sessions` + advance `current_stage`
- Acceptance: walk through approach → consent → capture, data persists, photos upload to R2, voice memo transcribed
- Depends on: T1

**T5 — Pipeline UI: stages 4-6** (~4-6h)
- `/app/pipeline/[sessionId]/processing` — shows job progress, polls `factory_jobs` until ready
- Background worker (Vercel cron OR direct invocation): processes the queued job, calls T3 endpoints, builds tenant + items, updates session
- `/app/pipeline/[sessionId]/ready` — quick review UI (card grid of items, swipe to confirm/edit/delete)
- `/app/pipeline/[sessionId]/present` — fullscreen iframe of `/sites/[slug]` with `?preview=token`
- Acceptance: from capture to ready in <60s, review UI lets you fix obvious errors, present mode is full-screen
- Depends on: T2, T3, T4

**T6 — Pipeline UI: stages 7-8** (~3-4h)
- `/app/pipeline/[sessionId]/pricing` — `<ScriptCard>` with main + variants (voucher, upsell, concorrenza)
- `/app/pipeline/[sessionId]/close` — outcome buttons (won/thinking/lost) with reason picker (PT)
- Outcome=`won` → triggers payment flow (T7)
- Outcome=`thinking` → preview link valid 30 days, follow-up scheduled
- Outcome=`lost` → archive with reason, send polite goodbye email
- Acceptance: full pipeline runnable end-to-end, outcomes recorded with reasons
- Depends on: T4

**T7 — Cash collection + legal click-thru + welcome email** (~5-8h)
- Cash flow: ToS/Privacy/DPA checkboxes UI in pricing stage, "Confirma ricevuto in contanti" button on close stage
- Receipt PDF generation (simple: business name, amount, date, plan, payment method = cash) sent via WhatsApp/email
- Tenant goes live immediately on cash confirmation
- `withdrawal_window_ends_at` set to `now() + 14 days` (refund obligation still applies even on cash)
- Resend integration with React Email templates (`welcome.it.tsx`, `welcome.en.tsx`)
- Welcome email contains: site URL, magic link 24h, plan summary, withdrawal window, "monthly recurring activation" placeholder ("In arrivo: link per attivare l'abbonamento")
- Stripe Checkout flow scaffolded but **NOT activated** until MEI/CNPJ + Stripe Standard ready (post-trip, T7.5 task)
- Acceptance: end-to-end cash close → live site → email received with site URL and recibo PDF
- Depends on: T6

**T7.5 — Stripe activation (post-trip, async)** (~4-6h)
- Triggered when Edson's MEI + Stripe Standard are KYC'd
- Activate Stripe Checkout for new sales (replaces cash UI as default option, cash stays as fallback)
- Send "activate your subscription" email to all `paid_setup_only` cash customers with personalized Stripe Checkout link for recurring
- Webhook handler flips `payment_status` from `paid_setup_only` → `active` on subscription confirmed
- Day-28 reminder email if not yet activated; site goes offline at day-30 if no activation
- Acceptance: 1+ cash customer successfully transitions to recurring via email link
- Depends on: T7 + Edson's MEI + Stripe Standard live

**T8 — Owner dashboard** (~4-6h)
- `/app/dashboard/[tenantId]` — overview with site URL, stats, recent bookings
- `/app/dashboard/[tenantId]/menu` — edit items inline, swap photos
- `/app/dashboard/[tenantId]/bookings` — list, mark confirmed/declined
- `/app/dashboard/[tenantId]/settings` — edit hours, contact emails, locale, plan upgrade
- All in Italian (matches `owner_locale`); owner sees their own brand, not Factory's
- Acceptance: owner logs in via magic link, can edit a dish, change a price, see bookings
- Depends on: T7

**T9 — Demos + pitch dry-run** (~3-5h, parallelizable)
- 3-4 real menus from Cosenza venues across vibes (1 gelateria, 1 caffetteria, 1 trattoria, 1 enoteca)
- Run them through the factory end-to-end, polish the output
- Fix any bugs surfaced
- Pratica o pitch lendo a cheat-sheet IT do PIPELINE_PLAYBOOK; com Vavà, alinhe quem fala o quê
- Practice timing: target <10min from "facciamolo" to live URL
- Acceptance: 4 demo sites live at `<slug>.thefactory.life`, pitch script comfortable
- Depends on: T2 minimum (template renders), ideally T7 for end-to-end realism. Can iterate while later tasks finish.

### Stop conditions

For each task, Claude Code:
1. Reads CLAUDE.md and the task definition
2. Confirms its dependencies are done (commit log + acceptance criteria)
3. Implements
4. Runs `pnpm build && pnpm typecheck && pnpm lint`
5. Verifies acceptance criteria
6. Commits with `feat(T<n>): <summary>`
7. **Stops and waits** for Edson to review before starting next task

If Claude Code finishes a task and is uncertain whether to continue, default to **stop**. Never blow through multiple tasks without review — each task is a checkpoint.

### Out of scope (not in any task)

- WhatsApp Business API integration (v2)
- POS / Registratore Telematico integration (v2)
- Reservation calendar logic (v1 is form → owner notification)
- Online ordering / cart / checkout for end customers (would trigger fiscal RT obligations)
- Multiple template families (one vibe-aware template until 10 paying customers)
- Auto-onboarding for new orgs (until org #2 wants in)
- Marketplace inbound (Model 3, not before validation of Models 1+2)
- Multi-language pitch scripts (TTS, SpeakButton, scripts/{lang}.ts) — diáspora play deferido até Edson decidir atacar imigrantes donos de comércio

---

## Operating principles for Claude Code

When working on this codebase:

1. **Mobile-first always.** Every operator UI is built for an iPhone in landscape on a noisy restaurant table. No hover states, big tap targets, voice input where possible.
2. **PT/IT separation is sacred.** Operator UI (`/app/*`) = Portuguese (com cheat-sheet IT inline pra ler ao dono). Public sites (`/sites/*`) = Italian (default). Marketing landing v1 = Portuguese-primary com bloco IT residual. Never mix layers. Customer never sees Portuguese on their site.
3. **Italian no operator UI aparece como texto plano dentro de cards PT** (`italian_hint`/`italian_variants` em `PIPELINE_PLAYBOOK`). Sem TTS, sem botão 🔊 — Edson lê e improvisa. v1 ataca Cosenza italianófona; multilíngue diáspora é deferido.
4. **All scripts live in `src/lib/scripts/index.ts`.** Don't hardcode operator-facing PT strings ou cheat-sheet IT em components. Centralize pra audit, A/B test, e edição rápida.
5. **Don't add libraries lightly.** Stack is locked above. If you think you need a new dep, write a comment explaining why and ask Edson before adding.
6. **GDPR is a feature.** Every new endpoint that handles personal data adds an `audit_log` entry. Every form has a consent checkbox where required.
7. **Speed of onboarding > everything.** If a feature adds 30 seconds to the factory flow, justify it or cut it.
8. **One vibe-aware template, polished.** Don't add a second template family until v1 has 10 paying customers. The single template adapts via vibe (different photo treatments, color defaults, copy hooks, page set), not by being a different theme.
9. **Edge functions for tenant resolution, RSC for everything else.** Don't ship client components that fetch tenant data — push it to RSC.
10. **No magic.** Tenant context is passed explicitly through React Server Components. No global state for tenant.
11. **Pipeline > wizard.** Factory tracks every pitch through stages, records outcomes (won/lost/thinking), and treats failure as data. Edson learns from his own funnel.

---

## Decisions log

| Date | Decision | Why |
|---|---|---|
| 2026-05-05 | Single template for v1 | Speed of build, demo clarity |
| 2026-05-05 | No WhatsApp in v1 | Verification time blocks 10-min ship |
| 2026-05-05 | Cosenza/Calabria first market | Co-founder local, ISV pathway, lower competition |
| 2026-05-05 | Stripe + Satispay, not Stripe-only | Satispay is culturally expected in IT restaurants |
| 2026-05-05 | EU-only data residency | GDPR + AI Act + customer trust |
| 2026-05-05 | Expand vertical to all F&B hospitality | Same engine, 5-10x larger TAM, higher density per block, faster sales cycle than restaurants |
| 2026-05-05 | Beachhead = gelateria + caffetteria | Single decider, lower-stakes purchase, multilingual demo with gusti is killer |
| 2026-05-05 | Project name: `Factory` (committed) | Final brand. Brand both internal (operator UI) and external (customer-facing). Industrial connotation accepted as feature, not bug — signals manufacturing/production speed which is the value prop. |
| 2026-05-05 | Internal pipeline folder: `src/components/pipeline/` (not `factory/`) | Avoids name collision now that `Factory` is the brand. The pipeline is what the components implement; factory is the brand wrapping them. |
| 2026-05-05 | Operator route: `/app/pipeline/*` (not `/app/factory/*`) | Same reason — avoids redundant URL like `thefactory.life/factory/`. |
| 2026-05-05 | API routes: `/api/jobs/*` (not `/api/factory/*`) | Reflects what they do (background jobs in factory_jobs table). |
| 2026-05-05 | Schema includes `tenants.lead_source` + `pitch_sessions.client_satisfied`/`operator_self_rating` | Preserves Model 3 ("Uber dos sites") future. Cost: 3 columns. Avoid: schema migration on a million-row table later. |
| 2026-05-05 | Lifetime plan (€690) treated as exception, not default | Locks in cliente legado se virarmos marketplace recurring no Model 3. Default = monthly; lifetime só sob pedido explícito. |
| 2026-05-05 | NOT pursuing Model 3 (managed marketplace) before Model 1 + Model 2 validated | Marketplace gerenciado requer chicken-and-egg solving + capital. Sequência correta: 1 → 2 → 3 com triggers explícitos. |
| 2026-05-05 | Pricing pivot: €490 → tiered €20/€49/€149 setup with €19/€39/€79 monthly | €20 elimina fricção psicológica, captura mercado MEI/forfettario, escala melhor pra Modelo 3 global. Three-tier anchoring drives 60-70% to Growth via natural upsell. Volume + recurring beat one-time fee. |
| 2026-05-05 | Click-to-accept legal docs (no PDF signature) for Starter/Growth | Legalmente vinculante Itália sob D.Lgs 70/2003. Reduz friction de checkout de minutos pra segundos. PDF signature via Yousign reservado pra Pro corporate ou disputas. |
| 2026-05-05 | 14-day right of withdrawal hard-coded into tenants.withdrawal_window_ends_at | Codice del Consumo italiano exige. Refund automático via Stripe se cliente cancela dentro da janela. Compliance + good faith. |
| 2026-05-05 | Three email roles per tenant: contact / public / billing | Real-world owners use different addresses for each (personal vs info@ vs accountant). Single field is wrong from day 1. |
| 2026-05-05 | Single all-in-one welcome email, not drip chain (Starter/Growth) | Maximizes read rate, reduces "não recebi" support tickets, respects cliente time. Drip onboarding only for Pro tier. |
| 2026-05-05 | React Email + Resend, locale-aware per `owner_locale` | Italian-speaking cliente recebe IT, others EN. v1 só IT/EN templates. |
| 2026-05-05 | Email validation: client-side typo detection (Mailcheck), no API verification | Mailcheck JS lib é grátis e pega 90% dos typos óbvios (gmial→gmail). API verification é over-engineering pra v1. |
| 2026-05-05 | Build plan = task graph with explicit dependencies, NOT day-based schedule | Edson trabalha em rajadas variáveis. Calendário fixo é prisão psicológica e quebra na primeira janela inesperada. Tarefas com deps são honestas: você pode fazer T1+T2 em 10h ou em 3 semanas, ambos válidos. Claude Code para após cada tarefa pra review. |
| 2026-05-05 | In-loco closing via QR code (Stripe Checkout + Satispay) rendered in operator app | Cliente saca celular, scaneia, paga em <30s. Stripe Checkout é PCI-compliant out of box. Satispay é cultural fit pra Italian café/gelateria. Both end on Stripe Tax + Invoicing. |
| 2026-05-05 | `pre_srl_mode` boolean replaced with `billing_jurisdiction` enum (br_pj / it_partner / it_srl) | Mais expressivo. Default `br_pj` permite cobrar setup + recurring desde dia 1 via Stripe Brasil + CNPJ existente. Cliente recebe invoice brasileira (export of services), commercialista italiano aplica reverse charge UE (procedimento padrão). |
| 2026-05-05 | Stripe Brasil + CNPJ atual + Wise Business EUR como infraestrutura de pagamento v1 | Edson já tem CNPJ pra contrato com Bitflow. Wise EUR evita FX loss em pagamentos europeus. Não bloqueia o lançamento na espera da SRL. |
| 2026-05-05 | Satispay deferida pra fase `it_partner` ou `it_srl` (requer P.IVA italiana) | Cultural fit perdido temporariamente, mas Stripe + Apple Pay + SEPA cobrem 95% dos casos. |
| 2026-05-05 | Cash-first launch strategy (no Stripe needed for v1) | Edson sem CNPJ → cash collection elimina dependência de infra Stripe na primeira viagem. Setup pago em mãos, recurring é opt-in posterior via Stripe quando MEI/CNPJ ativo. Separa pergunta de validação ("italianos pagam €20 cash?") de pergunta de infra ("recurring confiável?"). |
| 2026-05-05 | Pacchetto Lancio variant (€80 cash + 3 meses inclusos) | Variant pra cash-heavy quando cliente abre carteira sem hesitar. 4x cash flow por venda, reduz pressure de recurring activation, framing familiar pra Italian retail. |
| 2026-05-05 | First-month-free pra todos os cash customers | Site fica live por 30 dias mesmo sem recurring ativado. Cliente experimenta valor antes de comprometer mensalidade. Email de ativação dispara no dia 28. |
| 2026-05-05 | Prepaid packages (€110/6mo, €200/12mo) substituem cash setup + recurring opt-in | Italian SMB cultura prefere pagamento à vista anchor. Lock-in de 6-12 meses reduz churn precoce. Cash flow brutal por venda (€110-200 vs €20). Renovação fica pra fase pós-MEI já com infra digital pronta. Trade-off conhecido: trava em Modelo 1 mais tempo, MRR menos previsível, mas validação muito mais rápida. |
| 2026-05-05 | Renúncia explícita ao direito de arrependimento (Codice del Consumo art. 59) | Site live imediatamente = serviço completamente prestado. Renúncia em checkbox separado, destacada. Mesmo assim, refund honrado nos 14 dias se solicitado — goodwill > €110. |
| 2026-05-05 | Three-option pricing (mensal/6mo/12mo) com 6mo como default | Anchoring clássico: opção barata (mensal) + default visual (6mo) + opção cara (12mo). Empirical: 60-70% 6mo, 20% 12mo, 10% mensal. Volume de cash inicial maximizado. |
| 2026-05-05 | Pricing FINAL v1: 3mo €50 / 6mo €99 / 12mo €179 (sem mensal) | Eliminação completa de recurring na v1 simplifica infra: zero webhooks, zero dunning, zero failed payment logic. 12mo como anchor com custom domain incluso. Mix esperado 30/50/20 → cash médio €113/venda. |
| 2026-05-05 | Pacote 3 meses (€50) como entry-level / "trial pago" | Captura cliente cauteloso que recusaria €99. Decisão de €50 é "compra por impulso" psicológica, abaixo do limiar de "preciso pensar". Renovação no fim valida demanda real. |
| 2026-05-05 | Custom domain incluso só no 12mo Starter | Cria razão legítima pra escolher 12mo além do preço. €40/ano de valor real (registro de domínio) que cliente reconhece. Sweet spot do anchoring. |
| 2026-05-05 | `tenants.payment_status` separado de `tenants.status` | Status = publicação (draft/live), payment_status = ciclo de pagamento (paid_setup_only/active/past_due). Permite tenant `live` que ainda não tem recurring (early-adopter pre-SRL). |
| 2026-05-05 | Stripe Tax + Invoicing pago (~0.4% extra) em vez de integração SDI manual | Stripe automatiza fattura elettronica via partner. Manual com Aruba/FattureInCloud é dor real, vale 0.4% pra delegar. |
| 2026-05-05 | Table `dishes` → `items` | Generic across all F&B item types (gusti, coppe, vini, panini, dolci, gelati...) |
| 2026-05-05 | Consent-first sales model (not fait accompli) | Italian relazione-before-affare culture; unlocks interior photos, owner photos, voice capture, vibe accuracy; legally clean |
| 2026-05-05 | Capture owner's voice (30s) during onboarding | Drives authentic tagline/description; reusable as persona seed for WhatsApp agent v2 |
| 2026-05-05 | Operator UI in Portuguese, public sites in Italian | Edson is not a native Italian speaker; forcing him to navigate IT UI slows him down and errs. Clear separation. |
| 2026-05-05 | Italian scripts spoken via device TTS, not Edson | iOS Alice / Android Google IT voices are higher quality than his accent and remove a credibility risk. Free, native, offline-capable. |
| 2026-05-05 | Factory is a sales pipeline (state machine) not a wizard | Captures outcomes, learns from losses, doubles as CRM. Pipeline assumes failure is data. |
| 2026-05-05 | All scripts (PT coaching + IT TTS) live in `src/lib/scripts.ts` | Single source of truth for operator-facing copy; trivial to A/B test variants and audit. |
| 2026-05-05 | Multi-org schema from day 1 (organizations + org_members) | Factory is SaaS-ready architecture; v1 only Edson but no refactor needed for org #2 |
| 2026-05-05 | Stripe Connect Express, even with single org | Decision is irreversible later; Edson's Stripe connects as the first account in the platform |
| 2026-05-05 | Tenant slug unique per org, not globally | Different orgs can have a `da-luigi.theirroot.com` without collision |
| 2026-05-05 | Per-org root domain via env var (v1) → DB lookup (v2) | KNOWN_ROOT_DOMAINS env covers v1; switch to DB-driven when org #2 joins |
| 2026-05-05 | Multi-language pitch scripts (12+ langs) | Imigrante donos de comércio são target subatendido; arquitetura suporta scripts culturalmente adaptados por idioma |
| 2026-05-06 | **Reverte** decisão multi-language scripts. Pipeline v1 só PT coaching + IT cheat-sheet inline (texto) | Edson em Cosenza pitcha em italiano; SpeakButton/TargetLang/24-langs era over-engineering pra futuro hipotético. ~400 linhas removidas. Diáspora play (chinês, árabe, hindi) volta como tarefa nova quando Edson decidir atacar — não antes. Git history preserva o código original em `feat(t1-c)` se precisar resgatar. |
| 2026-05-06 | Marketing landing v1 em PT-primary, IT-residual | Edson é o único viewer em v1 (vendas in-person, sem SEO). Italiano só pra raros visitantes diretos. Quando SEO/SEM começar (pós-V1.5), flipa pra IT-primary. |
| 2026-05-06 | `<html lang>` dinâmico no root layout via `headers()` | Surfaces têm idiomas diferentes (pt-BR pra app/marketing, it pra tenant sites). Root layout lê `x-tenant-slug`/`x-custom-domain` setados pelo middleware. SEO correto sem precisar de layout per route group. |

Add new decisions here as they happen. Don't undo prior decisions silently — append a new entry that supersedes.

---

## Quick prompts for Claude Code

When stuck, copy-paste one of these into Claude Code:

- *"Read CLAUDE.md, then implement the menu extraction endpoint at `src/app/api/jobs/extract-menu/route.ts`. Use the prompt and category hints from `src/lib/verticals.ts`. Validate the response against a Zod schema. Insert categories and items into Supabase. Return the tenantId."*
- *"Read CLAUDE.md, then build the public site Hero component at `src/components/site/Hero.tsx`. Mobile-first. Vibe-driven (different photo treatment, copy, and CTA label per vibe — see verticals.ts). Renders business name, tagline, primary CTA. No client JS unless absolutely needed."*
- *"Read CLAUDE.md, then implement `middleware.ts` exactly as specified in the Architecture section. Add tests for hostname matching."*
- *"Read CLAUDE.md, then build the operator wizard step 3 (Review) at `src/app/app/pipeline/[tenantId]/menu/page.tsx`. Card grid, swipe interactions, inline edit. RSC where possible."*
- *"Read CLAUDE.md and src/lib/verticals.ts. Implement the vibe picker for factory step 1, with icon + name (IT/EN/DE) + description per vibe. Mobile-first, single column on phone."*
