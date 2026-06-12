export function normalizePlate(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  return value.trim().toUpperCase()
}

export function normalizePoNumber(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const trimmed = value.trim()
  if (trimmed.toLowerCase() === 'cash') return 'CASH'
  return trimmed
}

export function normalizeCostCenter(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  return value.trim().toUpperCase()
}

export function parseOptionalNumber(value: string): number | null {
  if (!value.trim()) return null
  const num = Number(value)
  return Number.isFinite(num) ? num : null
}

export function parseRequiredNumber(value: string): number | null {
  if (!value.trim()) return null
  const num = Number(value)
  if (!Number.isFinite(num) || num < 0) return null
  return num
}

export function resolveAmount(
  amountStr: string,
  qtyStr: string,
  unitPriceStr: string,
): number | null {
  const direct = parseRequiredNumber(amountStr)
  if (direct !== null) return direct

  const qty = parseOptionalNumber(qtyStr)
  const unitPrice = parseOptionalNumber(unitPriceStr)
  if (qty !== null && unitPrice !== null && qty >= 0 && unitPrice >= 0) {
    return qty * unitPrice
  }

  return null
}
