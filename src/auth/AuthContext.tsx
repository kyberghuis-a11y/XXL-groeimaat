import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { createDemoAuth } from './demoAuth';
import { createSupabaseAuth } from './supabaseAuth';
import type { AppUser, AuthService } from './types';
import { supabase } from '../lib/supabase';
import { clearDemoProfile } from '../profile/profileService';

/**
 * Kiest de inlogmethode:
 * - VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env.local → echte accounts (Supabase)
 * - anders → demo-modus (alleen in deze browser)
 */
function createAuthService(): AuthService {
  if (supabase) return createSupabaseAuth(supabase);
  // Demo: bij account verwijderen ook het profiel wissen (in Supabase doet "on delete cascade" dat).
  return createDemoAuth(window.localStorage, undefined, (userId) => clearDemoProfile(window.localStorage, userId));
}

interface AuthState {
  service: AuthService;
  user: AppUser | null;
  loading: boolean;
  /** Direct na registreren/inloggen de gebruiker zetten, zonder op de (asynchrone) melding te wachten. */
  applyUser: (user: AppUser | null) => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children, service: injected }: { children: React.ReactNode; service?: AuthService }) {
  const service = useMemo(() => injected ?? createAuthService(), [injected]);
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    service
      .getCurrentUser()
      .then((u) => active && setUser(u))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    const unsubscribe = service.onChange((u) => active && setUser(u));
    return () => {
      active = false;
      unsubscribe();
    };
  }, [service]);

  return <Ctx.Provider value={{ service, user, loading, applyUser: setUser }}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const value = useContext(Ctx);
  if (!value) throw new Error('useAuth moet binnen AuthProvider gebruikt worden');
  return value;
}

/** Alleen voor ingelogde gebruikers; anders naar het inlogscherm (en daarna terug). */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="p-6 text-center text-sm text-xxl-black/60">Even laden…</p>;
  if (!user) return <Navigate to="/inloggen" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
