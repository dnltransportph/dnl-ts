/**
 * Copy all public app data from one Supabase project to another.
 *
 * Usage:
 *   1. cp scripts/.env.migrate.example scripts/.env.migrate
 *   2. Fill in SOURCE_* and DEST_* values (service role keys required)
 *   3. Run schema on DEST first: supabase/schema.sql in SQL Editor
 *   4. node scripts/migrate-supabase.mjs
 *
 * Optional:
 *   node scripts/migrate-supabase.mjs --export-only
 *   node scripts/migrate-supabase.mjs --import-only
 *   node scripts/migrate-supabase.mjs --create-user user@company.com TempPassword123!
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '.migration-data')

const TABLES = [
  'plates',
  'cost_centers',
  'customers',
  'suppliers',
  'employees',
  'periods',
  'customer_delivery_sites',
  'sales',
  'purchase_expenses',
  'diesel_expenses',
  'salary_expenses',
  'toll_fee_refunds',
  'audit_log',
]

const PAGE_SIZE = 1000

function loadEnvFile(path) {
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return out
}

function requireEnv(env, key) {
  const value = env[key]
  if (!value) throw new Error(`Missing ${key} in scripts/.env.migrate`)
  return value
}

function adminClient(url, serviceRoleKey) {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function fetchAll(supabase, table) {
  const rows = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(`${table}: ${error.message}`)
    if (!data?.length) break

    rows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return rows
}

function sanitizeRows(table, rows) {
  if (table === 'periods') {
    return rows.map(({ closed_by, ...row }) => ({ ...row, closed_by: null }))
  }
  if (table === 'audit_log') {
    return rows.map(({ user_id, user_email, ...row }) => ({
      ...row,
      user_id: null,
      user_email: user_email ?? null,
    }))
  }
  return rows
}

async function clearTable(supabase, table) {
  const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (error) throw new Error(`clear ${table}: ${error.message}`)
}

async function insertBatch(supabase, table, rows) {
  const chunkSize = 500
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const { error } = await supabase.from(table).insert(chunk)
    if (error) throw new Error(`insert ${table}: ${error.message}`)
  }
}

async function exportData(source) {
  mkdirSync(DATA_DIR, { recursive: true })
  const summary = {}

  for (const table of TABLES) {
    const rows = await fetchAll(source, table)
    const sanitized = sanitizeRows(table, rows)
    writeFileSync(join(DATA_DIR, `${table}.json`), JSON.stringify(sanitized, null, 2))
    summary[table] = sanitized.length
    console.log(`exported ${table}: ${sanitized.length}`)
  }

  writeFileSync(join(DATA_DIR, 'summary.json'), JSON.stringify(summary, null, 2))
  return summary
}

async function importData(dest) {
  if (!existsSync(DATA_DIR)) throw new Error(`Missing ${DATA_DIR}. Run export first.`)

  for (const table of [...TABLES].reverse()) {
    await clearTable(dest, table)
  }

  const summary = {}
  for (const table of TABLES) {
    const file = join(DATA_DIR, `${table}.json`)
    if (!existsSync(file)) {
      console.log(`skip ${table}: no file`)
      continue
    }
    const rows = JSON.parse(readFileSync(file, 'utf8'))
    if (rows.length > 0) await insertBatch(dest, table, rows)
    summary[table] = rows.length
    console.log(`imported ${table}: ${rows.length}`)
  }

  return summary
}

async function createUser(dest, email, password) {
  const { data, error } = await dest.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw new Error(`createUser: ${error.message}`)
  console.log(`created user ${email} (${data.user.id})`)
}

async function main() {
  const env = {
    ...loadEnvFile(join(__dirname, '..', '.env')),
    ...loadEnvFile(join(__dirname, '.env.migrate')),
  }

  const args = process.argv.slice(2)
  const exportOnly = args.includes('--export-only')
  const importOnly = args.includes('--import-only')
  const createUserIdx = args.indexOf('--create-user')

  if (createUserIdx !== -1) {
    const email = args[createUserIdx + 1]
    const password = args[createUserIdx + 2]
    if (!email || !password) {
      throw new Error('Usage: --create-user email password')
    }
    const destUrl = requireEnv(env, 'DEST_SUPABASE_URL')
    const destKey = requireEnv(env, 'DEST_SUPABASE_SERVICE_ROLE_KEY')
    await createUser(adminClient(destUrl, destKey), email, password)
    return
  }

  const sourceUrl = requireEnv(env, 'SOURCE_SUPABASE_URL')
  const sourceKey = requireEnv(env, 'SOURCE_SUPABASE_SERVICE_ROLE_KEY')
  const source = adminClient(sourceUrl, sourceKey)

  if (!importOnly) {
    console.log('Exporting from source project...')
    const summary = await exportData(source)
    console.log('Export complete:', summary)
  }

  if (!exportOnly) {
    const destUrl = requireEnv(env, 'DEST_SUPABASE_URL')
    const destKey = requireEnv(env, 'DEST_SUPABASE_SERVICE_ROLE_KEY')
    const dest = adminClient(destUrl, destKey)

    console.log('Importing into destination project...')
    const summary = await importData(dest)
    console.log('Import complete:', summary)
  }
}

main().catch((err) => {
  console.error(err.message || err)
  process.exit(1)
})
