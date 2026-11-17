import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckIcon, TruckIcon } from '../components/Icons';
import { PageTitle } from '../components/Layout';
import { formatEuro } from '../lib/format';
import { amsterdamParts, formatDate, formatDayLong, relativeDay } from '../orders/delivery';
import { useOrders } from '../orders/OrdersContext';
import { STATUS_LABEL, STATUS_STEPS, isOngoing, simulatedStatus, type Order, type OrderStatus } from '../orders/types';
import { useProfile } from '../profile/ProfileContext';
import type { BudgetRange } from '../profile/types';

/** Huidige tijd, elke minuut bijgewerkt (de status is nagebootst en verandert met de tijd). */
function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

const BUDGET_MAX: Record<BudgetRange, number | null> = { under_20: 20, '20_40': 40, '40_60': 60, over_60: null };
const BUDGET_TEXT: Record<BudgetRange, string> = { under_20: 'tot €20', '20_40': '€20–€40', '40_60': '€40–€60', over_60: 'meer dan €60' };

/** Totaal uitgegeven in de huidige maand (Nederlandse tijd), zonder geannuleerde en geretourneerde bestellingen. */
export function spentThisMonth(orders: Order[], now: Date): number {
  const month = amsterdamParts(now).date.slice(0, 7);
  const total = orders
    .filter((o) => o.status !== 'geannuleerd' && o.status !== 'retour' && amsterdamParts(new Date(o.ordered_at)).date.startsWith(month))
    .reduce((sum, o) => sum + o.total_eur, 0);
  return Math.round(total * 100) / 100;
}

function StatusBar({ status }: { status: OrderStatus }) {
  const current = STATUS_STEPS.findIndex((s) => s.status === status);
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label={`Status: ${STATUS_LABEL[status]}`}>
      {STATUS_STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step.status} className="flex flex-col items-center gap-1 text-center" aria-current={i === current ? 'step' : undefined}>
            <span className={`h-1.5 w-full rounded-full ${done ? 'bg-xxl-red' : 'bg-xxl-black/10'}`} aria-hidden="true" />
            <span className={`text-[10px] leading-tight ${i === current ? 'font-extrabold' : done ? 'font-semibold' : 'text-xxl-black/50'}`}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function ItemList({ order }: { order: Order }) {
  return (
    <ul className="space-y-0.5 text-sm">
      {order.items.map((i) => (
        <li key={i.variant_id}>
          {i.quantity}× {i.product_name}
          <span className="text-xxl-black/60"> · {[i.flavor, i.size_label].filter(Boolean).join(' · ')}</span>
        </li>
      ))}
    </ul>
  );
}

function OngoingCard({ order, now }: { order: Order; now: Date }) {
  const status = simulatedStatus(order, now);
  return (
    <li className="space-y-3 rounded-lg bg-xxl-white p-4">
      <div className="flex items-baseline justify-between gap-2 text-xs text-xxl-black/60">
        <span className="font-bold text-xxl-black">{order.order_number}</span>
        <span>Besteld op {formatDate(new Date(order.ordered_at))}</span>
      </div>
      <p className="text-xl font-black">
        Verwacht: <span className="first-letter:uppercase">{formatDayLong(order.expected_delivery)}</span>
      </p>
      <StatusBar status={status} />
      <ItemList order={order} />
      <div className="flex items-center justify-between border-t border-xxl-black/10 pt-3 text-sm">
        <span className="text-xxl-black/60">{order.tracking_url ? <a href={order.tracking_url}>Track & trace</a> : 'Track & trace: nog niet beschikbaar in deze demo'}</span>
        <span className="font-extrabold">{formatEuro(order.total_eur)}</span>
      </div>
    </li>
  );
}

function PastRow({ order, now }: { order: Order; now: Date }) {
  const status = simulatedStatus(order, now);
  return (
    <li className="rounded-lg bg-xxl-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold">{formatDate(new Date(order.ordered_at))}</p>
          <p className="text-xs text-xxl-black/60">{order.order_number}</p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold uppercase ${status === 'bezorgd' ? 'bg-xxl-black text-xxl-white' : 'bg-xxl-grey text-xxl-black ring-1 ring-xxl-black/15'}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </div>
      <div className="mt-2">
        <ItemList order={order} />
      </div>
      <p className="mt-2 text-right text-sm font-extrabold">{formatEuro(order.total_eur)}</p>
    </li>
  );
}

export function OrdersPage() {
  const { orders, loading, error } = useOrders();
  const { answers } = useProfile();
  const now = useNow();
  // Bevestiging na bestellen: één keer tonen, daarna uit de browsergeschiedenis halen (niet opnieuw na verversen).
  const location = useLocation();
  const navigate = useNavigate();
  const [placed] = useState(() => (location.state as { placed?: string } | null)?.placed);
  useEffect(() => {
    if (placed) navigate(location.pathname, { replace: true, state: null });
  }, [placed, navigate, location.pathname]);
  const [tab, setTab] = useState<'lopend' | 'eerder'>('lopend');

  const ongoing = orders.filter((o) => isOngoing(simulatedStatus(o, now)));
  const past = orders.filter((o) => !isOngoing(simulatedStatus(o, now)));
  const next = [...ongoing].sort((a, b) => a.expected_delivery.localeCompare(b.expected_delivery))[0];
  const spent = spentThisMonth(orders, now);
  const budget = answers.budget_range;
  const budgetMax = budget ? BUDGET_MAX[budget] : null;

  return (
    <div className="space-y-4 p-4">
      <PageTitle>Bestellingen</PageTitle>

      {placed && (
        <p role="status" className="flex gap-2 rounded-md bg-xxl-white p-3 text-sm ring-2 ring-xxl-black">
          <CheckIcon size={18} className="mt-0.5 shrink-0 text-xxl-red" />
          <span>
            <strong>Bedankt!</strong> Je bestelling {placed} is geplaatst (demo).
          </span>
        </p>
      )}

      {next && (
        <section className="flex items-start gap-3 rounded-lg bg-xxl-black p-4 text-xxl-white" aria-labelledby="next-title">
          <TruckIcon className="mt-1 shrink-0" />
          <div>
            <h2 id="next-title" className="text-xs font-bold tracking-wider text-xxl-white/70 uppercase">
              Eerstvolgende levering
            </h2>
            <p className="text-2xl font-black first-letter:uppercase">{relativeDay(next.expected_delivery, now)}</p>
            <p className="text-sm text-xxl-white/80">
              {next.order_number} · {STATUS_LABEL[simulatedStatus(next, now)]}
            </p>
          </div>
        </section>
      )}

      <div className="grid grid-cols-2 rounded-md bg-xxl-white p-1" role="tablist">
        {(
          [
            ['lopend', `Lopend (${ongoing.length})`],
            ['eerder', `Eerder besteld (${past.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`min-h-11 rounded text-sm font-extrabold uppercase ${tab === id ? 'bg-xxl-black text-xxl-white' : 'text-xxl-black/70'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-sm text-xxl-black/60">Even laden…</p>}
      {error && <p className="rounded-md bg-xxl-white p-3 text-sm text-xxl-red">{error}</p>}

      {!loading && tab === 'lopend' && (
        <>
          {ongoing.length > 0 ? (
            <ul className="space-y-3">
              {ongoing.map((o) => (
                <OngoingCard key={o.id} order={o} now={now} />
              ))}
            </ul>
          ) : (
            <div className="rounded-lg bg-xxl-white p-6 text-center">
              <p className="font-black uppercase">Geen lopende bestellingen</p>
              <Link to="/home" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4">
                Bekijk je advies
              </Link>
            </div>
          )}
          {ongoing.length > 0 && <p className="text-xs text-xxl-black/60">De status wordt in deze demo nagebootst; er is nog geen koppeling met de webshop van XXL Nutrition.</p>}
        </>
      )}

      {!loading && tab === 'eerder' && (
        <>
          <section className="rounded-lg bg-xxl-white p-4 text-sm" aria-labelledby="month-title">
            <h2 id="month-title" className="text-xs font-extrabold tracking-wider uppercase">
              Uitgegeven deze maand
            </h2>
            <p className="mt-1 text-2xl font-black">{formatEuro(spent)}</p>
            {budget && (
              <p className={budgetMax !== null && spent > budgetMax ? 'font-semibold text-xxl-red' : 'text-xxl-black/70'}>
                Je budget: {BUDGET_TEXT[budget]} per maand
                {budgetMax !== null && (spent > budgetMax ? ` · ${formatEuro(spent - budgetMax)} erboven` : ` · nog ${formatEuro(budgetMax - spent)} over`)}
              </p>
            )}
          </section>
          {past.length > 0 ? (
            <ul className="space-y-3">
              {past.map((o) => (
                <PastRow key={o.id} order={o} now={now} />
              ))}
            </ul>
          ) : (
            <p className="rounded-lg bg-xxl-white p-6 text-center text-sm text-xxl-black/70">Je hebt nog geen afgeronde bestellingen.</p>
          )}
        </>
      )}
    </div>
  );
}
