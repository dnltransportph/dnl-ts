import { NativeSelect } from '@mantine/core'
import { type SelectHTMLAttributes } from 'react'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string
  options: { value: string; label: string }[]
}

export function Select({ label, options, className = '', style, ...props }: SelectProps) {
  return (
    <NativeSelect
      label={label}
      data={options}
      className={className}
      style={{ width: '100%', ...style }}
      size="sm"
      {...props}
    />
  )
}
