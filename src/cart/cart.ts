// Winkelwagen: pure functies. De winkelwagen staat alleen in deze browser (localStorage);
// pas bij afrekenen wordt er een bestelling opgeslagen.
import { expandVariants, getProductLine } from '../data/catalog';
import type { ProductLine, ProductVariant } from '../data/types';

export const MAX_QUANTITY = 10;
export const FREE_GOODIES_FROM = 40; // "gratis goodies en samples vanaf €40"
export const FREE_SHIPPING_FROM = 100; // "gratis verzending vanaf €100"

export interface CartLine {
  variant_id: string;
  quantity: number;
}

export interface CartRow {
  line: ProductLine;
  variant: ProductVariant;
  quantity: number;
  total: number;
}

/** Zoekt een variant op id. Geeft undefined als het product niet (meer) bestaat. */
export function findVariant(variantId: string): { line: ProductLine; variant: ProductVariant } | undefined {
  const lineId = variantId.split('__')[0];
  const line = getProductLine(lineId);
  const variant = line && expandVariants(line).find((v) => v.id === variantId);
  return line && variant ? { line, variant } : undefined;
}

export function addToCart(cart: CartLine[], variantId: string, quantity = 1): CartLine[] {
  const existing = cart.find((l) => l.variant_id === variantId);
  if (existing) return setQuantity(cart, variantId, existing.quantity + quantity);
  return [...cart, { variant_id: variantId, quantity: Math.min(MAX_QUANTITY, Math.max(1, quantity)) }];
}

/** Aantal aanpassen; 0 of minder = verwijderen. Maximaal 10 per product. */
export function setQuantity(cart: CartLine[], variantId: string, quantity: number): CartLine[] {
  if (quantity <= 0) return cart.filter((l) => l.variant_id !== variantId);
  return cart.map((l) => (l.variant_id === variantId ? { ...l, quantity: Math.min(MAX_QUANTITY, Math.round(quantity)) } : l));
}

/** Regels met actuele prijzen; onbekende producten vallen weg. */
export function cartRows(cart: CartLine[]): CartRow[] {
  return cart.flatMap((l) => {
    const found = findVariant(l.variant_id);
    if (!found) return [];
    return [{ ...found, quantity: l.quantity, total: round2(found.variant.price_eur * l.quantity) }];
  });
}

export interface CartSummary {
  count: number; // aantal stuks
  subtotal: number;
  freeShipping: boolean;
  freeGoodies: boolean;
  toFreeShipping: number; // nog nodig voor gratis verzending
  toFreeGoodies: number;
}

export function summarize(rows: CartRow[]): CartSummary {
  const subtotal = round2(rows.reduce((sum, r) => sum + r.total, 0));
  return {
    count: rows.reduce((n, r) => n + r.quantity, 0),
    subtotal,
    freeShipping: subtotal >= FREE_SHIPPING_FROM,
    freeGoodies: subtotal >= FREE_GOODIES_FROM,
    toFreeShipping: Math.max(0, round2(FREE_SHIPPING_FROM - subtotal)),
    toFreeGoodies: Math.max(0, round2(FREE_GOODIES_FROM - subtotal)),
  };
}

/** Leest de winkelwagen veilig uit opgeslagen tekst (kapotte of oude data = lege of opgeschoonde winkelwagen). */
export function parseCart(raw: string | null): CartLine[] {
  try {
    const data = JSON.parse(raw ?? '[]') as unknown;
    if (!Array.isArray(data)) return [];
    return data
      .filter((l): l is CartLine => typeof l?.variant_id === 'string' && Number.isInteger(l?.quantity) && l.quantity > 0)
      .filter((l) => findVariant(l.variant_id))
      .map((l) => ({ variant_id: l.variant_id, quantity: Math.min(MAX_QUANTITY, l.quantity) }));
  } catch {
    return [];
  }
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
