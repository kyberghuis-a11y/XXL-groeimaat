import type { SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { KeyValueStorage } from '../auth/demoAuth';
import { addToCart, cartRows, findVariant, MAX_QUANTITY, parseCart, setQuantity, summarize } from '../cart/cart';
import { expandVariants, getProductLine } from '../data/catalog';
import { spentThisMonth } from '../pages/Orders';
import { amsterdamParts, amsterdamTime, expectedDelivery, formatDayLong, relativeDay, shipDate } from './delivery';
import { buildOrder, clearDemoOrders, createDemoOrderService, createSupabaseOrderService, fromOrderRow, OrderError } from './orderService';
import { ORDER_STATUSES, PAYMENT_METHODS, isOngoing, makeOrderNumber, simulatedStatus, type Order } from './types';

const memoryStorage = (): KeyValueStorage => {
  const d: Record<string, string> = {};
  return { getItem: (k) => d[k] ?? null, setItem: (k, v) => void (d[k] = v), removeItem: (k) => void delete d[k] };
};
/** Tijdstip in Nederland, bijv. nl('2026-11-17', '21:59'). */
const nl = (date: string, time: string) => {
  const [h, m] = time.split(':').map(Number);
  return new Date(amsterdamTime(date, h).getTime() + m * 60_000);
};

const WD = getProductLine('whey-delicious')!;
const wdChoc450 = expandVariants(WD).find((v) => v.flavor === 'Chocolade' && v.size_label === '450 g')!; // €19,99
const wdChoc2500 = expandVariants(WD).find((v) => v.flavor === 'Chocolade' && v.size_label === '2500 g')!; // €85,99

describe('leverbeloftes: verzend- en bezorgdag (Nederlandse tijd)', () => {
  // Week van 16 november 2026: ma 16, di 17, wo 18, do 19, vr 20, za 21, zo 22, ma 23, di 24
  it.each([
    ['di vóór 22:00 → vandaag verzonden, morgen bezorgd', '2026-11-17', '21:59', '2026-11-17', '2026-11-18'],
    ['di om 22:00 → morgen verzonden', '2026-11-17', '22:00', '2026-11-18', '2026-11-19'],
    ['vr vóór 22:00 → za bezorgd', '2026-11-20', '10:00', '2026-11-20', '2026-11-21'],
    ['vr na 22:00 → ma verzonden, di bezorgd', '2026-11-20', '22:30', '2026-11-23', '2026-11-24'],
    ['za → ma verzonden, di bezorgd', '2026-11-21', '09:00', '2026-11-23', '2026-11-24'],
    ['zo → ma verzonden, di bezorgd', '2026-11-22', '15:00', '2026-11-23', '2026-11-24'],
    ['ma vroeg → ma verzonden, di bezorgd', '2026-11-23', '08:00', '2026-11-23', '2026-11-24'],
  ])('%s', (_name, date, time, ship, deliver) => {
    const at = nl(date, time);
    expect(shipDate(at)).toBe(ship);
    expect(expectedDelivery(at)).toBe(deliver);
  });

  it('nooit bezorgd op zondag', () => {
    for (let h = 0; h < 24 * 14; h += 5) {
      const at = new Date(Date.UTC(2026, 10, 16) + h * 3_600_000);
      expect(new Date(`${expectedDelivery(at)}T12:00:00Z`).getUTCDay()).not.toBe(0);
    }
  });

  it('rekent in Nederlandse tijd, ook rond middernacht UTC', () => {
    // 23:30 UTC op maandag = 00:30 dinsdag in Nederland (wintertijd)
    expect(amsterdamParts(new Date('2026-11-16T23:30:00Z'))).toMatchObject({ date: '2026-11-17', weekday: 2, hour: 0 });
  });

  it('zomer- en wintertijd: 22:00 is altijd 22:00 in Nederland', () => {
    expect(amsterdamTime('2026-07-01', 22).toISOString()).toBe('2026-07-01T20:00:00.000Z'); // zomertijd UTC+2
    expect(amsterdamTime('2026-11-17', 22).toISOString()).toBe('2026-11-17T21:00:00.000Z'); // wintertijd UTC+1
  });

  it('teksten: "donderdag 20 november", vandaag/morgen', () => {
    expect(formatDayLong('2026-11-19')).toBe('donderdag 19 november');
    const now = nl('2026-11-17', '12:00');
    expect(relativeDay('2026-11-17', now)).toBe('vandaag');
    expect(relativeDay('2026-11-18', now)).toBe('morgen');
    expect(relativeDay('2026-11-20', now)).toBe('vrijdag 20 november');
  });
});

describe('nagebootste status', () => {
  const order = { status: 'besteld' as const, ordered_at: nl('2026-11-17', '10:00').toISOString(), expected_delivery: '2026-11-18' };
  it.each([
    ['10:05', '2026-11-17', 'besteld'],
    ['10:20', '2026-11-17', 'in_behandeling'],
    ['20:00', '2026-11-17', 'verzonden'],
    ['08:00', '2026-11-18', 'onderweg'],
    ['14:00', '2026-11-18', 'bezorgd'],
  ])('om %s op %s: %s', (time, date, status) => {
    expect(simulatedStatus(order, nl(date, time))).toBe(status);
  });
  it('laat bestellen (21:30): pas na 1 uur verzonden', () => {
    const late = { ...order, ordered_at: nl('2026-11-17', '21:30').toISOString() };
    expect(simulatedStatus(late, nl('2026-11-17', '22:00'))).toBe('in_behandeling');
    expect(simulatedStatus(late, nl('2026-11-17', '22:31'))).toBe('verzonden');
  });
  it('geannuleerd en retour blijven staan', () => {
    expect(simulatedStatus({ ...order, status: 'geannuleerd' }, nl('2026-11-30', '12:00'))).toBe('geannuleerd');
    expect(simulatedStatus({ ...order, status: 'retour' }, nl('2026-11-30', '12:00'))).toBe('retour');
  });
  it('lopend vs. eerder besteld; vaste statuslijst uit de brief', () => {
    expect(ORDER_STATUSES).toEqual(['besteld', 'in_behandeling', 'verzonden', 'onderweg', 'bezorgd', 'geannuleerd', 'retour']);
    expect(ORDER_STATUSES.filter(isOngoing)).toEqual(['besteld', 'in_behandeling', 'verzonden', 'onderweg']);
  });
});

describe('winkelwagen', () => {
  it('toevoegen, samenvoegen, aantal aanpassen en verwijderen', () => {
    let cart = addToCart([], wdChoc450.id);
    cart = addToCart(cart, wdChoc450.id, 2);
    expect(cart).toEqual([{ variant_id: wdChoc450.id, quantity: 3 }]);
    cart = setQuantity(cart, wdChoc450.id, 99);
    expect(cart[0].quantity).toBe(MAX_QUANTITY);
    expect(setQuantity(cart, wdChoc450.id, 0)).toEqual([]);
  });

  it('variant terugvinden via id', () => {
    expect(findVariant(wdChoc450.id)?.variant.price_eur).toBe(19.99);
    expect(findVariant('bestaat-niet__x__y')).toBeUndefined();
  });

  it('goodies vanaf €40, gratis verzending vanaf €100', () => {
    const one = summarize(cartRows([{ variant_id: wdChoc450.id, quantity: 1 }]));
    expect(one).toMatchObject({ count: 1, subtotal: 19.99, freeGoodies: false, toFreeGoodies: 20.01, freeShipping: false, toFreeShipping: 80.01 });
    const two = summarize(cartRows([{ variant_id: wdChoc450.id, quantity: 2 }]));
    expect(two).toMatchObject({ subtotal: 39.98, freeGoodies: false, toFreeGoodies: 0.02 });
    const big = summarize(cartRows([{ variant_id: wdChoc2500.id, quantity: 1 }, { variant_id: wdChoc450.id, quantity: 1 }]));
    expect(big).toMatchObject({ subtotal: 105.98, freeGoodies: true, freeShipping: true, toFreeShipping: 0 });
  });

  it('kapotte of verouderde opslag: veilig opgeschoond', () => {
    expect(parseCart('kapot')).toEqual([]);
    expect(parseCart(JSON.stringify({ a: 1 }))).toEqual([]);
    expect(parseCart(JSON.stringify([{ variant_id: 'weg__x__y', quantity: 1 }, { variant_id: wdChoc450.id, quantity: 50 }, { variant_id: wdChoc450.id, quantity: -1 }]))).toEqual([
      { variant_id: wdChoc450.id, quantity: MAX_QUANTITY },
    ]);
  });
});

describe('bestelling maken', () => {
  const now = nl('2026-11-17', '15:00');
  const rows = cartRows([{ variant_id: wdChoc450.id, quantity: 2 }]);

  it('bevat alles uit de brief: nummer, datum, verwachte levering, totaal, status', () => {
    const o = buildOrder(rows, 'iDEAL', now, () => 0.4821);
    expect(o).toMatchObject({
      order_number: 'GM-261117-4821',
      status: 'besteld',
      ordered_at: now.toISOString(),
      expected_delivery: '2026-11-18',
      total_eur: 39.98,
      free_shipping: false,
      tracking_url: null,
      payment_method: 'iDEAL',
    });
    expect(o.items).toEqual([
      { variant_id: wdChoc450.id, product_line_id: 'whey-delicious', product_name: 'Whey Delicious', flavor: 'Chocolade', size_label: '450 g', quantity: 2, price_eur: 19.99 },
    ]);
  });

  it('lege winkelwagen kan niet', () => {
    expect(() => buildOrder([], 'iDEAL', now)).toThrow(OrderError);
  });

  it('bestelnummer: GM + datum (NL) + 4 cijfers', () => {
    expect(makeOrderNumber(nl('2026-11-17', '23:30'), () => 0.0042)).toBe('GM-261117-0042');
  });

  it('alle betaalmethoden van de XXL-site', () => {
    expect(PAYMENT_METHODS).toEqual(['iDEAL', 'Mastercard', 'Amex', 'Klarna', 'SEPA', 'Apple Pay', 'Google Pay', 'PayPal', 'Bancontact']);
  });
});

describe('opslag van bestellingen', () => {
  const now = nl('2026-11-17', '15:00');
  const order = (n: number, at: Date): Order => ({ ...buildOrder(cartRows([{ variant_id: wdChoc450.id, quantity: n }]), 'PayPal', at), id: `o${n}` });

  it('demo: per gebruiker, nieuwste eerst, en wissen bij account verwijderen', async () => {
    const storage = memoryStorage();
    const svc = createDemoOrderService(storage);
    await svc.create('u1', order(1, nl('2026-11-10', '12:00')));
    await svc.create('u1', order(2, now));
    await svc.create('u2', order(3, now));
    expect((await svc.list('u1')).map((o) => o.id)).toEqual(['o2', 'o1']);
    clearDemoOrders(storage, 'u1');
    expect(await svc.list('u1')).toEqual([]);
    expect(await svc.list('u2')).toHaveLength(1);
  });

  it('Supabase: plaatsen via create_order (bestelling + regels in één keer)', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 'uuid-123', error: null });
    const svc = createSupabaseOrderService({ rpc } as unknown as SupabaseClient);
    const o = order(1, now);
    const saved = await svc.create('u1', o);
    expect(saved.id).toBe('uuid-123');
    const [fn, args] = rpc.mock.calls[0];
    expect(fn).toBe('create_order');
    expect(args.p_items).toEqual(o.items);
    expect(args.p_order).toMatchObject({ order_number: o.order_number, expected_delivery: '2026-11-18', total_eur: 19.99 });
    expect(args.p_order).not.toHaveProperty('items');
    expect(args.p_order).not.toHaveProperty('id');
  });

  it('Supabase: fout geeft nette melding', async () => {
    const svc = createSupabaseOrderService({ rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'x' } }) } as unknown as SupabaseClient);
    await expect(svc.create('u1', order(1, now))).rejects.toThrow(/niet worden geplaatst/);
  });

  it('Supabase: bedragen als tekst worden getallen', () => {
    const o = order(1, now);
    const { items, ...head } = o;
    const row = { ...head, total_eur: '19.99', order_items: items.map((i) => ({ ...i, price_eur: '19.99' })) };
    expect(fromOrderRow(row as never)).toEqual(o);
  });

  it('SQL-migratie kent alle statussen en betaalmethoden', () => {
    const sql = readFileSync(new URL('../../supabase/migrations/0004_orders.sql', import.meta.url), 'utf8');
    for (const v of [...ORDER_STATUSES, ...PAYMENT_METHODS]) expect(sql, v).toContain(`'${v}'`);
  });
});

describe('uitgegeven deze maand', () => {
  const o = (at: Date, total: number, status: Order['status'] = 'besteld'): Order => ({
    id: String(Math.random()),
    order_number: 'x',
    status,
    ordered_at: at.toISOString(),
    expected_delivery: '2026-11-18',
    delivered_at: null,
    total_eur: total,
    free_shipping: false,
    tracking_url: null,
    payment_method: 'iDEAL',
    items: [],
  });
  it('alleen deze maand (NL-tijd), zonder geannuleerd en retour', () => {
    const now = nl('2026-11-17', '12:00');
    const list = [
      o(nl('2026-11-01', '09:00'), 19.99),
      o(nl('2026-11-17', '10:00'), 10.01),
      o(nl('2026-10-31', '23:00'), 50), // oktober
      o(nl('2026-11-05', '12:00'), 30, 'geannuleerd'),
      o(nl('2026-11-06', '12:00'), 30, 'retour'),
    ];
    expect(spentThisMonth(list, now)).toBe(30);
  });
});
