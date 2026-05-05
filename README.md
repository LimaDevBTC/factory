# Factory

White-label, multi-tenant SaaS that ships a live website for any food & beverage hospitality business in under 10 minutes — at the venue.

Supported verticals: trattoria, osteria, ristorante, agriturismo, pizzeria, caffetteria, panineria, bar/aperitivo, gelateria, pasticceria, enoteca/wine bar, birreria/pub.

> 📖 **Read [`CLAUDE.md`](./CLAUDE.md) before doing anything.** It is the spec, the roadmap, and the rulebook.

---

## Prerequisites

- Node 20+
- pnpm 9+ (or npm — pnpm preferred for monorepo readiness)
- Supabase CLI (`brew install supabase/tap/supabase`)
- A Supabase project in **eu-central-1 (Frankfurt)**
- Anthropic API key
- Cloudflare account with R2 enabled
- Stripe account (Italy or pan-EU entity)
- A domain (`factory.app` or whatever — bought from a registrar that supports CNAME on apex via flattening, or use Cloudflare DNS)

---

## Quick start (laptop, day 1)

```bash
# 1. Clone & install
pnpm install

# 2. Copy env template and fill in
cp .env.example .env.local

# 3. Push schema to your Supabase project
supabase link --project-ref <your-project-ref>
supabase db push

# 4. Local dev with subdomain support
# lvh.me resolves all subdomains to 127.0.0.1, perfect for multi-tenant local dev
pnpm dev

# Open these URLs:
#   http://lvh.me:3000              → marketing
#   http://app.lvh.me:3000          → SaaS app
#   http://gelateriadamarco.lvh.me:3000   → tenant site (after creating one)
```

---

## Project structure

See `CLAUDE.md` for the canonical layout. TL;DR:

- `middleware.ts` — tenant resolution by hostname
- `src/app/marketing/` — landing page (`factory.app`)
- `src/app/app/` — SaaS app (`app.factory.app`)
  - `factory/` — operator-only onboarding wizard (Edson runs this)
  - `dashboard/` — restaurant owner panel
- `src/app/sites/[slug]/` — public restaurant sites
- `src/app/api/jobs/extract-menu/` — Claude vision endpoint
- `supabase/schema.sql` — database schema (run once)

---

## Build plan — tasks

The build is a graph of tasks with explicit dependencies, **no fixed schedule**. Pace is yours: rajada de 10h ou janelas curtas durante 3 semanas — both are valid. What matters is that tasks ship in dependency order.

| Task | Focus | Depends on | Est. |
|------|-------|------------|------|
| **T1** | Foundation: scaffold, middleware, schema, auth, PWA, placeholders | — | 4-6h |
| **T2** | Vibe-aware public site template (renders from DB) | T1 | 6-10h |
| **T3** | Menu extraction (Claude vision, category hints) | T1, partial T2 | 4-6h |
| **T4** | Pipeline UI stages 1-3 (approach, consent, capture) | T1 | 6-8h |
| **T5** | Pipeline UI stages 4-6 (processing, ready, present) + bg worker | T2, T3, T4 | 4-6h |
| **T6** | Pipeline UI stages 7-8 (pricing, close) | T4 | 3-4h |
| **T7** | Stripe Checkout + legal docs + welcome email | T6 | 6-10h |
| **T8** | Owner dashboard (post-purchase, italian) | T7 | 4-6h |
| **T9** | Demos with real Cosenza menus + pitch dry-run (parallelizable) | T2 minimum | 3-5h |

Total estimate: ~40-65h of focused work, dependent on Claude Code velocity. Could be 3-4 days of crunch or 3-4 weeks of part-time. Doesn't matter — the graph is what matters.

Full task definitions and acceptance criteria: `CLAUDE.md` → "Build plan — tasks, not days".

---

## What's NOT in v1

- WhatsApp Business API (sold as upsell after onboarding)
- Online ordering / cart / checkout
- Reservation calendar logic (v1 is form → owner notification)
- Multiple template designs (one polished beats five mediocre)
- POS / Registratore Telematico integration

---

## Compliance baseline (read before deploying)

This product operates in the EU. All of the following are non-optional:

- **GDPR**: Data residency in EU. Cookie banner functional. Right to erasure implemented (`/api/gdpr/delete`). Privacy policy lists sub-processors.
- **EU AI Act**: AI disclosure in every site footer. AI-generated content flagged in DB. All Claude calls logged.
- **Italian fiscal**: We do NOT process restaurant-side payments in v1, so no `Registratore Telematico` integration is needed. The restaurant pays US directly via Stripe — that's our SaaS revenue, not theirs.

If you need to bend any of these for a feature, talk to Edson first. They're load-bearing.

---

## Useful commands

```bash
pnpm dev                  # local dev
pnpm build                # production build
pnpm typecheck            # TypeScript check
pnpm lint                 # ESLint

supabase db push          # push migration to remote
supabase db reset         # reset local DB
supabase gen types typescript --linked > src/lib/supabase/types.ts  # regen types
```

---

## Deployment

- **Vercel** (region `fra1` = Frankfurt)
- Domain wildcard: `*.factory.app` → Vercel
- Custom-domain tenants: Cloudflare for SaaS → CNAME flattening → Vercel
- Supabase: keep in `eu-central-1` forever
- R2: `auto` is fine (Cloudflare handles routing); restrict to EU jurisdictional zones in bucket settings

---

## Status

- [ ] T1 — Foundation
- [ ] T2 — Public site template
- [ ] T3 — Menu extraction
- [ ] T4 — Pipeline UI stages 1-3
- [ ] T5 — Pipeline UI stages 4-6
- [ ] T6 — Pipeline UI stages 7-8
- [ ] T7 — Stripe + legal + welcome email
- [ ] T8 — Owner dashboard
- [ ] T9 — Cosenza demos + pitch dry-run
- [ ] First paying customer in Cosenza
