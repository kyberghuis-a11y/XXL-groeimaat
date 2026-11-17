// Opslag van de smaaktest. Supabase: tabel taste_profiles (antwoorden + berekend profiel); demo: localStorage.
import type { SupabaseClient } from '@supabase/supabase-js';
import type { KeyValueStorage } from '../auth/demoAuth';
import { EMPTY_TASTE_ANSWERS, type TasteAnswers } from './questions';
import { buildTasteProfile } from './tasteProfile';

export interface TasteService {
  load(userId: string): Promise<TasteAnswers>;
  save(userId: string, patch: Partial<TasteAnswers>): Promise<TasteAnswers>;
}

export class TasteSaveError extends Error {
  constructor() {
    super('Je antwoord kon niet worden opgeslagen. Controleer je internet en probeer het opnieuw.');
  }
}

// ---------- Demo ----------

const DEMO_KEY = 'groeimaat.demo.taste';

function readAll(storage: KeyValueStorage): Record<string, TasteAnswers> {
  try {
    const parsed = JSON.parse(storage.getItem(DEMO_KEY) ?? '{}') as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, TasteAnswers>) : {};
  } catch {
    return {};
  }
}

export function createDemoTasteService(storage: KeyValueStorage): TasteService {
  return {
    async load(userId) {
      return { ...EMPTY_TASTE_ANSWERS, ...readAll(storage)[userId] };
    },
    async save(userId, patch) {
      const all = readAll(storage);
      const next = { ...EMPTY_TASTE_ANSWERS, ...all[userId], ...patch };
      storage.setItem(DEMO_KEY, JSON.stringify({ ...all, [userId]: next }));
      return next;
    },
  };
}

export function clearDemoTaste(storage: KeyValueStorage, userId: string): void {
  const all = readAll(storage);
  delete all[userId];
  storage.setItem(DEMO_KEY, JSON.stringify(all));
}

// ---------- Supabase ----------

/** De rij voor taste_profiles: antwoorden + (als alles is ingevuld) het berekende profiel. */
export function toTasteRow(userId: string, answers: TasteAnswers) {
  const p = buildTasteProfile(answers);
  return {
    user_id: userId,
    answers,
    scores: p?.scores ?? null,
    sweetness: p?.sweetness ?? null,
    texture: p?.texture ?? null,
    mix_with: p?.mix_with ?? null,
    excluded_flavors: p?.excluded_flavors ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function createSupabaseTasteService(client: SupabaseClient): TasteService {
  const service: TasteService = {
    async load(userId) {
      const { data } = await client.from('taste_profiles').select('answers').eq('user_id', userId).maybeSingle();
      return { ...EMPTY_TASTE_ANSWERS, ...((data as { answers: Partial<TasteAnswers> } | null)?.answers ?? {}) };
    },
    async save(userId, patch) {
      const next = { ...(await service.load(userId)), ...patch };
      const { error } = await client.from('taste_profiles').upsert(toTasteRow(userId, next), { onConflict: 'user_id' });
      if (error) throw new TasteSaveError();
      return next;
    },
  };
  return service;
}
