// Demo-modus: gebruikt zolang er geen Supabase-sleutels zijn ingevuld.
// Bewaart alleen naam en e-mail in deze browser. Het wachtwoord wordt NOOIT opgeslagen
// (afspraak uit de brief: wachtwoorden nooit zelf opslaan), dus elk wachtwoord van 8+ tekens werkt.
import { AuthError, type AppUser, type AuthService } from './types';

const USERS_KEY = 'groeimaat.demo.users';
const SESSION_KEY = 'groeimaat.demo.session';

/** Minimale opslag-interface, zodat tests geen echte browser nodig hebben. */
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createDemoAuth(storage: KeyValueStorage, now: () => Date = () => new Date()): AuthService {
  const listeners = new Set<(u: AppUser | null) => void>();

  const read = <T>(key: string, fallback: T): T => {
    try {
      const raw = storage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  };
  const users = () => read<AppUser[]>(USERS_KEY, []);
  const saveUsers = (list: AppUser[]) => storage.setItem(USERS_KEY, JSON.stringify(list));
  const current = (): AppUser | null => {
    const id = read<string | null>(SESSION_KEY, null);
    return users().find((u) => u.id === id) ?? null;
  };
  const setSession = (user: AppUser | null) => {
    if (user) storage.setItem(SESSION_KEY, JSON.stringify(user.id));
    else storage.removeItem(SESSION_KEY);
    listeners.forEach((l) => l(user));
  };
  const normEmail = (e: string) => e.trim().toLowerCase();

  return {
    mode: 'demo',
    async getCurrentUser() {
      return current();
    },
    onChange(callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    async signUp({ name, email }) {
      const list = users();
      if (list.some((u) => u.email === normEmail(email)))
        throw new AuthError('Er bestaat al een account met dit e-mailadres. Log in.');
      const user: AppUser = {
        id: `demo-${now().getTime()}-${Math.random().toString(36).slice(2, 8)}`,
        email: normEmail(email),
        name: name.trim(),
        is_adult: null,
        created_at: now().toISOString(),
      };
      saveUsers([...list, user]);
      setSession(user);
      return { status: 'signed_in', user };
    },
    async signIn({ email }) {
      const user = users().find((u) => u.email === normEmail(email));
      if (!user) throw new AuthError('E-mailadres of wachtwoord klopt niet.');
      setSession(user);
      return user;
    },
    async signOut() {
      setSession(null);
    },
    async deleteAccount() {
      const user = current();
      if (!user) return;
      saveUsers(users().filter((u) => u.id !== user.id));
      setSession(null);
    },
  };
}
