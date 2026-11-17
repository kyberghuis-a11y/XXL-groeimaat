import type { ProductLine } from '../data/types';

/** "20 smaken" (aantal volgens XXL als dat hoger is dan wat we kennen); null voor producten zonder smaak. */
export function flavorCountText(product: ProductLine): string | null {
  const named = product.flavors.filter((f) => f.name !== null).length;
  if (named === 0) return null;
  const total = Math.max(product.flavor_count_total ?? 0, named);
  return `${total} ${total === 1 ? 'smaak' : 'smaken'}`;
}

