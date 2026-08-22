import { type ReactNode } from 'react'

type Color = 'sky' | 'sun' | 'leaf' | 'coral' | 'berry' | 'neutral'

interface Props {
  children: ReactNode
  color?: Color
  className?: string
}

const colorMap: Record<Color, string> = {
  sky:     'bg-[var(--color-sky-soft)] text-[var(--color-sky-deep)]',
  sun:     'bg-[var(--color-sun-soft)] text-[var(--color-sun-deep)]',
  leaf:    'bg-[var(--color-leaf-soft)] text-[var(--color-leaf-deep)]',
  coral:   'bg-[var(--color-coral-soft)] text-[var(--color-coral)]',
  berry:   'bg-[var(--color-berry-soft)] text-[var(--color-berry-deep)]',
  neutral: 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)]',
}

export function Badge({ children, color = 'neutral', className = '' }: Props) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${colorMap[color]} ${className}`}>
      {children}
    </span>
  )
}
