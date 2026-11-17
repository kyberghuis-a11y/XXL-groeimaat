import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckIcon } from '../components/Icons';
import { PageTitle } from '../components/Layout';
import { CONCEPT_LABEL, FLAVOR_FAMILY_LABELS } from '../lib/format';
import { firstOpenQuestion, optionLabel, type FlowQuestion } from '../lib/questionFlow';
import { PAYMENT_METHODS } from '../orders/types';
import { useProfile } from '../profile/ProfileContext';
import { QUESTIONS } from '../profile/questions';
import { TASTE_QUESTIONS } from '../taste/questions';
import { useTaste } from '../taste/TasteContext';
import { personaTitle } from '../taste/tasteProfile';
import { AccountSection } from './Account';

/** Lijst met antwoorden; elke regel opent het aanpasscherm voor die vraag. */
function AnswerList({ questions, answers }: { questions: FlowQuestion[]; answers: Record<string, unknown> }) {
  return (
    <ul className="mt-3 divide-y divide-xxl-black/10 border-y border-xxl-black/10">
      {questions.map((q) => (
        <li key={q.key}>
          <Link
            to={`/profiel/aanpassen/${q.key}`}
            className="flex min-h-12 items-center justify-between gap-3 py-2 text-sm hover:bg-xxl-grey/60"
            aria-label={`${q.topic === 'Smaaktest' ? q.title : q.topic}: ${optionLabel(q, answers[q.key])}. Wijzig`}
          >
            <span className="min-w-0">
              <span className="block font-semibold">{q.topic === 'Smaaktest' ? q.title : q.topic}</span>
              <span className="block text-xxl-black/70">{optionLabel(q, answers[q.key])}</span>
            </span>
            <span className="shrink-0 text-xs font-extrabold text-xxl-red uppercase underline underline-offset-2">Wijzig</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Profielvragen + leeftijd. */
function MyAnswers() {
  const { answers, loading } = useProfile();
  if (loading) return null;
  const record = answers as unknown as Record<string, unknown>;
  const next = firstOpenQuestion(QUESTIONS, record);
  return (
    <section className="rounded-lg bg-xxl-white p-5" aria-labelledby="answers-title">
      <h2 id="answers-title" className="text-base font-extrabold uppercase">
        Mijn voorkeuren
      </h2>
      {next !== null ? (
        <Link to={`/onboarding/2/${next}`} className="mt-4 flex min-h-12 items-center justify-center rounded-md bg-xxl-red text-sm font-extrabold text-xxl-white uppercase">
          Vragen afmaken
        </Link>
      ) : (
        <>
          <p className="mt-1 text-sm text-xxl-black/70">Pas een antwoord aan; je advies wordt direct opnieuw berekend.</p>
          <AnswerList questions={QUESTIONS} answers={record} />
        </>
      )}
    </section>
  );
}

/** Smaakprofiel + smaakvragen. */
function MyTaste() {
  const taste = useTaste();
  const { answers } = useProfile();
  const [open, setOpen] = useState(false);
  if (taste.loading) return null;
  const profileDone = firstOpenQuestion(QUESTIONS, answers as unknown as Record<string, unknown>) === null;
  return (
    <section className="rounded-lg bg-xxl-white p-5" aria-labelledby="taste-title">
      <h2 id="taste-title" className="text-base font-extrabold uppercase">
        Mijn smaakprofiel
      </h2>
      {taste.profile ? (
        <>
          <p className="mt-2 font-bold">{personaTitle(taste.profile)}</p>
          <p className="mt-1 text-sm">Top {taste.profile.top_families.length}: {taste.profile.top_families.map((f) => FLAVOR_FAMILY_LABELS[f]).join(', ')}</p>
          <div className="mt-3 grid gap-2">
            <Link to="/onboarding/3/1" className="flex min-h-12 items-center justify-center rounded-md bg-xxl-red px-3 text-center text-sm font-extrabold text-xxl-white uppercase">
              Smaaktest opnieuw doen
            </Link>
            <Link to="/onboarding/4" className="flex min-h-12 items-center justify-center rounded-md border-2 border-xxl-black px-3 text-center text-sm font-extrabold uppercase">
              Bekijk je smaakprofiel
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-3 flex min-h-11 w-full items-center justify-between text-sm font-bold"
          >
            Eén antwoord aanpassen
            <span aria-hidden="true">{open ? '−' : '+'}</span>
          </button>
          {open && <AnswerList questions={TASTE_QUESTIONS} answers={taste.answers as unknown as Record<string, unknown>} />}
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-xxl-black/70">Je hebt de smaaktest nog niet gedaan.</p>
          {profileDone && (
            <Link to="/onboarding/3" className="mt-3 flex min-h-12 items-center justify-center rounded-md bg-xxl-red text-sm font-extrabold text-xxl-white uppercase">
              Doe de smaaktest
            </Link>
          )}
        </>
      )}
    </section>
  );
}

export function Profile() {
  // Bevestiging na het aanpassen van een antwoord: één keer tonen, niet opnieuw na verversen.
  const location = useLocation();
  const navigate = useNavigate();
  const [saved] = useState(() => (location.state as { saved?: string } | null)?.saved);
  useEffect(() => {
    if (saved) navigate(location.pathname, { replace: true, state: null });
  }, [saved, navigate, location.pathname]);

  return (
    <div className="space-y-4 p-4">
      <PageTitle>Profiel</PageTitle>
      {saved && (
        <p role="status" className="flex gap-2 rounded-md bg-xxl-white p-3 text-sm ring-2 ring-xxl-black">
          <CheckIcon size={18} className="mt-0.5 shrink-0 text-xxl-red" />
          <span>
            <strong>Opgeslagen.</strong> Je advies is direct bijgewerkt.{' '}
            <Link to="/home" className="font-bold underline underline-offset-2">
              Bekijk je advies
            </Link>
          </span>
        </p>
      )}
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
