import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { sumAmounts } from '@/lib/pl'
import type { PLTotals } from '@/types/database'

async function fetchTotals(periodId: string): Promise<PLTotals> {
  const [sales, purchases, diesel, salary, toll] = await Promise.all([
    supabase.from('sales').select('amount').eq('period_id', periodId),
    supabase.from('purchase_expenses').select('amount').eq('period_id', periodId),
    supabase.from('diesel_expenses').select('amount').eq('period_id', periodId),
    supabase.from('salary_expenses').select('amount').eq('period_id', periodId),
    supabase.from('toll_fee_refunds').select('amount').eq('period_id', periodId),
  ])

  for (const result of [sales, purchases, diesel, salary, toll]) {
    if (result.error) throw result.error
  }

  return {
    sales: sumAmounts(sales.data ?? []),
    purchases: sumAmounts(purchases.data ?? []),
    diesel: sumAmounts(diesel.data ?? []),
    salary: sumAmounts(salary.data ?? []),
    toll: sumAmounts(toll.data ?? []),
  }
}

export function usePLTotals(periodId: string | undefined) {
  return useQuery({
    queryKey: ['pl-totals', periodId],
    queryFn: () => fetchTotals(periodId!),
    enabled: Boolean(periodId),
  })
}
