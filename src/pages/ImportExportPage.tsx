import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Checkbox,
  FileInput,
  Group,
  Paper,
  Radio,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { usePeriod } from '@/hooks/usePeriod'
import { MASTER_DATA_QUERY_KEYS } from '@/hooks/useMasterData'
import { Button } from '@/components/ui/Button'
import {
  importSheetCountsGridProps,
  subduedSurfaceStyle,
} from '@/components/layout/contentLayout'
import { formatPeriodLabel } from '@/lib/format'
import { commitImport, findOrCreatePeriod } from '@/lib/excel/commit'
import { buildWorkbook, exportFilename } from '@/lib/excel/export'
import { fetchPeriodExportData } from '@/lib/excel/fetchPeriodData'
import { parseWorkbook } from '@/lib/excel/import'
import type { ParsedWorkbook } from '@/lib/excel/types'
import { downloadBuffer } from '@/lib/excel/utils'

type ImportTarget = 'detected' | 'selected'

export function ImportExportPage() {
  const { selectedPeriod, periods, selectPeriod, refreshPeriods, isPeriodClosed } = usePeriod()
  const queryClient = useQueryClient()

  const [parsed, setParsed] = useState<ParsedWorkbook | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [importTarget, setImportTarget] = useState<ImportTarget>('detected')
  const [replaceExisting, setReplaceExisting] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importMessage, setImportMessage] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const errorIssues = parsed?.issues.filter((i) => i.severity === 'error') ?? []
  const warningIssues = parsed?.issues.filter((i) => i.severity === 'warning') ?? []
  const canImport = parsed != null && errorIssues.length === 0

  const handleFileChange = async (file: File | null) => {
    setParseError(null)
    setImportMessage(null)
    setParsed(null)
    setFileName(null)

    if (!file) return
    if (!file.name.endsWith('.xlsx')) {
      setParseError('Please upload an .xlsx workbook.')
      return
    }

    try {
      const buffer = await file.arrayBuffer()
      const result = await parseWorkbook(buffer)
      setParsed(result)
      setFileName(file.name)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to read workbook.')
    }
  }

  const invalidatePeriodQueries = async (periodId: string) => {
    const tables = [
      'sales',
      'purchase_expenses',
      'diesel_expenses',
      'salary_expenses',
      'toll_fee_refunds',
      'pl-totals',
    ]
    await Promise.all(
      tables.map((key) => queryClient.invalidateQueries({ queryKey: [key, periodId] })),
    )
  }

  const handleImport = async () => {
    if (!parsed || !canImport) return

    if (importTarget === 'selected' && selectedPeriod?.status === 'closed') {
      setImportMessage('Cannot import into a closed period. Reopen it first or use the detected month.')
      return
    }

    setImporting(true)
    setImportMessage(null)

    let periodId: string

    if (importTarget === 'selected' && selectedPeriod) {
      periodId = selectedPeriod.id
    } else {
      const { periodId: resolvedId, error, created } = await findOrCreatePeriod(
        parsed.detectedYear,
        parsed.detectedMonth,
      )
      if (error || !resolvedId) {
        setImportMessage(error ?? 'Could not resolve target period.')
        setImporting(false)
        return
      }
      periodId = resolvedId
      if (created) await refreshPeriods()
      selectPeriod(resolvedId)
    }

    const { error } = await commitImport(periodId, parsed, replaceExisting)
    setImporting(false)

    if (error) {
      setImportMessage(error)
      return
    }

    await invalidatePeriodQueries(periodId)
    await Promise.all(
      [...MASTER_DATA_QUERY_KEYS, 'audit-log'].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    )
    await queryClient.invalidateQueries({ queryKey: ['audit-log', periodId] })
    const totalRows =
      parsed.sales.length +
      parsed.purchases.length +
      parsed.diesel.length +
      parsed.salary.length +
      parsed.toll.length
    setImportMessage(`Imported ${totalRows} rows successfully.`)
    setParsed(null)
    setFileName(null)
  }

  const handleExport = async () => {
    if (!selectedPeriod) return

    setExporting(true)
    setExportError(null)

    try {
      const data = await fetchPeriodExportData(selectedPeriod)
      const buffer = await buildWorkbook(data)
      downloadBuffer(buffer, exportFilename(selectedPeriod.year, selectedPeriod.month))
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <Stack gap="xl" w="100%">
      <Stack gap={4}>
        <Title order={2}>Import / Export</Title>
        <Text size="sm" c="dimmed">
          Upload a monthly P&L workbook to load data into Supabase, or export the current period
          back to Excel.
        </Text>
      </Stack>

      <Paper component="section" withBorder shadow="sm" p="md">
        <Text size="sm" fw={600}>
          Export to Excel
        </Text>
        <Text size="sm" c="dimmed" mt={4}>
          Generates a 6-sheet workbook matching the current spreadsheet layout. Sales export fills
          column F per trip, mirrors amounts into plate columns G–J (PGJ736, NCS129, UNM562, UFJ992),
          and writes weekly totals in column K.
        </Text>
        <Group mt="md" wrap="wrap" gap="sm">
          <Button onClick={handleExport} disabled={!selectedPeriod || exporting}>
            {exporting ? 'Exporting…' : 'Download .xlsx'}
          </Button>
          {selectedPeriod && (
            <Text size="sm" c="dimmed">
              Period: {formatPeriodLabel(selectedPeriod.year, selectedPeriod.month)}
            </Text>
          )}
        </Group>
        {exportError && (
          <Text size="sm" c="red" mt="sm">
            {exportError}
          </Text>
        )}
      </Paper>

      <Paper component="section" withBorder shadow="sm" p="md">
        <Text size="sm" fw={600}>
          Import from Excel
        </Text>
        <Text size="sm" c="dimmed" mt={4}>
          Parses the 6 sheets (Sales, Purchases, Diesel, Salary, Toll Fee Refund). Sales import reads
          trip amounts from column F only.
        </Text>

        {isPeriodClosed && (
          <Alert color="yellow" mt="sm">
            The selected period is closed. Import into the detected month will create or use an open
            period, or reopen the current period first to import into it.
          </Alert>
        )}

        <FileInput
          mt="md"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileChange}
          placeholder="Choose .xlsx file"
          maw={400}
        />

        {parseError && (
          <Text size="sm" c="red" mt="sm">
            {parseError}
          </Text>
        )}

        {parsed && (
          <Stack gap="md" mt="md">
            <Paper style={subduedSurfaceStyle} p="md" radius="sm">
              <Text size="sm">
                <Text span fw={500}>
                  File:
                </Text>{' '}
                {fileName}
              </Text>
              <Text size="sm" mt={4}>
                <Text span fw={500}>
                  Detected period:
                </Text>{' '}
                {formatPeriodLabel(parsed.detectedYear, parsed.detectedMonth)}
              </Text>
              <SimpleGrid {...importSheetCountsGridProps} mt="sm">
                <Text size="sm">Sales: {parsed.sales.length}</Text>
                <Text size="sm">Purchases: {parsed.purchases.length}</Text>
                <Text size="sm">Diesel: {parsed.diesel.length}</Text>
                <Text size="sm">Salary: {parsed.salary.length}</Text>
                <Text size="sm">Toll: {parsed.toll.length}</Text>
              </SimpleGrid>
            </Paper>

            {(errorIssues.length > 0 || warningIssues.length > 0) && (
              <Stack gap="sm">
                {errorIssues.length > 0 && (
                  <Alert color="red" title={`${errorIssues.length} error${errorIssues.length === 1 ? '' : 's'} — fix the workbook before importing`}>
                    <Stack gap={4} mah={160} style={{ overflowY: 'auto' }}>
                      {errorIssues.map((issue, index) => (
                        <Text key={`e-${index}`} size="sm">
                          {issue.sheet} row {issue.row || '—'}: {issue.message}
                        </Text>
                      ))}
                    </Stack>
                  </Alert>
                )}
                {warningIssues.length > 0 && (
                  <Alert color="yellow" title={`${warningIssues.length} warning${warningIssues.length === 1 ? '' : 's'}`}>
                    <Stack gap={4} mah={128} style={{ overflowY: 'auto' }}>
                      {warningIssues.map((issue, index) => (
                        <Text key={`w-${index}`} size="sm">
                          {issue.sheet} row {issue.row || '—'}: {issue.message}
                        </Text>
                      ))}
                    </Stack>
                  </Alert>
                )}
              </Stack>
            )}

            <Group align="flex-end" wrap="wrap" gap="lg">
              <Radio.Group
                label="Import into"
                value={importTarget}
                onChange={(value) => setImportTarget(value as ImportTarget)}
              >
                <Stack gap="xs" mt="xs">
                  <Radio
                    value="detected"
                    label={`Detected month (${formatPeriodLabel(parsed.detectedYear, parsed.detectedMonth)})`}
                  />
                  <Radio
                    value="selected"
                    disabled={!selectedPeriod || isPeriodClosed}
                    label={`Currently selected period${
                      selectedPeriod
                        ? ` (${formatPeriodLabel(selectedPeriod.year, selectedPeriod.month)}${isPeriodClosed ? ', closed' : ''})`
                        : ' (none)'
                    }`}
                  />
                </Stack>
              </Radio.Group>

              <Checkbox
                label="Replace existing rows for this period"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.currentTarget.checked)}
              />
            </Group>

            <Button onClick={handleImport} disabled={!canImport || importing}>
              {importing ? 'Importing…' : 'Import into Supabase'}
            </Button>
            {importMessage && (
              <Text
                size="sm"
                c={importMessage.startsWith('Imported') ? 'green.7' : 'red'}
              >
                {importMessage}
              </Text>
            )}
          </Stack>
        )}
      </Paper>

      {periods.length > 0 && (
        <Text size="xs" c="dimmed">
          Supported sheets: P&L SUMMARY, PURCHASES AND EXPENSES, SALES, SALARY EXPENSES, TOLL FEE
          REFUND, DIESEL EXPENSES. May 2026 and future monthly workbooks use the same layout.
        </Text>
      )}
    </Stack>
  )
}
