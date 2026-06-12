import type { CustomerDeliverySite } from '@/types/database'

function normalize(value: string): string {
  return value.trim().toUpperCase()
}

export function deliverySitesForCustomer(
  presets: CustomerDeliverySite[],
  customerName: string,
): CustomerDeliverySite[] {
  const customer = normalize(customerName)
  if (!customer) return []

  return presets
    .filter((preset) => normalize(preset.customer_name) === customer)
    .sort((a, b) => a.delivery_site.localeCompare(b.delivery_site))
}

export function deliverySiteOptionsForCustomer(
  presets: CustomerDeliverySite[],
  customerName: string,
): string[] {
  return deliverySitesForCustomer(presets, customerName).map((preset) => preset.delivery_site)
}

export function findPresetForDeliverySite(
  presets: CustomerDeliverySite[],
  customerName: string,
  deliverySite: string,
): CustomerDeliverySite | null {
  const customer = normalize(customerName)
  const site = normalize(deliverySite)
  if (!customer || !site) return null

  return (
    presets.find(
      (preset) =>
        normalize(preset.customer_name) === customer && normalize(preset.delivery_site) === site,
    ) ?? null
  )
}
