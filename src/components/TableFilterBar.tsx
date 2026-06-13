import { IconSearch } from '@tabler/icons-react'
import { Group, NativeSelect, Stack, Text, TextInput } from '@mantine/core'
import { Button } from '@/components/ui/Button'
import { insetDividerBottom } from '@/components/layout/contentLayout'
import type { FilterableColumn, TableFilterState } from '@/lib/tableFilters'
import { hasActiveTableFilters } from '@/lib/tableFilters'

interface TableFilterBarProps {
  columns: FilterableColumn[]
  filters: TableFilterState
  onSearchChange: (value: string) => void
  onSelectChange: (key: string, value: string) => void
  onClear: () => void
  filteredCount: number
  totalCount: number
}

export function TableFilterBar({
  columns,
  filters,
  onSearchChange,
  onSelectChange,
  onClear,
  filteredCount,
  totalCount,
}: TableFilterBarProps) {
  const selectColumns = columns.filter(
    (col) => col.inputType === 'select' && col.selectOptions && Array.isArray(col.selectOptions),
  )
  const active = hasActiveTableFilters(filters)

  return (
    <Stack gap="sm" p="md" style={insetDividerBottom}>
      <Group justify="space-between" align="center" wrap="wrap" gap="sm">
        <Text size="sm" fw={600}>
          Filters
        </Text>
        <Text size="xs" c="dimmed">
          {active
            ? `Showing ${filteredCount} of ${totalCount} entries`
            : `${totalCount} ${totalCount === 1 ? 'entry' : 'entries'}`}
        </Text>
      </Group>

      <Group align="flex-end" wrap="wrap" gap="sm">
        <TextInput
          placeholder="Search all columns…"
          value={filters.search}
          onChange={(e) => onSearchChange(e.target.value)}
          leftSection={<IconSearch size={16} stroke={1.5} />}
          style={{ flex: 1, minWidth: '14rem' }}
          size="sm"
        />

        {selectColumns.map((col) => {
          const options = Array.isArray(col.selectOptions) ? col.selectOptions : []

          return (
            <NativeSelect
              key={col.key}
              label={col.label}
              value={filters.selects[col.key] ?? ''}
              onChange={(e) => onSelectChange(col.key, e.target.value)}
              data={[
                { value: '', label: `All ${col.label.toLowerCase()}` },
                ...options,
              ]}
              size="sm"
              style={{ minWidth: '10rem' }}
            />
          )
        })}

        {active && (
          <Button variant="secondary" size="sm" onClick={onClear}>
            Clear
          </Button>
        )}
      </Group>
    </Stack>
  )
}
