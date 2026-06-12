import type { PLResult, PLTotals } from '@/types/database'

export function computePL(totals: PLTotals): PLResult {
  const { sales, toll, purchases, salary, diesel } = totals
  const net = sales + toll - purchases - salary - diesel

  return {
    sales,
    tollFeeRefund: toll,
    purchases,
    salary,
    diesel,
    net,
    ratios: {
      purchases: sales > 0 ? purchases / sales : 0,
      salary: sales > 0 ? salary / sales : 0,
      diesel: sales > 0 ? diesel / sales : 0,
    },
  }
}

export function sumAmounts(rows: { amount: number | null }[]): number {
  return rows.reduce((sum, row) => sum + (row.amount ?? 0), 0)
}
