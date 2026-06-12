import type {
  CategoryBreakdownRow,
  DieselExpense,
  PurchaseExpense,
  SalaryExpense,
  Sale,
  TollFeeRefund,
  TruckReportRow,
} from '@/types/database'
import { sumAmounts } from '@/lib/pl'

interface PeriodRows {
  sales: Sale[]
  purchases: PurchaseExpense[]
  diesel: DieselExpense[]
  salary: SalaryExpense[]
  toll: TollFeeRefund[]
}

function groupByPlate(
  rows: { plate_code: string | null; amount: number }[],
): Map<string, number> {
  const map = new Map<string, number>()
  for (const row of rows) {
    const key = row.plate_code?.trim() || '(none)'
    map.set(key, (map.get(key) ?? 0) + row.amount)
  }
  return map
}

export function computeTruckReport(rows: PeriodRows, knownPlates: string[]): TruckReportRow[] {
  const salesByPlate = groupByPlate(rows.sales)
  const tollByPlate = groupByPlate(rows.toll)
  const purchasesByPlate = groupByPlate(rows.purchases.filter((r) => r.plate_code))
  const dieselByPlate = groupByPlate(rows.diesel)
  const salaryByPlate = groupByPlate(rows.salary.filter((r) => r.plate_code))

  const plateSet = new Set<string>(knownPlates)
  for (const map of [salesByPlate, tollByPlate, purchasesByPlate, dieselByPlate, salaryByPlate]) {
    for (const key of map.keys()) {
      if (key !== '(none)') plateSet.add(key)
    }
  }

  const report: TruckReportRow[] = []

  for (const plateCode of [...plateSet].sort()) {
    const sales = salesByPlate.get(plateCode) ?? 0
    const toll = tollByPlate.get(plateCode) ?? 0
    const purchases = purchasesByPlate.get(plateCode) ?? 0
    const diesel = dieselByPlate.get(plateCode) ?? 0
    const salary = salaryByPlate.get(plateCode) ?? 0
    const net = sales + toll - purchases - diesel - salary

    report.push({ plateCode, sales, toll, purchases, diesel, salary, net })
  }

  return report
}

function groupByField(
  rows: { amount: number }[],
  getKey: (row: (typeof rows)[number]) => string | null,
): Map<string, number> {
  const map = new Map<string, number>()
  for (const row of rows) {
    const key = getKey(row)?.trim() || '(none)'
    map.set(key, (map.get(key) ?? 0) + row.amount)
  }
  return map
}

function mapToBreakdown(
  map: Map<string, number>,
  category: string,
  salesTotal: number,
): CategoryBreakdownRow[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, amount]) => ({
      category,
      label,
      amount,
      pctOfSales: salesTotal > 0 ? amount / salesTotal : null,
    }))
}

export function computeCategoryBreakdown(rows: PeriodRows): CategoryBreakdownRow[] {
  const salesTotal = sumAmounts(rows.sales)

  const sections: CategoryBreakdownRow[] = []

  sections.push(
    ...mapToBreakdown(
      groupByField(rows.sales, (r) => (r as Sale).customer),
      'Sales by customer',
      salesTotal,
    ),
  )

  sections.push(
    ...mapToBreakdown(
      groupByField(rows.purchases, (r) => {
        const p = r as PurchaseExpense
        return p.cost_center_code ? `Cost center: ${p.cost_center_code}` : p.supplier
      }),
      'Purchases',
      salesTotal,
    ),
  )

  sections.push(
    ...mapToBreakdown(
      groupByField(rows.diesel, (r) => (r as DieselExpense).supplier),
      'Diesel by supplier',
      salesTotal,
    ),
  )

  sections.push(
    ...mapToBreakdown(
      groupByField(rows.salary, (r) => {
        const s = r as SalaryExpense
        return s.cost_center_code ? `Cost center: ${s.cost_center_code}` : s.employee
      }),
      'Salary',
      salesTotal,
    ),
  )

  sections.push(
    ...mapToBreakdown(
      groupByField(rows.toll, (r) => (r as TollFeeRefund).delivery_site),
      'Toll by delivery site',
      salesTotal,
    ),
  )

  return sections
}

export function computeTruckReportTotals(rows: TruckReportRow[]): TruckReportRow {
  return rows.reduce(
    (acc, row) => ({
      plateCode: 'Total',
      sales: acc.sales + row.sales,
      toll: acc.toll + row.toll,
      purchases: acc.purchases + row.purchases,
      diesel: acc.diesel + row.diesel,
      salary: acc.salary + row.salary,
      net: acc.net + row.net,
    }),
    { plateCode: 'Total', sales: 0, toll: 0, purchases: 0, diesel: 0, salary: 0, net: 0 },
  )
}
