import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Autocomplete,
  Group,
  Modal,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { supabase } from '@/lib/supabase'
import { usePeriod } from '@/hooks/usePeriod'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { TransactionStatsGrid } from '@/components/TransactionStatsGrid'
import { TableFilterBar } from '@/components/TableFilterBar'
import { formatCurrency, formatDate } from '@/lib/format'
import { hasActiveTableFilters, matchesTableFilters, type TableFilterState } from '@/lib/tableFilters'
import { useMemo, useState, type CSSProperties, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from 'react'

const DATE_COLUMN_STYLE: CSSProperties = {
  whiteSpace: 'nowrap',
  minWidth: '7.5rem',
}

export interface ColumnDef<T> {
  key: keyof T & string
  label: string
  render?: (row: T) => ReactNode
  inputType?: 'text' | 'number' | 'date' | 'select' | 'combobox'
  selectOptions?: { value: string; label: string }[]
  comboboxOptions?: (form: Record<string, string>) => string[]
  required?: boolean
  align?: 'left' | 'right' | 'center'
}

export type FormFieldChangeHandler = (
  key: string,
  value: string,
  form: Record<string, string>,
  setForm: Dispatch<SetStateAction<Record<string, string>>>,
) => void

interface TransactionModuleProps<T extends { id: string; amount: number; date: string }> {
  title: string
  table: string
  columns: ColumnDef<T>[]
  emptyForm: Omit<T, 'id' | 'created_at' | 'updated_at'>
  normalize?: (form: Record<string, string>) => Record<string, unknown>
  validate?: (form: Record<string, string>) => string | null
  onFieldChange?: FormFieldChangeHandler
}

export function TransactionModule<T extends { id: string; amount: number; date: string }>({
  title,
  table,
  columns,
  normalize,
  validate,
  onFieldChange,
}: TransactionModuleProps<T>) {
  const { selectedPeriod, isPeriodClosed } = usePeriod()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<Record<string, string>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false)
  const [filters, setFilters] = useState<TableFilterState>({ search: '', selects: {} })

  const periodId = selectedPeriod?.id
  const readOnly = isPeriodClosed

  const { data: rows = [], isLoading } = useQuery({
    queryKey: [table, periodId],
    queryFn: async () => {
      const { data, error: fetchError } = await supabase
        .from(table)
        .select('*')
        .eq('period_id', periodId!)
        .order('date', { ascending: true })

      if (fetchError) throw fetchError
      return (data ?? []) as T[]
    },
    enabled: Boolean(periodId),
  })

  const resetForm = () => {
    setForm({})
    setEditingId(null)
    setError(null)
    closeModal()
  }

  const startAdd = () => {
    setForm({})
    setEditingId(null)
    setError(null)
    openModal()
  }

  const startEdit = (row: T) => {
    if (readOnly) return
    const next: Record<string, string> = {}
    for (const col of columns) {
      const value = row[col.key]
      next[col.key] = value == null ? '' : String(value)
    }
    setForm(next)
    setEditingId(row.id)
    setError(null)
    openModal()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!periodId || readOnly) return

    const validationError = validate?.(form)
    if (validationError) {
      setError(validationError)
      return
    }

    setSaving(true)
    setError(null)

    const payload = normalize ? normalize(form) : form
    const record = { ...payload, period_id: periodId }

    const result = editingId
      ? await supabase.from(table).update(record).eq('id', editingId)
      : await supabase.from(table).insert(record)

    setSaving(false)

    if (result.error) {
      setError(result.error.message)
      return
    }

    await queryClient.invalidateQueries({ queryKey: [table, periodId] })
    await queryClient.invalidateQueries({ queryKey: ['pl-totals', periodId] })
    await queryClient.invalidateQueries({ queryKey: ['report-data', periodId] })
    await queryClient.invalidateQueries({ queryKey: ['audit-log', periodId] })
    resetForm()
  }

  const handleDelete = async (id: string) => {
    if (!periodId || readOnly || !confirm('Delete this entry?')) return

    const { error: deleteError } = await supabase.from(table).delete().eq('id', id)
    if (deleteError) {
      setError(deleteError.message)
      return
    }

    await queryClient.invalidateQueries({ queryKey: [table, periodId] })
    await queryClient.invalidateQueries({ queryKey: ['pl-totals', periodId] })
    await queryClient.invalidateQueries({ queryKey: ['report-data', periodId] })
    await queryClient.invalidateQueries({ queryKey: ['audit-log', periodId] })
    if (editingId === id) resetForm()
  }

  const filteredRows = useMemo(
    () =>
      rows.filter((row) =>
        matchesTableFilters(row, columns, filters, {
          date: formatDate,
          currency: formatCurrency,
        }),
      ),
    [rows, columns, filters],
  )

  const total = filteredRows.reduce((sum, row) => sum + (row.amount ?? 0), 0)
  const filtersActive = hasActiveTableFilters(filters)

  const clearFilters = () => setFilters({ search: '', selects: {} })

  const renderField = (col: ColumnDef<T>) => {
    const label = `${col.label}${col.required ? ' *' : ''}`

    const applyFieldChange = (key: string, value: string) => {
      if (onFieldChange) {
        onFieldChange(key, value, { ...form, [key]: value }, setForm)
        return
      }
      setForm((prev) => ({ ...prev, [key]: value }))
    }

    if (col.inputType === 'select' && col.selectOptions) {
      const currentValue = form[col.key] ?? ''
      const options =
        currentValue && !col.selectOptions.some((option) => option.value === currentValue)
          ? [...col.selectOptions, { value: currentValue, label: currentValue }]
          : col.selectOptions

      return (
        <Select
          label={label}
          value={currentValue}
          onChange={(e) => applyFieldChange(col.key, e.target.value)}
          options={options}
          disabled={readOnly}
        />
      )
    }

    if (col.inputType === 'combobox') {
      return (
        <Autocomplete
          label={label}
          value={form[col.key] ?? ''}
          data={col.comboboxOptions?.(form) ?? []}
          onChange={(value) => applyFieldChange(col.key, value)}
          disabled={readOnly}
          size="sm"
        />
      )
    }

    if (col.inputType === 'number') {
      return (
        <NumberInput
          label={label}
          value={form[col.key] ? Number(form[col.key]) : ''}
          onChange={(value) =>
            applyFieldChange(col.key, value == null ? '' : String(value))
          }
          disabled={readOnly}
          size="sm"
          min={0}
          decimalScale={2}
          fixedDecimalScale={col.key === 'trips'}
        />
      )
    }

    return (
      <TextInput
        label={label}
        type={col.inputType ?? 'text'}
        value={form[col.key] ?? ''}
        onChange={(e) => applyFieldChange(col.key, e.target.value)}
        required={col.required}
        disabled={readOnly}
        size="sm"
      />
    )
  }

  return (
    <Stack gap="lg" w="100%">
      <Stack gap="md">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Title order={2}>{title}</Title>
          {!readOnly && (
            <Button type="button" onClick={startAdd}>
              Add entry
            </Button>
          )}
        </Group>
        <TransactionStatsGrid
          entryCount={filteredRows.length}
          total={total}
          filtered={filtersActive}
          totalEntries={rows.length}
        />
      </Stack>

      {readOnly && (
        <Alert color="yellow">
          This period is closed. Entries are read-only. Reopen the period from the header to make
          changes.
        </Alert>
      )}

      {!readOnly && (
        <Modal
          opened={modalOpened}
          onClose={resetForm}
          title={editingId ? 'Edit entry' : 'Add entry'}
          centered
          overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
          size="lg"
        >
          <form onSubmit={handleSubmit}>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
              {columns.map((col) => (
                <div key={col.key}>{renderField(col)}</div>
              ))}
            </SimpleGrid>
            {error && (
              <Text size="sm" c="red" mt="sm">
                {error}
              </Text>
            )}
            <Group gap="sm" mt="md" justify="flex-end">
              <Button type="button" variant="secondary" onClick={resetForm} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Update' : 'Add'}
              </Button>
            </Group>
          </form>
        </Modal>
      )}

      <Paper withBorder shadow="sm" w="100%">
        {!isLoading && rows.length > 0 && (
          <TableFilterBar
            columns={columns}
            filters={filters}
            onSearchChange={(search) => setFilters((prev) => ({ ...prev, search }))}
            onSelectChange={(key, value) =>
              setFilters((prev) => ({
                ...prev,
                selects: { ...prev.selects, [key]: value },
              }))
            }
            onClear={clearFilters}
            filteredCount={filteredRows.length}
            totalCount={rows.length}
          />
        )}
        <Table.ScrollContainer minWidth={600} w="100%">
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                {columns.map((col) => (
                  <Table.Th
                    key={col.key}
                    ta={col.align}
                    style={col.key === 'date' ? DATE_COLUMN_STYLE : undefined}
                  >
                    {col.label}
                  </Table.Th>
                ))}
                {!readOnly && <Table.Th ta="right">Actions</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading && (
                <Table.Tr>
                  <Table.Td colSpan={columns.length + (readOnly ? 0 : 1)} ta="center" c="dimmed">
                    Loading…
                  </Table.Td>
                </Table.Tr>
              )}
              {!isLoading && rows.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={columns.length + (readOnly ? 0 : 1)} ta="center" c="dimmed">
                    No entries yet.
                  </Table.Td>
                </Table.Tr>
              )}
              {!isLoading && rows.length > 0 && filteredRows.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={columns.length + (readOnly ? 0 : 1)} ta="center" c="dimmed">
                    No entries match your filters.
                  </Table.Td>
                </Table.Tr>
              )}
              {filteredRows.map((row) => (
                <Table.Tr key={row.id}>
                  {columns.map((col) => (
                    <Table.Td
                      key={col.key}
                      ta={col.align}
                      style={col.key === 'date' ? DATE_COLUMN_STYLE : undefined}
                    >
                      {col.render
                        ? col.render(row)
                        : col.key === 'date'
                          ? formatDate(String(row[col.key]))
                          : col.key === 'amount'
                            ? formatCurrency(Number(row[col.key]))
                            : String(row[col.key] ?? '—')}
                    </Table.Td>
                  ))}
                  {!readOnly && (
                    <Table.Td ta="right" style={{ whiteSpace: 'nowrap' }}>
                      <Button variant="ghost" size="sm" onClick={() => startEdit(row)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(row.id)}>
                        Delete
                      </Button>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>
    </Stack>
  )
}

export function baseValidators(form: Record<string, string>): string | null {
  if (!form.date?.trim()) return 'Date is required.'
  const amount = Number(form.amount)
  if (!Number.isFinite(amount) || amount < 0) return 'Amount is required and must be ≥ 0.'
  return null
}
