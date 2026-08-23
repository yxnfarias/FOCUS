import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'

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
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface)] p-4">
      {/* Theme toggle */}
      <button
        onClick={toggle}
        aria-label="Alternar tema"
        className="fixed top-4 right-4 p-2 rounded-[var(--radius-md)] text-[var(--color-ink-subtle)] hover:bg-[var(--color-surface-elevated)] transition-colors"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[var(--color-sky)] tracking-tight">FOCUS</h1>
          <p className="text-sm text-[var(--color-ink-subtle)] mt-1">Sua organização pessoal</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-surface-elevated)] rounded-[var(--radius-xl)] border border-[var(--color-outline)] shadow-lg p-6 flex flex-col gap-5">
          {/* Tab switcher */}
          <div className="flex rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] p-1 gap-1">
            {(['login', 'register'] as Mode[]).map(m => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-1.5 text-sm font-semibold rounded-[var(--radius-sm)] transition-all ${
                  mode === m
                    ? 'bg-[var(--color-surface-elevated)] text-[var(--color-ink)] shadow-sm'
                    : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                }`}
              >
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {mode === 'register' && (
              <Input
                label="Nome"
                placeholder="Seu nome"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                autoFocus
              />
            )}
            <Input
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus={mode === 'login'}
            />
            <Input
              label="Senha"
              type="password"
              placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={mode === 'register' ? 6 : undefined}
            />

            {error && (
              <p className="text-sm text-[var(--color-coral)] bg-[var(--color-coral-soft)] rounded-[var(--radius-md)] px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth disabled={loading} className="mt-1">
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Button>
          </form>

          <p className="text-xs text-center text-[var(--color-ink-faint)]">
            Seus dados ficam armazenados apenas neste dispositivo.
          </p>
        </div>
      </div>
    </div>
  )
}
