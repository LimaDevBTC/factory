/**
 * Verticals (vibes) — the kinds of F&B businesses Factory supports.
 *
 * Each vibe drives:
 *   - The menu extraction prompt (category hints injected into Claude's vision call)
 *   - The vibe picker UI in the factory wizard
 *   - Default brand colors and font pairings
 *   - Whether the public site shows /prenota
 *   - Copy hooks (CTA labels, taglines, page titles)
 *
 * Adding a new vibe? Add it here AND in supabase/schema.sql vibe constraint.
 */

export const VIBES = [
  // ── sit-down meals ──────────────────────────────────────────
  'trattoria_familiare',
  'osteria_tipica',
  'ristorante_elegante',
  'agriturismo',
  'pizzeria_moderna',
  // ── cafés & quick ───────────────────────────────────────────
  'caffetteria',
  'panineria_street_food',
  'bar_aperitivo',
  // ── sweets ──────────────────────────────────────────────────
  'gelateria_artigianale',
  'pasticceria',
  // ── beverage-led ────────────────────────────────────────────
  'enoteca_wine_bar',
  'birreria_pub',
] as const;

export type Vibe = (typeof VIBES)[number];

type VibeConfig = {
  /** Human-readable names for the picker UI */
  label: { it: string; en: string; de: string };
  /** Short description shown under the vibe in the picker */
  description: { it: string; en: string; de: string };
  /** Lucide icon name */
  icon: string;
  /** Whether the public site exposes /prenota */
  takesReservations: boolean;
  /** Default suggested categories — fed to Claude vision as hints */
  categoryHints: string[];
  /** Default colors if owner doesn't pick */
  defaultColors: { primary: string; secondary: string };
  /** Default font pairing */
  fontPairing: 'cinzel_inter' | 'playfair_lato' | 'unbounded_inter' | 'cormorant_dmsans';
  /** Label for the menu CTA */
  menuCta: { it: string; en: string; de: string };
  /** What the menu page is called in the nav */
  menuPageLabel: { it: string; en: string; de: string };
};

export const VIBE_CONFIG: Record<Vibe, VibeConfig> = {
  trattoria_familiare: {
    label: {
      it: 'Trattoria familiare',
      en: 'Family trattoria',
      de: 'Familientrattoria',
    },
    description: {
      it: 'Cucina casalinga, atmosfera accogliente, ricette tradizionali.',
      en: 'Home-style cooking, warm atmosphere, traditional recipes.',
      de: 'Hausgemachte Küche, herzliche Atmosphäre, traditionelle Rezepte.',
    },
    icon: 'UtensilsCrossed',
    takesReservations: true,
    categoryHints: [
      'antipasti', 'primi', 'secondi', 'contorni', 'dolci', 'vini', 'bevande',
    ],
    defaultColors: { primary: '#8B0000', secondary: '#F5E6D3' },
    fontPairing: 'cinzel_inter',
    menuCta: { it: 'Vedi il menu', en: 'View menu', de: 'Speisekarte ansehen' },
    menuPageLabel: { it: 'Menu', en: 'Menu', de: 'Speisekarte' },
  },

  osteria_tipica: {
    label: { it: 'Osteria tipica', en: 'Traditional osteria', de: 'Traditionelle Osteria' },
    description: {
      it: 'Vino, taglieri, piatti del giorno scritti a mano sulla lavagna.',
      en: 'Wine, charcuterie boards, hand-chalked daily specials.',
      de: 'Wein, Brettchen, handgeschriebene Tagesgerichte.',
    },
    icon: 'Wine',
    takesReservations: true,
    categoryHints: [
      'antipasti', 'taglieri', 'primi', 'secondi', 'dolci', 'vini_della_casa', 'distillati',
    ],
    defaultColors: { primary: '#5D2F0F', secondary: '#EFE3D0' },
    fontPairing: 'cormorant_dmsans',
    menuCta: { it: 'Vedi la carta', en: 'View menu', de: 'Karte ansehen' },
    menuPageLabel: { it: 'Carta', en: 'Menu', de: 'Karte' },
  },

  ristorante_elegante: {
    label: { it: 'Ristorante elegante', en: 'Fine dining', de: 'Fine Dining' },
    description: {
      it: 'Cucina raffinata, presentazione curata, esperienza di alto livello.',
      en: 'Refined cuisine, careful presentation, premium experience.',
      de: 'Verfeinerte Küche, sorgfältige Präsentation, gehobene Erfahrung.',
    },
    icon: 'ChefHat',
    takesReservations: true,
    categoryHints: [
      'antipasti', 'primi', 'secondi', 'dolci', 'menu_degustazione', 'carta_dei_vini', 'distillati',
    ],
    defaultColors: { primary: '#1A1A1A', secondary: '#D4AF37' },
    fontPairing: 'playfair_lato',
    menuCta: { it: 'Scopri la carta', en: 'Discover the menu', de: 'Karte entdecken' },
    menuPageLabel: { it: 'Carta', en: 'Menu', de: 'Karte' },
  },

  agriturismo: {
    label: { it: 'Agriturismo', en: 'Farm restaurant', de: 'Agrotourismus' },
    description: {
      it: "Prodotti dell'orto, ricette del territorio, vini aziendali.",
      en: 'Garden produce, regional recipes, estate wines.',
      de: 'Gartenprodukte, regionale Rezepte, Hauswein.',
    },
    icon: 'Wheat',
    takesReservations: true,
    categoryHints: [
      'antipasti_della_casa', 'primi', 'secondi', 'contorni_dell_orto', 'dolci', 'vini_aziendali', 'distillati_artigianali',
    ],
    defaultColors: { primary: '#556B2F', secondary: '#FAF3E0' },
    fontPairing: 'cormorant_dmsans',
    menuCta: { it: 'Scopri i nostri piatti', en: 'See our dishes', de: 'Unsere Gerichte' },
    menuPageLabel: { it: 'Menu', en: 'Menu', de: 'Speisekarte' },
  },

  pizzeria_moderna: {
    label: { it: 'Pizzeria', en: 'Pizzeria', de: 'Pizzeria' },
    description: {
      it: 'Pizze classiche e speciali, calzoni, fritti, birre alla spina.',
      en: 'Classic and specialty pizzas, calzoni, fritti, draft beers.',
      de: 'Klassische und Spezialpizzen, Calzoni, Frittiertes, Fassbier.',
    },
    icon: 'Pizza',
    takesReservations: true,
    categoryHints: [
      'antipasti', 'fritti', 'pizze_classiche', 'pizze_speciali', 'pizze_bianche', 'calzoni', 'dolci', 'birre', 'bevande',
    ],
    defaultColors: { primary: '#C8102E', secondary: '#FFF8E7' },
    fontPairing: 'unbounded_inter',
    menuCta: { it: 'Scegli la tua pizza', en: 'Pick your pizza', de: 'Wähle deine Pizza' },
    menuPageLabel: { it: 'Menu', en: 'Menu', de: 'Speisekarte' },
  },

  caffetteria: {
    label: { it: 'Caffetteria', en: 'Café', de: 'Café' },
    description: {
      it: 'Caffè, cappuccino, cornetti, panini, aperitivi.',
      en: 'Espresso, cappuccino, pastries, panini, aperitivi.',
      de: 'Espresso, Cappuccino, Gebäck, Panini, Aperitivi.',
    },
    icon: 'Coffee',
    takesReservations: false,
    categoryHints: [
      'caffetteria', 'colazione', 'pasticceria_dolce', 'pasticceria_salata', 'panini', 'bevande_fredde', 'aperitivi',
    ],
    defaultColors: { primary: '#3E2723', secondary: '#EFE3D0' },
    fontPairing: 'cormorant_dmsans',
    menuCta: { it: 'Vedi il menu', en: 'View menu', de: 'Speisekarte ansehen' },
    menuPageLabel: { it: 'Menu', en: 'Menu', de: 'Speisekarte' },
  },

  panineria_street_food: {
    label: { it: 'Panineria & street food', en: 'Sandwich bar / street food', de: 'Sandwich-Bar / Street Food' },
    description: {
      it: 'Panini, hamburger, piadine, fritti, birre.',
      en: 'Sandwiches, burgers, piadine, fried snacks, beers.',
      de: 'Sandwiches, Burger, Piadine, Frittiertes, Bier.',
    },
    icon: 'Sandwich',
    takesReservations: false,
    categoryHints: [
      'panini', 'hamburger', 'piadine', 'fritti', 'contorni', 'birre', 'bevande',
    ],
    defaultColors: { primary: '#FF6B35', secondary: '#FFF3E6' },
    fontPairing: 'unbounded_inter',
    menuCta: { it: 'Scegli ora', en: 'Order now', de: 'Jetzt bestellen' },
    menuPageLabel: { it: 'Menu', en: 'Menu', de: 'Menü' },
  },

  bar_aperitivo: {
    label: { it: 'Bar / Aperitivo', en: 'Bar / Aperitivo', de: 'Bar / Aperitivo' },
    description: {
      it: 'Cocktail, vini al calice, taglieri, snacks per aperitivo.',
      en: 'Cocktails, wines by the glass, charcuterie, aperitivo snacks.',
      de: 'Cocktails, offene Weine, Brettchen, Aperitivo-Snacks.',
    },
    icon: 'Martini',
    takesReservations: false,
    categoryHints: [
      'cocktail_classici', 'cocktail_signature', 'vini_al_calice', 'birre', 'taglieri', 'snacks', 'analcolici',
    ],
    defaultColors: { primary: '#2C3E50', secondary: '#F4D03F' },
    fontPairing: 'unbounded_inter',
    menuCta: { it: "Vedi l'aperitivo", en: 'See aperitivo menu', de: 'Aperitivo-Karte' },
    menuPageLabel: { it: 'Carta', en: 'Menu', de: 'Karte' },
  },

  gelateria_artigianale: {
    label: { it: 'Gelateria artigianale', en: 'Artisan gelato', de: 'Handgemachtes Eis' },
    description: {
      it: 'Gusti classici e speciali, coppe, granite, gelati vegani.',
      en: 'Classic and specialty flavors, sundaes, granitas, vegan gelato.',
      de: 'Klassische und Spezial-Sorten, Becher, Granita, veganes Eis.',
    },
    icon: 'IceCream',
    takesReservations: false,
    categoryHints: [
      'gusti_classici', 'gusti_speciali', 'gusti_vegani', 'gusti_senza_lattosio', 'coppe', 'granite', 'frappe', 'dolci_freddi',
    ],
    defaultColors: { primary: '#FF85A1', secondary: '#FFF0F5' },
    fontPairing: 'cormorant_dmsans',
    menuCta: { it: 'Scopri i gusti', en: 'See the flavors', de: 'Sorten entdecken' },
    menuPageLabel: { it: 'Gusti', en: 'Flavors', de: 'Sorten' },
  },

  pasticceria: {
    label: { it: 'Pasticceria', en: 'Pastry shop', de: 'Konditorei' },
    description: {
      it: 'Pasticceria fresca e secca, torte, cioccolato, caffetteria.',
      en: 'Fresh and dry pastries, cakes, chocolate, coffee bar.',
      de: 'Frische und trockene Patisserie, Torten, Schokolade, Kaffeebar.',
    },
    icon: 'Cake',
    takesReservations: false,
    categoryHints: [
      'pasticceria_fresca', 'pasticceria_secca', 'torte', 'biscotti', 'cioccolato', 'gelato', 'caffetteria', 'salato',
    ],
    defaultColors: { primary: '#A0522D', secondary: '#FFF8E7' },
    fontPairing: 'playfair_lato',
    menuCta: { it: 'Vedi le creazioni', en: 'See our creations', de: 'Kreationen ansehen' },
    menuPageLabel: { it: 'Le nostre creazioni', en: 'Creations', de: 'Kreationen' },
  },

  enoteca_wine_bar: {
    label: { it: 'Enoteca / Wine bar', en: 'Wine bar', de: 'Weinbar' },
    description: {
      it: 'Selezione di vini al calice e in bottiglia, taglieri, formaggi.',
      en: 'Wines by the glass and bottle, charcuterie, cheeses.',
      de: 'Weine offen und in Flaschen, Brettchen, Käse.',
    },
    icon: 'Grape',
    takesReservations: true,
    categoryHints: [
      'vini_rossi', 'vini_bianchi', 'vini_rosati', 'bollicine', 'vini_dolci', 'distillati', 'taglieri', 'formaggi', 'salumi',
    ],
    defaultColors: { primary: '#722F37', secondary: '#F8F4E8' },
    fontPairing: 'cormorant_dmsans',
    menuCta: { it: 'Carta dei vini', en: 'Wine list', de: 'Weinkarte' },
    menuPageLabel: { it: 'Carta dei vini', en: 'Wine list', de: 'Weinkarte' },
  },

  birreria_pub: {
    label: { it: 'Birreria / Pub', en: 'Brewpub / Pub', de: 'Brauhaus / Pub' },
    description: {
      it: 'Birre artigianali alla spina e in bottiglia, hamburger, fritti.',
      en: 'Craft beers on tap and bottled, burgers, fried snacks.',
      de: 'Craft-Biere vom Fass und Flasche, Burger, Frittiertes.',
    },
    icon: 'Beer',
    takesReservations: true,
    categoryHints: [
      'birre_alla_spina', 'birre_in_bottiglia', 'hamburger', 'panini', 'fritti', 'taglieri', 'dolci',
    ],
    defaultColors: { primary: '#C68B17', secondary: '#1F1B16' },
    fontPairing: 'unbounded_inter',
    menuCta: { it: 'Vedi le birre', en: 'See the beers', de: 'Biere ansehen' },
    menuPageLabel: { it: 'Menu', en: 'Menu', de: 'Karte' },
  },
};

export function isValidVibe(s: string): s is Vibe {
  return (VIBES as readonly string[]).includes(s);
}

/**
 * Build the category-hints string injected into the menu extraction prompt.
 * Used by /api/jobs/extract-menu.
 */
export function getCategoryHintsForPrompt(vibe: Vibe): string {
  return VIBE_CONFIG[vibe].categoryHints.join(', ');
}
