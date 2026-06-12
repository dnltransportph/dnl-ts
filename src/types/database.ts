export type PeriodStatus = 'open' | 'closed'

export interface Period {
  id: string
  year: number
  month: number
  status: PeriodStatus
  closed_at: string | null
  closed_by: string | null
  created_at: string
}

export interface MasterRecord {
  id: string
  code?: string
  name?: string
  created_at: string
}

export interface Plate {
  id: string
  code: string
  created_at: string
}

export interface CostCenter {
  id: string
  code: string
  created_at: string
}

export interface Customer {
  id: string
  name: string
  created_at: string
}

export interface Supplier {
  id: string
  name: string
  created_at: string
}

export interface Employee {
  id: string
  name: string
  created_at: string
}

export interface CustomerDeliverySite {
  id: string
  customer_id: string
  customer_name: string
  delivery_site: string
  trips: number
  amount: number
  created_at: string
}

export type AuditAction = 'insert' | 'update' | 'delete'

export interface AuditLogEntry {
  id: string
  user_id: string | null
  user_email: string | null
  table_name: string
  record_id: string | null
  period_id: string | null
  action: AuditAction
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  created_at: string
}

export interface TruckReportRow {
  plateCode: string
  sales: number
  toll: number
  purchases: number
  diesel: number
  salary: number
  net: number
}

export interface CategoryBreakdownRow {
  category: string
  label: string
  amount: number
  pctOfSales: number | null
}

export interface Sale {
  id: string
  period_id: string
  date: string
  plate_code: string | null
  customer: string | null
  delivery_site: string | null
  trips: number | null
  amount: number
  created_at: string
  updated_at: string
}

export interface PurchaseExpense {
  id: string
  period_id: string
  date: string
  po_number: string | null
  plate_code: string | null
  cost_center_code: string | null
  supplier: string | null
  description: string | null
  qty: number | null
  unit: string | null
  unit_price: number | null
  amount: number
  created_at: string
  updated_at: string
}

export interface DieselExpense {
  id: string
  period_id: string
  date: string
  po_number: string | null
  plate_code: string | null
  supplier: string | null
  description: string | null
  qty: number | null
  unit: string | null
  unit_price: number | null
  amount: number
  created_at: string
  updated_at: string
}

export interface SalaryExpense {
  id: string
  period_id: string
  date: string
  plate_code: string | null
  cost_center_code: string | null
  employee: string | null
  remarks: string | null
  amount: number
  created_at: string
  updated_at: string
}

export interface TollFeeRefund {
  id: string
  period_id: string
  date: string
  plate_code: string | null
  delivery_site: string | null
  amount: number
  created_at: string
  updated_at: string
}

export interface PLTotals {
  sales: number
  toll: number
  purchases: number
  salary: number
  diesel: number
}

export interface PLResult {
  sales: number
  tollFeeRefund: number
  purchases: number
  salary: number
  diesel: number
  net: number
  ratios: {
    purchases: number
    salary: number
    diesel: number
  }
}

export type TransactionTable =
  | 'sales'
  | 'purchase_expenses'
  | 'diesel_expenses'
  | 'salary_expenses'
  | 'toll_fee_refunds'
