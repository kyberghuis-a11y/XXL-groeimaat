import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { BackIcon } from '../components/Icons';
import { QuestionFlow } from '../components/QuestionFlow';
import { getProductLine, getProductLines } from '../data/catalog';
import { isAllowed, type HardRuleInput } from '../recommend/rules';
import type { FlavorFamily } from '../data/types';
import { DISCLAIMER, FLAVOR_FAMILY_LABELS } from '../lib/format';
import { optionLabel } from '../lib/questionFlow';
import { useProfile } from '../profile/ProfileContext';
import { isProfileComplete } from '../profile/questions';
import { TASTE_QUESTIONS, type TasteAnswers } from '../taste/questions';
import { suggestFlavors, suggestionSentence, type FlavorSuggestion } from '../taste/suggestions';
import { useTaste } from '../taste/TasteContext';
import { MAX_SCORE, personaTitle, rankFamilies, type TasteProfile } from '../taste/tasteProfile';
import { ProgressBar, STEPS } from './Onboarding';

const Loading = () => <p className="p-6 text-center text-sm text-xxl-black/60">Even laden…</p>;

/** Bewaakt de volgorde: eerst account, dan profielvragen, dan smaaktest. */
function useOnboardingGuard(): React.ReactElement | null {
  const { user, loading: authLoading } = useAuth();
  const profile = useProfile();
  const taste = useTaste();
  const location = useLocation();
  if (!authLoading && !user) return <Navigate to="/inloggen" replace state={{ from: location.pathname }} />;
  if (authLoading || profile.loading || taste.loading) return <Loading />;
  if (!isProfileComplete(profile.answers)) return <Navigate to="/onboarding/2" replace />;
  return null;
}

/** Onboarding stap 3: 7 smaakvragen (/onboarding/3/:q). */
export function TasteQuestions() {
  const guard = useOnboardingGuard();
  const { answers, save } = useTaste();
  if (guard) return guard;
  return (
    <QuestionFlow
      step={3}
      questions={TASTE_QUESTIONS}
      answers={answers as unknown as Record<string, unknown>}
      save={(patch) => save(patch as Partial<TasteAnswers>)}
      basePath="/onboarding/3"
      prevPath="/onboarding/2"
      nextPath="/onboarding/4"
      lastLabel="Bekijk mijn smaakprofiel"
    />
  );
}

/** Concrete XXL-smaken per familie, rekening houdend met de harde regels (dieet, 18+). */
export function useFamilySuggestions(profile: TasteProfile | null): Record<FlavorFamily, FlavorSuggestion[]> | null {
  const { answers } = useProfile();
  if (!profile) return null;
  const lines = getProductLines();
  return Object.fromEntries(
    rankFamilies(profile.scores).map((f) => [f, suggestFlavors(f, profile, answers, lines)]),
  ) as Record<FlavorFamily, FlavorSuggestion[]>;
}

/** "Begin met …": de beste smaak uit je nummer 1 en nummer 2 familie. */
export function startAdvice(profile: TasteProfile, suggestions: Record<FlavorFamily, FlavorSuggestion[]>): string | null {
  const [first, second] = profile.top_families;
  const picks = [suggestions[first]?.[0], (second && suggestions[second]?.[0]) || suggestions[first]?.[1]].filter(
    (x): x is FlavorSuggestion => Boolean(x),
  );
  return suggestionSentence(picks);
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-xxl-black/10"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={MAX_SCORE}
        aria-valuenow={score}
        aria-label={`Score ${score} van ${MAX_SCORE}`}
      >
        <div className="h-full rounded-full bg-xxl-red" style={{ width: `${(score / MAX_SCORE) * 100}%` }} />
      </div>
      <span className="w-10 text-right text-xs font-bold">
        {score}/{MAX_SCORE}
      </span>
    </div>
  );
}

/** Tips uit de brief; producten worden alleen genoemd als ze bij jouw voeding en leeftijd passen. */
export function beginnerTips(mixWith: TasteProfile['mix_with'], rules: HardRuleInput): string[] {
  const allowed = (id: string) => {
    const line = getProductLine(id);
    return Boolean(line && isAllowed(line, rules));
  };
  const tips = [
    allowed('whey-delicious')
      ? 'Twijfel je? Begin met het kleinste formaat (bijvoorbeeld Whey Delicious 450 g) of met samples.'
      : 'Twijfel je? Begin met het kleinste formaat of met samples.',
    'Chocolade en vanille zijn de veiligste smaken om mee te beginnen.',
  ];
  if (mixWith === 'water' && allowed('clear-whey-isolate'))
    tips.push('Drink je je shake met water? Dan vind je Clear Whey vaak lekkerder dan een romige whey.');
  return tips;
}

/** Onboarding stap 4: jouw smaakprofiel. */
export function TasteResult() {
  const guard = useOnboardingGuard();
  const { profile, answers } = useTaste();
  const { answers: profileAnswers } = useProfile();
  const suggestions = useFamilySuggestions(profile);
  if (guard) return guard;
  if (!profile || !suggestions) return <Navigate to="/onboarding/3" replace />;

  const advice = startAdvice(profile, suggestions);
  const dislikeQuestion = TASTE_QUESTIONS.find((q) => q.key === 'dislikes')!;
  const tips = beginnerTips(profile.mix_with, profileAnswers);

  return (
    <div className="flex min-h-dvh flex-col bg-xxl-grey px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <ProgressBar step={4} total={STEPS.length} />

      <div className="flex-1 space-y-5 py-8">
        <div>
          <p className="text-xs font-extrabold tracking-wider text-xxl-red uppercase">Jouw smaakprofiel</p>
          <h1 className="mt-1 text-2xl leading-tight font-black">{personaTitle(profile)}</h1>
          {advice && (
            <p className="mt-2 text-base">
              Begin met <strong>{advice}</strong>.
            </p>
          )}
        </div>

        <section className="rounded-lg bg-xxl-white p-5" aria-labelledby="top3-title">
          <h2 id="top3-title" className="text-sm font-extrabold tracking-wider uppercase">
            Jouw top {profile.top_families.length} smaken
          </h2>
          <ol className="mt-3 space-y-5">
            {profile.top_families.map((family, i) => (
              <li key={family}>
                <p className="flex items-baseline gap-2 font-extrabold">
                  <span className="text-xxl-red">{i + 1}.</span> {FLAVOR_FAMILY_LABELS[family]}
                </p>
                <div className="mt-1">
                  <ScoreBar score={profile.scores[family]} />
                </div>
                {suggestions[family].length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {suggestions[family].map((s) => (
                      <li key={`${s.line.id}-${s.flavor.name}`}>
                        <Link to={`/product/${s.line.id}`} className="underline underline-offset-2">
                          {s.line.name} {s.flavor.name.toLowerCase()}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-xxl-black/60">Nog geen XXL-smaak in deze familie die bij jouw voeding past.</p>
                )}
              </li>
            ))}
          </ol>

          <details className="mt-5 text-sm">
            <summary className="min-h-11 cursor-pointer py-2 font-bold">Alle scores bekijken</summary>
            <dl className="mt-2 space-y-2">
              {rankFamilies(profile.scores).map((f) => (
                <div key={f}>
                  <dt className="text-xs font-semibold">{FLAVOR_FAMILY_LABELS[f]}</dt>
                  <dd>
                    <ScoreBar score={profile.scores[f]} />
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        </section>

        {profile.excluded_flavors.length > 0 && (
          <p className="rounded-md bg-xxl-white p-4 text-sm">
            <strong>Raden we nooit aan:</strong> {optionLabel(dislikeQuestion, answers.dislikes)}.
          </p>
        )}

        <section className="rounded-lg bg-xxl-black p-5 text-xxl-white" aria-labelledby="tips-title">
          <h2 id="tips-title" className="text-sm font-extrabold tracking-wider uppercase">
            Tips voor beginners
          </h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-xxl-white/90">
            {tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        <p className="text-xs leading-relaxed text-xxl-black/60">{DISCLAIMER}</p>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-3">
        <Link to="/onboarding/3/7" className="flex min-h-14 items-center gap-1 rounded-md border-2 border-xxl-black px-4 text-sm font-extrabold uppercase">
          <BackIcon size={18} />
          Terug
        </Link>
        <Link to="/home" className="flex min-h-14 items-center justify-center rounded-md bg-xxl-red text-base font-extrabold text-xxl-white uppercase">
          Naar mijn advies
        </Link>
      </div>
    </div>
  );
}
