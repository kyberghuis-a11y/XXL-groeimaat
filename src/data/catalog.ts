// Datalaag: de ENIGE plek waar schermen productdata vandaan halen.
// In bouwstap 3 vervangen we de inhoud van dit bestand door Supabase-queries;
// de functienamen en types blijven gelijk, zodat schermen niet hoeven te veranderen.
import seed from './products.seed.json';
import type { ProductLine, ProductVariant } from './types';

const productLines = seed.product_lines as ProductLine[];

/** Prijs per portie, afgerond op centen. Geeft null als het aantal porties onbekend is. */
export function pricePerServing(priceEur: number, servings: number | null): number | null {
  if (servings === null || servings <= 0) return null;
  return Math.round((priceEur / servings) * 100) / 100;
}

/** Zet de smaken × formaten van een productlijn om naar losse varianten (tabel product_variants). */
export function expandVariants(line: ProductLine): ProductVariant[] {
  return line.flavors.flatMap((flavor) =>
    line.sizes.map((size) => ({
      id: `${line.id}__${slug(flavor.name ?? 'standaard')}__${slug(size.label)}`,
      product_line_id: line.id,
      flavor: flavor.name,
      flavor_family: flavor.family,
      sweetness: flavor.sweetness,
      texture: flavor.texture,
      size_label: size.label,
      size_grams: size.size_grams,
      servings: size.servings,
      price_eur: size.price_eur,
      price_per_serving: pricePerServing(size.price_eur, size.servings),
      in_stock: true,
      needs_check: Boolean(flavor.needs_check || size.needs_check),
    })),
  );
}

function slug(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function getProductLines(): ProductLine[] {
  return productLines;
}

export function getProductLine(id: string): ProductLine | undefined {
  return productLines.find((p) => p.id === id);
}

/** Laagste prijs van een productlijn ("Vanaf €xx,xx"). */
export function fromPrice(line: ProductLine): number {
  return Math.min(...line.sizes.map((s) => s.price_eur));
}

/** Laagste prijs per portie van een productlijn, of null als die nergens bekend is. */
export function bestPricePerServing(line: ProductLine): number | null {
  const values = line.sizes
    .map((s) => pricePerServing(s.price_eur, s.servings))
    .filter((v): v is number => v !== null);
  return values.length ? Math.min(...values) : null;
}
