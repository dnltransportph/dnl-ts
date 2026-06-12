import { supabase } from '@/lib/supabase'
import { computePL, sumAmounts } from '@/lib/pl'
import type {
  DieselExpense,
  Period,
  PurchaseExpense,
  SalaryExpense,
  Sale,
  TollFeeRefund,
} from '@/types/database'
import type { PeriodExportData } from './types'

export async function fetchPeriodExportData(period: Period): Promise<PeriodExportData> {
  const periodId = period.id

  const [salesRes, purchasesRes, dieselRes, salaryRes, tollRes] = await Promise.all([
    supabase.from('sales').select('*').eq('period_id', periodId).order('date'),
    supabase.from('purchase_expenses').select('*').eq('period_id', periodId).order('date'),
    supabase.from('diesel_expenses').select('*').eq('period_id', periodId).order('date'),
    supabase.from('salary_expenses').select('*').eq('period_id', periodId).order('date'),
    supabase.from('toll_fee_refunds').select('*').eq('period_id', periodId).order('date'),
  ])

  for (const result of [salesRes, purchasesRes, dieselRes, salaryRes, tollRes]) {
    if (result.error) throw result.error
  }

  const sales = (salesRes.data ?? []) as Sale[]
  const purchases = (purchasesRes.data ?? []) as PurchaseExpense[]
  const diesel = (dieselRes.data ?? []) as DieselExpense[]
  const salary = (salaryRes.data ?? []) as SalaryExpense[]
  const toll = (tollRes.data ?? []) as TollFeeRefund[]

  const totals = computePL({
    sales: sumAmounts(sales),
    purchases: sumAmounts(purchases),
    diesel: sumAmounts(diesel),
    salary: sumAmounts(salary),
    toll: sumAmounts(toll),
  })

  return {
    year: period.year,
    month: period.month,
    sales: sales.map((row, index) => ({
      date: row.date,
      plate_code: row.plate_code,
      customer: row.customer,
      delivery_site: row.delivery_site,
      trips: row.trips,
      amount: row.amount,
      sourceRow: index + 1,
    })),
    purchases: purchases.map((row, index) => ({
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
      sourceRow: index + 1,
    })),
    diesel: diesel.map((row, index) => ({
      date: row.date,
      po_number: row.po_number,
      plate_code: row.plate_code,
      supplier: row.supplier,
      description: row.description,
      qty: row.qty,
      unit: row.unit,
      unit_price: row.unit_price,
      amount: row.amount,
      sourceRow: index + 1,
    })),
    salary: salary.map((row, index) => ({
      date: row.date,
      plate_code: row.plate_code,
      cost_center_code: row.cost_center_code,
      employee: row.employee,
      remarks: row.remarks,
      amount: row.amount,
      sourceRow: index + 1,
    })),
    toll: toll.map((row, index) => ({
      date: row.date,
      plate_code: row.plate_code,
      delivery_site: row.delivery_site,
      amount: row.amount,
      sourceRow: index + 1,
    })),
    totals: {
      sales: totals.sales,
      purchases: totals.purchases,
      diesel: totals.diesel,
      salary: totals.salary,
      toll: totals.tollFeeRefund,
      net: totals.net,
      ratios: totals.ratios,
    },
  }
}
