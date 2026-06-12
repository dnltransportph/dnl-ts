import ExcelJS from 'exceljs'
import type { Row, Worksheet } from 'exceljs'
import {
  DATA_START_ROW,
  HEADER_ROW,
  SALARY_DATA_START_ROW,
  SHEET_NAMES,
  TOLL_DATA_START_ROW,
} from './constants'
import type {
  ImportIssue,
  ParsedDieselRow,
  ParsedPurchaseRow,
  ParsedSalaryRow,
  ParsedSaleRow,
  ParsedTollRow,
  ParsedWorkbook,
} from './types'
import {
  cellDate,
  cellNumber,
  cellText,
  isSumFormulaCell,
  isTotalRow,
  poOrNull,
  splitPlateOrCostCenter,
  textOrNull,
} from './utils'

const AMOUNT_COL = {
  sales: 6,
  purchases: 9,
  diesel: 9,
  salary: 5,
  toll: 4,
} as const

function shouldStopAtRow(row: Row, amountCol: number): boolean {
  const labels = [cellText(row.getCell(1)), cellText(row.getCell(2))]
  if (isTotalRow(labels)) return true

  const date = cellDate(row.getCell(1))
  if (!date && isSumFormulaCell(row.getCell(amountCol))) return true

  return false
}

function addIssue(
  issues: ImportIssue[],
  sheet: string,
  row: number,
  message: string,
  severity: ImportIssue['severity'] = 'error',
) {
  issues.push({ sheet, row, message, severity })
}

function detectPeriod(workbook: ExcelJS.Workbook): { year: number; month: number } | null {
  const candidates = [
    workbook.getWorksheet(SHEET_NAMES.SALES)?.getRow(3).getCell(1),
    workbook.getWorksheet(SHEET_NAMES.PURCHASES)?.getRow(3).getCell(1),
    workbook.getWorksheet(SHEET_NAMES.DIESEL)?.getRow(2).getCell(1),
  ]

  for (const cell of candidates) {
    if (!cell) continue
    const iso = cellDate(cell)
    if (!iso) continue
    const date = new Date(iso + 'T00:00:00')
    return { year: date.getFullYear(), month: date.getMonth() + 1 }
  }

  return null
}

function parseSales(sheet: Worksheet, issues: ImportIssue[]): ParsedSaleRow[] {
  const rows: ParsedSaleRow[] = []

  for (let rowNum = DATA_START_ROW; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum)
    if (shouldStopAtRow(row, AMOUNT_COL.sales)) break

    const date = cellDate(row.getCell(1))
    if (!date) continue

    const amount = cellNumber(row.getCell(AMOUNT_COL.sales))
    if (amount == null || amount < 0) {
      addIssue(
        issues,
        SHEET_NAMES.SALES,
        rowNum,
        'Skipped — missing amount in column F.',
        'warning',
      )
      continue
    }

    rows.push({
      date,
      plate_code: splitPlateOrCostCenter(cellText(row.getCell(2))).plate_code,
      customer: textOrNull(cellText(row.getCell(3))),
      delivery_site: textOrNull(cellText(row.getCell(4))),
      trips: cellNumber(row.getCell(5)),
      amount,
      sourceRow: rowNum,
    })
  }

  return rows
}

function parsePurchases(sheet: Worksheet, issues: ImportIssue[]): ParsedPurchaseRow[] {
  const rows: ParsedPurchaseRow[] = []

  for (let rowNum = DATA_START_ROW; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum)
    if (shouldStopAtRow(row, AMOUNT_COL.purchases)) break

    const date = cellDate(row.getCell(1))
    if (!date) continue

    const amount = cellNumber(row.getCell(AMOUNT_COL.purchases))
    const qty = cellNumber(row.getCell(6))
    const unitPrice = cellNumber(row.getCell(8))
    const resolvedAmount = amount ?? (qty != null && unitPrice != null ? qty * unitPrice : null)
    const plateOrCenter = splitPlateOrCostCenter(cellText(row.getCell(3)))

    if (resolvedAmount == null || resolvedAmount < 0) {
      addIssue(issues, SHEET_NAMES.PURCHASES, rowNum, 'Skipped — missing amount.', 'warning')
      continue
    }

    rows.push({
      date,
      po_number: poOrNull(cellText(row.getCell(2))),
      plate_code: plateOrCenter.plate_code,
      cost_center_code: plateOrCenter.cost_center_code,
      supplier: textOrNull(cellText(row.getCell(4))),
      description: textOrNull(cellText(row.getCell(5))),
      qty,
      unit: textOrNull(cellText(row.getCell(7))),
      unit_price: unitPrice,
      amount: resolvedAmount,
      sourceRow: rowNum,
    })
  }

  return rows
}

function parseDiesel(sheet: Worksheet, issues: ImportIssue[]): ParsedDieselRow[] {
  const rows: ParsedDieselRow[] = []

  for (let rowNum = DATA_START_ROW; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum)
    if (shouldStopAtRow(row, AMOUNT_COL.diesel)) break

    const date = cellDate(row.getCell(1))
    if (!date) continue

    const amount = cellNumber(row.getCell(AMOUNT_COL.diesel))
    const qty = cellNumber(row.getCell(6))
    const unitPrice = cellNumber(row.getCell(8))
    const resolvedAmount = amount ?? (qty != null && unitPrice != null ? qty * unitPrice : null)

    if (resolvedAmount == null || resolvedAmount < 0) {
      addIssue(issues, SHEET_NAMES.DIESEL, rowNum, 'Skipped — missing amount.', 'warning')
      continue
    }

    rows.push({
      date,
      po_number: poOrNull(cellText(row.getCell(2))),
      plate_code: splitPlateOrCostCenter(cellText(row.getCell(3))).plate_code,
      supplier: textOrNull(cellText(row.getCell(4))),
      description: textOrNull(cellText(row.getCell(5))),
      qty,
      unit: textOrNull(cellText(row.getCell(7))),
      unit_price: unitPrice,
      amount: resolvedAmount,
      sourceRow: rowNum,
    })
  }

  return rows
}

function parseSalary(sheet: Worksheet, issues: ImportIssue[]): ParsedSalaryRow[] {
  const rows: ParsedSalaryRow[] = []

  for (let rowNum = SALARY_DATA_START_ROW; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum)
    if (shouldStopAtRow(row, AMOUNT_COL.salary)) break

    const date = cellDate(row.getCell(1))
    if (!date) continue

    const amount = cellNumber(row.getCell(AMOUNT_COL.salary))
    const plateOrCenter = splitPlateOrCostCenter(cellText(row.getCell(2)))

    if (amount == null || amount < 0) {
      addIssue(issues, SHEET_NAMES.SALARY, rowNum, 'Skipped — missing amount.', 'warning')
      continue
    }

    rows.push({
      date,
      plate_code: plateOrCenter.plate_code,
      cost_center_code: plateOrCenter.cost_center_code,
      employee: textOrNull(cellText(row.getCell(4))),
      remarks: textOrNull(cellText(row.getCell(3))),
      amount,
      sourceRow: rowNum,
    })
  }

  return rows
}

function parseToll(sheet: Worksheet, issues: ImportIssue[]): ParsedTollRow[] {
  const rows: ParsedTollRow[] = []

  for (let rowNum = TOLL_DATA_START_ROW; rowNum <= sheet.rowCount; rowNum++) {
    const row = sheet.getRow(rowNum)
    if (shouldStopAtRow(row, AMOUNT_COL.toll)) break

    const date = cellDate(row.getCell(1))
    if (!date) continue

    const amount = cellNumber(row.getCell(AMOUNT_COL.toll))
    if (amount == null || amount < 0) {
      addIssue(issues, SHEET_NAMES.TOLL, rowNum, 'Skipped — missing amount.', 'warning')
      continue
    }

    rows.push({
      date,
      plate_code: splitPlateOrCostCenter(cellText(row.getCell(2))).plate_code,
      delivery_site: textOrNull(cellText(row.getCell(3))),
      amount,
      sourceRow: rowNum,
    })
  }

  return rows
}

function assertSheet(workbook: ExcelJS.Workbook, name: string, issues: ImportIssue[]): Worksheet | null {
  const sheet = workbook.getWorksheet(name)
  if (!sheet) {
    addIssue(issues, name, 0, `Missing sheet "${name}".`)
    return null
  }
  return sheet
}

export async function parseWorkbook(buffer: ArrayBuffer): Promise<ParsedWorkbook> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const issues: ImportIssue[] = []
  const period = detectPeriod(workbook)

  if (!period) {
    addIssue(issues, 'Workbook', 0, 'Could not detect reporting month from sheet headers.')
  }

  const salesSheet = assertSheet(workbook, SHEET_NAMES.SALES, issues)
  const purchasesSheet = assertSheet(workbook, SHEET_NAMES.PURCHASES, issues)
  const dieselSheet = assertSheet(workbook, SHEET_NAMES.DIESEL, issues)
  const salarySheet = assertSheet(workbook, SHEET_NAMES.SALARY, issues)
  const tollSheet = assertSheet(workbook, SHEET_NAMES.TOLL, issues)

  if (!salesSheet || !purchasesSheet || !dieselSheet || !salarySheet || !tollSheet || !period) {
    return {
      detectedYear: period?.year ?? new Date().getFullYear(),
      detectedMonth: period?.month ?? new Date().getMonth() + 1,
      sales: [],
      purchases: [],
      diesel: [],
      salary: [],
      toll: [],
      issues,
    }
  }

  const header = salesSheet.getRow(HEADER_ROW).getCell(1).value
  if (!header) {
    addIssue(issues, SHEET_NAMES.SALES, HEADER_ROW, 'Unexpected header layout on SALES sheet.', 'warning')
  }

  return {
    detectedYear: period.year,
    detectedMonth: period.month,
    sales: parseSales(salesSheet, issues),
    purchases: parsePurchases(purchasesSheet, issues),
    diesel: parseDiesel(dieselSheet, issues),
    salary: parseSalary(salarySheet, issues),
    toll: parseToll(tollSheet, issues),
    issues,
  }
}
