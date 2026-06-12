import { format, parseISO } from 'date-fns'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatPeriodLabel(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), 'MMMM yyyy')
}

export function formatDate(value: string): string {
  return format(parseISO(value), 'MMM d, yyyy')
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return ''
  return value.slice(0, 10)
}
