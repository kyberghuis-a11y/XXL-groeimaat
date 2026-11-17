import { Navigate, useParams } from 'react-router-dom';
import { EditQuestion } from '../components/QuestionFlow';
import { useProfile } from '../profile/ProfileContext';
import { QUESTIONS } from '../profile/questions';
import type { ProfileAnswers } from '../profile/types';
import { TASTE_QUESTIONS, type TasteAnswers } from '../taste/questions';
import { useTaste } from '../taste/TasteContext';

/** Profiel > Mijn voorkeuren > Wijzig: één profiel- of smaakvraag aanpassen (/profiel/aanpassen/:key). */
export function EditAnswer() {
  const { key } = useParams();
  const profile = useProfile();
  const taste = useTaste();

  if (profile.loading || taste.loading) return <p className="p-6 text-center text-sm text-xxl-black/70">Even laden…</p>;

  const profileQuestion = QUESTIONS.find((q) => q.key === key);
  if (profileQuestion)
    return (
      <EditQuestion
        question={profileQuestion}
        answers={profile.answers as unknown as Record<string, unknown>}
        save={(patch) => profile.save(patch as Partial<ProfileAnswers>)}
        returnPath="/profiel"
        renderNote={(k, value) =>
          k === 'is_adult' && value === false ? (
            <p className="mt-4 rounded-md bg-xxl-white p-3 text-sm">We laten producten met cafeïne buiten je advies.</p>
          ) : null
        }
      />
    );

  const tasteQuestion = TASTE_QUESTIONS.find((q) => q.key === key);
  if (tasteQuestion)
    return (
      <EditQuestion
        question={tasteQuestion}
        answers={taste.answers as unknown as Record<string, unknown>}
        save={(patch) => taste.save(patch as Partial<TasteAnswers>)}
        returnPath="/profiel"
      />
    );

  return <Navigate to="/profiel" replace />;
}
