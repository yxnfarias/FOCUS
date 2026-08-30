import { useState, useEffect, useCallback } from 'react'
import { Wallet, Target, CheckSquare, Star, TrendingUp, Flame } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Card } from '../../components/ui/Card'
import { useAuth } from '../../contexts/AuthContext'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function firstName(name: string) {
  return name.split(' ')[0]
}

export function Dashboard() {
  const { user } = useAuth()
  const userId = user!.id
  const today = new Date().toISOString().split('T')[0]

  const [balance, setBalance]           = useState(0)
  const [completedToday, setCompletedToday] = useState(0)
  const [totalHabits, setTotalHabits]   = useState(0)
  const [pendingTasks, setPendingTasks] = useState(0)
  const [pendingWishes, setPendingWishes] = useState(0)
  const [topStreak, setTopStreak]       = useState(0)

  const load = useCallback(async () => {
    const [
      { data: transactions },
      { data: habits },
      { data: habitLogs },
      { data: tasks },
      { data: wishes },
    ] = await Promise.all([
      supabase.from('transactions').select('type,amount').eq('user_id', userId),
      supabase.from('habits').select('streak').eq('user_id', userId),
      supabase.from('habit_logs').select('id').eq('user_id', userId).eq('date', today).eq('completed', true),
      supabase.from('tasks').select('id').eq('user_id', userId).neq('status', 'done'),
      supabase.from('wish_items').select('id').eq('user_id', userId).eq('completed', false),
    ])

    const bal = (transactions ?? []).reduce(
      (acc: number, t: { type: string; amount: number }) =>
        t.type === 'income' ? acc + t.amount : acc - t.amount, 0
    )
    setBalance(bal)
    setCompletedToday((habitLogs ?? []).length)
    setTotalHabits((habits ?? []).length)
    setPendingTasks((tasks ?? []).length)
    setPendingWishes((wishes ?? []).length)
    setTopStreak((habits ?? []).reduce((max: number, h: { streak: number }) => h.streak > max ? h.streak : max, 0))
  }, [userId, today])

  useEffect(() => { load() }, [load])

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
      accent: 'var(--color-sun)', bg: 'var(--color-sun-soft)',
    },
    {
      to: '/desejos', icon: Star, label: 'Desejos',
      value: String(pendingWishes), sub: 'na lista',
      accent: 'var(--color-berry)', bg: 'var(--color-berry-soft)',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-[var(--color-ink)]">
          {greeting()}, {firstName(user!.name)}! 👋
        </h1>
        <p className="text-[var(--color-ink-muted)] mt-1">Aqui está o resumo do seu dia.</p>
      </div>

      {/* Streak banner */}
      {topStreak > 0 && (
        <div
          className="flex items-center gap-3 rounded-[var(--radius-lg)] px-5 py-4 border"
          style={{ background: 'var(--color-streak-bg)', borderColor: 'var(--color-streak-border)' }}
        >
          <Flame size={24} className="shrink-0" style={{ color: 'var(--color-streak-title)' }} />
          <div>
            <p className="font-bold" style={{ color: 'var(--color-streak-title)' }}>{topStreak} dias em sequência!</p>
            <p className="text-sm" style={{ color: 'var(--color-streak-text)' }}>Continue assim — você está construindo algo incrível.</p>
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
