import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { HEADER_ROW, SHEET_NAMES } from './constants'
import {
  SALES_PLATE_COLUMN_ORDER,
  salesPlateAmountCells,
  sumSalesByPlate,
  weeklyTotalsBySaleIndex,
} from './salesLayout'
import type { PeriodExportData } from './types'
import { periodDateFromParts } from './utils'

function setPeriodHeader(sheet: ExcelJS.Worksheet, subtitle: string, periodDate: Date) {
  sheet.getCell('A1').value = 'DNL TRANSPORT SERVICES'
  sheet.getCell('A2').value = subtitle
  sheet.getCell('A3').value = periodDate
  sheet.getCell('B3').value = periodDate
}

function writeRow(
  sheet: ExcelJS.Worksheet,
  rowNum: number,
  values: (string | number | Date | null | undefined)[],
) {
  values.forEach((value, index) => {
    if (value != null) sheet.getRow(rowNum).getCell(index + 1).value = value
  })
}

function buildPlSummary(wb: ExcelJS.Workbook, data: PeriodExportData) {
  const sheet = wb.addWorksheet(SHEET_NAMES.PL_SUMMARY)
  const periodDate = periodDateFromParts(data.year, data.month)

  sheet.getCell('A1').value = 'DNL TRANSPORT SERVICES'
  sheet.getCell('A2').value = 'PROFIT & LOSS SUMMARY'
  sheet.getCell('A3').value = periodDate
  sheet.getCell('B3').value = periodDate

  writeRow(sheet, HEADER_ROW, ['CATEGORY', 'AMOUNT'])
  const { totals } = data

  const categories: [number, string, number, number | null][] = [
    [1, 'SALES', totals.sales, null],
    [2, 'TOLL FEE REFUND', totals.toll, null],
    [3, 'PURCHASES AND EXPENSES', totals.purchases, totals.ratios.purchases],
    [4, 'DIESEL EXPENSES', totals.diesel, totals.ratios.diesel],
    [5, 'SALARY EXPENSES', totals.salary, totals.ratios.salary],
  ]

  categories.forEach(([num, label, amount, ratio], index) => {
    const rowNum = HEADER_ROW + 1 + index
    writeRow(sheet, rowNum, [num, label, amount])
    if (ratio != null) sheet.getCell(rowNum, 5).value = ratio
  })

  writeRow(sheet, HEADER_ROW + 8, ['TOTAL', totals.net])
}

function buildSales(wb: ExcelJS.Workbook, data: PeriodExportData) {
  const sheet = wb.addWorksheet(SHEET_NAMES.SALES)
  const periodDate = periodDateFromParts(data.year, data.month)

  setPeriodHeader(sheet, 'SALES REPORT', periodDate)
  sheet.getCell('C3').value = periodDate
  writeRow(sheet, HEADER_ROW, [
    'DATE',
    'PLATE NO.',
    'CUSTOMER',
    'DELIVERY SITE',
    'NO. OF TRIPS',
    'AMOUNT',
    'AMOUNT',
    'AMOUNT',
    'AMOUNT',
    'AMOUNT',
    'WEEKLY TTL',
  ])

  const weeklyTotals = weeklyTotalsBySaleIndex(data.sales)
  const plateTotals = sumSalesByPlate(data.sales)

  let rowNum = HEADER_ROW + 1
  data.sales.forEach((sale, index) => {
    const [g, h, i, j] = salesPlateAmountCells(sale)
    writeRow(sheet, rowNum, [
      new Date(sale.date + 'T00:00:00'),
      sale.plate_code,
      sale.customer,
      sale.delivery_site,
      sale.trips,
      sale.amount,
      g,
      h,
      i,
      j,
      weeklyTotals.get(index) ?? null,
    ])
    rowNum++
  })

  const totalRow = rowNum + 1
  writeRow(sheet, totalRow, [
    'TOTAL RUNNING SALES',
    null,
    null,
    null,
    null,
    data.totals.sales,
    ...SALES_PLATE_COLUMN_ORDER.map((plate) => plateTotals[plate] ?? 0),
    null,
  ])
}

function buildPurchases(wb: ExcelJS.Workbook, data: PeriodExportData) {
  const sheet = wb.addWorksheet(SHEET_NAMES.PURCHASES)
  const periodDate = periodDateFromParts(data.year, data.month)

  setPeriodHeader(sheet, 'SUMMARY OF PURCHASES/EXPENSES', periodDate)
  writeRow(sheet, HEADER_ROW, [
    'DATE',
    'PO NO',
    'PLATE NO',
    'SUPPLIER',
    'DESCRIPTION',
    'QTY',
    'UNIT',
    'U. PRICE',
    'AMOUNT',
    'TOTAL',
  ])

  let rowNum = HEADER_ROW + 1
  for (const row of data.purchases) {
    const plateOrCenter = row.cost_center_code ?? row.plate_code
    writeRow(sheet, rowNum, [
      new Date(row.date + 'T00:00:00'),
      row.po_number,
      plateOrCenter,
      row.supplier,
      row.description,
      row.qty,
      row.unit,
      row.unit_price,
      row.amount,
      null,
    ])
    rowNum++
  }

  writeRow(sheet, rowNum + 1, [
    'TOTAL PURCHASES/EXPENSES',
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    data.totals.purchases,
  ])
}

function buildSalary(wb: ExcelJS.Workbook, data: PeriodExportData) {
  const sheet = wb.addWorksheet(SHEET_NAMES.SALARY)
  const periodDate = periodDateFromParts(data.year, data.month)

  setPeriodHeader(sheet, 'SALARY AND ADVANCES EXPENSES', periodDate)
  sheet.getCell('D3').value = periodDate
  writeRow(sheet, HEADER_ROW, [
    'DATE',
    'PLATE NO.',
    'REMARKS',
    'EMPLOYEE',
    'AMOUNT',
    'JUN',
    'JHOANNA',
    'JERRRICA',
    'JOAN',
    'ARIEL',
  ])

  let rowNum = HEADER_ROW + 2
  for (const row of data.salary) {
    const plateOrCenter = row.cost_center_code ?? row.plate_code
    writeRow(sheet, rowNum, [
      new Date(row.date + 'T00:00:00'),
      plateOrCenter,
      row.remarks,
      row.employee,
      row.amount,
    ])
    rowNum++
  }

  writeRow(sheet, rowNum + 1, ['TOTAL RUNNING SALES', null, null, null, data.totals.salary])
}

function buildToll(wb: ExcelJS.Workbook, data: PeriodExportData) {
  const sheet = wb.addWorksheet(SHEET_NAMES.TOLL)
  const periodDate = periodDateFromParts(data.year, data.month)

  setPeriodHeader(sheet, 'TOLL FEE REFUND', periodDate)
  sheet.getCell('C3').value = periodDate
  writeRow(sheet, HEADER_ROW, ['DATE', 'PLATE NO.', 'DELIVERY SITE', 'AMOUNT'])

  let rowNum = HEADER_ROW + 3
  for (const row of data.toll) {
    writeRow(sheet, rowNum, [
      new Date(row.date + 'T00:00:00'),
      row.plate_code,
      row.delivery_site,
      row.amount,
    ])
    rowNum++
  }

  writeRow(sheet, rowNum + 1, ['TOTAL RUNNING SALES', null, null, data.totals.toll])
}

function buildDiesel(wb: ExcelJS.Workbook, data: PeriodExportData) {
  const sheet = wb.addWorksheet(SHEET_NAMES.DIESEL)
  const periodDate = periodDateFromParts(data.year, data.month)

  sheet.getCell('A1').value = 'SUMMARY OF DIESEL EXPENSES'
  sheet.getCell('A2').value = periodDate
  writeRow(sheet, HEADER_ROW, [
    'DATE',
    'P.O NUMBER',
    'PLATE NUMBER',
    'SUPPLIER',
    'DESCRIPTION',
    'QTY',
    'UNIT',
    'UNIT PRICE',
    'AMOUNT',
  ])

  let rowNum = HEADER_ROW + 1
  for (const row of data.diesel) {
    writeRow(sheet, rowNum, [
      new Date(row.date + 'T00:00:00'),
      row.po_number,
      row.plate_code,
      row.supplier,
      row.description,
      row.qty,
      row.unit,
      row.unit_price,
      row.amount,
    ])
    rowNum++
  }

  writeRow(sheet, rowNum + 1, [
    'TOTAL DIESEL EXPENSES',
    null,
    null,
    null,
    null,
    null,
    null,
    data.totals.diesel,
  ])
}

export async function buildWorkbook(data: PeriodExportData): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook()
  wb.created = new Date()
  wb.creator = 'DNL P&L Webapp'

  buildPlSummary(wb, data)
  buildPurchases(wb, data)
  buildSales(wb, data)
  buildSalary(wb, data)
  buildToll(wb, data)
  buildDiesel(wb, data)

  const buffer = await wb.xlsx.writeBuffer()
  return buffer
}

export function exportFilename(year: number, month: number): string {
  const label = format(new Date(year, month - 1, 1), 'MMM yyyy').toUpperCase()
  return `DNL ${label} P&L.xlsx`
}
