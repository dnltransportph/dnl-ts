import { TransactionModule, baseValidators, type FormFieldChangeHandler } from '@/components/TransactionModule'
import { useMasterData } from '@/hooks/useMasterData'
import {
  deliverySiteOptionsForCustomer,
  findPresetForDeliverySite,
} from '@/lib/salesPresets'
import type { Sale } from '@/types/database'
import { normalizePlate } from '@/lib/validation'
import { useMemo } from 'react'

export function SalesPage() {
  const { plateOptions, customerOptions, customerDeliverySites } = useMasterData()
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
        key: 'customer' as const,
        label: 'Customer',
        inputType: 'select' as const,
        selectOptions: customerOptions,
      },
      {
        key: 'delivery_site' as const,
        label: 'Delivery Site',
        inputType: 'combobox' as const,
        comboboxOptions: (form: Record<string, string>) =>
          deliverySiteOptionsForCustomer(presets, form.customer ?? ''),
      },
      { key: 'trips' as const, label: 'No. of Trips', inputType: 'number' as const },
      {
        key: 'amount' as const,
        label: 'Amount',
        inputType: 'number' as const,
        required: true,
        align: 'right' as const,
      },
    ],
    [plateOptions, customerOptions, presets],
  )

  const onFieldChange: FormFieldChangeHandler = (key, value, _form, setForm) => {
    if (key === 'customer') {
      setForm((prev) => ({
        ...prev,
        customer: value,
        delivery_site: '',
        trips: '',
        amount: '',
      }))
      return
    }

    if (key === 'delivery_site') {
      setForm((prev) => {
        const preset = findPresetForDeliverySite(presets, prev.customer ?? '', value)
        return {
          ...prev,
          delivery_site: value,
          trips: preset != null ? String(preset.trips) : '',
          amount: preset != null ? String(preset.amount) : '',
        }
      })
      return
    }

    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <TransactionModule<Sale>
      title="Sales"
      table="sales"
      columns={columns}
      emptyForm={{
        period_id: '',
        date: '',
        plate_code: null,
        customer: null,
        delivery_site: null,
        trips: null,
        amount: 0,
      }}
      validate={baseValidators}
      onFieldChange={onFieldChange}
      normalize={(form) => ({
        date: form.date,
        plate_code: normalizePlate(form.plate_code),
        customer: form.customer?.trim() || null,
        delivery_site: form.delivery_site?.trim() || null,
        trips: form.trips ? Number(form.trips) : null,
        amount: Number(form.amount),
      })}
    />
  )
}
