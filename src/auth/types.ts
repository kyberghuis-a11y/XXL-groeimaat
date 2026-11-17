// Eén contract voor inloggen, los van waar de accounts staan (Supabase of demo).
// Schermen praten alleen met dit contract via useAuth().

/** Rij uit de tabel `users` (zie projectbrief, sectie Datamodel). */
export interface AppUser {
  id: string;
  email: string;
  name: string;
  is_adult: boolean | null; // wordt gevraagd in de onboarding (bouwstap 4)
  created_at: string;
}

export type SignUpResult = { status: 'signed_in'; user: AppUser } | { status: 'confirm_email'; email: string };

export interface AuthService {
  /** 'supabase' = echte accounts; 'demo' = alleen in deze browser, geen wachtwoord opgeslagen. */
  readonly mode: 'supabase' | 'demo';
  getCurrentUser(): Promise<AppUser | null>;
  onChange(callback: (user: AppUser | null) => void): () => void;
  signUp(input: { name: string; email: string; password: string }): Promise<SignUpResult>;
  signIn(input: { email: string; password: string }): Promise<AppUser>;
  signOut(): Promise<void>;
  /** AVG: account en alle gegevens verwijderen. */
  deleteAccount(): Promise<void>;
}

/** Fout met een tekst die je direct aan de gebruiker kunt tonen. */
export class AuthError extends Error {}
