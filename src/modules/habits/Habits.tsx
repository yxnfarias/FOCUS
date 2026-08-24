import { useState, useEffect, useCallback } from 'react'
import { Plus, Flame, Trash2, Target, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Habit, HabitLog } from '../../db'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { ContributionGraph } from './ContributionGraph'
import { useAuth } from '../../contexts/AuthContext'

const COLORS = ['#3B82F6', '#22C55E', '#FBBF24', '#F87171', '#A855F7', '#F97316']
const ICONS  = ['🏃', '📚', '💧', '🧘', '🍎', '💪', '🎯', '🛌', '✍️', '🧹']

function AddHabitModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor]             = useState(COLORS[0])
  const [icon, setIcon]               = useState(ICONS[0])
  const [frequency, setFrequency]     = useState<'daily' | 'weekly'>('daily')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    await supabase.from('habits').insert({
      user_id: userId,
      name: name.trim(), description, color, icon, frequency,
      target_days: [0,1,2,3,4,5,6], streak: 0,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-[var(--color-surface-elevated)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] w-full max-w-md p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-[var(--color-ink)]">Novo hábito</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input label="Nome do hábito" placeholder="Ex: Beber 2L de água" value={name} onChange={e => setName(e.target.value)} required />
          <Input label="Descrição (opcional)" placeholder="Para que serve este hábito?" value={description} onChange={e => setDescription(e.target.value)} />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-[var(--color-ink-muted)]">Ícone</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setIcon(ic)}
                  className={`text-xl p-2 rounded-[var(--radius-sm)] transition-colors ${icon === ic ? 'bg-[var(--color-sky-soft)]' : 'hover:bg-[var(--color-surface-sunken)]'}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-[var(--color-ink-muted)]">Cor</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-[var(--color-outline-strong)]' : ''}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <Select label="Frequência" value={frequency} onChange={e => setFrequency((e.target as HTMLSelectElement).value as 'daily' | 'weekly')}>
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
          </Select>
          <div className="flex gap-2 mt-2">
            <Button type="button" variant="ghost" onClick={onClose} fullWidth>Cancelar</Button>
            <Button type="submit" fullWidth>Criar hábito</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Habits() {
  const { user } = useAuth()
  const userId = user!.id
  const [showModal, setShowModal] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  const [habits, setHabits] = useState<Habit[]>([])
  const [logs, setLogs]     = useState<HabitLog[]>([])

  const loadHabits = useCallback(async () => {
    const { data } = await supabase
      .from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: true })
    setHabits((data ?? []) as Habit[])
  }, [userId])

  const loadLogs = useCallback(async () => {
    const { data } = await supabase
      .from('habit_logs').select('*').eq('user_id', userId).eq('date', today)
    setLogs((data ?? []) as HabitLog[])
  }, [userId, today])

  useEffect(() => {
    loadHabits()
    loadLogs()
  }, [loadHabits, loadLogs])

  const completedIds = new Set(logs.filter(l => l.completed).map(l => l.habit_id))

  async function toggleHabit(habit: Habit) {
    if (!habit.id) return
    const isCompleted = completedIds.has(habit.id)
    await supabase.from('habit_logs').upsert(
      { user_id: userId, habit_id: habit.id, date: today, completed: !isCompleted },
      { onConflict: 'habit_id,date' }
    )
    const newStreak = isCompleted ? Math.max(0, habit.streak - 1) : habit.streak + 1
    await supabase.from('habits').update({ streak: newStreak }).eq('id', habit.id)
    await loadLogs()
    await loadHabits()
  }

  async function deleteHabit(id: number) {
    await supabase.from('habits').delete().eq('id', id)
    await loadHabits()
    await loadLogs()
  }

  async function closeModal() {
    setShowModal(false)
    await loadHabits()
  }

  const total = habits.length
  const done  = completedIds.size
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">Hábitos</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">{total} hábito{total !== 1 ? 's' : ''} cadastrados</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Novo
        </Button>
      </div>

      {/* Progress card */}
      {total > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-bold text-[var(--color-ink)]">Hoje</p>
              <p className="text-sm text-[var(--color-ink-muted)]">{done} de {total} hábitos cumpridos</p>
            </div>
            <span className="text-3xl font-bold tabular-nums" style={{ color: pct === 100 ? 'var(--color-leaf)' : 'var(--color-sky)' }}>
              {pct}%
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--color-surface-sunken)] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: pct === 100 ? 'var(--color-leaf)' : 'var(--color-sky)' }} />
          </div>
          {done === total && total > 0 && (
            <p className="text-sm font-semibold text-center mt-3" style={{ color: 'var(--color-leaf-deep)' }}>
              🎉 Todos os hábitos completos hoje!
            </p>
          )}
        </Card>
      )}

      {/* Contribution Graph */}
      {total > 0 && (
        <Card>
          <ContributionGraph />
        </Card>
      )}

      {/* Habit cards */}
      {habits.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-14 gap-3">
          <Target size={40} className="text-[var(--color-ink-faint)]" />
          <p className="text-[var(--color-ink-subtle)] font-medium">Nenhum hábito cadastrado.</p>
          <p className="text-sm text-[var(--color-ink-faint)]">Crie seu primeiro hábito e comece hoje.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {habits.map((habit: Habit) => {
            const isCompleted = completedIds.has(habit.id!)
            return (
              <div
                key={habit.id}
                className="relative flex flex-col rounded-[var(--radius-lg)] border p-3 gap-2 transition-all duration-200"
                style={{
                  background: isCompleted ? `${habit.color}12` : 'var(--color-surface-elevated)',
                  borderColor: isCompleted ? habit.color : 'var(--color-outline)',
                  borderWidth: isCompleted ? '1.5px' : '1px',
                }}
              >
                {/* Top row: icon + delete */}
                <div className="flex items-center justify-between">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0"
                    style={{ background: `${habit.color}20`, border: `2px solid ${habit.color}` }}
                  >
                    {habit.icon}
                  </div>
                  <button
                    onClick={() => habit.id && deleteHabit(habit.id)}
                    className="p-1 rounded-[var(--radius-sm)] hover:bg-[var(--color-coral-soft)] text-[var(--color-ink-faint)] hover:text-[var(--color-coral)] transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Name */}
                <p
                  className={`text-sm font-semibold leading-tight ${isCompleted ? 'line-through text-[var(--color-ink-subtle)]' : 'text-[var(--color-ink)]'}`}
                >
                  {habit.name}
                </p>

                {/* Observations */}
                {habit.description ? (
                  <p className="text-xs text-[var(--color-ink-subtle)] leading-snug line-clamp-2 flex-1">
                    {habit.description}
                  </p>
                ) : (
                  <p className="text-xs text-[var(--color-ink-faint)] italic flex-1">Sem observações</p>
                )}

                {/* Bottom row: streak + checkbox */}
                <div className="flex items-center justify-between mt-1">
                  {habit.streak > 0 ? (
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                      <Flame size={11} /> {habit.streak}d
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--color-ink-faint)]">0 dias</span>
                  )}

                  <button
                    onClick={() => toggleHabit(habit)}
                    title={isCompleted ? 'Desmarcar' : 'Marcar como feito'}
                    className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200"
                    style={{
                      borderColor: isCompleted ? habit.color : 'var(--color-outline-strong)',
                      background:  isCompleted ? habit.color : 'transparent',
                    }}
                  >
                    {isCompleted && <Check size={11} color="white" strokeWidth={3} />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && <AddHabitModal userId={userId} onClose={closeModal} />}
    </div>
  )
}
