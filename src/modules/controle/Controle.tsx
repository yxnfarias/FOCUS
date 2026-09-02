import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, ReceiptText, ToggleLeft, ToggleRight, TrendingDown, Target } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { ExpenseControl } from '../../db'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input, Select } from '../../components/ui/Input'
import { useAuth } from '../../contexts/AuthContext'

const EXPENSE_CATEGORIES = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Roupas', 'Assinaturas', 'Outro']

function AddControlModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [kind, setKind]       = useState<'fixed' | 'variable'>('fixed')
  const [name, setName]       = useState('')
  const [category, setCategory] = useState('')
  const [amount, setAmount]   = useState('')
  const [dueDay, setDueDay]   = useState('')
  const [notes, setNotes]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !amount) return
    await supabase.from('expense_controls').insert({
      user_id: userId,
      kind,
      name: name.trim(),
      category,
      amount: parseFloat(amount),
      due_day: kind === 'fixed' && dueDay ? parseInt(dueDay) : null,
      active: true,
      notes,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-[var(--color-surface-elevated)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] w-full max-w-md p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-[var(--color-ink)]">Nova despesa</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            {(['fixed', 'variable'] as const).map(k => (
              <button key={k} type="button" onClick={() => setKind(k)}
                className={`flex-1 py-2.5 rounded-[var(--radius-md)] text-sm font-bold transition-colors ${kind === k ? (k === 'fixed' ? 'bg-[var(--color-coral)] text-white' : 'bg-[var(--color-sun)] text-white') : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)]'}`}>
                {k === 'fixed' ? 'Fixa' : 'Variável'}
              </button>
            ))}
          </div>
          <Input label="Nome" placeholder="Ex: Netflix, Aluguel, Alimentação..." value={name} onChange={e => setName(e.target.value)} required />
          <Input label="Valor (R$)" type="number" min="0" step="0.01" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} required />
          <Select label="Categoria" value={category} onChange={e => setCategory((e.target as HTMLSelectElement).value)}>
            <option value="">Selecione...</option>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          {kind === 'fixed' && (
            <Input label="Dia do vencimento (opcional)" type="number" min="1" max="31" placeholder="Ex: 15" value={dueDay} onChange={e => setDueDay(e.target.value)} />
          )}
          <Input label="Observações (opcional)" placeholder="Notas adicionais..." value={notes} onChange={e => setNotes(e.target.value)} />
          <div className="flex gap-2 mt-2">
            <Button type="button" variant="ghost" onClick={onClose} fullWidth>Cancelar</Button>
            <Button type="submit" fullWidth>Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Controle() {
  const { user } = useAuth()
  const userId = user!.id
  const [items, setItems]       = useState<ExpenseControl[]>([])
  const [showModal, setShowModal] = useState(false)

  const loadItems = useCallback(async () => {
    const { data } = await supabase
      .from('expense_controls').select('*').eq('user_id', userId).order('created_at', { ascending: true })
    setItems((data ?? []) as ExpenseControl[])
  }, [userId])

  useEffect(() => { loadItems() }, [loadItems])

  async function toggleActive(item: ExpenseControl) {
    const updated = items.map(i => i.id === item.id ? { ...i, active: !i.active } : i)
    setItems(updated)
    await supabase.from('expense_controls').update({ active: !item.active }).eq('id', item.id!)
  }

  async function deleteItem(id: number) {
    setItems(items.filter(i => i.id !== id))
    await supabase.from('expense_controls').delete().eq('id', id)
  }

  async function closeModal() {
    setShowModal(false)
    await loadItems()
  }

  const fixed    = items.filter(i => i.kind === 'fixed')
  const variable = items.filter(i => i.kind === 'variable')
  const totalFixed    = fixed.filter(i => i.active).reduce((a, i) => a + i.amount, 0)
  const totalVariable = variable.reduce((a, i) => a + i.amount, 0)
  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">Controle</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
            {fixed.length} fixas · {variable.length} variáveis
          </p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Nova
        </Button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center flex flex-col items-center gap-2 py-4">
          <div className="p-2 rounded-full bg-[var(--color-coral-soft)]">
            <TrendingDown size={18} className="text-[var(--color-coral)]" />
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] font-semibold">Fixas ativas</p>
          <p className="font-bold text-[var(--color-coral)] text-base">{fmt(totalFixed)}</p>
        </Card>
        <Card className="text-center flex flex-col items-center gap-2 py-4">
          <div className="p-2 rounded-full bg-[var(--color-sun-soft)]">
            <Target size={18} className="text-[var(--color-sun-deep)]" />
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] font-semibold">Orçamento variável</p>
          <p className="font-bold text-[var(--color-sun-deep)] text-base">{fmt(totalVariable)}</p>
        </Card>
        <Card className="text-center flex flex-col items-center gap-2 py-4">
          <div className="p-2 rounded-full bg-[var(--color-sky-soft)]">
            <ReceiptText size={18} className="text-[var(--color-sky)]" />
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] font-semibold">Total comprometido</p>
          <p className="font-bold text-[var(--color-sky)] text-base">{fmt(totalFixed + totalVariable)}</p>
        </Card>
      </div>

      {/* Fixed expenses */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-[var(--color-ink)]">Despesas Fixas</h2>
        {fixed.length === 0 && (
          <Card className="flex flex-col items-center justify-center py-10 gap-2">
            <TrendingDown size={32} className="text-[var(--color-ink-faint)]" />
            <p className="text-[var(--color-ink-subtle)] font-medium text-sm">Nenhuma despesa fixa cadastrada.</p>
            <p className="text-xs text-[var(--color-ink-faint)]">Adicione aluguel, mensalidades, planos...</p>
          </Card>
        )}
        {fixed.map(item => (
          <Card key={item.id} className="flex items-center gap-3" style={{ opacity: item.active ? 1 : 0.45 }}>
            <button
              onClick={() => toggleActive(item)}
              className="shrink-0 transition-colors"
              title={item.active ? 'Pausar' : 'Ativar'}
              style={{ color: item.active ? 'var(--color-coral)' : 'var(--color-ink-faint)' }}
            >
              {item.active
                ? <ToggleRight size={24} />
                : <ToggleLeft size={24} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[var(--color-ink)] truncate">{item.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {item.category && <Badge color="coral">{item.category}</Badge>}
                {item.due_day && (
                  <span className="text-xs text-[var(--color-ink-subtle)]">vence dia {item.due_day}</span>
                )}
                {item.notes && (
                  <span className="text-xs text-[var(--color-ink-faint)] truncate">{item.notes}</span>
                )}
              </div>
            </div>
            <p className="font-bold text-sm text-[var(--color-coral)] shrink-0">{fmt(item.amount)}<span className="text-[var(--color-ink-faint)] font-normal text-xs">/mês</span></p>
            <button
              onClick={() => item.id && deleteItem(item.id)}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-ink-faint)] hover:bg-[var(--color-coral-soft)] hover:text-[var(--color-coral)] transition-colors shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </Card>
        ))}
      </div>

      {/* Variable budgets */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-[var(--color-ink)]">Orçamentos Variáveis</h2>
        {variable.length === 0 && (
          <Card className="flex flex-col items-center justify-center py-10 gap-2">
            <Target size={32} className="text-[var(--color-ink-faint)]" />
            <p className="text-[var(--color-ink-subtle)] font-medium text-sm">Nenhum orçamento variável cadastrado.</p>
            <p className="text-xs text-[var(--color-ink-faint)]">Defina uma verba mensal para alimentação, lazer...</p>
          </Card>
        )}
        {variable.map(item => (
          <Card key={item.id} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-[var(--color-sun-soft)]">
              <Target size={16} className="text-[var(--color-sun-deep)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[var(--color-ink)] truncate">{item.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {item.category && <Badge color="sun">{item.category}</Badge>}
                {item.notes && (
                  <span className="text-xs text-[var(--color-ink-faint)] truncate">{item.notes}</span>
                )}
              </div>
            </div>
            <p className="font-bold text-sm text-[var(--color-sun-deep)] shrink-0">meta {fmt(item.amount)}</p>
            <button
              onClick={() => item.id && deleteItem(item.id)}
              className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-ink-faint)] hover:bg-[var(--color-coral-soft)] hover:text-[var(--color-coral)] transition-colors shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </Card>
        ))}
      </div>

      {showModal && <AddControlModal userId={userId} onClose={closeModal} />}
    </div>
  )
}
