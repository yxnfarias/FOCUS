import { type InputHTMLAttributes, type SelectHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export function Input({ label, error, hint, className = '', id, ...props }: Props) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-[var(--color-ink-muted)]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full rounded-[var(--radius-md)] border px-3 py-2 text-[var(--color-ink)]
          bg-[var(--color-surface-elevated)] placeholder:text-[var(--color-ink-faint)]
          focus:outline-none focus:ring-2 focus:ring-[var(--color-sky)] focus:border-[var(--color-sky-deep)]
          ${error ? 'border-[var(--color-coral)]' : 'border-[var(--color-outline)]'}
          ${className}
        `}
        {...props}
      />
      {hint && !error && <p className="text-xs text-[var(--color-ink-subtle)]">{hint}</p>}
      {error && <p className="text-xs text-[var(--color-coral)]">{error}</p>}
    </div>
  )
}

export function Select({ label, error, className = '', id, children, ...props }: SelectProps & { children: React.ReactNode }) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-[var(--color-ink-muted)]">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`
          w-full rounded-[var(--radius-md)] border px-3 py-2 text-[var(--color-ink)]
          bg-[var(--color-surface-elevated)]
          focus:outline-none focus:ring-2 focus:ring-[var(--color-sky)] focus:border-[var(--color-sky-deep)]
          ${error ? 'border-[var(--color-coral)]' : 'border-[var(--color-outline)]'}
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-[var(--color-coral)]">{error}</p>}
    </div>
  )
}
