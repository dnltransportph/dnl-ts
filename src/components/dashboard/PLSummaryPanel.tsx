import { BarChart, Sparkline } from '@mantine/charts'
import { Group, Paper, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core'
import type { PLResult } from '@/types/database'
import { useCurrencyBarChartLayout } from '@/hooks/useCurrencyBarChartLayout'
import { formatCurrency, formatExpenseCurrency, formatPercent } from '@/lib/format'
import { totalRowStyle, twoColumnGridProps } from '@/components/layout/contentLayout'

function expenseSparklineData(value: number): number[] {
  return [0.55, 0.68, 0.74, 0.82, 0.91, 1].map((factor) => value * factor)
}

interface PLSummaryPanelProps {
  pl: PLResult
}

export function PLSummaryPanel({ pl }: PLSummaryPanelProps) {
  const flowChartLayout = useCurrencyBarChartLayout(true)

  const rows = [
    { label: 'Sales', value: pl.sales, ratio: null, type: 'income' as const },
    { label: 'Toll Fee Refund', value: pl.tollFeeRefund, ratio: null, type: 'income' as const },
    {
      label: 'Purchases & Expenses',
      value: pl.purchases,
      ratio: pl.ratios.purchases,
      type: 'expense' as const,
    },
    { label: 'Salary Expenses', value: pl.salary, ratio: pl.ratios.salary, type: 'expense' as const },
    { label: 'Diesel Expenses', value: pl.diesel, ratio: pl.ratios.diesel, type: 'expense' as const },
  ]

  const totalExpenses = pl.purchases + pl.salary + pl.diesel

  const expenseMix = [
    { name: 'Purchases', value: pl.purchases },
    { name: 'Salary', value: pl.salary },
    { name: 'Diesel', value: pl.diesel },
  ].filter((item) => item.value > 0)

  const flowChartData = [
    { metric: 'Sales', amount: pl.sales },
    { metric: 'Toll refund', amount: pl.tollFeeRefund },
    { metric: 'Purchases', amount: -pl.purchases },
    { metric: 'Salary', amount: -pl.salary },
    { metric: 'Diesel', amount: -pl.diesel },
    { metric: 'Net P&L', amount: pl.net },
  ]

  return (
    <Stack gap="md" w="100%">
      <Title order={3}>P&L Summary</Title>

      <Paper withBorder shadow="sm" w="100%">
        <Table.ScrollContainer minWidth={480}>
          <Table layout="fixed" w="100%">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Category</Table.Th>
                <Table.Th ta="right">Amount</Table.Th>
                <Table.Th ta="right">% of Sales</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row) => (
                <Table.Tr key={row.label}>
                  <Table.Td fw={500}>{row.label}</Table.Td>
                  <Table.Td ta="right" c={row.type === 'expense' ? 'red.7' : 'green.7'} style={{ whiteSpace: 'nowrap' }}>
                    {row.type === 'expense'
                      ? formatExpenseCurrency(row.value)
                      : formatCurrency(row.value)}
                  </Table.Td>
                  <Table.Td ta="right" c="dimmed">
                    {row.ratio != null ? formatPercent(row.ratio) : '—'}
                  </Table.Td>
                </Table.Tr>
              ))}
              <Table.Tr style={totalRowStyle}>
                <Table.Td c="brand.9">Net P&L</Table.Td>
                <Table.Td ta="right" c={pl.net >= 0 ? 'green.7' : 'red.7'} style={{ whiteSpace: 'nowrap' }}>
                  {formatCurrency(pl.net)}
                </Table.Td>
                <Table.Td />
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <SimpleGrid {...twoColumnGridProps}>
        <Paper withBorder shadow="sm" p="md" w="100%">
          <Text size="sm" fw={600} mb="sm">
            Expense mix
          </Text>
          {expenseMix.length > 0 ? (
            <Stack gap="sm">
              {expenseMix.map((item) => {
                const mixShare = totalExpenses > 0 ? item.value / totalExpenses : 0
                const trendUp = mixShare >= 1 / expenseMix.length

                return (
                  <Paper key={item.name} withBorder p="sm" radius="md">
                    <Text size="xs" c="dimmed" fw={500}>
                      {item.name}
                    </Text>
                    <Group justify="space-between" align="flex-end" mt={4} wrap="nowrap">
                      <Text size="lg" fw={700} lh={1.2}>
                        {formatCurrency(item.value)}
                      </Text>
                      <Group gap={4} wrap="nowrap">
                        <Text size="sm" c={trendUp ? 'red.6' : 'teal.6'} lh={1}>
                          {trendUp ? '↓' : '↑'}
                        </Text>
                        <Text size="sm" c={trendUp ? 'red.6' : 'teal.6'} fw={500}>
                          {formatPercent(mixShare)}
                        </Text>
                      </Group>
                    </Group>
                    <Sparkline
                      mt="sm"
                      h={36}
                      w="100%"
                      data={expenseSparklineData(item.value)}
                      color="brand.6"
                      withGradient={false}
                      strokeWidth={2}
                      curveType="natural"
                    />
                  </Paper>
                )
              })}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              No expenses recorded for this period.
            </Text>
          )}
        </Paper>

        <Paper withBorder shadow="sm" p="md" w="100%">
          <Text size="sm" fw={600} mb="sm">
            P&L flow
          </Text>
          <BarChart
            w="100%"
            h={280}
            data={flowChartData}
            dataKey="metric"
            series={[{ name: 'amount', color: 'brand.6' }]}
            orientation="vertical"
            valueFormatter={formatCurrency}
            withBarValueLabel
            getBarColor={(value) => (value >= 0 ? 'teal.6' : 'brand.6')}
            tickLine="y"
            gridAxis="y"
            {...flowChartLayout}
          />
        </Paper>
      </SimpleGrid>

      <Text size="xs" c="dimmed">
        Formula: Sales + Toll Fee Refund − Purchases − Salary − Diesel
      </Text>
    </Stack>
  )
}
