import { Button as MantineButton, type ButtonProps as MantineButtonProps } from '@mantine/core'
import { type ButtonHTMLAttributes } from 'react'

const variantMap = {
  primary: { variant: 'filled', color: 'brand' },
  secondary: { variant: 'default', color: undefined },
  danger: { variant: 'filled', color: 'red' },
  ghost: { variant: 'subtle', color: 'gray' },
} as const satisfies Record<
  string,
  Pick<MantineButtonProps, 'variant' | 'color'>
>

const sizeMap = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
} as const

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantMap
  size?: keyof typeof sizeMap
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth,
  ...props
}: ButtonProps) {
  const { variant: mantineVariant, color } = variantMap[variant]
  const isFullWidth = fullWidth ?? className.includes('w-full')

  return (
    <MantineButton
      variant={mantineVariant}
      color={color}
      size={sizeMap[size]}
      fullWidth={isFullWidth}
      className={className}
      {...props}
    />
  )
}
