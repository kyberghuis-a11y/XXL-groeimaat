import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ComingSoon, PageTitle } from '../components/Layout';
import { useAuth } from '../auth/AuthContext';
import { AccountSection } from './Account';
import { useProfile } from '../profile/ProfileContext';
import { QUESTIONS, answerLabel, firstUnanswered } from '../profile/questions';
import { CONCEPT_LABEL, DISCLAIMER, FLAVOR_FAMILY_LABELS } from '../lib/format';
import { firstOpenQuestion } from '../lib/questionFlow';
import { TASTE_QUESTIONS } from '../taste/questions';
import { useTaste } from '../taste/TasteContext';
import { personaTitle } from '../taste/tasteProfile';
import { startAdvice, useFamilySuggestions } from './TasteScreens';
import { AdviceList } from '../components/AdviceList';
import { useAdvice } from '../recommend/useAdvice';

export function Home() {
  const { user } = useAuth();
  const { loading } = useProfile();
  return (
    <div className="space-y-4 p-4">
      <PageTitle>{user?.name ? `Hoi ${user.name}` : 'Jouw advies'}</PageTitle>
      {!loading && <OnboardingCard />}
      <AdviceSection />
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

/** Het advies: per categorie de top 3 (bouwstap 6). */
function AdviceSection() {
  const advice = useAdvice();
  if (advice.status !== 'ready') return null;
  if (advice.groups.length === 0)
    return (
      <section className="rounded-lg bg-xxl-white p-5" role="status">
        <h2 className="text-base font-extrabold uppercase">Nog geen passend advies</h2>
        <p className="mt-1 text-sm text-xxl-black/80">
          We vinden nu geen XXL-product dat bij al je antwoorden past. Dat kan komen door je voeding, je leeftijd of smaken die je niet lust.
          Bekijk alle producten in Ontdek, of pas je antwoorden later aan via Profiel.
        </p>
      </section>
    );
  return (
    <section aria-labelledby="advice-title" className="space-y-3">
      <h2 id="advice-title" className="sr-only">
        Jouw advies
      </h2>
      <AdviceList groups={advice.groups} />
    </section>
  );
}

function CallToAction({ title, text, to, button }: { title: string; text: string; to: string; button: string }) {
  return (
    <section className="rounded-lg bg-xxl-black p-5 text-xxl-white">
      <h2 className="text-base font-extrabold uppercase">{title}</h2>
      <p className="mt-1 text-sm text-xxl-white/80">{text}</p>
      <Link to={to} className="mt-4 flex min-h-12 items-center justify-center rounded-md bg-xxl-red text-sm font-extrabold uppercase">
        {button}
      </Link>
    </section>
  );
}

const vragen = (n: number) => `${n} korte ${n === 1 ? 'vraag' : 'vragen'}`;

/** Home: wat is de volgende stap in de onboarding? Of, als alles klaar is, je smaakprofiel. */
function OnboardingCard() {
  const { answers } = useProfile();
  const taste = useTaste();
  const suggestions = useFamilySuggestions(taste.profile);
  if (taste.loading) return null;

  const nextProfile = firstUnanswered(answers);
  if (nextProfile !== null)
    return (
      <CallToAction
        title="Maak je profiel af"
        text={`Nog ${vragen(QUESTIONS.length - nextProfile + 1)}. Daarna kunnen we je advies geven.`}
        to={`/onboarding/2/${nextProfile}`}
        button="Verder met de vragen"
      />
    );
  const nextTaste = firstOpenQuestion(TASTE_QUESTIONS, taste.answers as unknown as Record<string, unknown>);
  if (nextTaste !== null || !taste.profile || !suggestions)
    return (
      <CallToAction
        title="Doe de smaaktest"
        text={`Nog ${vragen(TASTE_QUESTIONS.length - (nextTaste ?? 1) + 1)} over wat je lekker vindt. Zo kiezen we de smaak die bij je past.`}
        to={`/onboarding/3/${nextTaste ?? 1}`}
        button={nextTaste === 1 ? 'Start de smaaktest' : 'Verder met de smaaktest'}
      />
    );
  const advice = startAdvice(taste.profile, suggestions);
  return (
    <section className="rounded-lg bg-xxl-white p-5" aria-labelledby="persona-title">
      <p className="text-xs font-extrabold tracking-wider text-xxl-red uppercase">Jouw smaakprofiel</p>
      <h2 id="persona-title" className="mt-1 text-lg leading-tight font-black">
        {personaTitle(taste.profile)}
      </h2>
      {advice && <p className="mt-1 text-sm">Begin met {advice}.</p>}
      <Link to="/onboarding/4" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4">
        Bekijk je smaakprofiel
      </Link>
    </section>
  );
}

/** Profiel: korte samenvatting van het smaakprofiel. */
function MyTaste() {
  const taste = useTaste();
  if (taste.loading) return null;
  return (
    <section className="rounded-lg bg-xxl-white p-5" aria-labelledby="taste-title">
      <h2 id="taste-title" className="text-base font-extrabold uppercase">
        Mijn smaakprofiel
      </h2>
      {taste.profile ? (
        <>
          <p className="mt-2 font-bold">{personaTitle(taste.profile)}</p>
          <p className="mt-1 text-sm">Top 3: {taste.profile.top_families.map((f) => FLAVOR_FAMILY_LABELS[f]).join(', ')}</p>
          <Link to="/onboarding/4" className="mt-2 inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4">
            Bekijk je smaakprofiel
          </Link>
          <p className="text-xs text-xxl-black/60">De smaaktest opnieuw doen komt in een volgende stap (bouwstap 8).</p>
        </>
      ) : (
        <p className="mt-2 text-sm text-xxl-black/70">Je hebt de smaaktest nog niet gedaan.</p>
      )}
    </section>
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
      <MyTaste />
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
