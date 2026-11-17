import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { createDemoAuth, type KeyValueStorage } from '../auth/demoAuth';
import { clearDemoProfile, createDemoProfileService, createSupabaseProfileService, ProfileSaveError } from './profileService';
import { NONE, QUESTIONS, answerLabel, firstUnanswered, isProfileComplete, toggleDiet } from './questions';
import { EMPTY_ANSWERS, type ProfileAnswers } from './types';

function memoryStorage(): KeyValueStorage {
  const data: Record<string, string> = {};
  return { getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v), removeItem: (k) => void delete data[k] };
}

const FULL: ProfileAnswers = {
  is_adult: true,
  sport: 'strength',
  frequency: '3_4',
  goal: 'muscle',
  lifestyle: 'sedentary',
  diet: [],
  usage_moment: 'post_workout',
  budget_range: '20_40',
  experience: 'none',
};

describe('vragenlijst', () => {
  it('leeftijdsvraag + de 8 profielvragen uit de brief, in volgorde', () => {
    expect(QUESTIONS.map((q) => q.key)).toEqual([
      'is_adult',
      'sport',
      'frequency',
      'goal',
      'lifestyle',
      'diet',
      'usage_moment',
      'budget_range',
      'experience',
    ]);
  });

  it('antwoordopties komen overeen met de brief', () => {
    const count = (key: string) => QUESTIONS.find((q) => q.key === key)!.options.length;
    expect(count('sport')).toBe(7);
    expect(count('frequency')).toBe(3);
    expect(count('goal')).toBe(5);
    expect(count('lifestyle')).toBe(3);
    expect(count('diet')).toBe(6); // Geen + 5
    expect(count('usage_moment')).toBe(4);
    expect(count('budget_range')).toBe(4);
    expect(count('experience')).toBe(3);
  });

  it('elke vraag heeft unieke opties en alleen voeding is meerkeuze', () => {
    for (const q of QUESTIONS) {
      expect(new Set(q.options.map((o) => String(o.value))).size).toBe(q.options.length);
      expect(Boolean(q.multi)).toBe(q.key === 'diet');
    }
  });

  it('firstUnanswered / isProfileComplete', () => {
    expect(firstUnanswered(EMPTY_ANSWERS)).toBe(1);
    expect(firstUnanswered({ ...EMPTY_ANSWERS, is_adult: false, sport: 'running' })).toBe(3);
    expect(firstUnanswered({ ...FULL, budget_range: null })).toBe(8);
    expect(isProfileComplete(FULL)).toBe(true);
    // "nee" bij 18+ en "Geen" bij voeding tellen als beantwoord
    expect(isProfileComplete({ ...FULL, is_adult: false, diet: [] })).toBe(true);
  });

  it('voeding: "Geen" sluit de rest uit', () => {
    expect(toggleDiet(['vegan'], NONE, false)).toEqual({ diet: [], none: true });
    expect(toggleDiet([], 'vegan', true)).toEqual({ diet: ['vegan'], none: false });
    expect(toggleDiet(['vegan'], 'halal', false)).toEqual({ diet: ['vegan', 'halal'], none: false });
    expect(toggleDiet(['vegan', 'halal'], 'vegan', false)).toEqual({ diet: ['halal'], none: false });
    expect(toggleDiet([], NONE, true)).toEqual({ diet: [], none: false }); // Geen weer uitzetten
  });

  it('labels voor het overzicht', () => {
    const q = (key: string) => QUESTIONS.find((x) => x.key === key)!;
    expect(answerLabel(q('diet'), FULL)).toBe('Geen');
    expect(answerLabel(q('diet'), { ...FULL, diet: ['vegan', 'halal'] })).toBe('Veganistisch, Halal');
    expect(answerLabel(q('is_adult'), { ...FULL, is_adult: false })).toBe('Nee, ik ben jonger dan 18');
    expect(answerLabel(q('goal'), EMPTY_ANSWERS)).toBe('—');
  });
});

describe('demo-opslag', () => {
  it('slaat per gebruiker stapsgewijs op', async () => {
    const svc = createDemoProfileService(memoryStorage());
    expect(await svc.load('u1')).toEqual(EMPTY_ANSWERS);
    await svc.save('u1', { is_adult: false });
    await svc.save('u1', { sport: 'running', diet: ['vegan'] });
    expect(await svc.load('u1')).toMatchObject({ is_adult: false, sport: 'running', diet: ['vegan'], goal: null });
    expect(await svc.load('u2')).toEqual(EMPTY_ANSWERS);
  });

  it('account verwijderen wist ook het profiel (AVG)', async () => {
    const storage = memoryStorage();
    const profiles = createDemoProfileService(storage);
    const auth = createDemoAuth(storage, undefined, (id) => clearDemoProfile(storage, id));
    const res = await auth.signUp({ name: 'Sam', email: 'sam@test.nl', password: '12345678' });
    const id = res.status === 'signed_in' ? res.user.id : '';
    await profiles.save(id, FULL);
    await auth.deleteAccount();
    expect(await profiles.load(id)).toEqual(EMPTY_ANSWERS);
  });

  it('kapotte opslag geeft lege antwoorden', async () => {
    const storage = memoryStorage();
    storage.setItem('groeimaat.demo.profiles', 'kapot{');
    expect(await createDemoProfileService(storage).load('u1')).toEqual(EMPTY_ANSWERS);
  });
});

// Nagebootste Supabase-client die bijhoudt wat er wordt aangeroepen.
function fakeClient(opts: { updateError?: boolean; upsertError?: boolean } = {}) {
  const calls: { table: string; op: string; payload?: unknown; options?: unknown }[] = [];
  let profileRow: Record<string, unknown> | null = { sport: 'running', diet: [] };
  let isAdult: boolean | null = true;
  const client = {
    from(table: string) {
      return {
        select: () => ({
          eq: () => ({
            maybeSingle: () => Promise.resolve({ data: table === 'users' ? { is_adult: isAdult } : profileRow, error: null }),
          }),
        }),
        update: (payload: { is_adult: boolean }) => ({
          eq: () => {
            calls.push({ table, op: 'update', payload });
            if (!opts.updateError) isAdult = payload.is_adult;
            return Promise.resolve({ error: opts.updateError ? { message: 'x' } : null });
          },
        }),
        upsert: (payload: Record<string, unknown>, options: unknown) => {
          calls.push({ table, op: 'upsert', payload, options });
          if (!opts.upsertError) profileRow = { ...profileRow, ...payload };
          return Promise.resolve({ error: opts.upsertError ? { message: 'x' } : null });
        },
      };
    },
  };
  return { client: client as unknown as SupabaseClient, calls };
}

describe('Supabase-opslag', () => {
  it('laadt profiel + is_adult uit twee tabellen', async () => {
    const { client } = fakeClient();
    expect(await createSupabaseProfileService(client).load('u1')).toEqual({ ...EMPTY_ANSWERS, sport: 'running', diet: [], is_adult: true });
  });

  it('is_adult gaat naar users, de rest naar profiles (upsert op user_id)', async () => {
    const { client, calls } = fakeClient();
    const result = await createSupabaseProfileService(client).save('u1', { is_adult: false, goal: 'muscle' });
    expect(calls[0]).toMatchObject({ table: 'users', op: 'update', payload: { is_adult: false } });
    expect(calls[1]).toMatchObject({ table: 'profiles', op: 'upsert', payload: { user_id: 'u1', goal: 'muscle' }, options: { onConflict: 'user_id' } });
    expect(calls[1].payload).not.toHaveProperty('is_adult');
    expect(result).toMatchObject({ is_adult: false, goal: 'muscle' });
  });

  it('alleen is_adult: geen upsert op profiles', async () => {
    const { client, calls } = fakeClient();
    await createSupabaseProfileService(client).save('u1', { is_adult: true });
    expect(calls.map((c) => c.table)).toEqual(['users']);
  });

  it('fout bij opslaan geeft een nette melding', async () => {
    await expect(createSupabaseProfileService(fakeClient({ upsertError: true }).client).save('u1', { sport: 'running' })).rejects.toBeInstanceOf(
      ProfileSaveError,
    );
    await expect(createSupabaseProfileService(fakeClient({ updateError: true }).client).save('u1', { is_adult: true })).rejects.toThrow(
      /niet worden opgeslagen/,
    );
  });
});

describe('SQL-migratie past bij de code', () => {
  it('alle antwoordcodes staan in de check-constraints van 0002_profiles.sql', async () => {
    const { readFileSync } = await import('node:fs');
    const sql = readFileSync(new URL('../../supabase/migrations/0002_profiles.sql', import.meta.url), 'utf8');
    for (const q of QUESTIONS) {
      if (q.key === 'is_adult') continue;
      for (const o of q.options) {
        if (o.value === NONE) continue;
        expect(sql, `${q.key}=${String(o.value)}`).toContain(`'${String(o.value)}'`);
      }
    }
  });
});

vi.restoreAllMocks();
