import { useLiveQuery } from 'dexie-react-hooks'
import { Wallet, Target, CheckSquare, Star, TrendingUp, Flame } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '../../db'
import { Card } from '../../components/ui/Card'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function Dashboard() {
  const today = new Date().toISOString().split('T')[0]

  const transactions = useLiveQuery(() => db.transactions.toArray(), [])
  const habits       = useLiveQuery(() => db.habits.toArray(), [])
  const habitLogs    = useLiveQuery(() => db.habitLogs.where('date').equals(today).toArray(), [today])
  const tasks        = useLiveQuery(() => db.tasks.toArray().then(all => all.filter(t => t.status !== 'done')), [])
  const wishes       = useLiveQuery(() => db.wishItems.toArray().then(all => all.filter(i => !i.completed)), [])

  const balance           = transactions?.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0) ?? 0
  const completedToday    = habitLogs?.length ?? 0
  const totalHabits       = habits?.length ?? 0
  const pendingTasks      = tasks?.length ?? 0
  const pendingWishes     = wishes?.length ?? 0
  const topStreak         = habits?.reduce((max, h) => h.streak > max ? h.streak : max, 0) ?? 0
  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  const pillars = [
    {
      to: '/financas', icon: Wallet, label: 'Finanças',
      value: fmt(balance), sub: balance >= 0 ? 'Saldo positivo' : 'Atenção ao saldo',
      accent: balance >= 0 ? 'var(--color-leaf)' : 'var(--color-coral)',
      bg: balance >= 0 ? 'var(--color-leaf-soft)' : 'var(--color-coral-soft)',
    },
    {
      to: '/habitos', icon: Target, label: 'Hábitos',
      value: `${completedToday}/${totalHabits}`, sub: 'cumpridos hoje',
      accent: 'var(--color-sky)', bg: 'var(--color-sky-soft)',
    },
    {
      to: '/tarefas', icon: CheckSquare, label: 'Tarefas',
      value: String(pendingTasks), sub: pendingTasks === 1 ? 'pendente' : 'pendentes',
      accent: 'var(--color-sun)', bg: '#FEF9C3',
    },
    {
      to: '/desejos', icon: Star, label: 'Desejos',
      value: String(pendingWishes), sub: pendingWishes === 1 ? 'na lista' : 'na lista',
      accent: 'var(--color-berry)', bg: '#F3E8FF',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-[var(--color-ink)]">{greeting()} 👋</h1>
        <p className="text-[var(--color-ink-muted)] mt-1">Aqui está o resumo do seu dia.</p>
      </div>

      {/* Streak banner */}
      {topStreak > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-[var(--radius-lg)] px-5 py-4">
          <Flame size={24} className="text-amber-500 shrink-0" />
          <div>
            <p className="font-bold text-amber-800">{topStreak} dias em sequência!</p>
            <p className="text-sm text-amber-600">Continue assim — você está construindo algo incrível.</p>
          </div>
        </div>
      )}

      {/* Pillar cards — 2×2 grid */}
      <div className="grid grid-cols-2 gap-4">
        {pillars.map(({ to, icon: Icon, label, value, sub, accent, bg }) => (
          <Link key={to} to={to} className="group">
            <Card className="flex flex-col gap-4 h-full group-hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--color-ink-muted)]">{label}</span>
                <div className="p-2 rounded-[var(--radius-sm)]" style={{ background: bg }}>
                  <Icon size={18} style={{ color: accent }} />
                </div>
              </div>
              <div>
                <p className="text-3xl font-bold leading-none" style={{ color: accent }}>{value}</p>
                <p className="text-xs text-[var(--color-ink-subtle)] mt-1">{sub}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick insight */}
      <Card className="flex items-center gap-3 bg-[var(--color-sky-soft)] border-[var(--color-sky-soft)]">
        <TrendingUp size={20} className="text-[var(--color-sky)] shrink-0" />
        <p className="text-sm text-[var(--color-sky-deep)] font-medium">
          {pendingTasks === 0
            ? 'Nenhuma tarefa pendente — você está em dia!'
            : `Você tem ${pendingTasks} tarefa${pendingTasks > 1 ? 's' : ''} para fazer. Vamos lá!`}
        </p>
      </Card>
    </div>
  )
}
