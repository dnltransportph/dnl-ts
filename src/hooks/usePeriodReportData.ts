import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { computeCategoryBreakdown, computeTruckReport } from '@/lib/reports'
import type {
  DieselExpense,
  PurchaseExpense,
  SalaryExpense,
  Sale,
  TollFeeRefund,
} from '@/types/database'

export function usePeriodReportData(periodId: string | undefined) {
  return useQuery({
    queryKey: ['report-data', periodId],
    queryFn: async () => {
      const [salesRes, purchasesRes, dieselRes, salaryRes, tollRes, platesRes] =
        await Promise.all([
          supabase.from('sales').select('*').eq('period_id', periodId!),
          supabase.from('purchase_expenses').select('*').eq('period_id', periodId!),
          supabase.from('diesel_expenses').select('*').eq('period_id', periodId!),
          supabase.from('salary_expenses').select('*').eq('period_id', periodId!),
          supabase.from('toll_fee_refunds').select('*').eq('period_id', periodId!),
          supabase.from('plates').select('code').order('code'),
        ])

      for (const result of [salesRes, purchasesRes, dieselRes, salaryRes, tollRes, platesRes]) {
        if (result.error) throw result.error
      }

      const rows = {
        sales: (salesRes.data ?? []) as Sale[],
        purchases: (purchasesRes.data ?? []) as PurchaseExpense[],
        diesel: (dieselRes.data ?? []) as DieselExpense[],
        salary: (salaryRes.data ?? []) as SalaryExpense[],
        toll: (tollRes.data ?? []) as TollFeeRefund[],
      }

      const knownPlates = (platesRes.data ?? []).map((p) => p.code)

      return {
        truckReport: computeTruckReport(rows, knownPlates),
        categoryBreakdown: computeCategoryBreakdown(rows),
      }
    },
    enabled: Boolean(periodId),
  })
}
