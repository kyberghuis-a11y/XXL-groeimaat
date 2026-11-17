-- XXL Groeimaat, bouwstap 3: tabel `users` + account verwijderen (AVG).
-- Uitvoeren in Supabase: Dashboard > SQL Editor > New query > plak dit bestand > Run.
-- Veilig om opnieuw te draaien.

-- 1. Tabel users (projectbrief, sectie Datamodel). Wachtwoorden staan NIET hier maar in auth.users (Supabase Auth).
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null check (char_length(name) between 1 and 60),
  is_adult boolean,                      -- gevraagd in de onboarding (bouwstap 4)
  created_at timestamptz not null default now()
);

-- 2. Row Level Security: iedereen ziet en wijzigt alleen zijn eigen rij.
alter table public.users enable row level security;

drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- 3. Bij registratie automatisch een rij in public.users aanmaken (naam komt uit het registratieformulier).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), 'Sporter'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Account verwijderen (AVG). Verwijdert de ingelogde gebruiker; door "on delete cascade"
--    verdwijnen ook alle gekoppelde gegevens (nu users, later profiles, taste_profiles, orders).
create or replace function public.delete_user()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_user() from public, anon;
grant execute on function public.delete_user() to authenticated;
