import { useMediaQuery } from '@mantine/hooks'
import {
  compactCurrencyBarChartLayout,
  compactCurrencyBarChartWithValueLabelLayout,
  currencyBarChartLayout,
  currencyBarChartWithValueLabelLayout,
} from '@/lib/chartLayout'

const WIDE_CHART_MEDIA = '(min-width: 48em)'

export function useCurrencyBarChartLayout(withValueLabel = false) {
  const isWideChart = useMediaQuery(WIDE_CHART_MEDIA) ?? true

  if (withValueLabel) {
    return isWideChart
      ? currencyBarChartWithValueLabelLayout
      : compactCurrencyBarChartWithValueLabelLayout
  }

  return isWideChart ? currencyBarChartLayout : compactCurrencyBarChartLayout
}
