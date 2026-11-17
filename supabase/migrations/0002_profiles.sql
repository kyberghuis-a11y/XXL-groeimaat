-- XXL Groeimaat, bouwstap 4: tabel `profiles` (antwoorden op de profielvragen).
-- Uitvoeren in Supabase: Dashboard > SQL Editor > New query > plak dit bestand > Run.
-- Vereist 0001_users.sql. Veilig om opnieuw te draaien.

-- 1. Tabel profiles (projectbrief, sectie Datamodel). Eén rij per gebruiker.
--    Kolommen zijn leeg (null) tot de vraag is beantwoord; diet = '{}' betekent "Geen".
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  sport text check (sport in ('strength', 'running', 'team_sports', 'combat', 'crossfit', 'cycling', 'other')),
  frequency text check (frequency in ('1_2', '3_4', '5_plus')),
  goal text check (goal in ('muscle', 'weight_loss', 'endurance', 'recovery', 'general_fitness')),
  lifestyle text check (lifestyle in ('sedentary', 'active_job', 'on_the_go')),
  diet text[] check (diet <@ array['vegetarian', 'vegan', 'lactose_free', 'gluten_free', 'halal']::text[]),
  usage_moment text check (usage_moment in ('post_workout', 'breakfast', 'snack', 'unknown')),
  budget_range text check (budget_range in ('under_20', '20_40', '40_60', 'over_60')),
  experience text check (experience in ('none', 'some', 'yes')),
  updated_at timestamptz not null default now()
);

-- 2. Row Level Security: alleen je eigen profiel lezen, aanmaken en wijzigen.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. In users mag de app alleen naam en leeftijdsbevestiging wijzigen (niet id, e-mail of created_at).
revoke update on public.users from authenticated, anon;
grant update (name, is_adult) on public.users to authenticated;
