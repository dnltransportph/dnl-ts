import type { BarChartProps } from '@mantine/charts'

/** Reserve space for formatted PHP currency ticks on the x-axis. */
const currencyAxisMargin = {
  top: 4,
  right: 56,
  bottom: 4,
  left: 4,
} as const

/** Extra room for bar-end value labels (e.g. ₱514,838.00) beside horizontal bars. */
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

type BarChartLayoutProps = Pick<BarChartProps, 'barChartProps' | 'xAxisProps' | 'valueLabelProps'>

export const currencyBarChartLayout: BarChartLayoutProps = {
  barChartProps: { margin: currencyAxisMargin },
  xAxisProps: { padding: { left: 0, right: 16 } },
}

export const currencyBarChartWithValueLabelLayout: BarChartLayoutProps = {
  barChartProps: { margin: currencyValueLabelMargin },
  xAxisProps: { padding: { left: 0, right: 16 } },
  valueLabelProps: { offset: 4 },
}

export const compactCurrencyBarChartLayout: BarChartLayoutProps = {
  barChartProps: { margin: compactCurrencyAxisMargin },
  xAxisProps: { padding: { left: 0, right: 8 } },
}

export const compactCurrencyBarChartWithValueLabelLayout: BarChartLayoutProps = {
  barChartProps: { margin: compactCurrencyValueLabelMargin },
  xAxisProps: { padding: { left: 0, right: 8 } },
  valueLabelProps: { offset: 2 },
}
