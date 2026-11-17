// Opslag van bestellingen. Gesimuleerd: er wordt niets betaald of verzonden (MVP, zie brief).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { KeyValueStorage } from '../auth/demoAuth';
import { round2, summarize, type CartRow } from '../cart/cart';
import { expectedDelivery } from './delivery';
import { makeOrderNumber, type Order, type PaymentMethod } from './types';

export interface OrderService {
  list(userId: string): Promise<Order[]>; // nieuwste eerst
  create(userId: string, order: Order): Promise<Order>;
}

export class OrderError extends Error {
  constructor(message = 'Je bestelling kon niet worden geplaatst. Controleer je internet en probeer het opnieuw.') {
    super(message);
  }
}

/**
 * Maakt een bestelling van de winkelwagen. Verzendkosten onder €100 zijn nog niet bekend
 * (nog te controleren op xxlnutrition.com), dus het totaal is het bedrag van de producten.
 */
export function buildOrder(rows: CartRow[], payment: PaymentMethod, now: Date, random: () => number = Math.random): Order {
  if (rows.length === 0) throw new OrderError('Je winkelwagen is leeg.');
  const summary = summarize(rows);
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `order-${now.getTime()}-${Math.floor(random() * 1e6)}`,
    order_number: makeOrderNumber(now, random),
    status: 'besteld',
    ordered_at: now.toISOString(),
    expected_delivery: expectedDelivery(now),
    delivered_at: null,
    total_eur: round2(summary.subtotal),
    free_shipping: summary.freeShipping,
    tracking_url: null, // pas beschikbaar met een echte koppeling met XXL Nutrition
    payment_method: payment,
    items: rows.map((r) => ({
      variant_id: r.variant.id,
      product_line_id: r.line.id,
      product_name: r.line.name,
      flavor: r.variant.flavor,
      size_label: r.variant.size_label,
      quantity: r.quantity,
      price_eur: r.variant.price_eur,
    })),
  };
}

const newestFirst = (a: Order, b: Order) => b.ordered_at.localeCompare(a.ordered_at);

// ---------- Demo ----------

const DEMO_KEY = 'groeimaat.demo.orders';

function readAll(storage: KeyValueStorage): Record<string, Order[]> {
  try {
    const parsed = JSON.parse(storage.getItem(DEMO_KEY) ?? '{}') as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, Order[]>) : {};
  } catch {
    return {};
  }
}

export function createDemoOrderService(storage: KeyValueStorage): OrderService {
  return {
    async list(userId) {
      return [...(readAll(storage)[userId] ?? [])].sort(newestFirst);
    },
    async create(userId, order) {
      const all = readAll(storage);
      storage.setItem(DEMO_KEY, JSON.stringify({ ...all, [userId]: [...(all[userId] ?? []), order] }));
      return order;
    },
  };
}

export function clearDemoOrders(storage: KeyValueStorage, userId: string): void {
  const all = readAll(storage);
  delete all[userId];
  storage.setItem(DEMO_KEY, JSON.stringify(all));
}

// ---------- Supabase ----------

interface OrderRow extends Omit<Order, 'items' | 'total_eur'> {
  total_eur: number | string; // numeric komt soms als tekst terug
  order_items: (Omit<Order['items'][number], 'price_eur'> & { price_eur: number | string })[];
}

export function fromOrderRow(row: OrderRow): Order {
  const { order_items, ...rest } = row;
  return {
    ...rest,
    total_eur: Number(row.total_eur),
    items: order_items.map((i) => ({ ...i, price_eur: Number(i.price_eur) })),
  };
}

export function createSupabaseOrderService(client: SupabaseClient): OrderService {
  return {
    async list() {
      const { data, error } = await client
        .from('orders')
        .select(
          'id, order_number, status, ordered_at, expected_delivery, delivered_at, total_eur, free_shipping, tracking_url, payment_method, order_items (variant_id, product_line_id, product_name, flavor, size_label, quantity, price_eur)',
        )
        .order('ordered_at', { ascending: false });
      if (error) throw new OrderError('Je bestellingen konden niet worden geladen.');
      return ((data ?? []) as unknown as OrderRow[]).map(fromOrderRow);
    },
    async create(_userId, order) {
      const { items, id: _localId, ...head } = order;
      void _localId;
      // Eén databasefunctie: bestelling en regels samen opgeslagen, of allebei niet.
      const { data, error } = await client.rpc('create_order', { p_order: head, p_items: items });
      if (error) throw new OrderError();
      return { ...order, id: String(data) };
    },
  };
}
