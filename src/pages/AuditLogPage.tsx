import { Badge, Group, NativeSelect, Paper, Stack, Table, Text, TextInput, Title } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { useMemo, useState } from 'react'
import { usePeriod } from '@/hooks/usePeriod'
import {
  ACTION_LABELS,
  TABLE_LABELS,
  summarizeAuditChange,
  useAuditLog,
} from '@/hooks/useAuditLog'
import { formatPeriodLabel } from '@/lib/format'
import { Button } from '@/components/ui/Button'
import { insetDividerBottom } from '@/components/layout/contentLayout'
import { format } from 'date-fns'

const actionBadgeColor: Record<string, string> = {
  delete: 'red',
  insert: 'green',
  update: 'blue',
}

export function AuditLogPage() {
  const { selectedPeriod } = usePeriod()
  const { data: entries = [], isLoading, error } = useAuditLog(selectedPeriod?.id)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [moduleFilter, setModuleFilter] = useState('')

  const moduleOptions = useMemo(() => {
    const names = [...new Set(entries.map((entry) => entry.table_name))].sort()
    return names.map((name) => ({
      value: name,
      label: TABLE_LABELS[name] ?? name,
    }))
  }, [entries])

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    return entries.filter((entry) => {
      if (actionFilter && entry.action !== actionFilter) return false
      if (moduleFilter && entry.table_name !== moduleFilter) return false
      if (!query) return true

      const haystack = [
        entry.user_email,
        ACTION_LABELS[entry.action] ?? entry.action,
        TABLE_LABELS[entry.table_name] ?? entry.table_name,
        summarizeAuditChange(entry),
        format(new Date(entry.created_at), 'MMM d, yyyy h:mm a'),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [entries, search, actionFilter, moduleFilter])

  const filtersActive = Boolean(search.trim() || actionFilter || moduleFilter)

  const clearFilters = () => {
    setSearch('')
    setActionFilter('')
    setModuleFilter('')
  }

  if (!selectedPeriod) return null

  return (
    <Stack gap="lg" w="100%">
      <Stack gap={4}>
        <Title order={2}>Audit Log</Title>
        <Text size="sm" c="dimmed">
          Who changed what in {formatPeriodLabel(selectedPeriod.year, selectedPeriod.month)}.
        </Text>
      </Stack>

      <Paper withBorder shadow="sm">
        {!isLoading && !error && entries.length > 0 && (
          <Stack gap="sm" p="md" style={insetDividerBottom}>
            <Group justify="space-between" align="center" wrap="wrap" gap="sm">
              <Text size="sm" fw={600}>
                Filters
              </Text>
              <Text size="xs" c="dimmed">
                {filtersActive
                  ? `Showing ${filteredEntries.length} of ${entries.length} changes`
                  : `${entries.length} ${entries.length === 1 ? 'change' : 'changes'}`}
              </Text>
            </Group>

            <Group align="flex-end" wrap="wrap" gap="sm">
              <TextInput
                placeholder="Search user, module, or summary…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                leftSection={<IconSearch size={16} stroke={1.5} />}
                style={{ flex: 1, minWidth: '14rem' }}
                size="sm"
              />

              <NativeSelect
                label="Action"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                data={[
                  { value: '', label: 'All actions' },
                  { value: 'insert', label: 'Added' },
                  { value: 'update', label: 'Updated' },
                  { value: 'delete', label: 'Deleted' },
                ]}
                size="sm"
                style={{ minWidth: '10rem' }}
              />

              <NativeSelect
                label="Module"
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                data={[{ value: '', label: 'All modules' }, ...moduleOptions]}
                size="sm"
                style={{ minWidth: '10rem' }}
              />

              {filtersActive && (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </Group>
          </Stack>
        )}

        <Table.ScrollContainer minWidth={700}>
          <Table highlightOnHover striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>When</Table.Th>
                <Table.Th>User</Table.Th>
                <Table.Th>Action</Table.Th>
                <Table.Th>Module</Table.Th>
                <Table.Th>Summary</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {isLoading && (
                <Table.Tr>
                  <Table.Td colSpan={5} ta="center" c="dimmed">
                    Loading…
                  </Table.Td>
                </Table.Tr>
              )}
              {error && (
                <Table.Tr>
                  <Table.Td colSpan={5} ta="center" c="red">
                    Failed to load audit log. Run the Phase 3 migration if this is a new feature.
                  </Table.Td>
                </Table.Tr>
              )}
              {!isLoading && !error && entries.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5} ta="center" c="dimmed">
                    No changes recorded yet for this period.
                  </Table.Td>
                </Table.Tr>
              )}
              {!isLoading && !error && entries.length > 0 && filteredEntries.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5} ta="center" c="dimmed">
                    No changes match your filters.
                  </Table.Td>
                </Table.Tr>
              )}
              {filteredEntries.map((entry) => (
                <Table.Tr key={entry.id}>
                  <Table.Td c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                    {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                  </Table.Td>
                  <Table.Td>{entry.user_email ?? '—'}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={actionBadgeColor[entry.action] ?? 'gray'}
                      variant="light"
                      size="sm"
                    >
                      {ACTION_LABELS[entry.action] ?? entry.action}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{TABLE_LABELS[entry.table_name] ?? entry.table_name}</Table.Td>
                  <Table.Td c="dimmed">{summarizeAuditChange(entry)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Text size="xs" c="dimmed">
        Changes are logged automatically when entries are added, updated, or deleted. Excel imports
        are logged as individual row inserts.
      </Text>
    </Stack>
  )
}
