-- DNL P&L — Phase 3 migration
-- Run in Supabase SQL Editor on an existing Phase 1/2 project.

-- ---------------------------------------------------------------------------
-- Master data: customers, suppliers, employees
-- ---------------------------------------------------------------------------

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

alter table public.customers enable row level security;
alter table public.suppliers enable row level security;
alter table public.employees enable row level security;

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

-- ---------------------------------------------------------------------------
-- Period close metadata
-- ---------------------------------------------------------------------------

alter table public.periods
  add column if not exists closed_at timestamptz,
  add column if not exists closed_by uuid references auth.users (id);

-- ---------------------------------------------------------------------------
-- Period lock helper + RLS on transaction tables
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

-- Sales
drop policy if exists "Authenticated users can manage sales" on public.sales;
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

-- Purchase expenses
drop policy if exists "Authenticated users can manage purchase_expenses" on public.purchase_expenses;
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

-- Diesel expenses
drop policy if exists "Authenticated users can manage diesel_expenses" on public.diesel_expenses;
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

-- Salary expenses
drop policy if exists "Authenticated users can manage salary_expenses" on public.salary_expenses;
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

-- Toll fee refunds
drop policy if exists "Authenticated users can manage toll_fee_refunds" on public.toll_fee_refunds;
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

-- ---------------------------------------------------------------------------
-- Audit log
-- ---------------------------------------------------------------------------

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

alter table public.audit_log enable row level security;

create policy "Authenticated users can read audit_log"
  on public.audit_log for select to authenticated using (true);

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

drop trigger if exists sales_audit on public.sales;
create trigger sales_audit
  after insert or update or delete on public.sales
  for each row execute function public.audit_trigger_fn();

drop trigger if exists purchase_expenses_audit on public.purchase_expenses;
create trigger purchase_expenses_audit
  after insert or update or delete on public.purchase_expenses
  for each row execute function public.audit_trigger_fn();

drop trigger if exists diesel_expenses_audit on public.diesel_expenses;
create trigger diesel_expenses_audit
  after insert or update or delete on public.diesel_expenses
  for each row execute function public.audit_trigger_fn();

drop trigger if exists salary_expenses_audit on public.salary_expenses;
create trigger salary_expenses_audit
  after insert or update or delete on public.salary_expenses
  for each row execute function public.audit_trigger_fn();

drop trigger if exists toll_fee_refunds_audit on public.toll_fee_refunds;
create trigger toll_fee_refunds_audit
  after insert or update or delete on public.toll_fee_refunds
  for each row execute function public.audit_trigger_fn();
