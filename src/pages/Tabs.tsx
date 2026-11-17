import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ComingSoon, PageTitle } from '../components/Layout';
import { CONCEPT_LABEL, DISCLAIMER } from '../lib/format';

export function Home() {
  return (
    <div className="space-y-4 p-4">
      <PageTitle>Jouw advies</PageTitle>
      <ComingSoon title="Top 3 per categorie" step="bouwstap 6">
        <p className="mt-2 text-sm text-xxl-black/70">
          Hier zie je straks per categorie de 3 XXL-producten die het best bij je passen, met prijs per portie en de uitleg
          "Past bij jou omdat…".
        </p>
      </ComingSoon>
      <Link
        to="/ontdek"
        className="flex min-h-14 items-center justify-center rounded-md bg-xxl-red text-sm font-extrabold text-xxl-white uppercase"
      >
        Bekijk alle XXL-producten
      </Link>
      <p className="text-xs leading-relaxed text-xxl-black/60">{DISCLAIMER}</p>
    </div>
  );
}

export function Orders() {
  const [tab, setTab] = useState<'lopend' | 'eerder'>('lopend');
  return (
    <div className="space-y-4 p-4">
      <PageTitle>Bestellingen</PageTitle>
      <div className="grid grid-cols-2 rounded-md bg-xxl-white p-1" role="tablist">
        {(
          [
            ['lopend', 'Lopend'],
            ['eerder', 'Eerder besteld'],
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
      {tab === 'lopend' ? (
        <ComingSoon title="Lopende bestellingen" step="bouwstap 7">
          <p className="mt-2 text-sm text-xxl-black/70">Je ziet hier straks je verwachte leverdatum en de status van je bestelling.</p>
        </ComingSoon>
      ) : (
        <ComingSoon title="Bestelhistorie" step="bouwstap 7" />
      )}
    </div>
  );
}

const PAYMENT_METHODS = ['iDEAL', 'Mastercard', 'Amex', 'Klarna', 'SEPA', 'Apple Pay', 'Google Pay', 'PayPal', 'Bancontact'];

export function Profile() {
  return (
    <div className="space-y-4 p-4">
      <PageTitle>Profiel</PageTitle>
      <ComingSoon title="Mijn voorkeuren" step="bouwstap 8" />
      <ComingSoon title="Smaaktest opnieuw doen" step="bouwstap 8" />
      <ComingSoon title="Account & privacy" step="bouwstap 3" />

      <footer className="space-y-4 rounded-lg bg-xxl-black p-5 text-sm text-xxl-white">
        <div>
          <h2 className="text-xs font-extrabold tracking-wider uppercase">Klantenservice XXL Nutrition</h2>
          <p className="mt-1 text-xxl-white/80">Werkdagen 08:00–22:00</p>
          <p className="text-xxl-white/80">Weekend 12:00–16:00</p>
        </div>
        <div>
          <h2 className="text-xs font-extrabold tracking-wider uppercase">Betaalmethoden</h2>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {PAYMENT_METHODS.map((m) => (
              <li key={m} className="rounded bg-xxl-white px-2 py-1 text-[11px] font-bold text-xxl-black">
                {m}
              </li>
            ))}
          </ul>
        </div>
        <p className="border-t border-xxl-white/20 pt-3 text-xs text-xxl-white/60">{CONCEPT_LABEL}</p>
      </footer>
    </div>
  );
}
