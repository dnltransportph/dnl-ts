import { TextInput } from '@mantine/core'
import { type InputHTMLAttributes } from 'react'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <TextInput
      id={inputId}
      label={label}
      error={error}
      className={className}
      size="sm"
      {...props}
    />
  )
}
