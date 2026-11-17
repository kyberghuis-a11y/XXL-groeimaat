import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { QuestionFlow } from '../components/QuestionFlow';
import { useProfile } from '../profile/ProfileContext';
import { QUESTIONS } from '../profile/questions';
import type { ProfileAnswers } from '../profile/types';

/** Onboarding stap 2: leeftijd + 8 profielvragen, één per scherm (/onboarding/2/:q). */
export function ProfileQuestions() {
  const { user, loading: authLoading } = useAuth();
  const { answers, loading, save } = useProfile();
  const location = useLocation();

  if (!authLoading && !user) return <Navigate to="/inloggen" replace state={{ from: location.pathname }} />;
  if (authLoading || loading) return <p className="p-6 text-center text-sm text-xxl-black/60">Even laden…</p>;

  return (
    <QuestionFlow
      step={2}
      questions={QUESTIONS}
      answers={answers as unknown as Record<string, unknown>}
      save={(patch) => save(patch as Partial<ProfileAnswers>)}
      basePath="/onboarding/2"
      prevPath="/onboarding/1"
      nextPath="/onboarding/3"
      lastLabel="Naar de smaaktest"
      renderNote={(key, value) =>
        key === 'is_adult' && value === false ? (
          <p className="mt-4 rounded-md bg-xxl-white p-3 text-sm">Goed dat je het zegt. We laten producten met cafeïne buiten je advies.</p>
        ) : null
      }
    />
  );
}
