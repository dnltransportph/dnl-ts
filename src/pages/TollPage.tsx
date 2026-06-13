import { TransactionModule, baseValidators } from '@/components/TransactionModule'
import { useMasterData } from '@/hooks/useMasterData'
import { customerDeliverySiteComboboxOptions } from '@/lib/salesPresets'
import type { TollFeeRefund } from '@/types/database'
import { normalizePlate } from '@/lib/validation'
import { useMemo } from 'react'

export function TollPage() {
  const { plateOptions, customerDeliverySites } = useMasterData()
  const presets = customerDeliverySites.data ?? []

  const columns = useMemo(
    () => [
      { key: 'date' as const, label: 'Date', inputType: 'date' as const, required: true },
      {
        key: 'plate_code' as const,
        label: 'Plate No.',
        inputType: 'select' as const,
        selectOptions: plateOptions,
      },
      {
        key: 'delivery_site' as const,
        label: 'Delivery Site',
        inputType: 'combobox' as const,
        comboboxOptions: () => customerDeliverySiteComboboxOptions(presets),
      },
      {
        key: 'amount' as const,
        label: 'Amount',
        inputType: 'number' as const,
        required: true,
        align: 'right' as const,
      },
    ],
    [plateOptions, presets],
  )

  return (
    <TransactionModule<TollFeeRefund>
      title="Toll Fee Refund"
      table="toll_fee_refunds"
      columns={columns}
      emptyForm={{
        period_id: '',
        date: '',
        plate_code: null,
        delivery_site: null,
        amount: 0,
      }}
      validate={baseValidators}
      normalize={(form) => ({
        date: form.date,
        plate_code: normalizePlate(form.plate_code),
        delivery_site: form.delivery_site?.trim() || null,
        amount: Number(form.amount),
      })}
    />
  )
}
