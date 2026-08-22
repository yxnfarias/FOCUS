import { type ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  elevated?: boolean
  onClick?: () => void
}

export function Card({ children, className = '', elevated, onClick }: Props) {
  const base = `
    rounded-[var(--radius-lg)] border border-[var(--color-outline)] p-4
    ${elevated ? 'bg-[var(--color-surface-elevated)] shadow-md' : 'bg-[var(--color-surface)]'}
    ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow duration-150' : ''}
    ${className}
  `
  return <div className={base} onClick={onClick}>{children}</div>
}
