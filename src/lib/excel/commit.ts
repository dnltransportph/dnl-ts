import { supabase } from '@/lib/supabase'
import type { ParsedWorkbook } from './types'

const TRANSACTION_TABLES = [
  'sales',
  'purchase_expenses',
  'diesel_expenses',
  'salary_expenses',
  'toll_fee_refunds',
] as const

async function upsertMasterData(parsed: ParsedWorkbook): Promise<{ error: string | null }> {
  const plates = new Set<string>()
  const costCenters = new Set<string>()
  const customers = new Set<string>()
  const suppliers = new Set<string>()
  const employees = new Set<string>()

  for (const row of parsed.sales) {
    if (row.plate_code) plates.add(row.plate_code)
    if (row.customer) customers.add(row.customer.trim())
  }
  for (const row of parsed.purchases) {
    if (row.plate_code) plates.add(row.plate_code)
    if (row.cost_center_code) costCenters.add(row.cost_center_code)
    if (row.supplier) suppliers.add(row.supplier.trim())
  }
  for (const row of parsed.diesel) {
    if (row.plate_code) plates.add(row.plate_code)
    if (row.supplier) suppliers.add(row.supplier.trim())
  }
  for (const row of parsed.salary) {
    if (row.plate_code) plates.add(row.plate_code)
    if (row.cost_center_code) costCenters.add(row.cost_center_code)
    if (row.employee) employees.add(row.employee.trim())
  }
  for (const row of parsed.toll) {
    if (row.plate_code) plates.add(row.plate_code)
  }

  for (const code of plates) {
    const { error } = await supabase
      .from('plates')
      .upsert({ code }, { onConflict: 'code', ignoreDuplicates: true })
    if (error) return { error: `plates: ${error.message}` }
  }
  for (const code of costCenters) {
    const { error } = await supabase
      .from('cost_centers')
      .upsert({ code }, { onConflict: 'code', ignoreDuplicates: true })
    if (error) return { error: `cost_centers: ${error.message}` }
  }
  for (const name of customers) {
    const { error } = await supabase
      .from('customers')
      .upsert({ name }, { onConflict: 'name', ignoreDuplicates: true })
    if (error) return { error: `customers: ${error.message}` }
  }
  for (const name of suppliers) {
    const { error } = await supabase
      .from('suppliers')
      .upsert({ name }, { onConflict: 'name', ignoreDuplicates: true })
    if (error) return { error: `suppliers: ${error.message}` }
  }
  for (const name of employees) {
    const { error } = await supabase
      .from('employees')
      .upsert({ name }, { onConflict: 'name', ignoreDuplicates: true })
    if (error) return { error: `employees: ${error.message}` }
  }

  return { error: null }
}

export async function commitImport(
  periodId: string,
  parsed: ParsedWorkbook,
  replaceExisting: boolean,
): Promise<{ error: string | null }> {
  const masterError = await upsertMasterData(parsed)
  if (masterError.error) return masterError

  if (replaceExisting) {
    for (const table of TRANSACTION_TABLES) {
      const { error } = await supabase.from(table).delete().eq('period_id', periodId)
      if (error) return { error: error.message }
    }
  }

  const sales = parsed.sales.map((row) => ({
    period_id: periodId,
    date: row.date,
    plate_code: row.plate_code,
    customer: row.customer,
    delivery_site: row.delivery_site,
    trips: row.trips,
    amount: row.amount,
  }))

  const purchases = parsed.purchases.map((row) => ({
    period_id: periodId,
    date: row.date,
    po_number: row.po_number,
    plate_code: row.plate_code,
    cost_center_code: row.cost_center_code,
    supplier: row.supplier,
    description: row.description,
    qty: row.qty,
    unit: row.unit,
    unit_price: row.unit_price,
    amount: row.amount,
  }))

  const diesel = parsed.diesel.map((row) => ({
    period_id: periodId,
    date: row.date,
    po_number: row.po_number,
    plate_code: row.plate_code,
    supplier: row.supplier,
    description: row.description,
    qty: row.qty,
    unit: row.unit,
    unit_price: row.unit_price,
    amount: row.amount,
  }))

  const salary = parsed.salary.map((row) => ({
    period_id: periodId,
    date: row.date,
    plate_code: row.plate_code,
    cost_center_code: row.cost_center_code,
    employee: row.employee,
    remarks: row.remarks,
    amount: row.amount,
  }))

  const toll = parsed.toll.map((row) => ({
    period_id: periodId,
    date: row.date,
    plate_code: row.plate_code,
    delivery_site: row.delivery_site,
    amount: row.amount,
  }))

  const inserts: { table: (typeof TRANSACTION_TABLES)[number]; rows: Record<string, unknown>[] }[] = [
    { table: 'sales', rows: sales },
    { table: 'purchase_expenses', rows: purchases },
    { table: 'diesel_expenses', rows: diesel },
    { table: 'salary_expenses', rows: salary },
    { table: 'toll_fee_refunds', rows: toll },
  ]

  for (const { table, rows } of inserts) {
    if (rows.length === 0) continue
    const { error } = await supabase.from(table).insert(rows)
    if (error) return { error: `${table}: ${error.message}` }
  }

  return { error: null }
}

export async function findOrCreatePeriod(
  year: number,
  month: number,
): Promise<{ periodId: string | null; error: string | null; created: boolean }> {
  const { data: existing, error: fetchError } = await supabase
    .from('periods')
    .select('id, status')
    .eq('year', year)
    .eq('month', month)
    .maybeSingle()

  if (fetchError) return { periodId: null, error: fetchError.message, created: false }
  if (existing) {
    if (existing.status === 'closed') {
      return {
        periodId: null,
        error: 'The detected month is closed. Reopen it before importing.',
        created: false,
      }
    }
    return { periodId: existing.id, error: null, created: false }
  }

  const { data, error } = await supabase
    .from('periods')
    .insert({ year, month })
    .select('id')
    .single()

  if (error) return { periodId: null, error: error.message, created: false }
  return { periodId: data.id, error: null, created: true }
}
