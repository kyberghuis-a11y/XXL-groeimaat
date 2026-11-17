import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ComingSoon, PageTitle } from '../components/Layout';
import { useAuth } from '../auth/AuthContext';
import { AccountSection } from './Account';
import { useProfile } from '../profile/ProfileContext';
import { QUESTIONS, answerLabel, firstUnanswered } from '../profile/questions';
import { CONCEPT_LABEL, DISCLAIMER } from '../lib/format';

export function Home() {
  const { user } = useAuth();
  const { answers, loading } = useProfile();
  const next = firstUnanswered(answers);
  return (
    <div className="space-y-4 p-4">
      <PageTitle>{user?.name ? `Hoi ${user.name}` : 'Jouw advies'}</PageTitle>
      {!loading && next !== null && (
        <section className="rounded-lg bg-xxl-black p-5 text-xxl-white">
          <h2 className="text-base font-extrabold uppercase">Maak je profiel af</h2>
          <p className="mt-1 text-sm text-xxl-white/80">
            Nog {QUESTIONS.length - next + 1} korte {QUESTIONS.length - next + 1 === 1 ? 'vraag' : 'vragen'}. Daarna kunnen we je advies geven.
          </p>
          <Link
            to={`/onboarding/2/${next}`}
            className="mt-4 flex min-h-12 items-center justify-center rounded-md bg-xxl-red text-sm font-extrabold uppercase"
          >
            Verder met de vragen
          </Link>
        </section>
      )}
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

/** Overzicht van de onboarding-antwoorden. Aanpassen komt in bouwstap 8. */
function MyAnswers() {
  const { answers, loading } = useProfile();
  if (loading) return null;
  const next = firstUnanswered(answers);
  return (
    <section className="rounded-lg bg-xxl-white p-5" aria-labelledby="answers-title">
      <h2 id="answers-title" className="text-base font-extrabold uppercase">
        Mijn voorkeuren
      </h2>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {QUESTIONS.map((q) => (
          <div key={q.key} className="contents">
            <dt className="font-semibold">{q.topic}</dt>
            <dd>{answerLabel(q, answers)}</dd>
          </div>
        ))}
      </dl>
      {next !== null ? (
        <Link to={`/onboarding/2/${next}`} className="mt-4 flex min-h-12 items-center justify-center rounded-md bg-xxl-red text-sm font-extrabold text-xxl-white uppercase">
          Vragen afmaken
        </Link>
      ) : (
        <p className="mt-3 text-xs text-xxl-black/60">Je antwoorden aanpassen komt in een volgende stap (bouwstap 8).</p>
      )}
    </section>
  );
}

const PAYMENT_METHODS = ['iDEAL', 'Mastercard', 'Amex', 'Klarna', 'SEPA', 'Apple Pay', 'Google Pay', 'PayPal', 'Bancontact'];

export function Profile() {
  return (
    <div className="space-y-4 p-4">
      <PageTitle>Profiel</PageTitle>
      <MyAnswers />
      <ComingSoon title="Smaaktest opnieuw doen" step="bouwstap 8" />
      <AccountSection />

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
