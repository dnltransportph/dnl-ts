-- DNL P&L — Seed May 2026 master data (customers, suppliers, employees)
-- Run once in Supabase SQL Editor after phase3.sql.

-- ---------------------------------------------------------------------------
-- Customers — from sales rows + May 2026 workbook (24)
-- ---------------------------------------------------------------------------

insert into public.customers (name)
select distinct trim(customer)
from public.sales
where customer is not null
  and trim(customer) <> ''
on conflict (name) do nothing;

insert into public.customers (name) values
  ('ARKELA'),
  ('BALIBAGO'),
  ('BL CONST.'),
  ('CLIMATECH'),
  ('ELISON'),
  ('GOLDEN LUCKY'),
  ('GOOD DIMENSION'),
  ('GREEN ISLAND'),
  ('GREG ARKELA'),
  ('HTN STEEL'),
  ('ISABELA JEBSEN'),
  ('MANILA WATERS'),
  ('MARKTOWN'),
  ('MJCIN'),
  ('OSCAR'),
  ('PANPLY'),
  ('SAN MIGUEL CORPORATION'),
  ('SANDIGAN'),
  ('STALWART'),
  ('TKL'),
  ('TKL STEEL'),
  ('TOP SILVER'),
  ('UNISON'),
  ('WESTMOND')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Suppliers — from purchase/diesel rows + May 2026 workbook (14)
-- ---------------------------------------------------------------------------

insert into public.suppliers (name)
select distinct trim(supplier)
from public.purchase_expenses
where supplier is not null
  and trim(supplier) <> ''
on conflict (name) do nothing;

insert into public.suppliers (name)
select distinct trim(supplier)
from public.diesel_expenses
where supplier is not null
  and trim(supplier) <> ''
on conflict (name) do nothing;

insert into public.suppliers (name) values
  ('BOY JUCO'),
  ('CRYSTAL OIL'),
  ('FLYING V'),
  ('GLOBAL OIL'),
  ('HAJIN AUTO SUPPLY'),
  ('JADENORTH'),
  ('JOVEN CORTEZ'),
  ('LOVERS'),
  ('MEGA LIBAU'),
  ('OTO SAVE AUTO SUPPLY'),
  ('PAG ASA MULTI PARTS'),
  ('SERV. CENRAL'),
  ('SKYWIN PRIME'),
  ('UNO FUEL')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Employees — from salary rows + May 2026 workbook (10)
-- ---------------------------------------------------------------------------

insert into public.employees (name)
select distinct trim(employee)
from public.salary_expenses
where employee is not null
  and trim(employee) <> ''
on conflict (name) do nothing;

insert into public.employees (name) values
  ('ARIEL DIZON'),
  ('EUNES AMANTOY'),
  ('HELMAR BOTER'),
  ('JERRICA GONZAGA'),
  ('JESUS DIWA'),
  ('JHONNA FORTES'),
  ('JOAN HERNANDEZ'),
  ('JR JUCO'),
  ('LIBERATO SARADOR'),
  ('NORMAN DIWA')
on conflict (name) do nothing;
