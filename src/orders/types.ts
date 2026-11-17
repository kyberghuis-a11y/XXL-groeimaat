// Bestellingen (projectbrief, sectie "Datamodel" en "Bestellingen").
import { amsterdamParts, amsterdamTime, shipDate, type IsoDate } from './delivery';

/** Vaste lijst uit de brief. */
export const ORDER_STATUSES = ['besteld', 'in_behandeling', 'verzonden', 'onderweg', 'bezorgd', 'geannuleerd', 'retour'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** De vijf stappen van de statusbalk. */
export const STATUS_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'besteld', label: 'Besteld' },
  { status: 'in_behandeling', label: 'In behandeling' },
  { status: 'verzonden', label: 'Verzonden' },
  { status: 'onderweg', label: 'Onderweg' },
  { status: 'bezorgd', label: 'Bezorgd' },
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  besteld: 'Besteld',
  in_behandeling: 'In behandeling',
  verzonden: 'Verzonden',
  onderweg: 'Onderweg',
  bezorgd: 'Bezorgd',
  geannuleerd: 'Geannuleerd',
  retour: 'Retour',
};

export const PAYMENT_METHODS = ['iDEAL', 'Mastercard', 'Amex', 'Klarna', 'SEPA', 'Apple Pay', 'Google Pay', 'PayPal', 'Bancontact'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Regel in order_items. Productnaam, smaak en formaat worden mee opgeslagen (de catalogus kan veranderen). */
export interface OrderItem {
  variant_id: string;
  product_line_id: string;
  product_name: string;
  flavor: string | null;
  size_label: string;
  quantity: number;
  price_eur: number; // stukprijs op het moment van bestellen
}

export interface Order {
  id: string;
  order_number: string;
  /** Opgeslagen status. In de MVP is dit 'besteld' (of later geannuleerd/retour); de rest wordt nagebootst. */
  status: OrderStatus;
  ordered_at: string; // ISO-tijdstip
  expected_delivery: IsoDate;
  delivered_at: string | null;
  total_eur: number;
  free_shipping: boolean;
  tracking_url: string | null;
  payment_method: PaymentMethod;
  items: OrderItem[];
}

/**
 * Nagebootste status op moment `now` (er is nog geen koppeling met de XXL-webshop):
 * besteld → na 15 min in behandeling → verzonden op de verzenddag om 20:00 (of 1 uur na bestellen als dat later is)
 * → onderweg op de bezorgdag om 08:00 → bezorgd op de bezorgdag om 14:00.
 */
export function simulatedStatus(order: Pick<Order, 'status' | 'ordered_at' | 'expected_delivery'>, now: Date): OrderStatus {
  if (order.status === 'geannuleerd' || order.status === 'retour') return order.status;
  const t = now.getTime();
  const ordered = new Date(order.ordered_at);
  const shipped = Math.max(amsterdamTime(shipDate(ordered), 20).getTime(), ordered.getTime() + 60 * 60 * 1000);
  if (t >= amsterdamTime(order.expected_delivery, 14).getTime()) return 'bezorgd';
  if (t >= amsterdamTime(order.expected_delivery, 8).getTime()) return 'onderweg';
  if (t >= shipped) return 'verzonden';
  if (t >= ordered.getTime() + 15 * 60 * 1000) return 'in_behandeling';
  return 'besteld';
}

/** Lopend = nog niet bezorgd, geannuleerd of retour. */
export function isOngoing(status: OrderStatus): boolean {
  return status === 'besteld' || status === 'in_behandeling' || status === 'verzonden' || status === 'onderweg';
}

/** Bestelnummer, bijv. "GM-261117-4821" (GM = Groeimaat; geen echt XXL-bestelnummer). */
export function makeOrderNumber(at: Date, random: () => number = Math.random): string {
  const d = amsterdamParts(at).date.replace(/-/g, '').slice(2);
  return `GM-${d}-${String(Math.floor(random() * 10000)).padStart(4, '0')}`;
}
