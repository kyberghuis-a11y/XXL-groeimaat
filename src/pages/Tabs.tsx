import { Link } from 'react-router-dom';
import { PageTitle } from '../components/Layout';
import { useAuth } from '../auth/AuthContext';
import { useProfile } from '../profile/ProfileContext';
import { QUESTIONS, firstUnanswered } from '../profile/questions';
import { DISCLAIMER } from '../lib/format';
import { firstOpenQuestion } from '../lib/questionFlow';
import { TASTE_QUESTIONS } from '../taste/questions';
import { useTaste } from '../taste/TasteContext';
import { personaTitle } from '../taste/tasteProfile';
import { startAdvice, useFamilySuggestions } from '../taste/advice';
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
      <p className="text-xs leading-relaxed text-xxl-black/70">{DISCLAIMER}</p>
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
