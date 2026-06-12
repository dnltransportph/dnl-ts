import type { ReactNode } from 'react'
import { Paper, SimpleGrid, Stack, Text } from '@mantine/core'
import { twoColumnGridProps } from '@/components/layout/contentLayout'

interface ReportChartSectionProps {
  chartTitle: string
  chart: ReactNode
  table: ReactNode
  footer?: ReactNode
  layout?: 'stacked' | 'sideBySide'
}

/** Shared layout for dashboard report tabs — stacked or chart left / table right. */
export function ReportChartSection({
  chartTitle,
  chart,
  table,
  footer,
  layout = 'stacked',
}: ReportChartSectionProps) {
  if (layout === 'sideBySide') {
    return (
      <SimpleGrid {...twoColumnGridProps}>
        <Paper withBorder shadow="sm" p="md" w="100%">
          <Text size="sm" fw={600} mb="sm">
            {chartTitle}
          </Text>
          {chart}
        </Paper>

        <Paper withBorder shadow="sm" p="md" w="100%">
          {table}
          {footer}
        </Paper>
      </SimpleGrid>
    )
  }

  return (
    <Stack gap="md" w="100%">
      <Paper withBorder shadow="sm" p="md" w="100%">
        <Text size="sm" fw={600} mb="sm">
          {chartTitle}
        </Text>
        {chart}
      </Paper>

      <Paper withBorder shadow="sm" w="100%">
        {table}
        {footer}
      </Paper>
    </Stack>
  )
}
