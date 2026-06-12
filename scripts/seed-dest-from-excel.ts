/**
 * Seed the destination Supabase project from the May 2026 workbook.
 *
 *   npx tsx --tsconfig tsconfig.app.json scripts/seed-dest-from-excel.ts [path-to-xlsx]
 */

import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

function loadEnvFile(path: string) {
  if (!existsSync(path)) return {}
  const out: Record<string, string> = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return out
}

const migrateEnv = loadEnvFile(join(__dirname, '.env.migrate'))
const destUrl = migrateEnv.DEST_SUPABASE_URL
const destKey = migrateEnv.DEST_SUPABASE_SERVICE_ROLE_KEY

if (!destUrl || !destKey) {
  throw new Error('Set DEST_SUPABASE_URL and DEST_SUPABASE_SERVICE_ROLE_KEY in scripts/.env.migrate')
}

process.env.VITE_SUPABASE_URL = destUrl
process.env.VITE_SUPABASE_ANON_KEY = destKey

const { parseWorkbook } = await import('../src/lib/excel/import.ts')
const { commitImport, findOrCreatePeriod } = await import('../src/lib/excel/commit.ts')
const { createClient } = await import('@supabase/supabase-js')

const defaultWorkbook =
  '/Users/romelordinario/Downloads/Copy of 5. DNL MAY. 2026 P&L.xlsx'
const workbookPath = process.argv[2] ?? defaultWorkbook

if (!existsSync(workbookPath)) {
  throw new Error(`Workbook not found: ${workbookPath}`)
}

const fileBuffer = readFileSync(workbookPath)
const parsed = await parseWorkbook(
  fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength),
)

if (!parsed.sales.length && parsed.issues.some((i) => i.severity !== 'warning')) {
  console.error(parsed.issues)
  throw new Error('Workbook parse failed')
}

const year = parsed.detectedYear
const month = parsed.detectedMonth
console.log(`Importing ${year}-${String(month).padStart(2, '0')} from ${workbookPath}`)
console.log(
  `Rows: sales=${parsed.sales.length} purchases=${parsed.purchases.length} diesel=${parsed.diesel.length} salary=${parsed.salary.length} toll=${parsed.toll.length}`,
)

const { periodId, error: periodError, created } = await findOrCreatePeriod(year, month)
if (periodError || !periodId) throw new Error(periodError ?? 'No period id')

console.log(created ? 'Created period' : 'Using existing period', periodId)

const { error } = await commitImport(periodId, parsed, true)
if (error) throw new Error(error)

console.log('Import complete.')

const supabase = createClient(destUrl, destKey, { auth: { persistSession: false } })
const { count } = await supabase
  .from('customer_delivery_sites')
  .select('*', { count: 'exact', head: true })

if ((count ?? 0) === 0) {
  console.log(
    'Next: run supabase/customer-delivery-sites-add-amount.sql in the client SQL Editor for Sales presets.',
  )
} else {
  console.log(`Delivery site presets: ${count}`)
}
