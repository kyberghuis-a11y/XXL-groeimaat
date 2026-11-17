import { useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getProductLines } from '../data/catalog';
import type { ProductLine } from '../data/types';
import { useProfile } from '../profile/ProfileContext';
import { isProfileComplete } from '../profile/questions';
import { useTaste } from '../taste/TasteContext';
import { matchForLine, recommend, type AdviceGroup, type LineMatch } from './engine';

export type AdviceState =
  | { status: 'loading' }
  | { status: 'incomplete' } // geen account, of onboarding niet af
  | { status: 'ready'; groups: AdviceGroup[] };

/** Het advies voor de ingelogde gebruiker. Wordt bij elke wijziging opnieuw berekend (niet opgeslagen). */
export function useAdvice(): AdviceState {
  const { user, loading: authLoading } = useAuth();
  const profile = useProfile();
  const taste = useTaste();
  return useMemo<AdviceState>(() => {
    if (authLoading || profile.loading || taste.loading) return { status: 'loading' };
    if (!user || !isProfileComplete(profile.answers) || !taste.profile) return { status: 'incomplete' };
    return { status: 'ready', groups: recommend(getProductLines(), profile.answers, taste.profile) };
  }, [authLoading, user, profile.loading, profile.answers, taste.loading, taste.profile]);
}

/** Match-percentage per productlijn, of null als we (nog) geen profiel hebben. */
export function useLineMatch(line: ProductLine | undefined): LineMatch | null {
  const { user } = useAuth();
  const profile = useProfile();
  const taste = useTaste();
  return useMemo(() => {
    if (!line || !user || !isProfileComplete(profile.answers) || !taste.profile) return null;
    return matchForLine(line, getProductLines(), profile.answers, taste.profile);
  }, [line, user, profile.answers, taste.profile]);
}
