export type ImportSeverity = 'warning' | 'error'

export interface ImportIssue {
  sheet: string
  row: number
  message: string
  severity: ImportSeverity
}

export interface ParsedSaleRow {
  date: string
  plate_code: string | null
  customer: string | null
  delivery_site: string | null
  trips: number | null
  amount: number
  sourceRow: number
}

export interface ParsedPurchaseRow {
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
  sourceRow: number
}

export interface ParsedDieselRow {
  date: string
  po_number: string | null
  plate_code: string | null
  supplier: string | null
  description: string | null
  qty: number | null
  unit: string | null
  unit_price: number | null
  amount: number
  sourceRow: number
}

export interface ParsedSalaryRow {
  date: string
  plate_code: string | null
  cost_center_code: string | null
  employee: string | null
  remarks: string | null
  amount: number
  sourceRow: number
}

export interface ParsedTollRow {
  date: string
  plate_code: string | null
  delivery_site: string | null
  amount: number
  sourceRow: number
}

export interface ParsedWorkbook {
  detectedYear: number
  detectedMonth: number
  sales: ParsedSaleRow[]
  purchases: ParsedPurchaseRow[]
  diesel: ParsedDieselRow[]
  salary: ParsedSalaryRow[]
  toll: ParsedTollRow[]
  issues: ImportIssue[]
}

export interface ImportCounts {
  sales: number
  purchases: number
  diesel: number
  salary: number
  toll: number
}

export interface PeriodExportData {
  year: number
  month: number
  sales: ParsedSaleRow[]
  purchases: ParsedPurchaseRow[]
  diesel: ParsedDieselRow[]
  salary: ParsedSalaryRow[]
  toll: ParsedTollRow[]
  totals: {
    sales: number
    purchases: number
    diesel: number
    salary: number
    toll: number
    net: number
    ratios: {
      purchases: number
      salary: number
      diesel: number
    }
  }
}
