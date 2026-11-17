import { amsterdamParts } from './delivery';
import type { Order } from './types';

/** Totaal uitgegeven in de huidige maand (Nederlandse tijd), zonder geannuleerde en geretourneerde bestellingen. */
export function spentThisMonth(orders: Order[], now: Date): number {
  const month = amsterdamParts(now).date.slice(0, 7);
  const total = orders
    .filter((o) => o.status !== 'geannuleerd' && o.status !== 'retour' && amsterdamParts(new Date(o.ordered_at)).date.startsWith(month))
    .reduce((sum, o) => sum + o.total_eur, 0);
  return Math.round(total * 100) / 100;
}

