-- XXL Groeimaat, bouwstap 5: tabel `taste_profiles` (smaaktest + berekend smaakprofiel).
-- Uitvoeren in Supabase: Dashboard > SQL Editor > New query > plak dit bestand > Run.
-- Vereist 0001_users.sql. Veilig om opnieuw te draaien.

-- 1. Tabel taste_profiles (projectbrief, sectie Datamodel). Eén rij per gebruiker.
--    answers  = de antwoorden op de 7 vragen (om later verder te gaan of de test opnieuw te doen)
--    scores   = 0–10 per smaakfamilie: {chocolade, vanille, koek, fruitig_zoet, fruitig_fris, neutraal}
--    De berekende kolommen zijn leeg tot alle 7 vragen zijn beantwoord.
create table if not exists public.taste_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  scores jsonb,
  sweetness smallint check (sweetness between 1 and 3),
  texture text check (texture in ('romig', 'fris')),
  mix_with text check (mix_with in ('water', 'milk', 'plant_milk', 'quark_oats')),
  excluded_flavors text[] check (excluded_flavors <@ array['banana', 'artificial_sweet', 'chocolate', 'fruity']::text[]),
  updated_at timestamptz not null default now()
);

-- 2. Row Level Security: alleen je eigen smaakprofiel lezen, aanmaken en wijzigen.
alter table public.taste_profiles enable row level security;

drop policy if exists "taste_select_own" on public.taste_profiles;
create policy "taste_select_own" on public.taste_profiles
  for select using (auth.uid() = user_id);

drop policy if exists "taste_insert_own" on public.taste_profiles;
create policy "taste_insert_own" on public.taste_profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "taste_update_own" on public.taste_profiles;
create policy "taste_update_own" on public.taste_profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
