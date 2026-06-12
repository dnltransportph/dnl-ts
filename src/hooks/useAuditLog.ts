import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AuditLogEntry } from '@/types/database'

export function useAuditLog(periodId: string | undefined, limit = 200) {
  return useQuery({
    queryKey: ['audit-log', periodId, limit],
    queryFn: async () => {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (periodId) {
        query = query.eq('period_id', periodId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as AuditLogEntry[]
    },
    enabled: Boolean(periodId),
  })
}

export const TABLE_LABELS: Record<string, string> = {
  sales: 'Sales',
  purchase_expenses: 'Purchases & Expenses',
  diesel_expenses: 'Diesel',
  salary_expenses: 'Salary',
  toll_fee_refunds: 'Toll Fee Refund',
}

export const ACTION_LABELS: Record<string, string> = {
  insert: 'Added',
  update: 'Updated',
  delete: 'Deleted',
}

export function summarizeAuditChange(entry: AuditLogEntry): string {
  const data = entry.action === 'delete' ? entry.old_data : entry.new_data
  if (!data) return '—'

  const amount = data.amount
  const date = data.date
  const parts: string[] = []

  if (date) parts.push(String(date))
  if (amount != null) parts.push(`₱${Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`)

  const plate = data.plate_code ?? data.cost_center_code
  if (plate) parts.push(String(plate))

  const person = data.customer ?? data.supplier ?? data.employee
  if (person) parts.push(String(person))

  return parts.length > 0 ? parts.join(' · ') : '—'
}
