import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabase';
import { createDemoProfileService, createSupabaseProfileService, type ProfileService } from './profileService';
import { EMPTY_ANSWERS, type ProfileAnswers } from './types';

interface ProfileState {
  answers: ProfileAnswers;
  loading: boolean;
  save: (patch: Partial<ProfileAnswers>) => Promise<void>;
}

const Ctx = createContext<ProfileState | null>(null);

function createProfileService(): ProfileService {
  return supabase ? createSupabaseProfileService(supabase) : createDemoProfileService(window.localStorage);
}

/** Laadt de antwoorden van de ingelogde gebruiker en houdt ze bij voor alle schermen. */
export function ProfileProvider({ children, service: injected }: { children: React.ReactNode; service?: ProfileService }) {
  const service = useMemo(() => injected ?? createProfileService(), [injected]);
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [answers, setAnswers] = useState<ProfileAnswers>(EMPTY_ANSWERS);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    service
      .load(userId)
      .catch(() => EMPTY_ANSWERS)
      .then((a) => {
        if (!active) return;
        setAnswers(a);
        setLoadedFor(userId);
      });
    return () => {
      active = false;
    };
  }, [service, userId]);

  const save = useCallback(
    async (patch: Partial<ProfileAnswers>) => {
      if (!userId) return;
      // Direct tonen; bij een fout terugzetten en de fout doorgeven aan het scherm.
      const previous = answers;
      setAnswers((a) => ({ ...a, ...patch }));
      try {
        setAnswers(await service.save(userId, patch));
      } catch (err) {
        setAnswers(previous);
        throw err;
      }
    },
    [service, userId, answers],
  );

  const value: ProfileState = {
    answers: userId && loadedFor === userId ? answers : EMPTY_ANSWERS,
    loading: Boolean(userId) && loadedFor !== userId,
    save,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProfile(): ProfileState {
  const value = useContext(Ctx);
  if (!value) throw new Error('useProfile moet binnen ProfileProvider gebruikt worden');
  return value;
}
