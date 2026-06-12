import type { Props as RechartsLabelProps } from 'recharts/types/component/Label'
import { formatCurrency } from '@/lib/format'

const LABEL_FILL = 'var(--chart-bar-label-color, var(--mantine-color-dimmed))'
const NEGATIVE_LABEL_FILL = 'var(--mantine-color-white)'

/** Places value labels outside positive bars and inside negative bars to avoid y-axis overlap. */
export function CurrencyBarValueLabel(props: RechartsLabelProps) {
  const { x, y, width, height, value } = props
  if (x == null || y == null || width == null || height == null || value == null) {
    return null
  }

  const num = Number(value)
  if (!Number.isFinite(num)) return null

  const barX = Number(x)
  const barY = Number(y)
  const barWidth = Number(width)
  const barHeight = Number(height)
  const centerY = barY + barHeight / 2

  if (num < 0) {
    if (barWidth < 40) return null

    return (
      <text
        x={barX + barWidth / 2}
        y={centerY}
        dy="0.355em"
        textAnchor="middle"
        fill={NEGATIVE_LABEL_FILL}
        fontSize={12}
      >
        {formatCurrency(num)}
      </text>
    )
  }

  return (
    <text
      x={barX + barWidth + 4}
      y={centerY}
      dy="0.355em"
      textAnchor="start"
      fill={LABEL_FILL}
      fontSize={12}
    >
      {formatCurrency(num)}
    </text>
  )
}
