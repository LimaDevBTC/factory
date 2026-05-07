# Factory — BUILD_PLAN

> **Propósito**: guia operacional pra construção da v1, do zero ao primeiro cliente pago em Cosenza.
> **Complementa** [`CLAUDE.md`](./CLAUDE.md) — não substitui. CLAUDE.md = política/spec/regras. BUILD_PLAN.md = execução/decisões/checkpoints.
> **Atualize** este arquivo conforme decisões mudarem. Risco maior é deixar ele desincronizado da realidade.

---

## TL;DR (estado em 2026-05-06)

- T0 ✅, T1 ✅, T2 ✅, T4 ✅ (pipeline list + KPIs, /new, stage router, ScriptCard + IT cheat-sheet, RecordButton/PhotoUploader, capture form com upsert tenant + Supabase Storage)
- Próximo passo: **T3** (menu extraction via Claude vision) e/ou **T5** (processing + ready + present)
- Modelo v1: **cash-only**, 3/6/12 meses prepago (€50/€99/€179)
- Stripe: **diferido pra T7.5** (pós-MEI/CNPJ + Stripe Standard ativo)
- Multilíngue TTS: **removido em v1** (só PT coaching + IT cheat-sheet inline). Diáspora play deferido, volta como tarefa nova.
- Beachhead Cosenza: gelateria + caffetteria primeiro

---

## Sumário

- [Cross-cutting não-negociáveis](#cross-cutting-não-negociáveis)
- [Auditoria do scaffold existente](#auditoria-do-scaffold-existente)
- [T0 — Reset & cleanup](#t0--reset--cleanup)
- [T1 — Foundation](#t1--foundation)
- [T2 — Public site template](#t2--public-site-template)
- [T3 — Menu extraction](#t3--menu-extraction)
- [T4 — Pipeline stages 1-3 (approach, consent, capture)](#t4--pipeline-stages-1-3)
- [T5 — Pipeline stages 4-6 + worker](#t5--pipeline-stages-4-6--worker)
- [T6 — Pipeline stages 7-8 (pricing, close)](#t6--pipeline-stages-7-8)
- [T7 — Cash close + legal + welcome email](#t7--cash-close--legal--welcome-email)
- [T8 — Owner dashboard](#t8--owner-dashboard)
- [T9 — Cosenza dry-run](#t9--cosenza-dry-run)
- [Diferido](#diferido)
- [Decisões em aberto](#decisões-em-aberto)
- [Reference / cheat sheet](#reference--cheat-sheet)

---

## Cross-cutting não-negociáveis

Estas regras sobrescrevem qualquer decisão local. Ler antes de cada tarefa.

### Idiomas (separação sagrada)

| Camada | Path | Idioma |
|---|---|---|
| Operator UI | `/app/*` (exceto `/app/dashboard/*`) | **pt-BR** sempre |
| Cheat-sheet IT pro pitch | `src/lib/scripts/index.ts` (`italian_hint` por stage) | italiano (texto plano dentro de cards PT, sem TTS) |
| Owner dashboard | `/app/dashboard/[tenantId]/*` | `tenants.owner_locale` (default `it`) |
| Public site | `/sites/[slug]/*` | `tenants.default_locale` + `enabled_locales` |
| Marketing | `/marketing/*` | `it` (mercado-alvo é Itália) |

Nunca misturar. Edson nunca lê italiano na factory; cliente nunca vê português.

### Stack travado (não adicionar libs sem perguntar)

Next.js 14 App Router · Tailwind + shadcn · Supabase (Frankfurt) · `@supabase/ssr` · Anthropic SDK (Opus 4.7 vision, Haiku 4.5 texto) · Resend · Cloudflare R2 · React Server Components por padrão.

**Sem:** Stripe, Satispay, Wise, Plausible, Mailcheck, qrcode em v1. Entram em T7.5+ ou diferidos.

### GDPR / AI Act / fiscal italiano

- Data residency: **EU only**, sempre. Frankfurt > tudo.
- Cookie banner funcional (Necessary always, Analytics/Marketing opt-in).
- AI footer: *"Alcune descrizioni di questo sito sono state generate con assistenza di intelligenza artificiale."* — em todas as páginas tenant.
- AI calls logadas em `ai_calls` table.
- Audit log em `audit_log` pra ações sensíveis.
- Site **NÃO processa pagamentos do cliente final** (sem cart/checkout). Mantém fora do escopo `Registratore Telematico`.

### Mobile-first sempre

Operator UI testada em iPhone landscape, brilho máximo, mesa de bar barulhenta. Tap targets grandes, sem hover, voz onde dá.

### Pipeline ≠ wizard

Cada pitch é uma `pitch_session` que evolui por estados. Outcomes (`won`/`lost`/`thinking`) com motivo registrado. Falha é dado.

### Comentários no código

Default = **zero comentários**. Só escreve quando o "porquê" é não-óbvio (constraint oculta, workaround específico, invariante sutil). Não documentar o "o quê" — nome do identificador faz isso.

---

## Auditoria do scaffold existente

Análise feita em 2026-05-05 dos arquivos do `factory.tar.gz` + extraídos.

### Schema SQL (`supabase/schema.sql`) — **mantém**

725 linhas. Já deployado em Supabase (14 tabelas + RLS + seed da org Edson). Reflete decisões de CLAUDE.md (multi-org, prepaid packages, withdrawal waiver, three email roles, lead_source, AI traceability).

**Pequenos ajustes em T0:**
- Header diz "Trattoria Factory" → trocar pra "Factory"
- Linha 723 tem TODO v1.1 sobre operators table — manter como está (correto pra v1)
- Verificar consistência de `default_locale` (texto curto: 'it') vs `pitch_sessions.target_lang` (BCP-47: 'it-IT'). Já é coerente — locales pra UI, BCP-47 pra TTS

### Middleware (`middleware.ts`) — **mantém**

96 linhas. Resolve 4 padrões de host: `<root>` / `www.<root>` / `app.<root>` / `<slug>.<root>` / custom-domain. Multi-org via `KNOWN_ROOT_DOMAINS`. Headers `x-org-root-domain`, `x-tenant-slug`, `x-custom-domain`. Sem mudanças necessárias.

### package.json — **trim em T0**

Remover (não usados em v1):
- `stripe` ❌ (T7.5+)
- `@types/qrcode` ❌ (era pra QR do Stripe)
- `qrcode` ❌
- `mailcheck` ❌ (T7+, lib pequena, adiciona quando necessário)

Manter resto. Confirmar versões compatíveis.

### `src/lib/scripts/index.ts` — **bug + mantém**

🐛 **Bug**: linhas 20-24 importam de `./scripts/it`, `./scripts/zh-CN`, etc. Arquivo está em `src/lib/scripts/index.ts`, então paths corretos são `./it`, `./zh-CN`, etc. Falha em compile.

Resto OK: `PIPELINE_STAGES`, `TargetLang` BCP-47, `LANG_INFO` com 24 idiomas, `getTtsTier` (native/fallback/manual), `COMMON_COACHING_PT` já com texto cash-only.

### `src/lib/scripts/{it,en,zh-CN,ar,hi-IN}.ts` — **revisar conteúdo**

Tier 1 (it, en) provavelmente OK. Tier 2 (zh-CN, ar, hi-IN) precisa review por nativo antes de produção. **Não bloqueia v1** — italiano é o idioma da Cosenza pitch.

### `src/lib/verticals.ts` — **mantém**

288 linhas, 12 vibes completos com label trilingual, descrição, ícone Lucide, takesReservations bool, categoryHints (alimenta Claude vision), defaultColors, fontPairing, menuCta, menuPageLabel. Excelente.

### `src/lib/allergens.ts` — **mantém + criar SVGs**

65 linhas. EU 14 allergens com labels IT/EN/DE + path SVG. **Pendente em T2**: criar 14 ícones SVG em `public/allergens/`. Sources livres existem (e.g. iconfinder, fontawesome free) — ou geramos minimalistas próprios.

### `src/components/pipeline/SpeakButton.tsx` — **mantém com review**

151 linhas. Lida com 3 tiers TTS, fallback MP3, voiceMissing UX. Usa `'use client'` corretamente. Acessível (`aria-label`).

Review futuro: testar em iPhone real (iOS Safari TTS é diferente de Chrome desktop). Tier 3 (sq-AL, bn-IN, etc.) requer MP3 hospedado — estratégia em CLAUDE.md mas não implementada — diferir até precisar.

### README.md — **atualizar em T0**

Lista Stripe como prereq, fala de Cloudflare for SaaS — atualizar pra refletir cash-only v1, sem Stripe ainda.

### Faltando (criar do zero)

- `next.config.mjs`
- `tailwind.config.ts`
- `tsconfig.json`
- `postcss.config.js`
- `src/app/*` (todas as routes)
- `src/lib/supabase/{client,server,admin,types}.ts`
- `src/lib/tenant.ts`
- `src/lib/claude.ts` (T3)
- `src/lib/email.ts` (T7)
- `src/components/ui/*` (shadcn)
- `src/components/site/*`
- `public/icon-{192,512}.png`
- `public/allergens/*.svg`
- `scripts/smoke.sh`
- `.gitignore`

---

## T0 — Reset & cleanup

**Objetivo**: deixar o scaffold limpo e consistente antes de começar T1.

**Não tem entrega visual.** É housekeeping necessário pra T1 não tropeçar em lixo herdado.

### Checklist

- [ ] **Extrair tarball** completo: `tar -xzf factory.tar.gz --strip-components=1` (já que `factory/` interno repete o nome)
- [ ] **Resolver conflito de nomes**: tarball tem `factory/CLAUDE.md` mas já temos um na raiz com decisões mais recentes — manter o atual (é o autoritativo)
- [ ] **Bug fix**: `src/lib/scripts/index.ts` imports `./scripts/it` → `./it` (5 imports)
- [ ] **Schema header**: trocar "Trattoria Factory" por "Factory" no `supabase/schema.sql` (cosmético, schema já tá no banco)
- [ ] **package.json trim**: remover `stripe`, `qrcode`, `@types/qrcode`, `mailcheck`
- [ ] **README rewrite**: cash-only flow, sem Stripe na quick start, atualizar tabela de tasks
- [ ] **`.gitignore`**: confirmar que cobre `.env.local`, `.next/`, `node_modules/`, `.vercel/`, `.DS_Store`
- [ ] **Git init clean**: primeiro commit com tudo limpo, mensagem `chore: scaffold inicial revisado e cleanup pré-T1`
- [ ] **`pnpm install`**: confirma que as deps trimadas instalam sem erro

### Critério de "pronto"

`pnpm install` clean, `git log` mostra 1-2 commits limpos, `src/lib/scripts/index.ts` compila (rodar `tsc --noEmit` rápido), `.env.local` tá com as 5 vars preenchidas.

### Tempo estimado

30-60 min. Tarefa mecânica.

---

## T1 — Foundation

**Objetivo**: app Next.js 14 rodando local com middleware multi-tenant, login magic-link, Supabase plugada, placeholders renderizando nas 3 superfícies (marketing, app, sites).

**Dependências**: T0 ✅ + Supabase deployed ✅ + `.env.local` ✅

### Subtarefas (commit após cada letra)

#### A. Bootstrap Next.js
- `next.config.mjs`: App Router, image domains (`*.supabase.co`, R2 pública), região `fra1` hint via `output.runtime` se aplicável
- `tailwind.config.ts`: shadcn baseline, fontes (Inter UI / Cinzel hero), conteúdo `./src/**`
- `tsconfig.json`: `@/*` → `./src/*`, strict, target ES2022
- `postcss.config.js`: tailwind + autoprefixer
- `src/app/globals.css`: shadcn CSS variables (claro/escuro)
- `src/app/layout.tsx`: metadata base, `<html lang="it">`, viewport mobile, font loading
- `.eslintrc.json`: extends `next/core-web-vitals`, no `next/typescript` que dá ruído
- **Commit**: `feat(t1-a): bootstrap next.js + tailwind`

#### B. Supabase clients
- `src/lib/supabase/client.ts`: `createBrowserClient` do `@supabase/ssr`
- `src/lib/supabase/server.ts`: `createServerClient` lendo cookies da request
- `src/lib/supabase/admin.ts`: service-role client; `throw` se `typeof window !== 'undefined'`
- `src/lib/supabase/types.ts`: tipos manuais pra `Organization`, `OrgMember`, `Tenant`, `PitchSession`, `Item`, `Category`. Não auto-gen ainda
- **Commit**: `feat(t1-b): supabase clients + types`

#### C. Tenant/org resolution
- `src/lib/tenant.ts`:
  - `getOrganizationByRootDomain(host)`
  - `getTenantBySlug(orgId, slug)`
  - `getTenantByCustomDomain(host)`
  - `getCurrentUserOrgMembership()` → `{ org, role } | null`
- Todos RSC-friendly (server.ts client). Type-safe via `types.ts`
- **Commit**: `feat(t1-c): tenant/org resolution helpers`

#### D. Magic-link auth
- `src/app/app/(auth)/login/page.tsx`: form PT, valida email contra `OPERATOR_EMAILS` env (split por vírgula)
- `src/app/app/(auth)/callback/route.ts`: troca code por session, redirect `/app/pipeline`
- `src/app/app/(auth)/logout/route.ts`: POST → signOut → redirect `/app/login`
- `src/app/app/layout.tsx`: protege rotas — sem session → `/app/login`; com session sem `org_members` → "Acesso negado" PT
- **Commit**: `feat(t1-d): magic-link auth (operator)`

#### E. Middleware integration check
- Verificar `middleware.ts` da raiz funciona com as rotas:
  - `lvh.me:3001` → `/marketing`
  - `app.lvh.me:3001` → `/app/login` (porque sem auth)
  - `qualquercoisa.lvh.me:3001` → `/sites/qualquercoisa` (renderiza 404 italiano)
- Sem mudanças no middleware se possível
- **Commit**: `chore(t1-e): verify middleware routes`

#### F. Marketing landing
- `src/app/marketing/page.tsx`: H1 "Factory" + subhead IT + CTA `mailto:` + footer com cookie banner stub
- Mobile-first, minimalista, sem over-design
- **Commit**: `feat(t1-f): marketing landing placeholder (it)`

#### G. App home + pipeline placeholder
- `src/app/app/page.tsx`: redirect `/app/pipeline`
- `src/app/app/pipeline/page.tsx`: heading PT "Pipeline" + empty state + "+" disabled + email logado + Sair button
- **Commit**: `feat(t1-g): pipeline placeholder (pt)`

#### H. Public site placeholder
- `src/app/sites/[slug]/page.tsx`: RSC lê `x-org-root-domain` header, look up tenant, renderiza:
  - Não encontrado / status != 'live' → 404 IT "Locale non trovato"
  - Encontrado → placeholder mostrando nome, vibe, "Sito in costruzione"
- **Commit**: `feat(t1-h): public site placeholder (it)`

#### I. PWA manifest
- `src/app/manifest.ts` (MetadataRoute.Manifest)
- `public/icon-192.png`, `public/icon-512.png` — gerar com cor sólida + texto "F" (Python/Pillow ou online)
- Apple-touch-icon meta no root layout
- **Commit**: `feat(t1-i): pwa manifest + icons`

#### J. Smoke test
- `scripts/smoke.sh`: `pnpm build && pnpm typecheck && pnpm lint`
- `chmod +x scripts/smoke.sh`
- Rodar até passar verde
- **Commit**: `chore(t1-j): smoke script + green build`

### Schema delta

Nenhuma. Schema já tá deployado.

### Acceptance (manual, antes de declarar T1 done)

- `pnpm dev` boota sem erro
- `http://lvh.me:3001` → marketing IT
- `http://app.lvh.me:3001` → redirect login
- Login PT, email não-whitelisted → erro PT
- Email whitelisted → magic link enviado (ver Supabase auth logs)
- Click no link → redirect `/app/pipeline` com email + Sair button
- Logout → volta pra login
- `http://qualquercoisa.lvh.me:3001` → 404 IT
- Manifest válido em DevTools → Application
- iPhone Safari → "Add to Home Screen" cria ícone Factory
- `pnpm build && pnpm typecheck && pnpm lint` verde
- ~10 commits limpos

### Riscos

- Magic link pode demorar (Supabase SMTP free, às vezes vai pro spam)
- `lvh.me` pode falhar em VPN corporativa → workaround `/etc/hosts`
- iOS Safari TTS quirks (não bloqueia T1, só relevante a partir de T4)

### Tempo estimado

4-6h focado.

---

## T2 — Public site template

**Objetivo**: template único vibe-aware renderizando dados reais do banco. Páginas: home, menu/gusti/carta, prenota (condicional), contatti.

**Dependências**: T1

### Decisões

- **Um template, vibe-driven** (não 12 templates). Diferenciação via `VIBE_CONFIG` (cor, fonte, label do menu, takesReservations).
- **i18n**: `next-intl` com `tenants.enabled_locales` driving available locales; switcher em `<Footer>`.
- **Allergen icons**: 14 SVGs em `public/allergens/`.
- **Cookie banner**: funcional (não stub) — necessary always-on, analytics/marketing opt-in. Persiste consent em `consents` table com `visitor_hash = sha256(ip + ua + salt)`.

### Subtarefas

#### A. Layout + i18n setup
- `src/app/sites/[slug]/layout.tsx`: RSC, busca tenant, monta provider de locale, header com nav, footer
- `src/lib/i18n.ts`: helper pra resolver locale por header/cookie
- `src/messages/{it,en,de}.json`: traduções base do template (nav, footer, legal)
- `src/components/site/Header.tsx`, `Footer.tsx`, `LocaleSwitcher.tsx`
- `src/components/site/CookieBanner.tsx` (client component, posta em `/api/consents`)
- `src/app/api/consents/route.ts`: POST com hash do IP+UA+salt

#### B. Home (Hero + Highlights)
- `src/components/site/Hero.tsx`: foto + nome + tagline (`tagline_it`/etc) + CTA com label do `VIBE_CONFIG.menuCta`
- `src/components/site/Highlights.tsx`: 3-4 cards rápidos (highlights do menu, hours, "prenota" se aplicável)
- `src/app/sites/[slug]/page.tsx`

#### C. Menu/Gusti/Carta
- `src/app/sites/[slug]/menu/page.tsx` (label adapta via `VIBE_CONFIG.menuPageLabel`)
- `src/components/site/MenuSection.tsx`: agrupa itens por categoria, ordena por `display_order`
- `src/components/site/DishCard.tsx`: foto, nome, descrição, preço €, `<AllergenBadges>`, `<DietaryBadges>`
- `src/components/site/AllergenBadges.tsx`: 14 SVGs lookup em `allergens.ts`
- Filter UI: dropdown "Senza glutine", "Vegano", filtra `allergens` array
- Renderiza só `is_available = true`

#### D. Prenota (condicional)
- `src/app/sites/[slug]/prenota/page.tsx` — só montar se `VIBE_CONFIG[vibe].takesReservations === true`
- `src/components/site/BookingForm.tsx`: client component, posta em `/api/bookings`
- `src/app/api/bookings/route.ts`: insert em `bookings` table, dispara email pro `tenants.contact_email` (se T7 já feito) ou só persiste por enquanto
- Não-aplicável vibes (gelateria, caffetteria, etc.) → não link nem rota

#### E. Contatti
- `src/app/sites/[slug]/contatti/page.tsx`
- Mostra address, phone, whatsapp, hours_json renderizado
- Google Maps embed lazy-loaded com gate de consent (não carrega antes do user aceitar marketing)

#### F. Allergen SVGs
- 14 ícones em `public/allergens/{nome}.svg`
- Estratégia: SVGs minimalistas próprios (linha simples + sigla) OU subset de pack open-source compatível (verificar licença)

#### G. Vibe-specific styling
- Aplicar `tenants.primary_color` / `secondary_color` via CSS vars in-line no layout
- Font pairing via `tenants.font_pairing` (cinzel_inter / playfair_lato / unbounded_inter / cormorant_dmsans)
- Carregar fontes via `next/font/google`

#### H. Seed tenant pra testar
- SQL via Management API: criar tenant `da-luigi` com vibe `trattoria_familiare`, status `live`, 3 categorias, ~10 items, hours_json
- OR: criar via dashboard pra walkthrough manual

### Schema delta

Nenhuma. Schema já tem tudo (categorias, items, allergens, hours_json, brand colors).

### Acceptance

- Tenant seed `<slug>.lvh.me:3001` renderiza home → menu → contatti
- Vibe gelateria não mostra `prenota` (rota 404)
- Vibe trattoria mostra `prenota` e formulário posta sem erro
- Allergen filter funciona, allergens badges aparecem nos itens
- Locale switcher EN ↔ IT troca conteúdo (tradução fallback pra IT se EN faltar)
- Cookie banner aparece em primeira visita, dismissa, persiste decisão
- Maps só carrega após consent
- Mobile: Lighthouse > 90 performance, > 95 acessibilidade
- Typecheck/lint/build verde

### Riscos

- `next-intl` setup tem armadilhas (App Router config). Reservar 1h pra debugging
- Fontes do Google podem inflar bundle — usar `display: swap` + `subsets: ['latin']`
- Allergen SVGs sem licença clara → atrasa T2

### Tempo estimado

6-10h focado.

---

## T3 — Menu extraction

**Objetivo**: endpoint que recebe URLs de fotos + vibe → chama Claude vision → extrai categorias + items + allergens → insere no banco.

**Dependências**: T1 + R2 setup (mesmo que minimal — pode usar Supabase Storage como fallback inicial)

### Subtarefas

- `src/lib/claude.ts`: wrapper do Anthropic SDK, `extractMenu(photos, vibe)` retorna JSON validado por Zod
- `src/lib/storage.ts`: wrapper R2 upload (S3-compat client) — ou alias Supabase Storage até T3 final
- `src/app/api/jobs/extract-menu/route.ts`:
  - Auth: requer operator session
  - Input: `{ pitch_session_id, photo_urls, vibe }`
  - Chama Claude com prompt + `categoryHints` do `verticals.ts`
  - Valida via Zod (categories[] + items[] com allergens só do EU 14)
  - Cria `tenant` (status `draft`) + categorias + items
  - Loga em `ai_calls` (tokens, custo, prompt_hash)
  - Retorna `{ tenant_id, job_id, categoriesCount, itemsCount }`
- `src/app/api/jobs/generate-copy/route.ts` (opcional, em paralelo): pega items sem `description_*` e chama Haiku pra IT/EN/DE — flag `description_ai_generated = true`
- Background: usar `factory_jobs` table pra status (queued/processing/ready/failed)

### Schema delta

Nenhuma.

### Acceptance

- Upload 3 fotos reais de menus diferentes (pizzeria, gelateria, trattoria)
- Endpoint retorna JSON válido em < 60s
- 90%+ dos itens reconhecidos com nome + preço
- Allergens só capturados quando explicitamente marcados
- `ai_calls` populada com tokens/custo
- Erro de Claude (invalid JSON) → response 500 com mensagem útil + entry em `factory_jobs.error_message`

### Riscos

- Claude pode misturar categorias visualmente próximas — mitigado por `categoryHints`
- Preços decimais europeus (`12,50` → 1250 cents) — incluir explicitamente no prompt
- Foto borrada / luz ruim → preço 0, operator corrige em T5 review

### Tempo estimado

4-6h focado.

---

## T4 — Pipeline stages 1-3

**Objetivo**: UI mobile-first das 3 primeiras etapas: approach → consent → capture. PT coaching com cheat-sheet IT inline + form de captura. Italian-only em v1 (sem language picker, sem TTS).

**Dependências**: T1

### Subtarefas

- `src/app/app/pipeline/page.tsx`: dashboard com pitches em curso + KPIs (won/lost/thinking) + "+ Novo pitch"
- `src/app/app/pipeline/new/page.tsx`: cria `pitch_session` com `target_lang = 'it-IT'` hard-coded em v1, `current_stage = 'approach'`
- `src/app/app/pipeline/[sessionId]/[stage]/page.tsx`: roteador de stage
- `src/components/pipeline/ScriptCard.tsx`: renderiza `coaching_pt` + `italian_hint` (texto IT plano, selecionável) + `italian_variants` (collapse com label_pt + texto IT)
- `src/components/pipeline/StageHeader.tsx`: progresso visual (1/8 ... 3/8), botão voltar
- `src/components/pipeline/RecordButton.tsx`: grava `MediaRecorder`, sobe pra R2, salva URL em `pitch_sessions.consent_audio_url`
- `src/components/pipeline/PhotoUploader.tsx`: input `capture="environment"` + multi, sobe pra R2
- `src/components/pipeline/CaptureForm.tsx`: campos PT (nome, indirizzo, p_iva, telefono, contact_email, public_email, hours, vibe, site_locales)
- Server actions pra avançar stage (atualiza `current_stage`, timestamp, tenant_id se já criado)

### Schema delta

Nenhuma. `pitch_sessions.target_lang` continua coluna textual mas em v1 sempre `'it-IT'`.

### Acceptance

- Edson cria sessão (sem picker de idioma), avança pra approach
- Approach: vê coaching PT + texto IT visível pra ler ao dono + 2 variantes em collapse, clica "próximo"
- Consent: lê coaching PT + frase IT, grava 5s de áudio do dono dizendo "sì", áudio sobe pra R2
- Capture: preenche form, anexa 3 fotos do menu, grava 30s da voz do dono
- Tudo persiste em `pitch_sessions` + `tenants` (draft)
- Mobile (iPhone real) flow funciona end-to-end

### Riscos

- iOS Safari: `MediaRecorder` aceita só formatos limitados — usar `audio/mp4` com fallback
- Upload de foto grande em rede ruim — exibir progresso, retry on fail

### Tempo estimado

5-7h focado (sem SpeakButton, ~1h a menos que estimativa anterior).

---

## T5 — Pipeline stages 4-6 + worker

**Objetivo**: processamento background → site renderizado → review → presentation.

**Dependências**: T2 + T3 + T4

### Subtarefas

- `src/app/app/pipeline/[sessionId]/processing/page.tsx`: polling em `factory_jobs.status` até `ready` ou `failed`. Mostra ETA, mensagem rotativa "Tu volta pra mesa, eu te aviso"
- Background worker: rota `/api/jobs/process` (cron OR direct invoke após capture). Pega job queued → roda extract-menu + generate-copy → atualiza tenant → marca job ready
- Push notification: usar Web Push API (opcional v1 — fallback é polling com badge)
- `src/app/app/pipeline/[sessionId]/ready/page.tsx`: card grid dos items extraídos. Swipe-to-delete, tap-to-edit. Auto-detecta erros prováveis (preço 0, descrição "..."). Confirma OK → avança
- `src/components/pipeline/MenuReview.tsx`: client component com `useOptimistic` pra edits inline
- `src/app/app/pipeline/[sessionId]/present/page.tsx`: iframe fullscreen `/sites/<slug>?preview=token` — gera token assinado em RSC pra autorizar visualização sem `status='live'`

### Schema delta

Considerar adicionar `tenants.preview_token` (text, nullable) pra autorizar preview de tenants ainda em `draft`. Refazer policy `public_read_*` pra incluir `... or preview_token = current_setting('request.preview_token')`.

Alternativa simpler: rota especial `/sites/_preview/[id]` com auth via cookie de operator session. Decidir em T5.

### Acceptance

- Capture → processing transição em < 5s
- Job processa em < 60s (3 fotos)
- Ready: vê 10-20 items extraídos, edita 2-3 inline, salva
- Present: iframe abre em fullscreen, scroll/zoom funcionam, parece site real
- Todo flow em iPhone: capture → ready → present sem perder estado

### Riscos

- Cron Vercel free tier tem limites — usar invocação direta pós-capture
- Preview de tenant draft sem RLS bypass cheirando: cuidado pra não vazar dados em produção

### Tempo estimado

4-6h focado.

---

## T6 — Pipeline stages 7-8

**Objetivo**: pricing UI com 3 opções + close com outcome registrado.

**Dependências**: T4

### Subtarefas

- `src/app/app/pipeline/[sessionId]/pricing/page.tsx`: ScriptCard com main + variants (`spinta_12mo`, `so_3mo_6mo`, `upsell_growth`, etc. — definidos em `scripts/it.ts`)
- UI: 3 cards (3mo €50 / 6mo €99 / 12mo €179 ⭐). Cliente toca o que escolheu — guarda em `pitch_sessions.metadata.selected_plan`
- `src/app/app/pipeline/[sessionId]/close/page.tsx`: 4 botões grandes — Won / Thinking / Lost / No-show
- Won → continua pra T7 (cash flow)
- Thinking → modal "preview link válido 30 dias", agenda follow-up, marca outcome
- Lost → modal motivo (lista `OUTCOME_REASONS_PT` de `scripts/index.ts`), salva, fim
- No-show → marca, fim

### Schema delta

Nenhuma. `pitch_sessions.outcome`, `outcome_reason`, `outcome_notes`, `follow_up_at` já existem.

### Acceptance

- Pricing renderiza 3 cards corretos
- Cliente toca opção → estado atualiza
- Close com outcome=won avança pra cash UI (T7)
- Outcome=lost com motivo persiste
- Email de "vai pensar" agendado em 3 dias (T7 envia, T6 só agenda)

### Tempo estimado

3-4h focado.

---

## T7 — Cash close + legal + welcome email

**Objetivo**: flow de fechamento cash com renúncia ao recesso + recibo PDF + welcome email + tenant vai live.

**Dependências**: T6 + Resend ativo

### Subtarefas

#### A. Legal pages (públicas)
- `src/app/legal/terms/page.tsx` (Italiano, versionado)
- `src/app/legal/privacy/page.tsx` (sub-processadores: Anthropic, Supabase, Vercel, Cloudflare, Resend, R2)
- `src/app/legal/dpa/page.tsx` (DPA standard SCC italiano)
- Versão controlada via env `LEGAL_TERMS_VERSION`, etc.

#### B. Cash collection UI (na pricing/close stage)
- Checkboxes obrigatórios:
  1. "Accetto i Termini di Servizio" (link)
  2. "Accetto l'informativa privacy e firmo il DPA"
  3. **"Acconsento all'esecuzione immediata del servizio (pubblicazione del sito) e riconosco di perdere il diritto di recesso una volta che il sito sia online. Codice del Consumo art. 59."** (destacado, separado)
- Opcional: "Voglio ricevere comunicazioni commerciali"
- Cada acceptance salva `terms_accepted_at`, `terms_version`, `*_ip_hash`, `*_user_agent`, `withdrawal_waived_at`, `withdrawal_waiver_text`
- Botão final: "✅ Confirma ricevuto in contanti €{amount}"
- Action: marca tenant `payment_status = 'paid_setup_only'`, `payment_method = 'cash'`, `cash_collected_at = now()`, `cash_collected_by = operator_id`, `service_period_starts_at = now()`, `service_period_ends_at = now() + plan duration`, `status = 'live'`, `published_at = now()`

#### C. Receipt PDF
- `src/lib/receipt.ts`: gera PDF simples (jsPDF ou React-PDF — decidir)
- Conteúdo: logo Factory, business name, P.IVA, plan, amount, date, payment method = "Contanti", "Ricevuta non fiscale" disclaimer
- Sobe pra R2, URL salva em `tenants.cash_receipt_pdf_url`

#### D. Welcome email
- `src/emails/welcome.it.tsx` (React Email): site URL, magic link 24h, plan summary, withdrawal window dates, links legal versions, receipt PDF URL, suporte reply-to
- `src/lib/email.ts`: wrapper Resend, locale-aware
- Trigger: imediatamente após cash close
- Email envia mesmo se `contact_email_verified_at` é null — clicar magic link verifica

#### E. Withdrawal honor (mesmo com waiver)
- Endpoint `/api/refund/[tenantId]`: marca `withdrawal_exercised_at`, `payment_status = 'refunded'`, `status = 'suspended'`
- Operador-only por enquanto (cliente liga/email pra Edson, ele aciona)

### Schema delta

Nenhuma. Tudo já tem coluna no schema.

### Acceptance

- Operador escolhe plano, vê checkboxes, todos marcados → botão habilita
- Toca "Confirma" → tenant vai pra `live` em < 2s
- Email chega em < 30s no email do dono
- PDF acessível no link do email
- `withdrawal_window_ends_at` = `cash_collected_at + 14 dias`
- Site live em `<slug>.lvh.me:3001` (dev) com dados reais

### Riscos

- React-PDF é pesado (~500KB bundle) — gerar PDF server-side com jsPDF Node ou Puppeteer-lite
- Resend free tier: 100 emails/dia. Suficiente pra v1
- Email italiano: revisar com nativo antes de produção (Vavà)

### Tempo estimado

5-8h focado.

---

## T8 — Owner dashboard

**Objetivo**: dono do tenant loga (magic link no welcome email), gerencia menu/horários/bookings.

**Dependências**: T7

### Subtarefas

- `src/app/app/dashboard/[tenantId]/page.tsx`: overview (site URL, KPIs simples, status pagamento, link suporte)
- `src/app/app/dashboard/[tenantId]/menu/page.tsx`: edit inline items, swap fotos, toggle availability
- `src/app/app/dashboard/[tenantId]/bookings/page.tsx`: list + mark confirmed/declined
- `src/app/app/dashboard/[tenantId]/settings/page.tsx`: hours, contact emails, locale, withdrawal banner se dentro da janela
- Layout: idioma do dono (`tenants.owner_locale`), brand do tenant (não Factory)
- Auth: magic link → set cookie → RLS via `tenant_users.role = 'owner'`
- Banner condicional: "Cancella entro {date} per rimborso completo" se dentro de 14 dias

### Schema delta

Nenhuma.

### Acceptance

- Dono clica magic link no welcome email → `/app/dashboard/<id>` em `it`
- Edit dish: muda preço de €5,00 pra €5,50, salva, public site reflete em < 5s
- Adiciona booking manualmente: aparece na lista
- Settings: muda email público, footer do site atualiza

### Riscos

- RLS pra `tenant_users` precisa testar bem — risco de owner ver dados de outro tenant
- "Brand do tenant" significa: header customizado com `tenants.logo_url`, NÃO mostra "Factory" (operator-only). Confundir é fácil

### Tempo estimado

4-6h focado.

---

## T9 — Cosenza dry-run

**Objetivo**: 4 demos reais end-to-end + pitch ensaiado em italiano.

**Dependências**: T2 mínimo (pra demo); T7 ideal (pra realismo)

### Subtarefas

- Coletar 4 menus reais de Cosenza (1 gelateria, 1 caffetteria, 1 trattoria, 1 enoteca) — pode ser via foto enviada por amigo local OU encontrado online (sites de TripAdvisor que mostram menu)
- Rodar cada um pelo factory: capture → process → ready → present → close (won simulado)
- Resultado: 4 sites live em `<slug>.lvh.me:3001` ou `<slug>.factory.app` se já deployado
- Polish: corrigir traduções estranhas, ajustar CSS de vibes específicos
- Practice pitch: cronometrar do "facciamolo" até site live — meta < 10min
- Documentar bugs encontrados, abrir issues, fix os bloqueantes

### Acceptance

- 4 demos prontos pra mostrar no celular
- Pitch < 10min consistente
- Confiança em mostrar pra um dono real

### Tempo estimado

3-5h. Paralelo com T2-T8 (a partir de T2 pode começar a coletar menus).

---

## Diferido

Tarefas/features mapeadas mas explicitamente fora de v1.

### T7.5 — Stripe activation (pós-MEI/CNPJ)

Trigger: Edson tem MEI ou CNPJ Brasil ativo + Stripe Standard onboarded.

- Re-add Stripe deps em `package.json`
- Stripe Checkout pra novos closes (cash continua como fallback)
- Email de "ativa tua subscription" pra cash customers existentes (link Stripe Checkout personalizado)
- Webhook handler `payment_status` cash → active
- Day-28 reminder + day-30 site offline se sem ativação

Estimado: 4-6h.

### T7.6 — Custom domains (Cloudflare for SaaS)

Trigger: primeiro cliente do plano 12mo Starter ou Growth.

- API integração com Cloudflare for SaaS
- Self-serve "conecta meu dominio.it" no dashboard do dono
- DNS verification flow

Estimado: 4-8h.

### T8.5 — Email verification flow

Trigger: primeiros suporte tickets confusos por unverified email.

- Banner "verifica seu email" no dashboard
- Re-send magic link button
- `contact_email_verified_at` UI everywhere

Estimado: 1-2h.

### T10 — WhatsApp agent (v2 upsell)

Sold as separate product 2-4 weeks pós site live. Não em v1.

### Sempre fora de v1

- Online ordering / cart (gatilharia RT obligation)
- POS / Registratore Telematico
- Reservation calendar lógica
- Multi-template (apenas vibes do template único até 10 clientes)
- Org self-onboarding (até #2 pedir)
- Public API
- Marketplace inbound (Model 3, requer capital)

---

## Decisões em aberto

Coisas pra alinhar com Edson antes ou durante a build.

| # | Decisão | Quando | Default tentativo |
|---|---|---|---|
| 1 | Domínio `factory.app` comprado? Onde? | Antes de deploy Vercel | usar `lvh.me` em dev até decidir |
| 2 | PDF de recibo: jsPDF Node vs Puppeteer vs React-PDF | T7 | jsPDF (~50KB, suficiente pra recibo simples) |
| 3 | Preview de tenant draft: token assinado vs cookie operator | T5 | cookie operator (mais simples, sem mudança schema) |
| 4 | Ícones allergens: gerar próprios vs pack open-source | T2 | gerar próprios minimalistas (controle total) |
| 5 | Resend domain verification: usar `factory.app` ou subdomain `mail.factory.app` | T7 | esperar #1 |
| 6 | `factory_jobs` worker: cron Vercel vs invocação direta | T5 | invocação direta pós-capture (free tier compatible) |
| 7 | Plausible vs sem analytics em v1 | T2 | sem analytics até T2 done; adicionar opcional depois |
| 8 | Cookie banner: shadcn ou custom | T2 | custom (1 component, 100 linhas) |
| 9 | ~~TTS Tier 3~~ — REMOVIDO: TTS multilíngue inteiro deferido | — | v1 = só italiano em texto, sem speech synthesis |
| 10 | Login persistido: Supabase default (1 semana) ou estender | T1 | default Supabase |

---

## Reference / cheat sheet

### URLs locais

- Marketing: `http://lvh.me:3001`
- App: `http://app.lvh.me:3001`
- Tenant: `http://<slug>.lvh.me:3001`
- API: `http://lvh.me:3001/api/*`

### Comandos

```bash
pnpm dev            # local dev
pnpm build          # production build
pnpm typecheck      # tsc --noEmit
pnpm lint           # next lint
./scripts/smoke.sh  # build + typecheck + lint
```

### Supabase atual

- Project ref: `wvovydlmntlkpcaazdhc`
- Region: Central EU (Frankfurt)
- Org seed: `factory-edson` (id: `11768c32-a605-4674-bd56-c2ada001d508`)
- Super admin: `limadevbtc@proton.me` (uid: `06ef5299-bb7e-47e8-ae9e-e2c984949673`)

### Convenções de código

- RSC por padrão; client components só com `'use client'` quando necessário (form, audio, mediarecorder)
- Tenant context via props/RSC (sem global state)
- Strings PT/IT em `src/lib/scripts.ts` (operator) ou `src/messages/*.json` (site)
- Allergens: snake_case IT (`frutta_a_guscio`)
- Currency: cents (€12,50 = 1250)
- Timestamps: `timestamptz`, UTC no banco, formatado no client
- IDs: uuid v4 do Postgres (`gen_random_uuid()`)

### Convenções de commit

`<type>(<scope>): <summary>` em PT ou EN consistente.
Tipos: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`.
Scope: `t<n>-<letter>` durante build (`feat(t1-b): supabase clients`).

### Co-author trailer

Em commits Claude-assisted, incluir:
```
Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

### Quality gates por task

Antes de declarar uma task done:

1. Acceptance criteria manual ✓ (lista por task acima)
2. `pnpm typecheck` ✓
3. `pnpm lint` ✓
4. `pnpm build` ✓
5. Smoke manual no iPhone (a partir de T2)
6. Commit limpo com mensagem descritiva
7. Update do checkbox no [README.md](./README.md) status section
8. **Stop & wait** — não começar próxima task sem review do Edson

### Quando pedir ajuda ao Edson

- Adicionar lib não listada no stack ✋
- Mudar schema (mesmo que pequeno) ✋
- Decisão pricing / legal ✋
- Texto público italiano (revisão por nativo) ✋
- Deploy production (qualquer push pra prod) ✋
- Quando travado > 30 min em algo ✋

### Decisão "stop or continue"

Após terminar uma task, **default = stop**. Cada task é checkpoint. Nunca encadear duas sem review. Se sobra tempo, refinar ou documentar — não avançar.
