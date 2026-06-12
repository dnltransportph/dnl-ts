import type { Cell, CellValue } from 'exceljs'
import { format } from 'date-fns'
import { COST_CENTER_CODES } from './constants'
import { normalizeCostCenter, normalizePlate, normalizePoNumber } from '@/lib/validation'

export function rawCellValue(value: CellValue | null | undefined): unknown {
  if (value == null) return null
  if (typeof value === 'object') {
    if ('result' in value && value.result != null) return value.result
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join('')
    }
    if (value instanceof Date) return value
  }
  return value
}

export function cellText(cell: Cell): string | null {
  const value = rawCellValue(cell.value)
  if (value == null) return null
  const text = String(value).trim()
  return text || null
}

export function cellNumber(cell: Cell): number | null {
  const value = rawCellValue(cell.value)
  if (value == null || value === '') return null
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const parsed = Number(String(value).replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

export function cellDate(cell: Cell): string | null {
  const value = rawCellValue(cell.value)
  if (value == null || value === '') return null

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return format(value, 'yyyy-MM-dd')
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const utcDays = Math.floor(value - 25569)
    const date = new Date(utcDays * 86400 * 1000)
    if (!Number.isNaN(date.getTime())) return format(date, 'yyyy-MM-dd')
  }

  const text = String(value).trim()
  const isoMatch = text.match(/^(\d{4}-\d{2}-\d{2})/)
  if (isoMatch) return isoMatch[1]

  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) return format(parsed, 'yyyy-MM-dd')

  return null
}

export function isTotalRow(values: (string | null)[]): boolean {
  const joined = values.filter(Boolean).join(' ').toUpperCase()
  return joined.includes('TOTAL') || joined.includes('TTL')
}

export function isSumFormulaCell(cell: Cell): boolean {
  const value = cell.value
  if (!value || typeof value !== 'object' || !('formula' in value) || !value.formula) {
    return false
  }
  return String(value.formula).toUpperCase().includes('SUM')
}

export function splitPlateOrCostCenter(value: string | null | undefined): {
  plate_code: string | null
  cost_center_code: string | null
} {
  const normalized = value?.trim().toUpperCase() ?? null
  if (!normalized) return { plate_code: null, cost_center_code: null }
  if (COST_CENTER_CODES.has(normalized)) {
    return { plate_code: null, cost_center_code: normalizeCostCenter(normalized) }
  }
  return { plate_code: normalizePlate(value), cost_center_code: null }
}

export function textOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed || null
}

export function poOrNull(value: string | null | undefined): string | null {
  return normalizePoNumber(value)
}

export function periodDateFromParts(year: number, month: number): Date {
  return new Date(year, month - 1, 1)
}

export function downloadBuffer(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
