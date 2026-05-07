-- ===========================================================================
-- Test tenants for T2 walkthrough.
-- Run after the main schema is deployed. Idempotent via DO block + ON CONFLICT.
--
-- Local dev URLs (lvh.me resolves any subdomain → 127.0.0.1):
--   http://da-luigi.lvh.me:3001          → trattoria
--   http://gelateria-bergamotto.lvh.me:3001  → gelateria
--
-- Run via Supabase SQL editor or:
--   psql "$SUPABASE_DB_URL" -f supabase/seeds/test-tenants.sql
-- ===========================================================================

-- The org seeded by schema.sql. Hard-coded id matches BUILD_PLAN reference.
do $$
declare
  v_org_id uuid := '11768c32-a605-4674-bd56-c2ada001d508';
  v_tenant_luigi uuid;
  v_tenant_gelat uuid;
  v_cat_antipasti uuid;
  v_cat_primi uuid;
  v_cat_dolci uuid;
  v_cat_gusti uuid;
  v_cat_coppe uuid;
begin
  -- ---------------- Trattoria da Luigi ----------------
  insert into public.tenants (
    organization_id, slug, name, vibe, status,
    address, city, province, region, postal_code, phone, whatsapp,
    contact_email, public_email,
    primary_color, secondary_color, font_pairing,
    tagline_it, tagline_en, tagline_de,
    description_it, description_en,
    default_locale, enabled_locales, owner_locale,
    hours_json, partita_iva,
    plan, billing_period, payment_status, lead_source, published_at
  ) values (
    v_org_id, 'da-luigi', 'Trattoria da Luigi', 'trattoria_familiare', 'live',
    'Via Roma 12', 'Cosenza', 'CS', 'Calabria', '87100', '+39 0984 123456', '+39 333 1234567',
    'luigi@example.test', 'info@trattoriadaluigi.example.test',
    '#8B0000', '#F5E6D3', 'cinzel_inter',
    'Cucina di famiglia, dal 1962.',
    'Family cooking since 1962.',
    'Familienküche seit 1962.',
    'Trattoria storica nel cuore di Cosenza. Pasta fatta in casa, ''nduja della casa, vino di Cirò.',
    'Historic family-run trattoria in the heart of Cosenza. Hand-made pasta, house ''nduja, Cirò wine.',
    'it', array['it','en']::text[], 'it',
    '{"mon":[{"open":"12:00","close":"15:00"},{"open":"19:30","close":"23:00"}],
      "tue":[{"open":"12:00","close":"15:00"},{"open":"19:30","close":"23:00"}],
      "wed":[],
      "thu":[{"open":"12:00","close":"15:00"},{"open":"19:30","close":"23:00"}],
      "fri":[{"open":"12:00","close":"15:00"},{"open":"19:30","close":"23:30"}],
      "sat":[{"open":"12:00","close":"15:00"},{"open":"19:30","close":"23:30"}],
      "sun":[{"open":"12:00","close":"15:30"}]}'::jsonb,
    '03123456789',
    'starter', 'prepaid_6mo', 'paid_setup_only', 'direct', now()
  )
  on conflict (organization_id, slug) do update set
    status = excluded.status,
    name = excluded.name,
    tagline_it = excluded.tagline_it,
    description_it = excluded.description_it,
    hours_json = excluded.hours_json,
    enabled_locales = excluded.enabled_locales,
    updated_at = now()
  returning id into v_tenant_luigi;

  -- Refresh categories cleanly (idempotent rerun)
  delete from public.items where tenant_id = v_tenant_luigi;
  delete from public.categories where tenant_id = v_tenant_luigi;

  insert into public.categories (tenant_id, slug, name_it, name_en, name_de, display_order)
  values (v_tenant_luigi, 'antipasti', 'Antipasti', 'Starters', 'Vorspeisen', 1)
  returning id into v_cat_antipasti;

  insert into public.categories (tenant_id, slug, name_it, name_en, name_de, display_order)
  values (v_tenant_luigi, 'primi', 'Primi', 'First courses', 'Erste Gänge', 2)
  returning id into v_cat_primi;

  insert into public.categories (tenant_id, slug, name_it, name_en, name_de, display_order)
  values (v_tenant_luigi, 'dolci', 'Dolci', 'Desserts', 'Süßspeisen', 3)
  returning id into v_cat_dolci;

  -- Antipasti
  insert into public.items (tenant_id, category_id, slug, name_it, name_en, name_de, description_it, price_cents, allergens, dietary, display_order) values
    (v_tenant_luigi, v_cat_antipasti, 'crostini-nduja',  'Crostini con ''nduja',  'Crostini with ''nduja',  'Crostini mit ''nduja',
     'Pane casereccio, ''nduja calabrese, ricotta fresca.', 700,
     array['glutine','latte']::text[], array[]::text[], 1),
    (v_tenant_luigi, v_cat_antipasti, 'caciocavallo-silano', 'Caciocavallo silano DOP', 'Caciocavallo silano DOP', 'Caciocavallo silano DOP',
     'Tagliato a fette, fior di sale e olio EVO.', 900,
     array['latte']::text[], array['vegetariano']::text[], 2),
    (v_tenant_luigi, v_cat_antipasti, 'tartare-tonno', 'Tartare di tonno', 'Tuna tartare', 'Thunfisch-Tatar',
     'Tonno fresco, capperi, scorza di limone.', 1400,
     array['pesce']::text[], array[]::text[], 3);

  -- Primi
  insert into public.items (tenant_id, category_id, slug, name_it, name_en, name_de, description_it, price_cents, allergens, dietary, display_order) values
    (v_tenant_luigi, v_cat_primi, 'maccheroni-ferretto', 'Maccheroni al ferretto', 'Maccheroni al ferretto', 'Maccheroni al ferretto',
     'Pasta tirata a mano, sugo di carne mista.', 1100,
     array['glutine','uova']::text[], array[]::text[], 1),
    (v_tenant_luigi, v_cat_primi, 'fileja-nduja', 'Fileja alla ''nduja', 'Fileja with ''nduja', 'Fileja mit ''nduja',
     'Pasta lunga ritorta, pomodoro, ''nduja calabrese.', 1200,
     array['glutine']::text[], array[]::text[], 2),
    (v_tenant_luigi, v_cat_primi, 'pasta-fagioli', 'Pasta e fagioli', 'Pasta and beans', 'Pasta mit Bohnen',
     'Tradizionale calabrese, finita con un filo di olio EVO.', 950,
     array['glutine']::text[], array['vegetariano']::text[], 3),
    (v_tenant_luigi, v_cat_primi, 'gnocchi-burro-salvia', 'Gnocchi burro e salvia', 'Gnocchi butter and sage', 'Gnocchi mit Butter und Salbei',
     null, 1050,
     array['glutine','latte','uova']::text[], array['vegetariano']::text[], 4);

  -- Dolci
  insert into public.items (tenant_id, category_id, slug, name_it, name_en, name_de, description_it, price_cents, allergens, dietary, display_order) values
    (v_tenant_luigi, v_cat_dolci, 'panna-cotta-bergamotto', 'Panna cotta al bergamotto', 'Bergamot panna cotta', 'Bergamotte-Panna-cotta',
     'Bergamotto di Reggio, latte vaccino e zucchero di canna.', 600,
     array['latte']::text[], array['vegetariano','senza_glutine']::text[], 1),
    (v_tenant_luigi, v_cat_dolci, 'tiramisu', 'Tiramisù della casa', 'House tiramisù', 'Tiramisù des Hauses',
     null, 600,
     array['glutine','uova','latte']::text[], array['vegetariano']::text[], 2),
    (v_tenant_luigi, v_cat_dolci, 'mostaccioli', 'Mostaccioli calabresi', 'Mostaccioli', 'Mostaccioli',
     'Biscotti di miele e mosto cotto, tradizione natalizia.', 450,
     array['glutine','frutta_a_guscio']::text[], array['vegetariano']::text[], 3);

  -- ---------------- Gelateria al Bergamotto ----------------
  insert into public.tenants (
    organization_id, slug, name, vibe, status,
    address, city, province, region, postal_code, phone,
    contact_email, public_email,
    primary_color, secondary_color, font_pairing,
    tagline_it, tagline_en,
    description_it, description_en,
    default_locale, enabled_locales, owner_locale,
    hours_json, partita_iva,
    plan, billing_period, payment_status, lead_source, published_at
  ) values (
    v_org_id, 'gelateria-bergamotto', 'Gelateria al Bergamotto', 'gelateria_artigianale', 'live',
    'Corso Mazzini 45', 'Cosenza', 'CS', 'Calabria', '87100', '+39 0984 765432',
    'maria@example.test', 'ciao@gelateriabergamotto.example.test',
    '#FF85A1', '#FFF0F5', 'cormorant_dmsans',
    'Gelato artigianale, ingredienti calabresi.',
    'Artisanal gelato, Calabrian ingredients.',
    'Gelateria artigianale nel centro storico di Cosenza. Bergamotto di Reggio, fichi dottati, liquirizia di Calabria.',
    'Artisanal gelateria in the historic centre of Cosenza. Reggio bergamot, dottato figs, Calabrian liquorice.',
    'it', array['it','en','de']::text[], 'it',
    '{"mon":[{"open":"11:00","close":"23:00"}],
      "tue":[{"open":"11:00","close":"23:00"}],
      "wed":[{"open":"11:00","close":"23:00"}],
      "thu":[{"open":"11:00","close":"23:00"}],
      "fri":[{"open":"11:00","close":"24:00"}],
      "sat":[{"open":"11:00","close":"24:00"}],
      "sun":[{"open":"11:00","close":"23:00"}]}'::jsonb,
    '03987654321',
    'starter', 'prepaid_12mo', 'paid_setup_only', 'direct', now()
  )
  on conflict (organization_id, slug) do update set
    status = excluded.status,
    name = excluded.name,
    tagline_it = excluded.tagline_it,
    description_it = excluded.description_it,
    enabled_locales = excluded.enabled_locales,
    updated_at = now()
  returning id into v_tenant_gelat;

  delete from public.items where tenant_id = v_tenant_gelat;
  delete from public.categories where tenant_id = v_tenant_gelat;

  insert into public.categories (tenant_id, slug, name_it, name_en, name_de, display_order)
  values (v_tenant_gelat, 'gusti', 'Gusti', 'Flavours', 'Sorten', 1)
  returning id into v_cat_gusti;

  insert into public.categories (tenant_id, slug, name_it, name_en, name_de, display_order)
  values (v_tenant_gelat, 'coppe', 'Coppe', 'Sundaes', 'Becher', 2)
  returning id into v_cat_coppe;

  -- Gusti (per pallina)
  insert into public.items (tenant_id, category_id, slug, name_it, name_en, name_de, description_it, price_cents, allergens, dietary, display_order, origin) values
    (v_tenant_gelat, v_cat_gusti, 'bergamotto', 'Bergamotto', 'Bergamot', 'Bergamotte',
     'Sorbetto al bergamotto di Reggio Calabria.', 280,
     array[]::text[], array['vegano','senza_lattosio','senza_glutine']::text[], 1, 'Reggio Calabria'),
    (v_tenant_gelat, v_cat_gusti, 'fico-dottato', 'Fico dottato', 'Dottato fig', 'Dottato-Feige',
     'Fichi dottati di Cosenza DOP, latte intero.', 280,
     array['latte']::text[], array['vegetariano','senza_glutine']::text[], 2, 'Cosenza'),
    (v_tenant_gelat, v_cat_gusti, 'liquirizia', 'Liquirizia di Calabria', 'Calabrian liquorice', 'Kalabrische Lakritze',
     'Liquirizia pura DOP, senza zuccheri aggiunti.', 280,
     array['latte']::text[], array['vegetariano','senza_glutine']::text[], 3, 'Calabria'),
    (v_tenant_gelat, v_cat_gusti, 'cioccolato-fondente', 'Cioccolato fondente', 'Dark chocolate', 'Zartbitterschokolade',
     'Cacao 70%, sorbetto vegano.', 280,
     array[]::text[], array['vegano','senza_lattosio','senza_glutine']::text[], 4, null),
    (v_tenant_gelat, v_cat_gusti, 'pistacchio', 'Pistacchio', 'Pistachio', 'Pistazie',
     'Pistacchi di Bronte DOP.', 320,
     array['latte','frutta_a_guscio']::text[], array['vegetariano','senza_glutine']::text[], 5, 'Bronte'),
    (v_tenant_gelat, v_cat_gusti, 'nocciola', 'Nocciola', 'Hazelnut', 'Haselnuss',
     'Nocciole tostate del Piemonte IGP.', 280,
     array['latte','frutta_a_guscio']::text[], array['vegetariano','senza_glutine']::text[], 6, 'Piemonte');

  -- Coppe (multi-pallina)
  insert into public.items (tenant_id, category_id, slug, name_it, name_en, name_de, description_it, price_cents, allergens, dietary, display_order) values
    (v_tenant_gelat, v_cat_coppe, 'coppa-tre-gusti', 'Coppa tre gusti', 'Three-flavour cup', 'Drei-Sorten-Becher',
     'Tre palline a scelta, panna a richiesta.', 600,
     array['latte']::text[], array['vegetariano']::text[], 1),
    (v_tenant_gelat, v_cat_coppe, 'coppa-bergamotto', 'Coppa Bergamotto', 'Bergamot cup', 'Bergamotte-Becher',
     'Bergamotto, fico dottato, scorza candita.', 700,
     array[]::text[], array['vegano','senza_lattosio','senza_glutine']::text[], 2);

end $$;

-- Verify:
--   select slug, name, vibe, status from public.tenants where organization_id = '11768c32-a605-4674-bd56-c2ada001d508';
--   select count(*) from public.items where tenant_id in (select id from public.tenants);
