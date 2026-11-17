// Datamodel volgens de projectbrief (sectie "Datamodel"), plus `allergens`
// (nodig voor de juridische eis "toon allergeneninformatie").

export const FLAVOR_FAMILIES = [
  'chocolade',
  'vanille',
  'koek',
  'fruitig_zoet',
  'fruitig_fris',
  'neutraal',
] as const;
export type FlavorFamily = (typeof FLAVOR_FAMILIES)[number];

export const LABELS = ['vegan', 'lactosevrij', 'bevat_cafeine', 'bestseller', 'nieuw'] as const;
export type Label = (typeof LABELS)[number];

export const CATEGORIES = [
  'Whey-eiwit',
  'Whey-isolaat',
  'Lactosevrij eiwit',
  'Helder eiwit',
  'Vegan eiwit',
  'Creatine',
  'Weight gainer',
  'Pre-workout',
  'Maaltijdvervanger',
  'Eiwitsnack',
  'Vitamines & mineralen',
] as const;
export type Category = (typeof CATEGORIES)[number];

export type Texture = 'romig' | 'fris';
export type Sweetness = 1 | 2 | 3;
export type DataSource = 'xxl' | 'partner' | 'calculated' | 'brief';

/** Smaak zoals die in het seedbestand staat (per productlijn). */
export interface SeedFlavor {
  name: string | null; // null = geen smaak (bijv. vitamines)
  family: FlavorFamily;
  sweetness: Sweetness;
  texture: Texture;
  needs_check?: boolean;
}

/** Formaat zoals dat in het seedbestand staat (per productlijn). */
export interface SeedSize {
  label: string; // bijv. "1000 g" of "60 softgels"
  size_grams: number | null;
  servings: number | null; // null = onbekend
  price_eur: number;
  source: DataSource;
  needs_check?: boolean;
}

export interface ProductLine {
  id: string; // slug, bijv. "whey-delicious"
  name: string;
  category: Category;
  tagline: string;
  beginner_info: string;
  short_bullets: string[];
  description: string;
  labels: Label[];
  badge: 'bestseller' | 'nieuw' | null;
  rating: number | null;
  review_count: number | null;
  protein_per_serving: number | null;
  allergens: string[];
  allergens_complete: boolean; // false = allergenen nog niet volledig gecontroleerd
  image_url: string;
  xxl_url: string;
  flavor_count_total: number | null; // aantal smaken volgens XXL (kan groter zijn dan wat we kennen)
  needs_check: boolean;
  check_notes: string[];
  flavors: SeedFlavor[];
  sizes: SeedSize[];
}

/** Eén koopbare combinatie van smaak × formaat (tabel product_variants). */
export interface ProductVariant {
  id: string;
  product_line_id: string;
  flavor: string | null;
  flavor_family: FlavorFamily;
  sweetness: Sweetness;
  texture: Texture;
  size_label: string;
  size_grams: number | null;
  servings: number | null;
  price_eur: number;
  price_per_serving: number | null;
  in_stock: boolean;
  needs_check: boolean;
}
