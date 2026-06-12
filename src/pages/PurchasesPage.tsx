import { TransactionModule } from '@/components/TransactionModule'
import { useMasterData } from '@/hooks/useMasterData'
import type { PurchaseExpense } from '@/types/database'
import {
  normalizeCostCenter,
  normalizePlate,
  normalizePoNumber,
  resolveAmount,
} from '@/lib/validation'

function validatePurchase(form: Record<string, string>): string | null {
  if (!form.date?.trim()) return 'Date is required.'
  const amount = resolveAmount(form.amount, form.qty, form.unit_price)
  if (amount === null) return 'Amount is required (enter amount or qty × unit price).'
  return null
}

export function PurchasesPage() {
  const { plateOptions, costCenterOptions, supplierOptions } = useMasterData()

  const columns = [
    { key: 'date' as const, label: 'Date', inputType: 'date' as const, required: true },
    { key: 'po_number' as const, label: 'PO No.' },
    {
      key: 'plate_code' as const,
      label: 'Plate No.',
      inputType: 'select' as const,
      selectOptions: plateOptions,
    },
    {
      key: 'cost_center_code' as const,
      label: 'Cost Center',
      inputType: 'select' as const,
      selectOptions: costCenterOptions,
    },
    {
      key: 'supplier' as const,
      label: 'Supplier',
      inputType: 'select' as const,
      selectOptions: supplierOptions,
    },
    { key: 'description' as const, label: 'Description' },
    { key: 'qty' as const, label: 'Qty', inputType: 'number' as const },
    { key: 'unit' as const, label: 'Unit' },
    { key: 'unit_price' as const, label: 'Unit Price', inputType: 'number' as const },
    {
      key: 'amount' as const,
      label: 'Amount',
      inputType: 'number' as const,
      required: true,
      align: 'right' as const,
    },
  ]

  return (
    <TransactionModule<PurchaseExpense>
      title="Purchases & Expenses"
      table="purchase_expenses"
      columns={columns}
      emptyForm={{
        period_id: '',
        date: '',
        po_number: null,
        plate_code: null,
        cost_center_code: null,
        supplier: null,
        description: null,
        qty: null,
        unit: null,
        unit_price: null,
        amount: 0,
      }}
      validate={validatePurchase}
      normalize={(form) => ({
        date: form.date,
        po_number: normalizePoNumber(form.po_number),
        plate_code: normalizePlate(form.plate_code),
        cost_center_code: normalizeCostCenter(form.cost_center_code),
        supplier: form.supplier?.trim() || null,
        description: form.description?.trim() || null,
        qty: form.qty ? Number(form.qty) : null,
        unit: form.unit?.trim() || null,
        unit_price: form.unit_price ? Number(form.unit_price) : null,
        amount: resolveAmount(form.amount, form.qty, form.unit_price)!,
      })}
    />
  )
}
