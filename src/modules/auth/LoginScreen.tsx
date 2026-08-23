import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { Sun, Moon } from 'lucide-react'

type Mode = 'login' | 'register'

export function LoginScreen() {
  const { login, register } = useAuth()
  const { theme, toggle } = useTheme()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        if (!name.trim()) { setError('Informe seu nome.'); setLoading(false); return }
        if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); setLoading(false); return }
        await register(name, email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado.')
    } finally {
      setLoading(false)
    }
  }

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
    setName('')
    setEmail('')
    setPassword('')
  }

  return (
    <div className="min-h-screen flex" data-theme={theme}>
      {/* ── Left panel — form ── */}
      <div className="relative flex flex-1 flex-col bg-[var(--color-surface)] px-6 py-8 md:px-12 lg:px-16">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label="Alternar tema"
          className="absolute top-6 right-6 p-2 rounded-md text-[var(--color-ink-subtle)] hover:bg-[var(--color-surface-elevated)] transition-colors"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Logo */}
        <div>
          <span className="text-2xl font-bold tracking-tight text-[var(--color-sky)]">FOCUS</span>
        </div>

        {/* Centered form */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-[var(--color-ink)]">
                {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta'}
              </h1>
              <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                {mode === 'login'
                  ? 'Insira seu e-mail para acessar sua conta.'
                  : 'Preencha os dados para começar.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === 'register' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--color-ink)]" htmlFor="name">
                    Nome
                  </label>
                  <input
                    id="name"
                    type="text"
                    placeholder="Seu nome"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    autoFocus
                    className="w-full rounded-md border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] outline-none focus:border-[var(--color-sky)] focus:ring-2 focus:ring-[var(--color-sky)]/20 transition-colors"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-[var(--color-ink)]" htmlFor="email">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus={mode === 'login'}
                  className="w-full rounded-md border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] outline-none focus:border-[var(--color-sky)] focus:ring-2 focus:ring-[var(--color-sky)]/20 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-[var(--color-ink)]" htmlFor="password">
                    Senha
                  </label>
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full rounded-md border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] outline-none focus:border-[var(--color-sky)] focus:ring-2 focus:ring-[var(--color-sky)]/20 transition-colors"
                />
              </div>

              {error && (
                <p className="text-sm text-[var(--color-coral)] bg-[var(--color-coral-soft)] rounded-md px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-[var(--color-ink)] text-[var(--color-surface)] font-semibold text-sm py-2.5 hover:opacity-90 disabled:opacity-50 transition-opacity mt-1"
              >
                {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--color-ink-subtle)]">
              {mode === 'login' ? (
                <>
                  Não tem uma conta?{' '}
                  <button
                    onClick={() => switchMode('register')}
                    className="font-semibold text-[var(--color-ink)] underline underline-offset-4 hover:text-[var(--color-sky)] transition-colors"
                  >
                    Criar conta
                  </button>
                </>
              ) : (
                <>
                  Já tem uma conta?{' '}
                  <button
                    onClick={() => switchMode('login')}
                    className="font-semibold text-[var(--color-ink)] underline underline-offset-4 hover:text-[var(--color-sky)] transition-colors"
                  >
                    Entrar
                  </button>
                </>
              )}
            </p>

            <p className="mt-8 text-center text-xs text-[var(--color-ink-faint)]">
              Seus dados ficam armazenados apenas neste dispositivo.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel — branding (hidden on mobile) ── */}
      <div className="hidden md:flex flex-1 flex-col justify-between bg-zinc-900 p-12 text-white dark:bg-zinc-950">
        <div>
          <span className="text-lg font-bold tracking-tight">FOCUS</span>
        </div>

        <blockquote className="space-y-4">
          <p className="text-xl font-light leading-relaxed text-zinc-100">
            "A disciplina é a ponte entre metas e realizações. Cada hábito construído hoje é um passo em direção à versão que você quer ser amanhã."
          </p>
          <footer className="text-sm text-zinc-400">— Organização Pessoal</footer>
        </blockquote>

        <p className="text-xs text-zinc-500">
          Offline-first · Seus dados, seu controle.
        </p>
      </div>
    </div>
  )
}
