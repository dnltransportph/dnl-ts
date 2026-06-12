import { useMediaQuery } from '@mantine/hooks'
import {
  compactCurrencyBarChartLayout,
  compactCurrencyBarChartWithValueLabelLayout,
  currencyBarChartLayout,
  currencyBarChartWithValueLabelLayout,
} from '@/lib/chartLayout'

const WIDE_CHART_MEDIA = '(min-width: 48em)'
/** Value labels need more plot width; two-column layouts stay narrow until ~992px. */
const WIDE_VALUE_LABEL_CHART_MEDIA = '(min-width: 62em)'

export function useCurrencyBarChartLayout(withValueLabel = false) {
  const isWideChart = useMediaQuery(
    withValueLabel ? WIDE_VALUE_LABEL_CHART_MEDIA : WIDE_CHART_MEDIA,
  ) ?? true

  if (withValueLabel) {
    return isWideChart
      ? currencyBarChartWithValueLabelLayout
      : compactCurrencyBarChartWithValueLabelLayout
  }

  return isWideChart ? currencyBarChartLayout : compactCurrencyBarChartLayout
}
