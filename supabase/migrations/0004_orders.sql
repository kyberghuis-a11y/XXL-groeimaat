-- XXL Groeimaat, bouwstap 7: tabellen `orders` en `order_items` (gesimuleerde bestellingen).
-- Uitvoeren in Supabase: Dashboard > SQL Editor > New query > plak dit bestand > Run.
-- Vereist 0001_users.sql. Veilig om opnieuw te draaien.

-- 1. Bestellingen (projectbrief, sectie Datamodel). Statussen = vaste lijst uit de brief.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  order_number text not null unique,
  status text not null default 'besteld'
    check (status in ('besteld', 'in_behandeling', 'verzonden', 'onderweg', 'bezorgd', 'geannuleerd', 'retour')),
  ordered_at timestamptz not null default now(),
  expected_delivery date not null,
  delivered_at timestamptz,
  total_eur numeric(10, 2) not null check (total_eur >= 0),
  free_shipping boolean not null default false,
  tracking_url text,
  payment_method text not null
    check (payment_method in ('iDEAL', 'Mastercard', 'Amex', 'Klarna', 'SEPA', 'Apple Pay', 'Google Pay', 'PayPal', 'Bancontact'))
);
create index if not exists orders_user_ordered_idx on public.orders (user_id, ordered_at desc);

-- 2. Regels per bestelling. variant_id verwijst naar de lokale productcatalogus; productnaam,
--    smaak en formaat worden mee opgeslagen zodat oude bestellingen leesbaar blijven.
create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  variant_id text not null,
  product_line_id text not null,
  product_name text not null,
  flavor text,
  size_label text not null,
  quantity integer not null check (quantity between 1 and 10),
  price_eur numeric(10, 2) not null check (price_eur >= 0)
);
create index if not exists order_items_order_idx on public.order_items (order_id);

-- 3. Row Level Security: alleen je eigen bestellingen lezen. Aanmaken gaat via create_order().
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders_select_own" on public.orders;
create policy "orders_select_own" on public.orders
  for select using (auth.uid() = user_id);

drop policy if exists "order_items_select_own" on public.order_items;
create policy "order_items_select_own" on public.order_items
  for select using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- 4. Bestelling plaatsen: bestelling + regels in één keer (alles of niets), altijd voor de ingelogde gebruiker.
create or replace function public.create_order(p_order jsonb, p_items jsonb)
returns uuid
language plpgsql
security definer set search_path = ''
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty order';
  end if;

  insert into public.orders (user_id, order_number, status, ordered_at, expected_delivery, total_eur, free_shipping, payment_method)
  values (
    auth.uid(),
    p_order ->> 'order_number',
    'besteld',
    coalesce((p_order ->> 'ordered_at')::timestamptz, now()),
    (p_order ->> 'expected_delivery')::date,
    (p_order ->> 'total_eur')::numeric,
    coalesce((p_order ->> 'free_shipping')::boolean, false),
    p_order ->> 'payment_method'
  )
  returning id into v_id;

  insert into public.order_items (order_id, variant_id, product_line_id, product_name, flavor, size_label, quantity, price_eur)
  select v_id, i ->> 'variant_id', i ->> 'product_line_id', i ->> 'product_name', i ->> 'flavor', i ->> 'size_label',
         (i ->> 'quantity')::integer, (i ->> 'price_eur')::numeric
  from jsonb_array_elements(p_items) as i;

  return v_id;
end;
$$;

revoke all on function public.create_order(jsonb, jsonb) from public, anon;
grant execute on function public.create_order(jsonb, jsonb) to authenticated;
