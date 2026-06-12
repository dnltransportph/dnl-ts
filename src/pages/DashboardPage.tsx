import { Badge, Divider, Group, Stack, Text, Title } from '@mantine/core'
import { DashboardReportsPanel } from '@/components/dashboard/DashboardReportsPanel'
import { PLSummaryPanel } from '@/components/dashboard/PLSummaryPanel'
import { usePeriod } from '@/hooks/usePeriod'
import { usePeriodReportData } from '@/hooks/usePeriodReportData'
import { usePLTotals } from '@/hooks/usePLTotals'
import { computePL } from '@/lib/pl'
import { formatPeriodLabel } from '@/lib/format'

export function DashboardPage() {
  const { selectedPeriod, isPeriodClosed } = usePeriod()
  const {
    data: totals,
    isLoading: totalsLoading,
    error: totalsError,
  } = usePLTotals(selectedPeriod?.id)
  const {
    data: reportData,
    isLoading: reportsLoading,
    error: reportsError,
  } = usePeriodReportData(selectedPeriod?.id)

  if (!selectedPeriod) return null

  if (totalsLoading || reportsLoading) {
    return (
      <Text c="dimmed" size="sm">
        Loading P&L dashboard…
      </Text>
    )
  }

  if (totalsError || !totals || reportsError || !reportData) {
    return (
      <Text c="red" size="sm">
        Failed to load P&L dashboard data. Check your Supabase connection.
      </Text>
    )
  }

  const pl = computePL(totals)

  return (
    <Stack gap="xl" w="100%">
      <Stack gap={4}>
        <Title order={2}>P&L Dashboard</Title>
        <Group gap="xs" align="center">
          <Text size="sm" c="dimmed">
            {formatPeriodLabel(selectedPeriod.year, selectedPeriod.month)}
          </Text>
          <Badge color={isPeriodClosed ? 'yellow' : 'green'} variant="light" size="sm">
            {isPeriodClosed ? 'Closed' : 'Open'}
          </Badge>
        </Group>
      </Stack>

      <PLSummaryPanel pl={pl} />

      <Divider />

      <DashboardReportsPanel
        truckReport={reportData.truckReport}
        categoryBreakdown={reportData.categoryBreakdown}
      />
    </Stack>
  )
}
