import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Eén gedeelde Supabase-client voor de hele app, of null in demo-modus
 * (als VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY niet in .env.local staan).
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;
