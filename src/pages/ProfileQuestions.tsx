import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { FormError } from '../components/Form';
import { BackIcon, CheckIcon } from '../components/Icons';
import { useProfile } from '../profile/ProfileContext';
import { NONE, QUESTIONS, firstUnanswered, toggleDiet } from '../profile/questions';
import type { Diet, ProfileAnswers } from '../profile/types';
import { ProgressBar, STEPS } from './Onboarding';

const AUTO_ADVANCE_MS = 250;

/** Onboarding stap 2: één profielvraag per scherm (/onboarding/2/:q). */
export function ProfileQuestions() {
  const { q: param } = useParams();
  const { user, loading: authLoading } = useAuth();
  const { answers, loading } = useProfile();
  const location = useLocation();

  if (!authLoading && !user) return <Navigate to="/inloggen" replace state={{ from: location.pathname }} />;
  if (authLoading || loading) return <p className="p-6 text-center text-sm text-xxl-black/60">Even laden…</p>;

  // Niet verder springen dan de eerste onbeantwoorde vraag. Alles ingevuld? Dan naar de laatste vraag.
  const maxAllowed = firstUnanswered(answers) ?? QUESTIONS.length;
  const q = Number(param);
  if (!param || !Number.isInteger(q) || q < 1 || q > maxAllowed) return <Navigate to={`/onboarding/2/${maxAllowed}`} replace />;

  // key: elke vraag start met een schone staat.
  return <QuestionScreen key={q} index={q - 1} answers={answers} />;
}

function QuestionScreen({ index, answers }: { index: number; answers: ProfileAnswers }) {
  const question = QUESTIONS[index];
  const { save } = useProfile();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<string | boolean | null>(null); // net getikt, voor de korte highlight
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Voeding (meerkeuze): lokaal bijhouden tot "Volgende".
  const [diet, setDiet] = useState<Diet[]>(answers.diet ?? []);
  const [dietNone, setDietNone] = useState<boolean>(answers.diet !== null && answers.diet.length === 0);

  const isLast = index === QUESTIONS.length - 1;
  const nextPath = isLast ? '/onboarding/3' : `/onboarding/2/${index + 2}`;
  const backPath = index === 0 ? '/onboarding/1' : `/onboarding/2/${index}`;
  const current = answers[question.key];
  const answered = question.multi ? dietNone || diet.length > 0 : current !== null;

  async function persist(patch: Partial<ProfileAnswers>): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      await save(patch);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Opslaan mislukt. Probeer het opnieuw.');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function chooseSingle(value: string | boolean) {
    if (saving) return;
    setPending(value);
    const ok = await persist({ [question.key]: value } as Partial<ProfileAnswers>);
    if (!ok) {
      setPending(null);
      return;
    }
    timer.current = window.setTimeout(() => navigate(nextPath), AUTO_ADVANCE_MS);
  }

  async function submitMulti() {
    if (!answered || saving) return;
    if (await persist({ diet: dietNone ? [] : diet })) navigate(nextPath);
  }

  const isSelected = (value: string | boolean): boolean => {
    if (question.multi) return value === NONE ? dietNone : diet.includes(value as Diet);
    return pending !== null ? pending === value : current === value;
  };

  return (
    <div className="flex min-h-dvh flex-col bg-xxl-grey px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <ProgressBar step={2} total={STEPS.length} sub={{ current: index + 1, total: QUESTIONS.length }} />

      <div className="flex-1 py-8">
        <p className="text-xs font-extrabold tracking-wider text-xxl-red uppercase">{question.topic}</p>
        <h1 id="question-title" className="mt-1 text-2xl leading-tight font-black">
          {question.title}
        </h1>
        {question.help && <p className="mt-2 text-sm text-xxl-black/70">{question.help}</p>}

        <div
          className="mt-6 space-y-3"
          role={question.multi ? 'group' : 'radiogroup'}
          aria-labelledby="question-title"
        >
          {question.options.map((o) => {
            const selected = isSelected(o.value);
            return (
              <button
                key={String(o.value)}
                type="button"
                role={question.multi ? 'checkbox' : 'radio'}
                aria-checked={selected}
                disabled={saving && !question.multi}
                onClick={() => {
                  if (!question.multi) return void chooseSingle(o.value);
                  const next = toggleDiet(diet, o.value as Diet | typeof NONE, dietNone);
                  setDiet(next.diet);
                  setDietNone(next.none);
                }}
                className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-md border-2 px-4 text-left text-base font-bold transition ${
                  selected ? 'border-xxl-black bg-xxl-black text-xxl-white' : 'border-xxl-black/15 bg-xxl-white hover:border-xxl-black/50'
                }`}
              >
                {o.label}
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center border-2 ${question.multi ? 'rounded' : 'rounded-full'} ${
                    selected ? 'border-xxl-white bg-xxl-red' : 'border-xxl-black/30'
                  }`}
                  aria-hidden="true"
                >
                  {selected && <CheckIcon size={14} className="text-xxl-white" />}
                </span>
              </button>
            );
          })}
        </div>

        {question.key === 'is_adult' && current === false && pending === null && (
          <p className="mt-4 rounded-md bg-xxl-white p-3 text-sm">Goed dat je het zegt. We laten producten met cafeïne buiten je advies.</p>
        )}
        <div className="mt-4">
          <FormError message={error} />
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-3">
        <Link to={backPath} className="flex min-h-14 items-center gap-1 rounded-md border-2 border-xxl-black px-4 text-sm font-extrabold uppercase">
          <BackIcon size={18} />
          Terug
        </Link>
        {question.multi ? (
          <button
            type="button"
            onClick={submitMulti}
            disabled={!answered || saving}
            className="min-h-14 rounded-md bg-xxl-red text-base font-extrabold text-xxl-white uppercase disabled:opacity-40"
          >
            {saving ? 'Opslaan…' : isLast ? 'Naar de smaaktest' : 'Volgende'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate(nextPath)}
            disabled={!answered || saving}
            className="min-h-14 rounded-md bg-xxl-red text-base font-extrabold text-xxl-white uppercase disabled:opacity-40"
          >
            {saving ? 'Opslaan…' : isLast ? 'Naar de smaaktest' : 'Volgende'}
          </button>
        )}
      </div>
    </div>
  );
}
