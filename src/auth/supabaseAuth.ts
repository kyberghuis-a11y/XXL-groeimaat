// Echte accounts via Supabase Auth. Wachtwoorden worden door Supabase beheerd, nooit door ons.
// De tabel public.users en de functie delete_user() staan in supabase/migrations/0001_users.sql.
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { translateAuthError } from './validation';
import { AuthError, type AppUser, type AuthService } from './types';

function fromAuthUser(u: User): AppUser {
  return {
    id: u.id,
    email: u.email ?? '',
    name: (u.user_metadata?.name as string | undefined) ?? '',
    is_adult: null,
    created_at: u.created_at,
  };
}

export function createSupabaseAuth(client: SupabaseClient): AuthService {
  /** Haalt de rij uit public.users; valt terug op de auth-gegevens als die (nog) niet bestaat. */
  async function loadUser(authUser: User): Promise<AppUser> {
    const { data } = await client
      .from('users')
      .select('id, email, name, is_adult, created_at')
      .eq('id', authUser.id)
      .maybeSingle();
    return (data as AppUser | null) ?? fromAuthUser(authUser);
  }

  return {
    mode: 'supabase',

    async getCurrentUser() {
      const { data } = await client.auth.getSession();
      return data.session ? loadUser(data.session.user) : null;
    },

    onChange(callback) {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        // Niet direct awaiten binnen de callback (advies van Supabase): eerst de huidige taak afronden.
        setTimeout(() => {
          if (session) void loadUser(session.user).then(callback);
          else callback(null);
        }, 0);
      });
      return () => data.subscription.unsubscribe();
    },

    async signUp({ name, email, password }) {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: `${window.location.origin}/onboarding/2`,
        },
      });
      if (error) throw new AuthError(translateAuthError(error.message));
      // Bestaand e-mailadres: Supabase geeft (om privacyredenen) geen fout, maar een user zonder identities.
      if (data.user && data.user.identities?.length === 0)
        throw new AuthError(translateAuthError('User already registered'));
      if (!data.session) return { status: 'confirm_email', email: email.trim() };
      return { status: 'signed_in', user: await loadUser(data.session.user) };
    },

    async signIn({ email, password }) {
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new AuthError(translateAuthError(error.message));
      return loadUser(data.user);
    },

    async signOut() {
      await client.auth.signOut();
    },

    async deleteAccount() {
      const { error } = await client.rpc('delete_user');
      if (error) throw new AuthError('Je account kon niet verwijderd worden. Probeer het later opnieuw.');
      await client.auth.signOut();
    },
  };
}
