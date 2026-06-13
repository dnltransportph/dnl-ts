export interface FilterableColumn {
  key: string
  label: string
  inputType?: 'text' | 'number' | 'date' | 'select' | 'combobox'
  selectOptions?:
    | { value: string; label: string }[]
    | ((form: Record<string, string>) => { value: string; label: string }[])
}

export interface TableFilterState {
  search: string
  selects: Record<string, string>
}

interface RowFormatters {
  date?: (value: string) => string
  currency?: (value: number) => string
}

export function getRowSearchText<T extends Record<string, unknown>>(
  row: T,
  col: FilterableColumn,
  formatters?: RowFormatters,
): string {
  const value = row[col.key]
  if (value == null) return ''

  if (col.key === 'date' && formatters?.date) {
    return formatters.date(String(value))
  }

  if (col.key === 'amount' && formatters?.currency) {
    return formatters.currency(Number(value))
  }

  return String(value)
}

export function matchesTableFilters<T extends Record<string, unknown>>(
  row: T,
  columns: FilterableColumn[],
  filters: TableFilterState,
  formatters?: RowFormatters,
): boolean {
  const search = filters.search.trim().toLowerCase()
  if (search) {
    const haystack = columns
      .map((col) => getRowSearchText(row, col, formatters))
      .join(' ')
      .toLowerCase()
    if (!haystack.includes(search)) return false
  }

  for (const col of columns) {
    if (col.inputType !== 'select') continue
    const selected = filters.selects[col.key]
    if (!selected) continue
    const cellValue = row[col.key]
    if (cellValue == null || String(cellValue) !== selected) return false
  }

  return true
}

export function hasActiveTableFilters(filters: TableFilterState): boolean {
  if (filters.search.trim()) return true
  return Object.values(filters.selects).some(Boolean)
}
