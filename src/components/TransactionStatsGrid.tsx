import { IconCoin, IconListNumbers } from '@tabler/icons-react'
import { Group, Paper, SimpleGrid, Text } from '@mantine/core'
import { formatCurrency } from '@/lib/format'
import { statCardsGridProps } from '@/components/layout/contentLayout'
import classes from './TransactionStatsGrid.module.css'

interface TransactionStatsGridProps {
  entryCount: number
  total: number
  filtered?: boolean
  totalEntries?: number
}

const stats = [
  {
    title: 'Entries',
    icon: IconListNumbers,
    getValue: (entryCount: number) => String(entryCount),
    getSubtitle: (filtered: boolean, totalEntries?: number) =>
      filtered && totalEntries != null
        ? `Filtered from ${totalEntries} in this period`
        : 'Recorded in this period',
  },
  {
    title: 'Total',
    icon: IconCoin,
    getValue: (_entryCount: number, total: number) => formatCurrency(total),
    getSubtitle: (filtered: boolean) =>
      filtered ? 'Sum of filtered amounts' : 'Sum of all amounts',
  },
] as const

export function TransactionStatsGrid({
  entryCount,
  total,
  filtered = false,
  totalEntries,
}: TransactionStatsGridProps) {
  return (
    <SimpleGrid {...statCardsGridProps}>
      {stats.map((stat) => {
        const Icon = stat.icon

        return (
          <Paper withBorder p="md" radius="md" key={stat.title}>
            <Group justify="space-between">
              <Text size="xs" c="dimmed" className={classes.title}>
                {stat.title}
              </Text>
              <Icon className={classes.icon} size={22} stroke={1.5} />
            </Group>

            <Text className={classes.value} mt={25}>
              {stat.getValue(entryCount, total)}
            </Text>

            <Text fz="xs" c="dimmed" mt={7}>
              {stat.getSubtitle(filtered, totalEntries)}
            </Text>
          </Paper>
        )
      })}
    </SimpleGrid>
  )
}
