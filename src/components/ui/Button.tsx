import { type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'danger' | 'success'
type Size = 'sm' | 'md' | 'lg'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
  fullWidth?: boolean
}

const variantStyles: Record<Variant, string> = {
  primary: 'bg-[var(--color-sky)] text-white hover:bg-[var(--color-sky-deep)] active:bg-[var(--color-sky-deep)]',
  ghost: 'bg-transparent text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)]',
  danger: 'bg-[var(--color-coral-soft)] text-[var(--color-coral)] hover:bg-[var(--color-coral)] hover:text-white',
  success: 'bg-[var(--color-leaf-soft)] text-[var(--color-leaf-deep)] hover:bg-[var(--color-leaf)] hover:text-white',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

export function Button({ variant = 'primary', size = 'md', children, fullWidth, className = '', ...props }: Props) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)]
        font-semibold transition-all duration-150 cursor-pointer
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-sky)]
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variantStyles[variant]} ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}
