import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabase';
import { EMPTY_TASTE_ANSWERS, type TasteAnswers } from './questions';
import { buildTasteProfile, type TasteProfile } from './tasteProfile';
import { createDemoTasteService, createSupabaseTasteService, type TasteService } from './tasteService';

interface TasteState {
  answers: TasteAnswers;
  profile: TasteProfile | null; // null zolang de smaaktest niet af is
  loading: boolean;
  save: (patch: Partial<TasteAnswers>) => Promise<void>;
}

const Ctx = createContext<TasteState | null>(null);

function createTasteService(): TasteService {
  return supabase ? createSupabaseTasteService(supabase) : createDemoTasteService(window.localStorage);
}

export function TasteProvider({ children, service: injected }: { children: React.ReactNode; service?: TasteService }) {
  const service = useMemo(() => injected ?? createTasteService(), [injected]);
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [answers, setAnswers] = useState<TasteAnswers>(EMPTY_TASTE_ANSWERS);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    service
      .load(userId)
      .catch(() => EMPTY_TASTE_ANSWERS)
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
    async (patch: Partial<TasteAnswers>) => {
      if (!userId) return;
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

  const current = userId && loadedFor === userId ? answers : EMPTY_TASTE_ANSWERS;
  const profile = useMemo(() => buildTasteProfile(current), [current]);
  return (
    <Ctx.Provider value={{ answers: current, profile, loading: Boolean(userId) && loadedFor !== userId, save }}>{children}</Ctx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTaste(): TasteState {
  const value = useContext(Ctx);
  if (!value) throw new Error('useTaste moet binnen TasteProvider gebruikt worden');
  return value;
}
