import { useState } from 'react'
import { BarChart } from '@mantine/charts'
import { Stack, Table, Tabs, Text, Title } from '@mantine/core'
import { ReportChartSection } from '@/components/dashboard/ReportChartSection'
import { useCurrencyBarChartLayout } from '@/hooks/useCurrencyBarChartLayout'
import { insetDividerTop, totalRowStyle } from '@/components/layout/contentLayout'
import { computeTruckReportTotals } from '@/lib/reports'
import { formatCurrency, formatPercent } from '@/lib/format'
import type { CategoryBreakdownRow, TruckReportRow } from '@/types/database'

type ReportTab = 'trucks' | 'categories'

interface DashboardReportsPanelProps {
  truckReport: TruckReportRow[]
  categoryBreakdown: CategoryBreakdownRow[]
}

const EXPENSE_CATEGORIES = new Set(['Purchases', 'Diesel by supplier', 'Salary'])
const CATEGORY_CHART_TOP_N = 8
const CATEGORY_CHART_BAR_HEIGHT = 40

function truncateAxisLabel(label: string, maxLength = 18): string {
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label
}

function buildCategoryChartData(
  rows: CategoryBreakdownRow[],
  isExpense: boolean,
): { item: string; amount: number; pctOfSales: number | null }[] {
  const top = rows.slice(0, CATEGORY_CHART_TOP_N)
  const rest = rows.slice(CATEGORY_CHART_TOP_N)

  const chartData = top.map((row) => ({
    item: row.label,
    amount: isExpense ? -row.amount : row.amount,
    pctOfSales: row.pctOfSales,
  }))

  if (rest.length > 0) {
    const othersAmount = rest.reduce((sum, row) => sum + row.amount, 0)
    const othersPct = rest.reduce((sum, row) => sum + (row.pctOfSales ?? 0), 0)

    chartData.push({
      item: `Others (${rest.length})`,
      amount: isExpense ? -othersAmount : othersAmount,
      pctOfSales: othersPct > 0 ? othersPct : null,
    })
  }

  return chartData
}

function CategoryAmountChart({
  category,
  rows,
}: {
  category: string
  rows: CategoryBreakdownRow[]
}) {
  const chartLayout = useCurrencyBarChartLayout(false)
  const isExpense = EXPENSE_CATEGORIES.has(category)
  const chartData = buildCategoryChartData(rows, isExpense)

  if (rows.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="xl">
        No items in this category.
      </Text>
    )
  }

  return (
    <Stack gap={4}>
      {rows.length > CATEGORY_CHART_TOP_N && (
        <Text size="xs" c="dimmed">
          Top {CATEGORY_CHART_TOP_N} of {rows.length} · see table for full list
        </Text>
      )}
      <BarChart
        w="100%"
        h={Math.max(220, chartData.length * CATEGORY_CHART_BAR_HEIGHT)}
        data={chartData}
        dataKey="item"
        series={[{ name: 'amount', color: 'brand.6', label: 'Amount' }]}
        orientation="vertical"
        valueFormatter={formatCurrency}
        getBarColor={(value) => (value >= 0 ? 'teal.6' : 'brand.6')}
        tickLine="y"
        gridAxis="y"
        maxBarWidth={24}
        yAxisProps={{
          width: 110,
          tickFormatter: (value) => truncateAxisLabel(String(value)),
        }}
        tooltipProps={{
          formatter: (value, _name, item) => {
            const pct = item?.payload?.pctOfSales as number | null | undefined
            const amount = formatCurrency(Number(value))
            return pct != null ? `${amount} (${formatPercent(pct)})` : amount
          },
        }}
        {...chartLayout}
      />
    </Stack>
  )
}

function CategoryTable({ rows }: { rows: CategoryBreakdownRow[] }) {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Item</Table.Th>
          <Table.Th ta="right">Amount</Table.Th>
          <Table.Th ta="right">% of Sales</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map((row) => (
          <Table.Tr key={`${row.category}-${row.label}`}>
            <Table.Td>{row.label}</Table.Td>
            <Table.Td ta="right">
              {formatCurrency(row.amount)}
            </Table.Td>
            <Table.Td ta="right" c="dimmed">
              {row.pctOfSales != null ? formatPercent(row.pctOfSales) : '—'}
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}

export function DashboardReportsPanel({
  truckReport,
  categoryBreakdown,
}: DashboardReportsPanelProps) {
  const [tab, setTab] = useState<ReportTab>('trucks')
  const truckChartLayout = useCurrencyBarChartLayout(true)

  const truckTotals = computeTruckReportTotals(truckReport)
  const categories = [...new Set(categoryBreakdown.map((row) => row.category))]

  const truckChartData = truckReport.map((row) => ({
    plate: row.plateCode,
    net: row.net,
  }))

  const truckChart =
    truckReport.length > 0 ? (
      <BarChart
        w="100%"
        h={Math.max(220, truckReport.length * 36)}
        data={truckChartData}
        dataKey="plate"
        series={[{ name: 'net', color: 'brand.6' }]}
        orientation="vertical"
        valueFormatter={formatCurrency}
        withBarValueLabel
        getBarColor={(value) => (value >= 0 ? 'teal.6' : 'brand.6')}
        tickLine="y"
        gridAxis="y"
        {...truckChartLayout}
      />
    ) : (
      <Text size="sm" c="dimmed" ta="center" py="xl">
        No truck data for this period.
      </Text>
    )

  const truckTable = (
    <Table.ScrollContainer minWidth={640} w="100%">
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Plate</Table.Th>
            <Table.Th ta="right">Sales</Table.Th>
            <Table.Th ta="right">Toll</Table.Th>
            <Table.Th ta="right">Purchases</Table.Th>
            <Table.Th ta="right">Diesel</Table.Th>
            <Table.Th ta="right">Salary</Table.Th>
            <Table.Th ta="right">Net</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {truckReport.length === 0 && (
            <Table.Tr>
              <Table.Td colSpan={7} ta="center" c="dimmed">
                No truck data for this period.
              </Table.Td>
            </Table.Tr>
          )}
          {truckReport.map((row) => (
            <Table.Tr key={row.plateCode}>
              <Table.Td fw={500}>{row.plateCode}</Table.Td>
              <Table.Td ta="right" c="green.7">
                {formatCurrency(row.sales)}
              </Table.Td>
              <Table.Td ta="right" c="green.7">
                {formatCurrency(row.toll)}
              </Table.Td>
              <Table.Td ta="right" c="red.7">
                −{formatCurrency(row.purchases)}
              </Table.Td>
              <Table.Td ta="right" c="red.7">
                −{formatCurrency(row.diesel)}
              </Table.Td>
              <Table.Td ta="right" c="red.7">
                −{formatCurrency(row.salary)}
              </Table.Td>
              <Table.Td
                ta="right"
                fw={500}
                c={row.net >= 0 ? 'green.7' : 'red.7'}
              >
                {formatCurrency(row.net)}
              </Table.Td>
            </Table.Tr>
          ))}
          {truckReport.length > 0 && (
            <Table.Tr style={totalRowStyle}>
              <Table.Td>{truckTotals.plateCode}</Table.Td>
              <Table.Td ta="right">
                {formatCurrency(truckTotals.sales)}
              </Table.Td>
              <Table.Td ta="right">
                {formatCurrency(truckTotals.toll)}
              </Table.Td>
              <Table.Td ta="right">
                −{formatCurrency(truckTotals.purchases)}
              </Table.Td>
              <Table.Td ta="right">
                −{formatCurrency(truckTotals.diesel)}
              </Table.Td>
              <Table.Td ta="right">
                −{formatCurrency(truckTotals.salary)}
              </Table.Td>
              <Table.Td ta="right" c={truckTotals.net >= 0 ? 'green.7' : 'red.7'}>
                {formatCurrency(truckTotals.net)}
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )

  const truckFooter = (
    <Text
      size="xs"
      c="dimmed"
      px="sm"
      py="xs"
      style={insetDividerTop}
    >
      Net per truck: Sales + Toll − Purchases − Diesel − Salary (truck-assigned rows only).
      Cost-center purchases and salary are excluded from per-truck totals.
    </Text>
  )

  return (
    <Stack gap="md" w="100%">
      <Title order={3}>Reports</Title>

      <Tabs value={tab} onChange={(value) => value && setTab(value as ReportTab)} keepMounted={false}>
        <Tabs.List>
          <Tabs.Tab value="trucks">Per truck</Tabs.Tab>
          <Tabs.Tab value="categories">Per category</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="trucks" pt="md">
          <ReportChartSection
            chartTitle="Net by truck"
            chart={truckChart}
            table={truckTable}
            footer={truckFooter}
          />
        </Tabs.Panel>

        <Tabs.Panel value="categories" pt="md">
          <Stack gap="lg">
            {categories.map((category) => {
              const rows = categoryBreakdown.filter((row) => row.category === category)

              return (
                <ReportChartSection
                  key={category}
                  chartTitle={category}
                  chart={<CategoryAmountChart category={category} rows={rows} />}
                  table={<CategoryTable rows={rows} />}
                  layout="sideBySide"
                />
              )
            })}
            {categories.length === 0 && (
              <Text size="sm" c="dimmed">
                No category breakdown available.
              </Text>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
