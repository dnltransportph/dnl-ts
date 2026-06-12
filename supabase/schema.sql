-- DNL P&L — Supabase schema (Phase 1–3)
-- Run in Supabase SQL Editor after creating a project.
-- Existing Phase 1/2 projects: run supabase/phase3.sql instead of re-running this file.

-- ---------------------------------------------------------------------------
-- Reference data (seed plates & cost centers from May 2026 workbook)
-- ---------------------------------------------------------------------------

create table if not exists public.plates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.cost_centers (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_at timestamptz not null default now()
);

insert into public.plates (code) values
  ('PGJ736'), ('NCS129'), ('UFJ992'), ('UNM562')
on conflict (code) do nothing;

insert into public.cost_centers (code) values
  ('HOUSEHOLD'), ('DNL'), ('GARAGE'), ('PALENGKE')
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- Periods (monthly P&L windows)
-- ---------------------------------------------------------------------------

create table if not exists public.periods (
  id uuid primary key default gen_random_uuid(),
  year int not null check (year between 2000 and 2100),
  month int not null check (month between 1 and 12),
  status text not null default 'open' check (status in ('open', 'closed')),
  closed_at timestamptz,
  closed_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  unique (year, month)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

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

create index if not exists periods_year_month_idx on public.periods (year desc, month desc);

-- ---------------------------------------------------------------------------
-- Transaction tables (all scoped to period_id)
-- ---------------------------------------------------------------------------

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.periods (id) on delete cascade,
  date date not null,
  plate_code text,
  customer text,
  delivery_site text,
  trips numeric,
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_expenses (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.periods (id) on delete cascade,
  date date not null,
  po_number text,
  plate_code text,
  cost_center_code text,
  supplier text,
  description text,
  qty numeric,
  unit text,
  unit_price numeric,
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.diesel_expenses (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.periods (id) on delete cascade,
  date date not null,
  po_number text,
  plate_code text,
  supplier text,
  description text,
  qty numeric,
  unit text,
  unit_price numeric,
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.salary_expenses (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.periods (id) on delete cascade,
  date date not null,
  plate_code text,
  cost_center_code text,
  employee text,
  remarks text,
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.toll_fee_refunds (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.periods (id) on delete cascade,
  date date not null,
  plate_code text,
  delivery_site text,
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sales_period_idx on public.sales (period_id);
create index if not exists purchase_expenses_period_idx on public.purchase_expenses (period_id);
create index if not exists diesel_expenses_period_idx on public.diesel_expenses (period_id);
create index if not exists salary_expenses_period_idx on public.salary_expenses (period_id);
create index if not exists toll_fee_refunds_period_idx on public.toll_fee_refunds (period_id);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id),
  user_email text,
  table_name text not null,
  record_id uuid,
  period_id uuid references public.periods (id) on delete set null,
  action text not null check (action in ('insert', 'update', 'delete')),
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_period_idx on public.audit_log (period_id, created_at desc);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sales_updated_at before update on public.sales
  for each row execute function public.set_updated_at();
create trigger purchase_expenses_updated_at before update on public.purchase_expenses
  for each row execute function public.set_updated_at();
create trigger diesel_expenses_updated_at before update on public.diesel_expenses
  for each row execute function public.set_updated_at();
create trigger salary_expenses_updated_at before update on public.salary_expenses
  for each row execute function public.set_updated_at();
create trigger toll_fee_refunds_updated_at before update on public.toll_fee_refunds
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Period lock helper
-- ---------------------------------------------------------------------------

create or replace function public.is_period_open(p_period_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.periods
    where id = p_period_id and status = 'open'
  );
$$;

create or replace function public.audit_trigger_fn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_user_email text;
  v_period_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is not null then
    select email into v_user_email from auth.users where id = v_user_id;
  end if;

  if TG_OP = 'DELETE' then
    v_period_id := OLD.period_id;
    insert into public.audit_log (user_id, user_email, table_name, record_id, period_id, action, old_data)
    values (v_user_id, v_user_email, TG_TABLE_NAME, OLD.id, v_period_id, 'delete', to_jsonb(OLD));
    return OLD;
  elsif TG_OP = 'UPDATE' then
    v_period_id := NEW.period_id;
    insert into public.audit_log (user_id, user_email, table_name, record_id, period_id, action, old_data, new_data)
    values (v_user_id, v_user_email, TG_TABLE_NAME, NEW.id, v_period_id, 'update', to_jsonb(OLD), to_jsonb(NEW));
    return NEW;
  elsif TG_OP = 'INSERT' then
    v_period_id := NEW.period_id;
    insert into public.audit_log (user_id, user_email, table_name, record_id, period_id, action, new_data)
    values (v_user_id, v_user_email, TG_TABLE_NAME, NEW.id, v_period_id, 'insert', to_jsonb(NEW));
    return NEW;
  end if;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security — authenticated team members get full access
-- ---------------------------------------------------------------------------

alter table public.plates enable row level security;
alter table public.cost_centers enable row level security;
alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.employees enable row level security;
alter table public.customer_delivery_sites enable row level security;
alter table public.periods enable row level security;
alter table public.sales enable row level security;
alter table public.purchase_expenses enable row level security;
alter table public.diesel_expenses enable row level security;
alter table public.salary_expenses enable row level security;
alter table public.toll_fee_refunds enable row level security;
alter table public.audit_log enable row level security;

create policy "Authenticated users can read plates"
  on public.plates for select to authenticated using (true);
create policy "Authenticated users can manage plates"
  on public.plates for all to authenticated using (true) with check (true);

create policy "Authenticated users can read cost_centers"
  on public.cost_centers for select to authenticated using (true);
create policy "Authenticated users can manage cost_centers"
  on public.cost_centers for all to authenticated using (true) with check (true);

create policy "Authenticated users can read customers"
  on public.customers for select to authenticated using (true);
create policy "Authenticated users can manage customers"
  on public.customers for all to authenticated using (true) with check (true);

create policy "Authenticated users can read suppliers"
  on public.suppliers for select to authenticated using (true);
create policy "Authenticated users can manage suppliers"
  on public.suppliers for all to authenticated using (true) with check (true);

create policy "Authenticated users can read employees"
  on public.employees for select to authenticated using (true);
create policy "Authenticated users can manage employees"
  on public.employees for all to authenticated using (true) with check (true);

create policy "Authenticated users can read customer_delivery_sites"
  on public.customer_delivery_sites for select to authenticated using (true);
create policy "Authenticated users can manage customer_delivery_sites"
  on public.customer_delivery_sites for all to authenticated using (true) with check (true);

create policy "Authenticated users can read periods"
  on public.periods for select to authenticated using (true);
create policy "Authenticated users can manage periods"
  on public.periods for all to authenticated using (true) with check (true);

create policy "Authenticated users can read sales"
  on public.sales for select to authenticated using (true);
create policy "Authenticated users can insert sales when period open"
  on public.sales for insert to authenticated
  with check (public.is_period_open(period_id));
create policy "Authenticated users can update sales when period open"
  on public.sales for update to authenticated
  using (public.is_period_open(period_id))
  with check (public.is_period_open(period_id));
create policy "Authenticated users can delete sales when period open"
  on public.sales for delete to authenticated
  using (public.is_period_open(period_id));

create policy "Authenticated users can read purchase_expenses"
  on public.purchase_expenses for select to authenticated using (true);
create policy "Authenticated users can insert purchase_expenses when period open"
  on public.purchase_expenses for insert to authenticated
  with check (public.is_period_open(period_id));
create policy "Authenticated users can update purchase_expenses when period open"
  on public.purchase_expenses for update to authenticated
  using (public.is_period_open(period_id))
  with check (public.is_period_open(period_id));
create policy "Authenticated users can delete purchase_expenses when period open"
  on public.purchase_expenses for delete to authenticated
  using (public.is_period_open(period_id));

create policy "Authenticated users can read diesel_expenses"
  on public.diesel_expenses for select to authenticated using (true);
create policy "Authenticated users can insert diesel_expenses when period open"
  on public.diesel_expenses for insert to authenticated
  with check (public.is_period_open(period_id));
create policy "Authenticated users can update diesel_expenses when period open"
  on public.diesel_expenses for update to authenticated
  using (public.is_period_open(period_id))
  with check (public.is_period_open(period_id));
create policy "Authenticated users can delete diesel_expenses when period open"
  on public.diesel_expenses for delete to authenticated
  using (public.is_period_open(period_id));

create policy "Authenticated users can read salary_expenses"
  on public.salary_expenses for select to authenticated using (true);
create policy "Authenticated users can insert salary_expenses when period open"
  on public.salary_expenses for insert to authenticated
  with check (public.is_period_open(period_id));
create policy "Authenticated users can update salary_expenses when period open"
  on public.salary_expenses for update to authenticated
  using (public.is_period_open(period_id))
  with check (public.is_period_open(period_id));
create policy "Authenticated users can delete salary_expenses when period open"
  on public.salary_expenses for delete to authenticated
  using (public.is_period_open(period_id));

create policy "Authenticated users can read toll_fee_refunds"
  on public.toll_fee_refunds for select to authenticated using (true);
create policy "Authenticated users can insert toll_fee_refunds when period open"
  on public.toll_fee_refunds for insert to authenticated
  with check (public.is_period_open(period_id));
create policy "Authenticated users can update toll_fee_refunds when period open"
  on public.toll_fee_refunds for update to authenticated
  using (public.is_period_open(period_id))
  with check (public.is_period_open(period_id));
create policy "Authenticated users can delete toll_fee_refunds when period open"
  on public.toll_fee_refunds for delete to authenticated
  using (public.is_period_open(period_id));

create policy "Authenticated users can read audit_log"
  on public.audit_log for select to authenticated using (true);

create trigger sales_audit
  after insert or update or delete on public.sales
  for each row execute function public.audit_trigger_fn();
create trigger purchase_expenses_audit
  after insert or update or delete on public.purchase_expenses
  for each row execute function public.audit_trigger_fn();
create trigger diesel_expenses_audit
  after insert or update or delete on public.diesel_expenses
  for each row execute function public.audit_trigger_fn();
create trigger salary_expenses_audit
  after insert or update or delete on public.salary_expenses
  for each row execute function public.audit_trigger_fn();
create trigger toll_fee_refunds_audit
  after insert or update or delete on public.toll_fee_refunds
  for each row execute function public.audit_trigger_fn();
