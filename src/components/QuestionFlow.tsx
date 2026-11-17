// Algemeen vraagscherm voor de onboarding: één vraag per scherm, grote knoppen, voortgangsbalk.
// Gebruikt door de profielvragen (stap 2) en de smaaktest (stap 3).
import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ProgressBar, STEPS } from '../pages/Onboarding';
import { FormError } from './Form';
import { BackIcon, CheckIcon } from './Icons';
import { NONE, firstOpenQuestion, toggleMulti, type FlowOption, type FlowQuestion } from '../lib/questionFlow';

type Answers = Record<string, unknown>;

interface FlowProps {
  step: number; // onboardingstap (2 of 3)
  questions: FlowQuestion[];
  answers: Answers;
  save: (patch: Answers) => Promise<void>;
  basePath: string; // bijv. "/onboarding/3"
  prevPath: string; // waar TERUG op vraag 1 heen gaat
  nextPath: string; // na de laatste vraag
  lastLabel: string; // knoptekst op de laatste vraag
  /** Extra uitleg onder de opties, afhankelijk van het antwoord. */
  renderNote?: (key: string, value: unknown) => React.ReactNode;
}

/** Leest :q uit de route en bewaakt dat je niet verder springt dan de eerste open vraag. */
export function QuestionFlow(props: FlowProps) {
  const { q: param } = useParams();
  const maxAllowed = firstOpenQuestion(props.questions, props.answers) ?? props.questions.length;
  const q = Number(param);
  if (!param || !Number.isInteger(q) || q < 1 || q > maxAllowed) return <Navigate to={`${props.basePath}/${maxAllowed}`} replace />;
  return <QuestionScreen key={q} index={q - 1} {...props} />;
}

const AUTO_ADVANCE_MS = 250;

function QuestionScreen({ index, step, questions, answers, save, basePath, prevPath, nextPath, lastLabel, renderNote }: FlowProps & { index: number }) {
  const question = questions[index];
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<FlowOption['value'] | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const current = answers[question.key] ?? null;
  const [multi, setMulti] = useState<string[]>(Array.isArray(current) ? (current as string[]) : []);
  const [none, setNone] = useState<boolean>(Array.isArray(current) && current.length === 0);

  const isLast = index === questions.length - 1;
  const next = isLast ? nextPath : `${basePath}/${index + 2}`;
  const back = index === 0 ? prevPath : `${basePath}/${index}`;
  const answered = question.multi ? none || multi.length > 0 : current !== null;

  async function persist(patch: Answers): Promise<boolean> {
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

  async function chooseSingle(value: FlowOption['value']) {
    if (saving) return;
    setPending(value);
    if (!(await persist({ [question.key]: value }))) return setPending(null);
    timer.current = window.setTimeout(() => navigate(next), AUTO_ADVANCE_MS);
  }

  async function submitMulti() {
    if (!answered || saving) return;
    if (await persist({ [question.key]: none ? [] : multi })) navigate(next);
  }

  const isSelected = (value: FlowOption['value']) => {
    if (question.multi) return value === NONE ? none : multi.includes(value as string);
    return pending !== null ? pending === value : current === value;
  };

  return (
    <div className="flex min-h-dvh flex-col bg-xxl-grey px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <ProgressBar step={step} total={STEPS.length} sub={{ current: index + 1, total: questions.length }} />

      <div className="flex-1 py-8">
        <p className="text-xs font-extrabold tracking-wider text-xxl-red uppercase">{question.topic}</p>
        <h1 id="question-title" className="mt-1 text-2xl leading-tight font-black">
          {question.title}
        </h1>
        {question.help && <p className="mt-2 text-sm text-xxl-black/70">{question.help}</p>}

        <div className="mt-6 space-y-3" role={question.multi ? 'group' : 'radiogroup'} aria-labelledby="question-title">
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
                  const t = toggleMulti(multi, o.value as string, none);
                  setMulti(t.values);
                  setNone(t.none);
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

        {pending === null && renderNote?.(question.key, current)}
        <div className="mt-4">
          <FormError message={error} />
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-3">
        <Link to={back} className="flex min-h-14 items-center gap-1 rounded-md border-2 border-xxl-black px-4 text-sm font-extrabold uppercase">
          <BackIcon size={18} />
          Terug
        </Link>
        <button
          type="button"
          onClick={question.multi ? submitMulti : () => navigate(next)}
          disabled={!answered || saving}
          className="min-h-14 rounded-md bg-xxl-red text-base font-extrabold text-xxl-white uppercase disabled:opacity-40"
        >
          {saving ? 'Opslaan…' : isLast ? lastLabel : 'Volgende'}
        </button>
      </div>
    </div>
  );
}
