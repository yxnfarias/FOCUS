import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../hooks/useTheme'
import { Eye, EyeOff, Sun, Moon } from 'lucide-react'

type Mode = 'login' | 'signup'

const EASE = 'cubic-bezier(0,0,.2,1)'
function anim(name: string, dur: string, delay = '0ms'): React.CSSProperties {
  return { animation: `${name} ${dur} ${EASE} ${delay} both` }
}

const CYCLER_WORDS = ['finanças', 'hábitos', 'tarefas', 'finanças']

export function LoginScreen() {
  const { login, register } = useAuth()
  const { theme, toggle } = useTheme()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isLogin = mode === 'login'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isLogin) {
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
    setShowPw(false)
  }

  const inputClass =
    'w-full rounded-[var(--radius-md)] border border-[var(--color-outline)] bg-[var(--color-surface)] px-4 py-3 text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] outline-none focus:border-[var(--color-sky)] focus:bg-[var(--color-surface-elevated)] focus:shadow-[0_0_0_4px_rgba(59,130,246,.14)] transition-[border-color,background-color,box-shadow] duration-150'

  return (
    <div data-theme={theme}>
      <main className="grid min-h-screen grid-cols-1 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">

        {/* ── Left panel: dark brand ── */}
        <section
          className="hidden md:flex flex-col justify-between p-14 relative overflow-hidden"
          style={{ background: '#0f172a' }}
        >
          {/* Halo A — sky */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{
              width: 560, height: 560, top: -100, left: -140, borderRadius: 999,
              background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
              filter: 'blur(10px)',
              animation: 'breathe 11s ease-in-out infinite',
            }}
          />
          {/* Halo B — berry */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{
              width: 460, height: 460, bottom: 80, right: -100, borderRadius: 999,
              background: 'radial-gradient(circle, #6d28d9 0%, transparent 70%)',
              filter: 'blur(10px)',
              animation: 'breathe 14s ease-in-out 2s infinite',
            }}
          />

          {/* Wordmark */}
          <div className="relative z-10 flex items-center gap-3" style={anim('riseIn', '600ms')}>
            <div
              className="w-10 h-10 flex items-center justify-center shrink-0"
              style={{ background: '#3b82f6', borderRadius: '10px' }}
            >
              <span className="text-white font-black text-xl">f</span>
            </div>
            <span className="text-white font-bold text-xl tracking-wide">focus</span>
          </div>

          {/* Central block */}
          <div className="relative z-10 flex flex-col gap-6">
            <h1
              className="font-bold text-white leading-[.98] tracking-[-0.035em]"
              style={{
                fontSize: 'clamp(40px, 5.2vw, 76px)',
                maxWidth: '11ch',
                ...anim('riseIn', '800ms', '100ms'),
              }}
            >
              Tudo que importa em um só lugar.
            </h1>

            {/* Sky rule */}
            <div
              className="h-[3px] w-16 rounded-full"
              style={{
                background: '#3b82f6',
                transformOrigin: 'left',
                ...anim('drawX', '700ms', '500ms'),
              }}
            />

            {/* Word cycler */}
            <p
              className="text-[19px]"
              style={{ color: '#94a3b8', ...anim('fadeIn', '800ms', '700ms') }}
            >
              Gerencie suas{' '}
              <span
                className="inline-block align-bottom overflow-hidden font-bold"
                style={{ height: '1.35em' }}
              >
                <span
                  className="flex flex-col"
                  style={{ animation: 'cycle 9s cubic-bezier(.4,0,.2,1) infinite' }}
                >
                  {CYCLER_WORDS.map((w, i) => (
                    <span
                      key={i}
                      className="block"
                      style={{ height: '1.35em', lineHeight: '1.35em', color: '#93c5fd' }}
                    >
                      {w}
                    </span>
                  ))}
                </span>
              </span>
            </p>
          </div>

          {/* Footer mono */}
          <p
            className="relative z-10"
            style={{
              color: '#475569',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              ...anim('fadeIn', '800ms', '900ms'),
            }}
          >
            Organização Pessoal
          </p>
        </section>

        {/* ── Right panel: form ── */}
        <section className="relative flex items-center justify-center p-8 md:p-14 bg-[var(--color-surface)] min-h-screen md:min-h-0">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label="Alternar tema"
            className="absolute top-6 right-6 p-2 rounded-[var(--radius-md)] text-[var(--color-ink-subtle)] hover:bg-[var(--color-surface-sunken)] transition-colors"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* Mobile wordmark (visible only below md) */}
          <div className="absolute top-6 left-6 flex items-center gap-2 md:hidden">
            <div
              className="w-8 h-8 flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-sky)', borderRadius: '8px' }}
            >
              <span className="text-white font-black text-sm">f</span>
            </div>
            <span className="font-bold text-[var(--color-ink)]">focus</span>
          </div>

          <div className="w-full max-w-[372px]">
            {/* H2 + subtext */}
            <div className="mb-8" style={anim('riseIn', '600ms', '150ms')}>
              <h2
                className="font-bold text-[var(--color-ink)] tracking-[-0.02em]"
                style={{ fontSize: '34px' }}
              >
                {isLogin ? 'Bem-vindo de volta' : 'Criar sua conta'}
              </h2>
              <p className="mt-2 text-[16px] text-[var(--color-ink-muted)]">
                {isLogin
                  ? 'Entre para continuar de onde parou.'
                  : 'Preencha os dados para começar.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
              {/* Name — signup only */}
              {!isLogin && (
                <div className="flex flex-col gap-1.5" style={anim('riseIn', '500ms', '200ms')}>
                  <label htmlFor="name" className="text-[13px] font-bold text-[var(--color-ink-muted)]">
                    Nome
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Seu nome"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                    required
                    className={inputClass}
                  />
                </div>
              )}

              {/* Email */}
              <div
                className="flex flex-col gap-1.5"
                style={anim('riseIn', '500ms', isLogin ? '200ms' : '250ms')}
              >
                <label htmlFor="email" className="text-[13px] font-bold text-[var(--color-ink-muted)]">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus={isLogin}
                  required
                  className={inputClass}
                />
              </div>

              {/* Password */}
              <div
                className="flex flex-col gap-1.5"
                style={anim('riseIn', '500ms', isLogin ? '250ms' : '300ms')}
              >
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[13px] font-bold text-[var(--color-ink-muted)]">
                    Senha
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      className="text-[13px] text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)] transition-colors"
                    >
                      Esqueci minha senha
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    placeholder={isLogin ? '••••••••' : 'Mínimo 6 caracteres'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className={inputClass + ' pr-12'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    aria-label={showPw ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPw}
                    className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center min-h-[44px] px-1.5 text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-sunken)] rounded transition-colors"
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {!isLogin && (
                  <p className="text-xs text-[var(--color-ink-subtle)]">Mínimo 6 caracteres</p>
                )}
              </div>

              {/* Error */}
              {error && (
                <p
                  className="text-sm px-4 py-2.5 rounded-[var(--radius-md)] bg-red-50"
                  style={{ color: '#b91c1c' }}
                  aria-live="polite"
                >
                  {error}
                </p>
              )}

              {/* Submit — ink bg, sky-deep on hover */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[var(--radius-md)] text-[16px] font-bold text-white py-[14px] bg-[#0f172a] hover:bg-[var(--color-sky-deep)] hover:shadow-[0_10px_24px_-12px_rgba(29,78,216,0.7)] active:translate-y-px disabled:opacity-50 transition-[background-color,box-shadow,transform] duration-[180ms] mt-1"
                style={anim('riseIn', '500ms', isLogin ? '300ms' : '350ms')}
              >
                {loading
                  ? (isLogin ? 'Entrando…' : 'Criando conta…')
                  : (isLogin ? 'Entrar' : 'Criar conta')}
              </button>
            </form>

            {/* Mode switch */}
            <p
              className="mt-6 text-center text-[14px] text-[var(--color-ink-subtle)]"
              style={anim('fadeIn', '600ms', isLogin ? '450ms' : '550ms')}
            >
              {isLogin ? (
                <>
                  Não tem uma conta?{' '}
                  <button
                    onClick={() => switchMode('signup')}
                    className="font-bold text-[var(--color-ink)] hover:text-[var(--color-sky)] transition-colors"
                  >
                    Cadastre-se
                  </button>
                </>
              ) : (
                <>
                  Já tem uma conta?{' '}
                  <button
                    onClick={() => switchMode('login')}
                    className="font-bold text-[var(--color-ink)] hover:text-[var(--color-sky)] transition-colors"
                  >
                    Entrar
                  </button>
                </>
              )}
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
