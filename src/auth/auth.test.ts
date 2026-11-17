import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { createDemoAuth, type KeyValueStorage } from './demoAuth';
import { createSupabaseAuth } from './supabaseAuth';
import { AuthError } from './types';
import { hasErrors, translateAuthError, validateEmail, validateSignIn, validateSignUp } from './validation';

function memoryStorage(): KeyValueStorage & { dump: () => Record<string, string> } {
  const data: Record<string, string> = {};
  return {
    getItem: (k) => data[k] ?? null,
    setItem: (k, v) => void (data[k] = v),
    removeItem: (k) => void delete data[k],
    dump: () => ({ ...data }),
  };
}

describe('validatie', () => {
  it('e-mail', () => {
    expect(validateEmail('')).toBe('Vul je e-mailadres in.');
    expect(validateEmail('kjeld@')).toMatch(/klopt niet/);
    expect(validateEmail('kjeld@voorbeeld')).toMatch(/klopt niet/);
    expect(validateEmail(' sporter@voorbeeld.nl ')).toBeUndefined();
  });

  it('registreren: alle velden verplicht, wachtwoord min. 8 tekens', () => {
    const e = validateSignUp({ name: ' ', email: 'x', password: '1234567' });
    expect(e.name).toBe('Vul je naam in.');
    expect(e.email).toMatch(/klopt niet/);
    expect(e.password).toMatch(/minstens 8/);
    expect(hasErrors(e)).toBe(true);
    expect(hasErrors(validateSignUp({ name: 'Sam', email: 'sam@test.nl', password: '12345678' }))).toBe(false);
  });

  it('registreren: naam max. 60 tekens', () => {
    expect(validateSignUp({ name: 'a'.repeat(61), email: 'a@b.nl', password: '12345678' }).name).toMatch(/60/);
  });

  it('inloggen', () => {
    expect(validateSignIn({ email: '', password: '' })).toEqual({
      email: 'Vul je e-mailadres in.',
      password: 'Vul je wachtwoord in.',
    });
  });

  it('vertaalt Supabase-fouten naar gewone taal', () => {
    expect(translateAuthError('Invalid login credentials')).toBe('E-mailadres of wachtwoord klopt niet.');
    expect(translateAuthError('Email not confirmed')).toMatch(/Bevestig/);
    expect(translateAuthError('User already registered')).toMatch(/bestaat al/);
    expect(translateAuthError('Password should be at least 6 characters')).toMatch(/sterker/);
    expect(translateAuthError('Email rate limit exceeded')).toMatch(/Te veel/);
    expect(translateAuthError('Failed to fetch')).toMatch(/verbinding/);
    expect(translateAuthError('iets onbekends')).toBe('Er ging iets mis. Probeer het opnieuw.');
    expect(translateAuthError(undefined)).toBe('Er ging iets mis. Probeer het opnieuw.');
  });
});

describe('demo-modus', () => {
  const input = { name: ' Sam ', email: 'Sam@Test.nl', password: 'geheim123' };

  it('registreren logt direct in en slaat GEEN wachtwoord op', async () => {
    const storage = memoryStorage();
    const auth = createDemoAuth(storage);
    const res = await auth.signUp(input);
    expect(res.status).toBe('signed_in');
    expect(await auth.getCurrentUser()).toMatchObject({ name: 'Sam', email: 'sam@test.nl', is_adult: null });
    expect(JSON.stringify(storage.dump())).not.toContain('geheim123');
  });

  it('dubbel e-mailadres geeft een nette fout', async () => {
    const auth = createDemoAuth(memoryStorage());
    await auth.signUp(input);
    await expect(auth.signUp({ ...input, email: 'sam@test.nl' })).rejects.toThrow(/bestaat al/);
  });

  it('uitloggen en weer inloggen', async () => {
    const auth = createDemoAuth(memoryStorage());
    const seen: (string | null)[] = [];
    auth.onChange((u) => seen.push(u?.email ?? null));
    await auth.signUp(input);
    await auth.signOut();
    expect(await auth.getCurrentUser()).toBeNull();
    const user = await auth.signIn({ email: 'SAM@test.nl', password: 'wat-dan-ook' });
    expect(user.name).toBe('Sam');
    expect(seen).toEqual(['sam@test.nl', null, 'sam@test.nl']);
  });

  it('onbekend e-mailadres kan niet inloggen', async () => {
    const auth = createDemoAuth(memoryStorage());
    await expect(auth.signIn({ email: 'nieuw@test.nl', password: '12345678' })).rejects.toBeInstanceOf(AuthError);
  });

  it('account verwijderen wist gebruiker en sessie (AVG)', async () => {
    const storage = memoryStorage();
    const auth = createDemoAuth(storage);
    await auth.signUp(input);
    await auth.deleteAccount();
    expect(await auth.getCurrentUser()).toBeNull();
    expect(storage.dump()['groeimaat.demo.users']).toBe('[]');
    await expect(auth.signIn({ email: input.email, password: 'x' })).rejects.toThrow();
  });

  it('kapotte opslag laat de app niet crashen', async () => {
    const storage = memoryStorage();
    storage.setItem('groeimaat.demo.users', '{kapot');
    expect(await createDemoAuth(storage).getCurrentUser()).toBeNull();
  });
});

// Nagebootste Supabase-client: test onze logica zonder netwerk.
const AUTH_USER = { id: 'u1', email: 'sam@test.nl', created_at: '2026-11-17T10:00:00Z', user_metadata: { name: 'Sam' }, identities: [{}] };

function fakeClient(overrides: Record<string, unknown> = {}) {
  const authUser = AUTH_USER;
  const row = { id: 'u1', email: 'sam@test.nl', name: 'Sam', is_adult: null, created_at: '2026-11-17T10:00:00Z' };
  const auth = {
    signUp: vi.fn().mockResolvedValue({ data: { user: authUser, session: { user: authUser } }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: authUser }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    ...overrides,
  };
  const client = {
    auth,
    rpc: vi.fn().mockResolvedValue({ error: null }),
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: row }) }) }) }),
  };
  return { client, auth };
}

describe('Supabase-koppeling', () => {
  vi.stubGlobal('window', { location: { origin: 'http://localhost:5173' } });
  const input = { name: 'Sam', email: ' sam@test.nl ', password: 'geheim123' };

  it('registreren stuurt naam mee als metadata en logt in', async () => {
    const { client, auth } = fakeClient();
    const res = await createSupabaseAuth(client as unknown as SupabaseClient).signUp(input);
    expect(res).toMatchObject({ status: 'signed_in', user: { name: 'Sam' } });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: 'sam@test.nl',
      password: 'geheim123',
      options: { data: { name: 'Sam' }, emailRedirectTo: 'http://localhost:5173/onboarding/2' },
    });
  });

  it('zonder sessie (e-mailbevestiging aan): vraag om mail te checken', async () => {
    const { client } = fakeClient({
      signUp: vi.fn().mockResolvedValue({ data: { user: AUTH_USER, session: null }, error: null }),
    });
    const res = await createSupabaseAuth(client as unknown as SupabaseClient).signUp(input);
    expect(res).toEqual({ status: 'confirm_email', email: 'sam@test.nl' });
  });

  it('bestaand e-mailadres (identities leeg) geeft nette fout', async () => {
    const { client } = fakeClient({
      signUp: vi.fn().mockResolvedValue({ data: { user: { ...AUTH_USER, identities: [] }, session: null }, error: null }),
    });
    await expect(createSupabaseAuth(client as unknown as SupabaseClient).signUp(input)).rejects.toThrow(/bestaat al/);
  });

  it('verkeerd wachtwoord geeft Nederlandse foutmelding', async () => {
    const { client } = fakeClient({
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Invalid login credentials' } }),
    });
    await expect(createSupabaseAuth(client as unknown as SupabaseClient).signIn(input)).rejects.toThrow(
      'E-mailadres of wachtwoord klopt niet.',
    );
  });

  it('account verwijderen roept delete_user aan en logt uit', async () => {
    const { client, auth } = fakeClient();
    await createSupabaseAuth(client as unknown as SupabaseClient).deleteAccount();
    expect(client.rpc).toHaveBeenCalledWith('delete_user');
    expect(auth.signOut).toHaveBeenCalled();
  });

  it('mislukt verwijderen: nette fout en NIET uitloggen', async () => {
    const { client, auth } = fakeClient();
    client.rpc = vi.fn().mockResolvedValue({ error: { message: 'boom' } });
    await expect(createSupabaseAuth(client as unknown as SupabaseClient).deleteAccount()).rejects.toThrow(/niet verwijderd/);
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});
