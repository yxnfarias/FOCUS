import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Wallet, Target, CheckSquare, Star, BookOpen, Sun, Moon, LogOut,
} from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Início', end: true },
  { to: '/financas', icon: Wallet, label: 'Finanças' },
  { to: '/habitos', icon: Target, label: 'Hábitos' },
  { to: '/tarefas', icon: CheckSquare, label: 'Tarefas' },
  { to: '/desejos', icon: Star, label: 'Desejos' },
  { to: '/diario', icon: BookOpen, label: 'Diário' },
]

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

export function AppShell() {
  const { theme, toggle } = useTheme()
  const { user, logout } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen flex bg-[var(--color-surface)]">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-[var(--color-surface-elevated)] border-r border-[var(--color-outline)] min-h-screen sticky top-0 h-screen">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[var(--color-outline)]">
          <span className="text-xl font-bold text-[var(--color-sky)] tracking-tight">FOCUS</span>
          <p className="text-xs text-[var(--color-ink-subtle)] mt-0.5">Organização Pessoal</p>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-md)] text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[var(--color-sky-soft)] text-[var(--color-sky-deep)]'
                    : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Footer */}
        <div className="border-t border-[var(--color-outline)]">
          {/* User info */}
          {user && (
            <div className="px-4 py-3 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[var(--color-sky-soft)] flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-[var(--color-sky-deep)]">{initials(user.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-ink)] truncate">{user.name}</p>
                <p className="text-[10px] text-[var(--color-ink-faint)] truncate">{user.email}</p>
              </div>
            </div>
          )}
          <div className="px-4 py-3 flex items-center justify-between border-t border-[var(--color-outline)]">
            <p className="text-xs text-[var(--color-ink-faint)]">v1.5 · Online</p>
            <div className="flex items-center gap-1">
              <button
                onClick={toggle}
                aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-ink-subtle)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)] transition-colors"
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
              <button
                onClick={logout}
                aria-label="Sair"
                title="Sair"
                className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-ink-subtle)] hover:bg-[var(--color-coral-soft)] hover:text-[var(--color-coral)] transition-colors"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar (mobile only) */}
        <header className="md:hidden sticky top-0 z-40 bg-[var(--color-surface-elevated)] border-b border-[var(--color-outline)] px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-bold text-[var(--color-sky)]">FOCUS</span>
          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-ink-subtle)] hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)] transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={logout}
              aria-label="Sair"
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-ink-subtle)] hover:bg-[var(--color-coral-soft)] hover:text-[var(--color-coral)] transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page */}
        <main key={location.pathname} className="flex-1 p-6 md:p-8 w-full" style={{ animation: 'fadeIn 180ms ease both' }}>
          <div className="max-w-3xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Bottom nav (mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface-elevated)] border-t border-[var(--color-outline)]">
        <div className="flex justify-around">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-2 text-xs font-semibold transition-colors ${
                  isActive ? 'text-[var(--color-sky)]' : 'text-[var(--color-ink-subtle)]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
