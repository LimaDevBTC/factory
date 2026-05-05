/**
 * The 14 EU allergens (Regulation EU 1169/2011 + Italian implementation D.Lgs. 231/2017).
 * Italian law requires every restaurant to disclose these. Our menu must support all.
 *
 * Slugs are stored in the `dishes.allergens` text[] column.
 */

export const EU_ALLERGENS = [
  'glutine',
  'crostacei',
  'uova',
  'pesce',
  'arachidi',
  'soia',
  'latte',
  'frutta_a_guscio',
  'sedano',
  'senape',
  'sesamo',
  'anidride_solforosa',
  'lupini',
  'molluschi',
] as const;

export type Allergen = (typeof EU_ALLERGENS)[number];

export const ALLERGEN_LABELS: Record<
  Allergen,
  { it: string; en: string; de: string; icon: string }
> = {
  glutine:            { it: 'Glutine',                 en: 'Gluten',           de: 'Gluten',          icon: '/allergens/glutine.svg' },
  crostacei:          { it: 'Crostacei',               en: 'Crustaceans',      de: 'Krebstiere',      icon: '/allergens/crostacei.svg' },
  uova:               { it: 'Uova',                    en: 'Eggs',             de: 'Eier',            icon: '/allergens/uova.svg' },
  pesce:              { it: 'Pesce',                   en: 'Fish',             de: 'Fisch',           icon: '/allergens/pesce.svg' },
  arachidi:           { it: 'Arachidi',                en: 'Peanuts',          de: 'Erdnüsse',        icon: '/allergens/arachidi.svg' },
  soia:               { it: 'Soia',                    en: 'Soybeans',         de: 'Soja',            icon: '/allergens/soia.svg' },
  latte:              { it: 'Latte',                   en: 'Milk',             de: 'Milch',           icon: '/allergens/latte.svg' },
  frutta_a_guscio:    { it: 'Frutta a guscio',         en: 'Tree nuts',        de: 'Schalenfrüchte',  icon: '/allergens/frutta-a-guscio.svg' },
  sedano:             { it: 'Sedano',                  en: 'Celery',           de: 'Sellerie',        icon: '/allergens/sedano.svg' },
  senape:             { it: 'Senape',                  en: 'Mustard',          de: 'Senf',            icon: '/allergens/senape.svg' },
  sesamo:             { it: 'Semi di sesamo',          en: 'Sesame',           de: 'Sesam',           icon: '/allergens/sesamo.svg' },
  anidride_solforosa: { it: 'Anidride solforosa e solfiti', en: 'Sulphites',   de: 'Schwefeldioxid',  icon: '/allergens/solfiti.svg' },
  lupini:             { it: 'Lupini',                  en: 'Lupin',            de: 'Lupinen',         icon: '/allergens/lupini.svg' },
  molluschi:          { it: 'Molluschi',               en: 'Molluscs',         de: 'Weichtiere',      icon: '/allergens/molluschi.svg' },
};

export const DIETARY_LABELS = {
  vegetariano:    { it: 'Vegetariano',    en: 'Vegetarian',     de: 'Vegetarisch' },
  vegano:         { it: 'Vegano',         en: 'Vegan',          de: 'Vegan' },
  senza_glutine:  { it: 'Senza glutine',  en: 'Gluten-free',    de: 'Glutenfrei' },
  senza_lattosio: { it: 'Senza lattosio', en: 'Lactose-free',   de: 'Laktosefrei' },
  piccante:       { it: 'Piccante',       en: 'Spicy',          de: 'Scharf' },
  bio:            { it: 'Biologico',      en: 'Organic',        de: 'Bio' },
  km_zero:        { it: 'Km 0',           en: 'Local',          de: 'Lokal' },
  halal:          { it: 'Halal',          en: 'Halal',          de: 'Halal' },
  kosher:         { it: 'Kosher',         en: 'Kosher',         de: 'Kosher' },
} as const;

export type Dietary = keyof typeof DIETARY_LABELS;

export function isValidAllergen(s: string): s is Allergen {
  return (EU_ALLERGENS as readonly string[]).includes(s);
}

export function isValidDietary(s: string): s is Dietary {
  return s in DIETARY_LABELS;
}
