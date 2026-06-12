-- DNL P&L — Customer delivery site presets (Sales)
-- Run in Supabase SQL Editor after phase3.sql / customers seed.

-- ---------------------------------------------------------------------------
-- Master data: customer → delivery site → default trips + amount
-- ---------------------------------------------------------------------------

create table if not exists public.customer_delivery_sites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  delivery_site text not null,
  trips numeric not null,
  amount numeric not null,
  created_at timestamptz not null default now(),
  unique (customer_id, delivery_site)
);

create index if not exists customer_delivery_sites_customer_idx
  on public.customer_delivery_sites (customer_id);

alter table public.customer_delivery_sites enable row level security;

create policy "Authenticated users can read customer_delivery_sites"
  on public.customer_delivery_sites for select to authenticated using (true);
create policy "Authenticated users can manage customer_delivery_sites"
  on public.customer_delivery_sites for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Seed from May 2026 workbook — SALES tab columns C, D, E, F (unique pairs)
-- ---------------------------------------------------------------------------

insert into public.customer_delivery_sites (customer_id, delivery_site, trips, amount)
select c.id, v.delivery_site, v.trips, v.amount
from (
  values
    ('ARKELA', 'MALABON', 1, 10000),
    ('ARKELA', 'ZAMBALES', 2.5, 11000),
    ('BALIBAGO', 'PAMPANGA', 1, 4608),
    ('BL CONST.', 'QUEZON CITY', 1, 3840),
    ('ELISON', 'QUEZON CITY', 1, 3840),
    ('GOLDEN LUCKY', 'MARILAO BULACAN', 1, 6000),
    ('GOLDEN LUCKY', 'MARILAO,BULACAN', 1, 6000),
    ('GOOD DIMENSION', 'QUEZON CITY', 1, 3840),
    ('GREEN ISLAND', 'SANTA ROSA, LAGUNA', 1.65, 16236),
    ('GREG ARKELA', 'PULILAN, BULACAN', 1.65, 16250),
    ('HTN STEEL', 'DEL MONTE, BULACAN', 1.25, 4800),
    ('HTN STEEL', 'QUEZON CITY', 1, 3840),
    ('ISABELA JEBSEN', 'CALOOCAN CITY', 1, 3840),
    ('MANILA WATERS', 'CAYETANO, TAGUIG', 1.25, 12300),
    ('MARKTOWN', 'LUCENA', 3, 29520),
    ('MJCIN', 'QUEZON CITY', 1, 3840),
    ('PANPLY', 'CALOOCAN CITY', 1, 6000),
    ('SAN MIGUEL CORPORATION', 'BMEG SAN ILDEFONSO', 1.65, 9900),
    ('SANDIGAN', 'ORION, BATAAN', 2.4, 23616),
    ('STALWART', 'SANTA ROSA, LAGUNA', 1.65, 16236),
    ('STALWART', 'STA. ROSA LAGUNA', 1.65, 16236),
    ('TKL', 'CANUMAY EAST', 1, 9840),
    ('TKL STEEL', 'CANUMAY EAST', 1, 3840),
    ('TOP SILVER', 'GUIGUINTO, BULACAN', 1.5, 14760),
    ('TOP SILVER', 'ZABARTE, QUEZON CITY', 1, 6000),
    ('UNISON', 'CARMONA, CAVITE', 1.65, 16236),
    ('WESTMOND', 'QUEZON CITY', 1, 3840)
) as v(customer_name, delivery_site, trips, amount)
join public.customers c on c.name = v.customer_name
on conflict (customer_id, delivery_site) do update
  set trips = excluded.trips,
      amount = excluded.amount;
