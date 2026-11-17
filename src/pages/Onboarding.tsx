import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { SignUpForm } from './Account';
import { ComingSoon } from '../components/Layout';
import { BackIcon } from '../components/Icons';
import { DISCLAIMER } from '../lib/format';

export const STEPS = [
  {
    title: 'Welkom & account',
    intro: 'Maak een account aan. Zo bewaren we je antwoorden en je advies.',
    buildStep: 'bouwstap 3',
  },
  {
    title: 'Over jou',
    intro: 'Korte vragen over je sport, je doel, je dag, je voeding en je budget.',
    buildStep: 'bouwstap 4',
  },
  {
    title: 'Smaaktest',
    intro: '7 vragen over wat je lekker vindt. Zo weten we welke XXL-smaken bij je passen.',
    buildStep: 'bouwstap 5',
  },
  {
    title: 'Jouw smaakprofiel',
    intro: 'Je ziet je top 3 smaakfamilies, vertaald naar echte XXL-smaken.',
    buildStep: 'bouwstap 5',
  },
] as const;

/** Voortgang over de hele onboarding. `sub` = vraag x van y binnen een stap. */
export function ProgressBar({ step, total, sub }: { step: number; total: number; sub?: { current: number; total: number } }) {
  const done = sub ? step - 1 + sub.current / sub.total : step;
  const pct = Math.round((done / total) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-bold uppercase">
        <span>
          Stap {step} van {total}
          {sub && ` · Vraag ${sub.current} van ${sub.total}`}
        </span>
        <span>{pct}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-xxl-black/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={step}
        aria-label="Voortgang onboarding"
      >
        <div className="h-full rounded-full bg-xxl-red transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Onboarding() {
  const { step: param } = useParams();
  const step = Number(param);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  if (!Number.isInteger(step) || step < 1 || step > STEPS.length) return <Navigate to="/onboarding/1" replace />;
  // Stap 2 t/m 4 alleen met een account.
  if (step > 1 && !loading && !user) return <Navigate to="/inloggen" replace state={{ from: location.pathname }} />;
  // Let op: /onboarding/2, /3 en /4 hebben eigen routes (ProfileQuestions, TasteScreens).

  const current = STEPS[step - 1];
  const isLast = step === STEPS.length;
  const back = step === 1 ? '/' : `/onboarding/${step - 1}`;
  const next = isLast ? '/home' : `/onboarding/${step + 1}`;
  const isAccountStep = step === 1;

  return (
    <div className="flex min-h-dvh flex-col bg-xxl-grey px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <ProgressBar step={step} total={STEPS.length} />

      <div className="flex-1 py-8">
        <h1 className="text-2xl font-black uppercase">{isAccountStep && user ? 'Je account' : current.title}</h1>
        {isAccountStep ? (
          user ? (
            <p className="mt-2 text-base text-xxl-black/80">
              Je bent ingelogd als <strong>{user.name}</strong> ({user.email}). Ga verder met de vragen.
            </p>
          ) : (
            <>
              <p className="mt-2 mb-6 text-base text-xxl-black/80">{current.intro}</p>
              <SignUpForm onDone={() => navigate('/onboarding/2')} />
            </>
          )
        ) : (
          <>
            <p className="mt-2 text-base text-xxl-black/80">{current.intro}</p>
            <div className="mt-6">
              <ComingSoon title="Vragen volgen" step={current.buildStep} />
            </div>
          </>
        )}
        {isAccountStep && <p className="mt-6 text-xs leading-relaxed text-xxl-black/60">{DISCLAIMER}</p>}
      </div>

      {/* Bij stap 1 zonder account is "Account aanmaken" de volgende-knop. */}
      {isAccountStep && !user ? (
        <Link to={back} className="flex min-h-14 items-center justify-center gap-1 rounded-md border-2 border-xxl-black px-4 text-sm font-extrabold uppercase">
          <BackIcon size={18} />
          Terug
        </Link>
      ) : (
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <Link
          to={back}
          className="flex min-h-14 items-center gap-1 rounded-md border-2 border-xxl-black px-4 text-sm font-extrabold uppercase"
        >
          <BackIcon size={18} />
          Terug
        </Link>
        <Link
          to={next}
          className="flex min-h-14 items-center justify-center rounded-md bg-xxl-red text-base font-extrabold text-xxl-white uppercase"
        >
          {isLast ? 'Naar mijn advies' : 'Volgende'}
        </Link>
      </div>
      )}
    </div>
  );
}
