// Opslag van de onboarding-antwoorden. Zelfde patroon als inloggen: één contract,
// met een Supabase-versie (tabellen profiles + users.is_adult) en een demo-versie (localStorage).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { KeyValueStorage } from '../auth/demoAuth';
import { EMPTY_ANSWERS, type ProfileAnswers } from './types';

export interface ProfileService {
  load(userId: string): Promise<ProfileAnswers>;
  /** Slaat alleen de meegegeven antwoorden op (de rest blijft staan). */
  save(userId: string, patch: Partial<ProfileAnswers>): Promise<ProfileAnswers>;
}

export class ProfileSaveError extends Error {
  constructor() {
    super('Je antwoord kon niet worden opgeslagen. Controleer je internet en probeer het opnieuw.');
  }
}

// ---------- Demo ----------

const DEMO_KEY = 'groeimaat.demo.profiles';

function readAll(storage: KeyValueStorage): Record<string, ProfileAnswers> {
  try {
    const raw = storage.getItem(DEMO_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, ProfileAnswers>) : {};
  } catch {
    return {};
  }
}

export function createDemoProfileService(storage: KeyValueStorage): ProfileService {
  return {
    async load(userId) {
      return { ...EMPTY_ANSWERS, ...readAll(storage)[userId] };
    },
    async save(userId, patch) {
      const all = readAll(storage);
      const next = { ...EMPTY_ANSWERS, ...all[userId], ...patch };
      storage.setItem(DEMO_KEY, JSON.stringify({ ...all, [userId]: next }));
      return next;
    },
  };
}

/** Bij "account verwijderen" in demo-modus. */
export function clearDemoProfile(storage: KeyValueStorage, userId: string): void {
  const all = readAll(storage);
  delete all[userId];
  storage.setItem(DEMO_KEY, JSON.stringify(all));
}

// ---------- Supabase ----------

const PROFILE_COLUMNS = ['sport', 'frequency', 'goal', 'lifestyle', 'diet', 'usage_moment', 'budget_range', 'experience'] as const;

export function createSupabaseProfileService(client: SupabaseClient): ProfileService {
  const service: ProfileService = {
    async load(userId) {
      const [profile, user] = await Promise.all([
        client.from('profiles').select(PROFILE_COLUMNS.join(', ')).eq('user_id', userId).maybeSingle(),
        client.from('users').select('is_adult').eq('id', userId).maybeSingle(),
      ]);
      return {
        ...EMPTY_ANSWERS,
        ...((profile.data as Partial<ProfileAnswers> | null) ?? {}),
        is_adult: (user.data as { is_adult: boolean | null } | null)?.is_adult ?? null,
      };
    },

    async save(userId, patch) {
      const { is_adult, ...rest } = patch;
      if (is_adult !== undefined) {
        const { error } = await client.from('users').update({ is_adult }).eq('id', userId);
        if (error) throw new ProfileSaveError();
      }
      const profilePatch = Object.fromEntries(Object.entries(rest).filter(([k]) => (PROFILE_COLUMNS as readonly string[]).includes(k)));
      if (Object.keys(profilePatch).length > 0) {
        const { error } = await client
          .from('profiles')
          .upsert({ user_id: userId, ...profilePatch, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
        if (error) throw new ProfileSaveError();
      }
      return service.load(userId);
    },
  };
  return service;
}
