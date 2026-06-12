import { TransactionModule, baseValidators } from '@/components/TransactionModule'
import { useMasterData } from '@/hooks/useMasterData'
import type { SalaryExpense } from '@/types/database'
import { normalizeCostCenter, normalizePlate } from '@/lib/validation'

export function SalaryPage() {
  const { plateOptions, costCenterOptions, employeeOptions } = useMasterData()

  const columns = [
    { key: 'date' as const, label: 'Date', inputType: 'date' as const, required: true },
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
      key: 'employee' as const,
      label: 'Employee',
      inputType: 'select' as const,
      selectOptions: employeeOptions,
    },
    { key: 'remarks' as const, label: 'Remarks' },
    {
      key: 'amount' as const,
      label: 'Amount',
      inputType: 'number' as const,
      required: true,
      align: 'right' as const,
    },
  ]

  return (
    <TransactionModule<SalaryExpense>
      title="Salary Expenses"
      table="salary_expenses"
      columns={columns}
      emptyForm={{
        period_id: '',
        date: '',
        plate_code: null,
        cost_center_code: null,
        employee: null,
        remarks: null,
        amount: 0,
      }}
      validate={baseValidators}
      normalize={(form) => ({
        date: form.date,
        plate_code: normalizePlate(form.plate_code),
        cost_center_code: normalizeCostCenter(form.cost_center_code),
        employee: form.employee?.trim() || null,
        remarks: form.remarks?.trim() || null,
        amount: Number(form.amount),
      })}
    />
  )
}
