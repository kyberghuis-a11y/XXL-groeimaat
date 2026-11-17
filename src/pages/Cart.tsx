import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useCart } from '../cart/CartContext';
import { FREE_GOODIES_FROM, FREE_SHIPPING_FROM, MAX_QUANTITY, type CartSummary } from '../cart/cart';
import { FormError, PrimaryButton } from '../components/Form';
import { CheckIcon, CloseIcon, TruckIcon } from '../components/Icons';
import { PageTitle } from '../components/Layout';
import { ProductImage } from '../components/ProductImage';
import { formatEuro } from '../lib/format';
import { expectedDelivery, relativeDay } from '../orders/delivery';
import { useOrders } from '../orders/OrdersContext';
import { PAYMENT_METHODS, type PaymentMethod } from '../orders/types';
import { useProfile } from '../profile/ProfileContext';

/** Voortgang naar gratis goodies (€40) en gratis verzending (€100). */
function Thresholds({ s }: { s: CartSummary }) {
  const bar = (value: number, max: number) => (
    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-xxl-black/10" aria-hidden="true">
      <div className="h-full rounded-full bg-xxl-red" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
  return (
    <div className="space-y-3 rounded-lg bg-xxl-white p-4 text-sm">
      <div>
        <p className="flex items-center gap-1.5 font-semibold">
          {s.freeGoodies && <CheckIcon size={16} className="text-xxl-red" />}
          {s.freeGoodies ? 'Je krijgt gratis goodies & samples' : `Nog ${formatEuro(s.toFreeGoodies)} tot gratis goodies & samples`}
        </p>
        {!s.freeGoodies && bar(s.subtotal, FREE_GOODIES_FROM)}
      </div>
      <div>
        <p className="flex items-center gap-1.5 font-semibold">
          {s.freeShipping && <CheckIcon size={16} className="text-xxl-red" />}
          {s.freeShipping ? 'Gratis verzending' : `Nog ${formatEuro(s.toFreeShipping)} tot gratis verzending`}
        </p>
        {!s.freeShipping && bar(s.subtotal, FREE_SHIPPING_FROM)}
      </div>
    </div>
  );
}

function Totals({ s }: { s: CartSummary }) {
  return (
    <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-sm">
      <dt>Producten ({s.count})</dt>
      <dd className="text-right">{formatEuro(s.subtotal)}</dd>
      <dt>Verzendkosten</dt>
      <dd className="text-right">{s.freeShipping ? 'Gratis' : 'Nog te controleren'}</dd>
      <dt className="pt-2 text-base font-extrabold">Totaal</dt>
      <dd className="pt-2 text-right text-base font-extrabold">{formatEuro(s.subtotal)}</dd>
      {!s.freeShipping && (
        <dd className="col-span-2 text-xs text-xxl-black/70">
          De verzendkosten onder {formatEuro(FREE_SHIPPING_FROM)} zijn nog niet bekend en tellen in deze demo niet mee.
        </dd>
      )}
    </dl>
  );
}

export function CartPage() {
  const { rows, summary, setQty } = useCart();
  const navigate = useNavigate();

  if (rows.length === 0)
    return (
      <div className="space-y-4 p-4">
        <PageTitle>Winkelwagen</PageTitle>
        <div className="rounded-lg bg-xxl-white p-6 text-center">
          <p className="text-lg font-black uppercase">Je winkelwagen is leeg</p>
          <p className="mt-2 text-sm text-xxl-black/70">Bekijk je advies op Home, of zoek zelf in Ontdek.</p>
          <Link to="/ontdek" className="mt-4 inline-flex min-h-12 items-center rounded-md bg-xxl-red px-6 text-sm font-extrabold text-xxl-white uppercase">
            Naar Ontdek
          </Link>
        </div>
      </div>
    );

  return (
    <div className="space-y-4 p-4">
      <PageTitle>Winkelwagen</PageTitle>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.variant.id} className="grid grid-cols-[72px_1fr] gap-3 rounded-lg bg-xxl-white p-3">
            <ProductImage product={r.line} className="aspect-square w-18 rounded-md" />
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to={`/product/${r.line.id}`} className="font-extrabold leading-tight hover:underline">
                    {r.line.name}
                  </Link>
                  <p className="text-sm text-xxl-black/70">{[r.variant.flavor, r.variant.size_label].filter(Boolean).join(' · ')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setQty(r.variant.id, 0)}
                  className="-mt-1 -mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-xxl-grey"
                  aria-label={`${r.line.name} verwijderen`}
                >
                  <CloseIcon size={18} />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center rounded-md border-2 border-xxl-black/15" role="group" aria-label={`Aantal ${r.line.name}`}>
                  <button type="button" onClick={() => setQty(r.variant.id, r.quantity - 1)} className="grid h-11 w-11 place-items-center text-lg font-bold" aria-label="Eén minder">
                    −
                  </button>
                  <span className="w-8 text-center font-bold" aria-live="polite">
                    {r.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(r.variant.id, r.quantity + 1)}
                    disabled={r.quantity >= MAX_QUANTITY}
                    className="grid h-11 w-11 place-items-center text-lg font-bold disabled:opacity-30"
                    aria-label="Eén meer"
                  >
                    +
                  </button>
                </div>
                <span className="font-extrabold">{formatEuro(r.total)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Thresholds s={summary} />
      <div className="rounded-lg bg-xxl-white p-4">
        <Totals s={summary} />
      </div>
      <PrimaryButton type="button" onClick={() => navigate('/afrekenen')}>
        Afrekenen
      </PrimaryButton>
    </div>
  );
}

export function CheckoutPage() {
  const { user, loading } = useAuth();
  const { answers } = useProfile();
  const { rows, summary, clear } = useCart();
  const { place } = useOrders();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<PaymentMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && !user) return <Navigate to="/inloggen" replace state={{ from: '/afrekenen' }} />;
  if (rows.length === 0 && !busy) return <Navigate to="/winkelwagen" replace />;

  // Harde regel: onder de 18 geen producten met cafeïne.
  const blocked = answers.is_adult !== true ? rows.filter((r) => r.line.labels.includes('bevat_cafeine')) : [];
  const delivery = relativeDay(expectedDelivery(new Date()), new Date());

  async function submit() {
    if (!payment) return setError('Kies een betaalmethode.');
    if (blocked.length > 0) return;
    setBusy(true);
    setError(null);
    try {
      const order = await place(rows, payment);
      clear();
      navigate('/bestellingen', { replace: true, state: { placed: order.order_number } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bestellen mislukt. Probeer het opnieuw.');
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 p-4">
      <PageTitle>Afrekenen</PageTitle>
      <p className="rounded-md border-2 border-xxl-black p-3 text-sm">
        <strong>Demo:</strong> je betaalt niets en er wordt niets verzonden. De bestelling komt alleen in deze app te staan.
      </p>

      <section className="rounded-lg bg-xxl-white p-4" aria-labelledby="overview-title">
        <h2 id="overview-title" className="mb-2 text-sm font-extrabold tracking-wider uppercase">
          Overzicht
        </h2>
        <ul className="mb-3 space-y-1 text-sm">
          {rows.map((r) => (
            <li key={r.variant.id} className="flex justify-between gap-2">
              <span>
                {r.quantity}× {r.line.name}
                <span className="text-xxl-black/70"> · {[r.variant.flavor, r.variant.size_label].filter(Boolean).join(' · ')}</span>
              </span>
              <span className="shrink-0">{formatEuro(r.total)}</span>
            </li>
          ))}
        </ul>
        <Totals s={summary} />
      </section>

      <section className="flex items-start gap-3 rounded-lg bg-xxl-black p-4 text-xxl-white">
        <TruckIcon className="mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-bold tracking-wider text-xxl-white/70 uppercase">Verwachte levering</p>
          <p className="text-lg font-black first-letter:uppercase">{delivery}</p>
          <p className="text-xs text-xxl-white/70">Vóór 22:00 besteld (ma–vr), vandaag verzonden. Bezorging van maandag t/m zaterdag.</p>
        </div>
      </section>

      <fieldset className="rounded-lg bg-xxl-white p-4">
        <legend className="sr-only">Betaalmethode</legend>
        <h2 className="mb-2 text-sm font-extrabold tracking-wider uppercase" aria-hidden="true">
          Betaalmethode
        </h2>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Betaalmethode">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={payment === m}
              onClick={() => setPayment(m)}
              className={`min-h-12 rounded-md border-2 px-3 text-sm font-bold ${payment === m ? 'border-xxl-black bg-xxl-black text-xxl-white' : 'border-xxl-black/15'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </fieldset>

      {blocked.length > 0 && (
        <p role="alert" className="rounded-md border-2 border-xxl-red bg-xxl-white p-3 text-sm">
          <strong>Alleen voor 18+:</strong> {blocked.map((r) => r.line.name).join(', ')} bevat cafeïne. Haal dit uit je winkelwagen om te bestellen.
        </p>
      )}
      <FormError message={error} />
      <PrimaryButton type="button" onClick={submit} loading={busy} disabled={blocked.length > 0}>
        Bestelling plaatsen (demo)
      </PrimaryButton>
      <Link to="/winkelwagen" className="block text-center text-sm font-bold underline underline-offset-4">
        Terug naar winkelwagen
      </Link>
    </div>
  );
}
