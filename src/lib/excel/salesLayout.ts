import { startOfWeek, format } from 'date-fns'
import type { ParsedSaleRow } from './types'

/** Per-plate amount columns on the SALES sheet (matches May 2026 workbook layout). */
export const SALES_PLATE_AMOUNT_COLUMNS: Record<string, number> = {
  PGJ736: 7, // G
  NCS129: 8, // H
  UNM562: 9, // I
  UFJ992: 10, // J
}

export const SALES_PLATE_COLUMN_ORDER = ['PGJ736', 'NCS129', 'UNM562', 'UFJ992'] as const

export function normalizePlateCode(plateCode: string | null): string | null {
  if (!plateCode) return null
  return plateCode.trim().toUpperCase()
}

export function plateAmountColumn(plateCode: string | null): number | null {
  const normalized = normalizePlateCode(plateCode)
  if (!normalized) return null
  return SALES_PLATE_AMOUNT_COLUMNS[normalized] ?? null
}

export function sumSalesByPlate(sales: ParsedSaleRow[]): Record<string, number> {
  const totals: Record<string, number> = {}
  for (const sale of sales) {
    const plate = normalizePlateCode(sale.plate_code)
    if (!plate || !(plate in SALES_PLATE_AMOUNT_COLUMNS)) continue
    totals[plate] = (totals[plate] ?? 0) + sale.amount
  }
  return totals
}

function weekKey(dateStr: string): string {
  return format(startOfWeek(new Date(dateStr + 'T00:00:00'), { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

/** Last sale index in each calendar week (Mon–Sun) receives that week's total in column K. */
export function weeklyTotalsBySaleIndex(sales: ParsedSaleRow[]): Map<number, number> {
  const result = new Map<number, number>()
  if (sales.length === 0) return result

  let weekStart = 0
  for (let i = 1; i <= sales.length; i++) {
    const isLastRow = i === sales.length
    const weekChanged = !isLastRow && weekKey(sales[i].date) !== weekKey(sales[weekStart].date)
    if (!isLastRow && !weekChanged) continue

    const weekSum = sales.slice(weekStart, i).reduce((sum, row) => sum + row.amount, 0)
    result.set(i - 1, weekSum)
    weekStart = i
  }

  return result
}

export function salesPlateAmountCells(
  sale: ParsedSaleRow,
): [number | null, number | null, number | null, number | null] {
  const plateCol = plateAmountColumn(sale.plate_code)
  return [
    plateCol === 7 ? sale.amount : null,
    plateCol === 8 ? sale.amount : null,
    plateCol === 9 ? sale.amount : null,
    plateCol === 10 ? sale.amount : null,
  ]
}
