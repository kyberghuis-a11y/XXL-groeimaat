// Filter-, zoek- en sorteerlogica voor de catalogus (Ontdek). Pure functies, dus goed te testen.
import { bestPricePerServing, fromPrice } from './catalog';
import type { Category, FlavorFamily, ProductLine } from './types';

export const PRICE_RANGES = [
  { id: 'tot-20', label: 'Tot €20', min: 0, max: 20 },
  { id: '20-40', label: '€20–€40', min: 20, max: 40 },
  { id: '40-60', label: '€40–€60', min: 40, max: 60 },
  { id: '60-plus', label: 'Meer dan €60', min: 60, max: Infinity },
] as const;
export type PriceRangeId = (typeof PRICE_RANGES)[number]['id'];

export const DIETS = [
  { id: 'vegan', label: 'Vegan' },
  { id: 'lactosevrij', label: 'Lactosevrij' },
  { id: 'zonder_cafeine', label: 'Zonder cafeïne' },
] as const;
export type DietId = (typeof DIETS)[number]['id'];

export const SORTS = [
  { id: 'popular', label: 'Populariteit' },
  { id: 'price', label: 'Prijs laag–hoog' },
  { id: 'price_per_serving', label: 'Prijs per portie' },
] as const;
export type SortId = (typeof SORTS)[number]['id'];

export interface CatalogFilters {
  categories: Category[];
  priceRanges: PriceRangeId[];
  diets: DietId[];
  flavorFamilies: FlavorFamily[];
  query: string;
}

export const EMPTY_FILTERS: CatalogFilters = {
  categories: [],
  priceRanges: [],
  diets: [],
  flavorFamilies: [],
  query: '',
};

export function activeFilterCount(f: CatalogFilters): number {
  return f.categories.length + f.priceRanges.length + f.diets.length + f.flavorFamilies.length;
}

/** Hoofdletters en accenten maken niet uit bij zoeken ("cafeine" vindt "cafeïne"). */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

function matchesDiet(line: ProductLine, diet: DietId): boolean {
  if (diet === 'vegan') return line.labels.includes('vegan');
  if (diet === 'lactosevrij') return line.labels.includes('lactosevrij');
  return !line.labels.includes('bevat_cafeine');
}

function inPriceRange(price: number, id: PriceRangeId): boolean {
  const range = PRICE_RANGES.find((r) => r.id === id)!;
  return price >= range.min && price < range.max;
}

/**
 * Tussen filtergroepen geldt EN. Binnen categorie, prijs en smaak geldt OF
 * ("Creatine" of "Whey-eiwit"). Dieet is altijd EN: "vegan + zonder cafeïne" moet allebei kloppen.
 */
export function filterProducts(lines: ProductLine[], f: CatalogFilters): ProductLine[] {
  const q = normalize(f.query);
  return lines.filter((line) => {
    if (f.categories.length && !f.categories.includes(line.category)) return false;
    if (f.priceRanges.length && !f.priceRanges.some((r) => inPriceRange(fromPrice(line), r))) return false;
    if (f.diets.length && !f.diets.every((d) => matchesDiet(line, d))) return false;
    if (f.flavorFamilies.length && !line.flavors.some((fl) => f.flavorFamilies.includes(fl.family))) return false;
    if (q) {
      const haystack = [line.name, line.category, ...line.flavors.map((fl) => fl.name ?? '')].map(normalize);
      if (!haystack.some((h) => h.includes(q))) return false;
    }
    return true;
  });
}

/**
 * Populariteit = aantal reviews (aflopend). Zolang reviews onbekend zijn (null),
 * staan bestsellers bovenaan en daarna de volgorde uit het seedbestand.
 */
export function sortProducts(lines: ProductLine[], sort: SortId): ProductLine[] {
  const indexed = lines.map((line, i) => ({ line, i }));
  const byPopularity = (a: { line: ProductLine; i: number }, b: { line: ProductLine; i: number }) =>
    (b.line.review_count ?? -1) - (a.line.review_count ?? -1) ||
    Number(b.line.badge === 'bestseller') - Number(a.line.badge === 'bestseller') ||
    a.i - b.i;

  if (sort === 'price') {
    indexed.sort((a, b) => fromPrice(a.line) - fromPrice(b.line) || a.i - b.i);
  } else if (sort === 'price_per_serving') {
    // Onbekende prijs per portie achteraan.
    indexed.sort(
      (a, b) =>
        (bestPricePerServing(a.line) ?? Infinity) - (bestPricePerServing(b.line) ?? Infinity) || a.i - b.i,
    );
  } else {
    indexed.sort(byPopularity);
  }
  return indexed.map((x) => x.line);
}
