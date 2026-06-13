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

export function allDeliverySiteOptions(presets: CustomerDeliverySite[]): string[] {
  const sites = new Set<string>()

  for (const preset of presets) {
    const site = preset.delivery_site.trim()
    if (site) sites.add(site)
  }

  return [...sites].sort((a, b) => a.localeCompare(b))
}

export function formatCustomerDeliverySite(preset: CustomerDeliverySite): string {
  return `${preset.customer_name} — ${preset.delivery_site}`
}

export function customerDeliverySiteSelectOptions(
  presets: CustomerDeliverySite[],
): { value: string; label: string }[] {
  return [...presets]
    .sort((a, b) => {
      const byCustomer = a.customer_name.localeCompare(b.customer_name)
      return byCustomer !== 0 ? byCustomer : a.delivery_site.localeCompare(b.delivery_site)
    })
    .map((preset) => {
      const label = formatCustomerDeliverySite(preset)
      return { value: label, label }
    })
}

export function customerDeliverySiteComboboxOptions(presets: CustomerDeliverySite[]): string[] {
  return customerDeliverySiteSelectOptions(presets).map((option) => option.label)
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
