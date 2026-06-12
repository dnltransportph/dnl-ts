# DNL P&L Webapp

Monthly Profit & Loss app for DNL Transport Services — replaces the manual Excel workbook.

**Stack:** Vite + React + TypeScript · Supabase (Auth + PostgreSQL)

## Quick start

### 1. Supabase project

1. Create a free project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql)
3. Enable **Email** auth under Authentication → Providers
4. Create team user accounts under Authentication → Users

### 2. Environment

```bash
cp .env.example .env
```

Add your project URL and anon key:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173 and sign in.

## Phase 1 features

- Supabase Auth (email/password)
- Period management (create / select month)
- CRUD for Sales, Purchases, Diesel, Salary, Toll Fee Refund
- Live P&L dashboard with expense ratios
- Validation: required date + amount, normalized plates and PO numbers

## Project structure

```text
src/
  pages/          # Dashboard + 5 transaction modules
  components/     # Layout, shared CRUD table
  hooks/          # Auth, period, P&L totals
  lib/            # Supabase client, P&L math, validation
supabase/
  schema.sql      # Tables + RLS policies
```

See [`PLAN.md`](PLAN.md) for full product spec and Phase 2–3 roadmap.
