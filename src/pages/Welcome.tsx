import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Logo } from '../components/Layout';
import { CONCEPT_LABEL, DISCLAIMER } from '../lib/format';

export function Welcome() {
  const { user, loading } = useAuth();
  const deleted = Boolean((useLocation().state as { deleted?: boolean } | null)?.deleted);
  if (!loading && user) return <Navigate to="/home" replace />;

  return (
    <div className="flex min-h-dvh flex-col bg-xxl-black px-6 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] text-xxl-white">
      <p className="self-start border border-xxl-white/40 px-2 py-1 text-[11px] font-bold tracking-wide uppercase">{CONCEPT_LABEL}</p>

      <div className="flex flex-1 flex-col justify-center py-10">
        <Logo className="text-4xl" />
        <p className="mt-3 text-sm font-bold tracking-[0.2em] text-xxl-red uppercase">Beyond your limits</p>
        <h1 className="mt-8 text-3xl leading-tight font-black">
          Weet binnen 3 minuten welk XXL-product en welke smaak bij jou past.
        </h1>
        <p className="mt-4 text-base text-xxl-white/80">
          Beantwoord een paar korte vragen over je sport, je doel en wat je lekker vindt. Je krijgt dan advies uit het assortiment van XXL Nutrition, in gewone taal.
        </p>
      </div>

      <div className="space-y-4">
        {deleted && (
          <p role="status" className="rounded-md bg-xxl-white p-3 text-sm font-semibold text-xxl-black">
            Je account en gegevens zijn verwijderd.
          </p>
        )}
        <Link
          to="/onboarding/1"
          className="flex min-h-14 w-full items-center justify-center rounded-md bg-xxl-red text-base font-extrabold tracking-wide uppercase"
        >
          Start
        </Link>
        <div className="flex justify-center gap-6 text-sm font-semibold text-xxl-white/80">
          <Link to="/inloggen" className="flex min-h-11 items-center underline underline-offset-4">
            Inloggen
          </Link>
          <Link to="/ontdek" className="flex min-h-11 items-center underline underline-offset-4">
            Eerst rondkijken
          </Link>
        </div>
        <p className="text-xs leading-relaxed text-xxl-white/60">{DISCLAIMER}</p>
        <p className="text-xs leading-relaxed text-xxl-white/60">
          XXL Groeimaat beveelt alleen producten van XXL Nutrition aan. Het is geen onafhankelijke vergelijking.
        </p>
      </div>
    </div>
  );
}
