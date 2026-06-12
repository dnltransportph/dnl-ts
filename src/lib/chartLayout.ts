import type { BarChartProps } from '@mantine/charts'
import { CurrencyBarValueLabel } from '@/components/charts/CurrencyBarValueLabel'

/** Reserve space for formatted PHP currency ticks on the x-axis. */
const currencyAxisMargin = {
  top: 4,
  right: 56,
  bottom: 4,
  left: 4,
} as const

/** Extra room for positive bar-end value labels (e.g. ₱514,838.00). */
const currencyValueLabelMargin = {
  ...currencyAxisMargin,
  right: 96,
} as const

/** Tighter margins for narrow viewports (phones / small tablets). */
const compactCurrencyAxisMargin = {
  top: 4,
  right: 8,
  bottom: 4,
  left: 4,
} as const

const compactCurrencyValueLabelMargin = {
  ...compactCurrencyAxisMargin,
  right: 48,
} as const

const currencyYAxisProps = {
  width: 76,
} as const

const compactCurrencyYAxisProps = {
  width: 68,
} as const

const currencyBarValueLabelProps = {
  content: CurrencyBarValueLabel,
} as const

type BarChartLayoutProps = Pick<
  BarChartProps,
  'barChartProps' | 'xAxisProps' | 'yAxisProps' | 'valueLabelProps'
>

export const currencyBarChartLayout: BarChartLayoutProps = {
  barChartProps: { margin: currencyAxisMargin },
  xAxisProps: { padding: { left: 0, right: 16 } },
}

export const currencyBarChartWithValueLabelLayout: BarChartLayoutProps = {
  barChartProps: { margin: currencyValueLabelMargin },
  xAxisProps: { padding: { left: 8, right: 16 } },
  yAxisProps: currencyYAxisProps,
  valueLabelProps: currencyBarValueLabelProps,
}

export const compactCurrencyBarChartLayout: BarChartLayoutProps = {
  barChartProps: { margin: compactCurrencyAxisMargin },
  xAxisProps: { padding: { left: 0, right: 8 } },
}

export const compactCurrencyBarChartWithValueLabelLayout: BarChartLayoutProps = {
  barChartProps: { margin: compactCurrencyValueLabelMargin },
  xAxisProps: { padding: { left: 8, right: 8 } },
  yAxisProps: compactCurrencyYAxisProps,
  valueLabelProps: currencyBarValueLabelProps,
}
