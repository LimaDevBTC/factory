// Seed test tenants via Supabase JS SDK with service_role.
// Mirrors supabase/seeds/test-tenants.sql (idempotent: upsert tenants,
// then DELETE+INSERT categories/items per tenant).
//
// Run:
//   pnpm seed
// or:
//   node --experimental-websocket --no-warnings --env-file=.env.local scripts/seed-test-tenants.mjs
//
// `--experimental-websocket` é necessário em Node 20.x — supabase-js v2.105
// inicializa Realtime no construtor que exige WebSocket global. Node 22+
// tem WebSocket nativo sem flag. Não usamos Realtime; é só ruído de import.

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ORG_ID = '11768c32-a605-4674-bd56-c2ada001d508';

const tenants = [
  {
    organization_id: ORG_ID,
    slug: 'da-luigi',
    name: 'Trattoria da Luigi',
    vibe: 'trattoria_familiare',
    status: 'live',
    address: 'Via Roma 12',
    city: 'Cosenza',
    province: 'CS',
    region: 'Calabria',
    postal_code: '87100',
    phone: '+39 0984 123456',
    whatsapp: '+39 333 1234567',
    contact_email: 'luigi@example.test',
    public_email: 'info@trattoriadaluigi.example.test',
    primary_color: '#8B0000',
    secondary_color: '#F5E6D3',
    font_pairing: 'cinzel_inter',
    tagline_it: 'Cucina di famiglia, dal 1962.',
    tagline_en: 'Family cooking since 1962.',
    tagline_de: 'Familienküche seit 1962.',
    description_it:
      'Trattoria storica nel cuore di Cosenza. Pasta fatta in casa, \'nduja della casa, vino di Cirò.',
    description_en:
      "Historic family-run trattoria in the heart of Cosenza. Hand-made pasta, house 'nduja, Cirò wine.",
    default_locale: 'it',
    enabled_locales: ['it', 'en'],
    owner_locale: 'it',
    hours_json: {
      mon: [{ open: '12:00', close: '15:00' }, { open: '19:30', close: '23:00' }],
      tue: [{ open: '12:00', close: '15:00' }, { open: '19:30', close: '23:00' }],
      wed: [],
      thu: [{ open: '12:00', close: '15:00' }, { open: '19:30', close: '23:00' }],
      fri: [{ open: '12:00', close: '15:00' }, { open: '19:30', close: '23:30' }],
      sat: [{ open: '12:00', close: '15:00' }, { open: '19:30', close: '23:30' }],
      sun: [{ open: '12:00', close: '15:30' }],
    },
    partita_iva: '03123456789',
    plan: 'starter',
    billing_period: 'prepaid_6mo',
    payment_status: 'paid_setup_only',
    lead_source: 'direct',
    published_at: new Date().toISOString(),
    categories: [
      { slug: 'antipasti', name_it: 'Antipasti', name_en: 'Starters', name_de: 'Vorspeisen', display_order: 1 },
      { slug: 'primi', name_it: 'Primi', name_en: 'First courses', name_de: 'Erste Gänge', display_order: 2 },
      { slug: 'dolci', name_it: 'Dolci', name_en: 'Desserts', name_de: 'Süßspeisen', display_order: 3 },
    ],
    items: [
      { cat: 'antipasti', slug: 'crostini-nduja', name_it: "Crostini con 'nduja", name_en: "Crostini with 'nduja", name_de: "Crostini mit 'nduja", description_it: "Pane casereccio, 'nduja calabrese, ricotta fresca.", price_cents: 700, allergens: ['glutine','latte'], dietary: [], display_order: 1 },
      { cat: 'antipasti', slug: 'caciocavallo-silano', name_it: 'Caciocavallo silano DOP', name_en: 'Caciocavallo silano DOP', name_de: 'Caciocavallo silano DOP', description_it: 'Tagliato a fette, fior di sale e olio EVO.', price_cents: 900, allergens: ['latte'], dietary: ['vegetariano'], display_order: 2 },
      { cat: 'antipasti', slug: 'tartare-tonno', name_it: 'Tartare di tonno', name_en: 'Tuna tartare', name_de: 'Thunfisch-Tatar', description_it: 'Tonno fresco, capperi, scorza di limone.', price_cents: 1400, allergens: ['pesce'], dietary: [], display_order: 3 },

      { cat: 'primi', slug: 'maccheroni-ferretto', name_it: 'Maccheroni al ferretto', name_en: 'Maccheroni al ferretto', name_de: 'Maccheroni al ferretto', description_it: 'Pasta tirata a mano, sugo di carne mista.', price_cents: 1100, allergens: ['glutine','uova'], dietary: [], display_order: 1 },
      { cat: 'primi', slug: 'fileja-nduja', name_it: "Fileja alla 'nduja", name_en: "Fileja with 'nduja", name_de: "Fileja mit 'nduja", description_it: "Pasta lunga ritorta, pomodoro, 'nduja calabrese.", price_cents: 1200, allergens: ['glutine'], dietary: [], display_order: 2 },
      { cat: 'primi', slug: 'pasta-fagioli', name_it: 'Pasta e fagioli', name_en: 'Pasta and beans', name_de: 'Pasta mit Bohnen', description_it: 'Tradizionale calabrese, finita con un filo di olio EVO.', price_cents: 950, allergens: ['glutine'], dietary: ['vegetariano'], display_order: 3 },
      { cat: 'primi', slug: 'gnocchi-burro-salvia', name_it: 'Gnocchi burro e salvia', name_en: 'Gnocchi butter and sage', name_de: 'Gnocchi mit Butter und Salbei', description_it: null, price_cents: 1050, allergens: ['glutine','latte','uova'], dietary: ['vegetariano'], display_order: 4 },

      { cat: 'dolci', slug: 'panna-cotta-bergamotto', name_it: 'Panna cotta al bergamotto', name_en: 'Bergamot panna cotta', name_de: 'Bergamotte-Panna-cotta', description_it: 'Bergamotto di Reggio, latte vaccino e zucchero di canna.', price_cents: 600, allergens: ['latte'], dietary: ['vegetariano','senza_glutine'], display_order: 1 },
      { cat: 'dolci', slug: 'tiramisu', name_it: 'Tiramisù della casa', name_en: 'House tiramisù', name_de: 'Tiramisù des Hauses', description_it: null, price_cents: 600, allergens: ['glutine','uova','latte'], dietary: ['vegetariano'], display_order: 2 },
      { cat: 'dolci', slug: 'mostaccioli', name_it: 'Mostaccioli calabresi', name_en: 'Mostaccioli', name_de: 'Mostaccioli', description_it: 'Biscotti di miele e mosto cotto, tradizione natalizia.', price_cents: 450, allergens: ['glutine','frutta_a_guscio'], dietary: ['vegetariano'], display_order: 3 },
    ],
  },
  {
    organization_id: ORG_ID,
    slug: 'gelateria-bergamotto',
    name: 'Gelateria al Bergamotto',
    vibe: 'gelateria_artigianale',
    status: 'live',
    address: 'Corso Mazzini 45',
    city: 'Cosenza',
    province: 'CS',
    region: 'Calabria',
    postal_code: '87100',
    phone: '+39 0984 765432',
    contact_email: 'maria@example.test',
    public_email: 'ciao@gelateriabergamotto.example.test',
    primary_color: '#FF85A1',
    secondary_color: '#FFF0F5',
    font_pairing: 'cormorant_dmsans',
    tagline_it: 'Gelato artigianale, ingredienti calabresi.',
    tagline_en: 'Artisanal gelato, Calabrian ingredients.',
    description_it:
      'Gelateria artigianale nel centro storico di Cosenza. Bergamotto di Reggio, fichi dottati, liquirizia di Calabria.',
    description_en:
      'Artisanal gelateria in the historic centre of Cosenza. Reggio bergamot, dottato figs, Calabrian liquorice.',
    default_locale: 'it',
    enabled_locales: ['it', 'en', 'de'],
    owner_locale: 'it',
    hours_json: {
      mon: [{ open: '11:00', close: '23:00' }],
      tue: [{ open: '11:00', close: '23:00' }],
      wed: [{ open: '11:00', close: '23:00' }],
      thu: [{ open: '11:00', close: '23:00' }],
      fri: [{ open: '11:00', close: '24:00' }],
      sat: [{ open: '11:00', close: '24:00' }],
      sun: [{ open: '11:00', close: '23:00' }],
    },
    partita_iva: '03987654321',
    plan: 'starter',
    billing_period: 'prepaid_12mo',
    payment_status: 'paid_setup_only',
    lead_source: 'direct',
    published_at: new Date().toISOString(),
    categories: [
      { slug: 'gusti', name_it: 'Gusti', name_en: 'Flavours', name_de: 'Sorten', display_order: 1 },
      { slug: 'coppe', name_it: 'Coppe', name_en: 'Sundaes', name_de: 'Becher', display_order: 2 },
    ],
    items: [
      { cat: 'gusti', slug: 'bergamotto', name_it: 'Bergamotto', name_en: 'Bergamot', name_de: 'Bergamotte', description_it: 'Sorbetto al bergamotto di Reggio Calabria.', price_cents: 280, allergens: [], dietary: ['vegano','senza_lattosio','senza_glutine'], display_order: 1, origin: 'Reggio Calabria' },
      { cat: 'gusti', slug: 'fico-dottato', name_it: 'Fico dottato', name_en: 'Dottato fig', name_de: 'Dottato-Feige', description_it: 'Fichi dottati di Cosenza DOP, latte intero.', price_cents: 280, allergens: ['latte'], dietary: ['vegetariano','senza_glutine'], display_order: 2, origin: 'Cosenza' },
      { cat: 'gusti', slug: 'liquirizia', name_it: 'Liquirizia di Calabria', name_en: 'Calabrian liquorice', name_de: 'Kalabrische Lakritze', description_it: 'Liquirizia pura DOP, senza zuccheri aggiunti.', price_cents: 280, allergens: ['latte'], dietary: ['vegetariano','senza_glutine'], display_order: 3, origin: 'Calabria' },
      { cat: 'gusti', slug: 'cioccolato-fondente', name_it: 'Cioccolato fondente', name_en: 'Dark chocolate', name_de: 'Zartbitterschokolade', description_it: 'Cacao 70%, sorbetto vegano.', price_cents: 280, allergens: [], dietary: ['vegano','senza_lattosio','senza_glutine'], display_order: 4, origin: null },
      { cat: 'gusti', slug: 'pistacchio', name_it: 'Pistacchio', name_en: 'Pistachio', name_de: 'Pistazie', description_it: 'Pistacchi di Bronte DOP.', price_cents: 320, allergens: ['latte','frutta_a_guscio'], dietary: ['vegetariano','senza_glutine'], display_order: 5, origin: 'Bronte' },
      { cat: 'gusti', slug: 'nocciola', name_it: 'Nocciola', name_en: 'Hazelnut', name_de: 'Haselnuss', description_it: 'Nocciole tostate del Piemonte IGP.', price_cents: 280, allergens: ['latte','frutta_a_guscio'], dietary: ['vegetariano','senza_glutine'], display_order: 6, origin: 'Piemonte' },

      { cat: 'coppe', slug: 'coppa-tre-gusti', name_it: 'Coppa tre gusti', name_en: 'Three-flavour cup', name_de: 'Drei-Sorten-Becher', description_it: 'Tre palline a scelta, panna a richiesta.', price_cents: 600, allergens: ['latte'], dietary: ['vegetariano'], display_order: 1 },
      { cat: 'coppe', slug: 'coppa-bergamotto', name_it: 'Coppa Bergamotto', name_en: 'Bergamot cup', name_de: 'Bergamotte-Becher', description_it: 'Bergamotto, fico dottato, scorza candita.', price_cents: 700, allergens: [], dietary: ['vegano','senza_lattosio','senza_glutine'], display_order: 2 },
    ],
  },
];

async function upsertTenant(spec) {
  const { categories, items, ...tenant } = spec;

  // Try update first, then insert if missing (mirrors ON CONFLICT (organization_id, slug))
  const { data: existing, error: selErr } = await supabase
    .from('tenants')
    .select('id')
    .eq('organization_id', tenant.organization_id)
    .eq('slug', tenant.slug)
    .maybeSingle();
  if (selErr) throw selErr;

  let tenantId;
  if (existing) {
    tenantId = existing.id;
    const { error } = await supabase
      .from('tenants')
      .update({ ...tenant, updated_at: new Date().toISOString() })
      .eq('id', tenantId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from('tenants')
      .insert(tenant)
      .select('id')
      .single();
    if (error) throw error;
    tenantId = data.id;
  }

  // Idempotent: clear and recreate categories + items
  await supabase.from('items').delete().eq('tenant_id', tenantId);
  await supabase.from('categories').delete().eq('tenant_id', tenantId);

  const catRows = categories.map((c) => ({ tenant_id: tenantId, ...c }));
  const { data: insertedCats, error: catErr } = await supabase
    .from('categories')
    .insert(catRows)
    .select('id, slug');
  if (catErr) throw catErr;

  const catBySlug = Object.fromEntries(insertedCats.map((c) => [c.slug, c.id]));

  const itemRows = items.map(({ cat, ...item }) => ({
    tenant_id: tenantId,
    category_id: catBySlug[cat],
    ...item,
  }));
  const { error: itemErr } = await supabase.from('items').insert(itemRows);
  if (itemErr) throw itemErr;

  return { tenantId, categoriesCount: insertedCats.length, itemsCount: itemRows.length };
}

async function main() {
  for (const t of tenants) {
    const res = await upsertTenant(t);
    console.log(`✓ ${t.slug} (${t.vibe}) → ${res.categoriesCount} categorias, ${res.itemsCount} items`);
  }
  console.log('seed OK');
}

main().catch((err) => {
  console.error('seed failed:', err);
  process.exit(1);
});
