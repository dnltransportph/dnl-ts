import { useMasterData } from '@/hooks/useMasterData'
import { useQueryClient } from '@tanstack/react-query'
import {
  Autocomplete,
  Group,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { settingsGridProps } from '@/components/layout/contentLayout'
import { formatCurrency } from '@/lib/format'
import type { CustomerDeliverySite } from '@/types/database'

type MasterTable = 'plates' | 'cost_centers' | 'customers' | 'suppliers' | 'employees'

interface MasterSectionProps {
  title: string
  table: MasterTable
  valueField: 'code' | 'name'
  placeholder: string
  items: { id: string; code?: string; name?: string }[]
  loading: boolean
}

function MasterSection({
  title,
  table,
  valueField,
  placeholder,
  items,
  loading,
}: MasterSectionProps) {
  const queryClient = useQueryClient()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: [table] })
  }

  const handleAdd = async () => {
    const trimmed = value.trim()
    if (!trimmed) return

    setSaving(true)
    setError(null)

    const { error: insertError } =
      valueField === 'code'
        ? await supabase.from(table).insert({ code: trimmed.toUpperCase() })
        : await supabase.from(table).insert({ name: trimmed })
    setSaving(false)

    if (insertError) {
      setError(insertError.message.includes('unique') ? 'Already exists.' : insertError.message)
      return
    }

    setValue('')
    await invalidate()
  }

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Remove "${label}" from the list? Existing transactions keep their values.`)) return

    const { error: deleteError } = await supabase.from(table).delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }
    await invalidate()
  }

  const getLabel = (item: { code?: string; name?: string }) =>
    valueField === 'code' ? item.code ?? '' : item.name ?? ''

  return (
    <Paper component="section" withBorder shadow="sm" p="md">
      <Text size="sm" fw={600}>
        {title}
      </Text>
      <Text size="xs" c="dimmed" mt={4}>
        Used in dropdowns when entering transactions. Removing an item does not change past entries.
      </Text>

      <Group mt="sm" wrap="wrap" gap="sm">
        <TextInput
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, minWidth: '12rem' }}
          size="sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <Button size="sm" onClick={handleAdd} disabled={saving || !value.trim()}>
          Add
        </Button>
      </Group>

      {error && (
        <Text size="sm" c="red" mt="sm">
          {error}
        </Text>
      )}

      <Paper withBorder mt="md" radius="sm">
        {loading && (
          <Text px="sm" py="md" size="sm" c="dimmed">
            Loading…
          </Text>
        )}
        {!loading && items.length === 0 && (
          <Text px="sm" py="md" size="sm" c="dimmed">
            No items yet.
          </Text>
        )}
        {items.map((item, index) => {
          const label = getLabel(item)
          return (
            <Group
              key={item.id}
              justify="space-between"
              px="sm"
              py="xs"
              style={{
                borderTop: index > 0 ? '1px solid var(--mantine-color-default-border)' : undefined,
              }}
            >
              <Text size="sm">{label}</Text>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id, label)}>
                Remove
              </Button>
            </Group>
          )
        })}
      </Paper>
    </Paper>
  )
}

interface CustomerPresetGroup {
  customer_id: string
  customer_name: string
  presets: CustomerDeliverySite[]
}

function groupPresetsForDisplay(presets: CustomerDeliverySite[]): CustomerPresetGroup[] {
  const byCustomer = new Map<string, CustomerDeliverySite[]>()

  for (const preset of presets) {
    const group = byCustomer.get(preset.customer_id) ?? []
    group.push(preset)
    byCustomer.set(preset.customer_id, group)
  }

  return [...byCustomer.values()]
    .map((group) => ({
      customer_id: group[0].customer_id,
      customer_name: group[0].customer_name,
      presets: [...group].sort((a, b) => a.delivery_site.localeCompare(b.delivery_site)),
    }))
    .sort((a, b) => a.customer_name.localeCompare(b.customer_name))
}

interface CustomerDeliverySitesSectionProps {
  customers: { id: string; name: string }[]
  presets: CustomerDeliverySite[]
  loading: boolean
}

function CustomerDeliverySitesSection({
  customers,
  presets,
  loading,
}: CustomerDeliverySitesSectionProps) {
  const queryClient = useQueryClient()
  const [customerName, setCustomerName] = useState('')
  const [deliverySite, setDeliverySite] = useState('')
  const [trips, setTrips] = useState<number | ''>('')
  const [amount, setAmount] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const customerSuggestions = useMemo(
    () => customers.map((customer) => customer.name),
    [customers],
  )

  const groupedPresets = useMemo(() => groupPresetsForDisplay(presets), [presets])

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['customer_delivery_sites'] })
    await queryClient.invalidateQueries({ queryKey: ['customers'] })
  }

  const resolveCustomerId = async (name: string): Promise<{ id: string | null; error: string | null }> => {
    const trimmed = name.trim()
    const existing = customers.find(
      (customer) => customer.name.toUpperCase() === trimmed.toUpperCase(),
    )
    if (existing) return { id: existing.id, error: null }

    const { data, error: insertError } = await supabase
      .from('customers')
      .insert({ name: trimmed })
      .select('id')
      .single()

    if (insertError) {
      return {
        id: null,
        error: insertError.message.includes('unique') ? 'Customer already exists.' : insertError.message,
      }
    }

    return { id: data.id, error: null }
  }

  const handleAdd = async () => {
    const site = deliverySite.trim()
    const customer = customerName.trim()
    if (!customer || !site || trips === '' || amount === '') return

    setSaving(true)
    setError(null)

    const { id: customerId, error: customerError } = await resolveCustomerId(customer)
    if (customerError || !customerId) {
      setSaving(false)
      setError(customerError ?? 'Could not resolve customer.')
      return
    }

    const { error: insertError } = await supabase.from('customer_delivery_sites').insert({
      customer_id: customerId,
      delivery_site: site,
      trips,
      amount,
    })

    setSaving(false)

    if (insertError) {
      setError(insertError.message.includes('unique') ? 'Preset already exists.' : insertError.message)
      return
    }

    setDeliverySite('')
    setTrips('')
    setAmount('')
    await invalidate()
  }

  const handleDelete = async (preset: CustomerDeliverySite) => {
    const label = `${preset.customer_name} — ${preset.delivery_site}`
    if (!confirm(`Remove preset "${label}"? Existing sales entries keep their values.`)) return

    const { error: deleteError } = await supabase
      .from('customer_delivery_sites')
      .delete()
      .eq('id', preset.id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    await invalidate()
  }

  const canAdd =
    Boolean(customerName.trim()) &&
    Boolean(deliverySite.trim()) &&
    trips !== '' &&
    amount !== ''

  return (
    <Paper component="section" withBorder shadow="sm" p="md">
      <Text size="sm" fw={600}>
        Customer delivery sites
      </Text>
      <Text size="xs" c="dimmed" mt={4}>
        Presets for Sales: customer, delivery site, trips, and amount (column F). Picking a preset
        site fills trips and amount. New customers typed here are added automatically.
      </Text>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm" mt="sm">
        <Autocomplete
          label="Customer"
          value={customerName}
          onChange={setCustomerName}
          data={customerSuggestions}
          placeholder="Select or type customer"
          size="sm"
        />
        <TextInput
          label="Delivery site"
          value={deliverySite}
          onChange={(e) => setDeliverySite(e.target.value)}
          placeholder="e.g. QUEZON CITY"
          size="sm"
        />
        <NumberInput
          label="No. of trips"
          value={trips}
          onChange={(value) => {
            if (value === '' || value == null) {
              setTrips('')
              return
            }
            setTrips(typeof value === 'number' ? value : Number(value))
          }}
          min={0}
          decimalScale={2}
          size="sm"
        />
        <NumberInput
          label="Amount"
          value={amount}
          onChange={(value) => {
            if (value === '' || value == null) {
              setAmount('')
              return
            }
            setAmount(typeof value === 'number' ? value : Number(value))
          }}
          min={0}
          decimalScale={2}
          thousandSeparator=","
          size="sm"
        />
      </SimpleGrid>

      <Group mt="sm" justify="flex-end">
        <Button size="sm" onClick={handleAdd} disabled={saving || !canAdd}>
          Add preset
        </Button>
      </Group>

      {error && (
        <Text size="sm" c="red" mt="sm">
          {error}
        </Text>
      )}

      <Paper withBorder mt="md" radius="sm">
        {loading && (
          <Text px="sm" py="md" size="sm" c="dimmed">
            Loading…
          </Text>
        )}
        {!loading && groupedPresets.length === 0 && (
          <Text px="sm" py="md" size="sm" c="dimmed">
            No presets yet.
          </Text>
        )}
        {groupedPresets.map((group, index) => (
          <Stack
            key={group.customer_id}
            gap={2}
            px="sm"
            py={6}
            style={{
              borderTop: index > 0 ? '1px solid var(--mantine-color-default-border)' : undefined,
            }}
          >
            <Text size="sm" fw={600} lh={1.3}>
              {group.customer_name}
            </Text>
            {group.presets.map((preset) => (
              <Group key={preset.id} justify="space-between" align="center" wrap="nowrap" gap="xs">
                <Text size="sm" c="dimmed" lh={1.3} style={{ minWidth: 0 }}>
                  {preset.delivery_site} · {preset.trips} trip{preset.trips === 1 ? '' : 's'} ·{' '}
                  {formatCurrency(preset.amount)}
                </Text>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(preset)}>
                  Remove
                </Button>
              </Group>
            ))}
          </Stack>
        ))}
      </Paper>
    </Paper>
  )
}

interface SettingsPageProps {
  plates: { id: string; code: string }[]
  costCenters: { id: string; code: string }[]
  customers: { id: string; name: string }[]
  suppliers: { id: string; name: string }[]
  employees: { id: string; name: string }[]
  customerDeliverySites: CustomerDeliverySite[]
  loading: boolean
}

function SettingsPageContent({
  plates,
  costCenters,
  customers,
  suppliers,
  employees,
  customerDeliverySites,
  loading,
}: SettingsPageProps) {
  return (
    <Stack gap="lg" w="100%">
      <Stack gap={4}>
        <Title order={2}>Settings</Title>
        <Text size="sm" c="dimmed">
          Manage dropdown lists for plates, cost centers, customers, suppliers, employees, and sales
          delivery presets.
        </Text>
      </Stack>

      <SimpleGrid {...settingsGridProps}>
        <MasterSection
          title="Plates / Trucks"
          table="plates"
          valueField="code"
          placeholder="e.g. PGJ736"
          items={plates}
          loading={loading}
        />
        <MasterSection
          title="Cost Centers"
          table="cost_centers"
          valueField="code"
          placeholder="e.g. HOUSEHOLD"
          items={costCenters}
          loading={loading}
        />
        <MasterSection
          title="Customers"
          table="customers"
          valueField="name"
          placeholder="e.g. CLIMATECH"
          items={customers}
          loading={loading}
        />
        <MasterSection
          title="Suppliers"
          table="suppliers"
          valueField="name"
          placeholder="e.g. GLOBAL OIL"
          items={suppliers}
          loading={loading}
        />
        <MasterSection
          title="Employees"
          table="employees"
          valueField="name"
          placeholder="e.g. JUAN DELA CRUZ"
          items={employees}
          loading={loading}
        />
      </SimpleGrid>

      <CustomerDeliverySitesSection
        customers={customers}
        presets={customerDeliverySites}
        loading={loading}
      />
    </Stack>
  )
}

export function SettingsPage() {
  const { plates, costCenters, customers, suppliers, employees, customerDeliverySites } =
    useMasterData()

  const loading =
    plates.isLoading ||
    costCenters.isLoading ||
    customers.isLoading ||
    suppliers.isLoading ||
    employees.isLoading ||
    customerDeliverySites.isLoading

  return (
    <SettingsPageContent
      plates={plates.data ?? []}
      costCenters={costCenters.data ?? []}
      customers={customers.data ?? []}
      suppliers={suppliers.data ?? []}
      employees={employees.data ?? []}
      customerDeliverySites={customerDeliverySites.data ?? []}
      loading={loading}
    />
  )
}
