import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, TrendingUp, TrendingDown, DollarSign, Trash2, Upload, History } from 'lucide-react'
import { db, type Transaction, type ImportJob } from '../../db'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input, Select } from '../../components/ui/Input'
import { ImportModal } from './ImportModal'
import { useAuth } from '../../contexts/AuthContext'
import { Investments } from './Investments'

type FinanceTab = 'extrato' | 'investimentos'

const INCOME_CATEGORIES = ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Outro']
const EXPENSE_CATEGORIES = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Educação', 'Lazer', 'Roupas', 'Assinaturas', 'Outro']

function AddTransactionModal({ userId, onClose }: { userId: number; onClose: () => void }) {
  const [type, setType]           = useState<'income' | 'expense'>('expense')
  const [amount, setAmount]       = useState('')
  const [category, setCategory]   = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0])

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || !category) return
    await db.transactions.add({ userId, type, amount: parseFloat(amount), category, description, date, createdAt: new Date().toISOString() })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-[var(--color-surface-elevated)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] w-full max-w-md p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-[var(--color-ink)]">Nova transação</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map(t => (
              <button key={t} type="button" onClick={() => { setType(t); setCategory('') }}
                className={`flex-1 py-2.5 rounded-[var(--radius-md)] text-sm font-bold transition-colors ${type === t ? (t === 'income' ? 'bg-[var(--color-leaf)] text-white' : 'bg-[var(--color-coral)] text-white') : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)]'}`}>
                {t === 'income' ? '+ Receita' : '− Gasto'}
              </button>
            ))}
          </div>
          <Input label="Valor (R$)" type="number" min="0" step="0.01" placeholder="0,00" value={amount} onChange={e => setAmount(e.target.value)} required />
          <Select label="Categoria" value={category} onChange={e => setCategory((e.target as HTMLSelectElement).value)} required>
            <option value="">Selecione...</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Descrição" placeholder="Ex: almoço, conta de luz..." value={description} onChange={e => setDescription(e.target.value)} />
          <Input label="Data" type="date" value={date} onChange={e => setDate(e.target.value)} />
          <div className="flex gap-2 mt-2">
            <Button type="button" variant="ghost" onClick={onClose} fullWidth>Cancelar</Button>
            <Button type="submit" fullWidth>Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Finances() {
  const { user } = useAuth()
  const userId = user!.id!
  const [tab, setTab]                     = useState<FinanceTab>('extrato')
  const [showModal, setShowModal]         = useState(false)
  const [showImport, setShowImport]       = useState(false)
  const [showImportHistory, setShowImportHistory] = useState(false)

  const transactions = useLiveQuery(() =>
    db.transactions.where('userId').equals(userId).toArray()
      .then(arr => arr.sort((a, b) => b.date.localeCompare(a.date))),
    [userId])
  const importJobs = useLiveQuery(() =>
    db.importJobs.where('userId').equals(userId).toArray()
      .then(j => j.sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
    [userId])

  const income  = transactions?.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0) ?? 0
  const expense = transactions?.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0) ?? 0
  const balance = income - expense
  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <div className="flex flex-col gap-6 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">Finanças</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">{transactions?.length ?? 0} transações registradas</p>
        </div>
        {tab === 'extrato' && (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowImportHistory(v => !v)} title="Histórico de importações">
              <History size={15} />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowImport(true)}>
              <Upload size={15} /> Importar
            </Button>
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus size={15} /> Nova
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-[var(--radius-md)] bg-[var(--color-surface-sunken)] self-start">
        {(['extrato', 'investimentos'] as FinanceTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-[var(--radius-sm)] text-sm font-semibold transition-all capitalize ${
              tab === t
                ? 'bg-[var(--color-surface-elevated)] text-[var(--color-ink)] shadow-sm'
                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
            }`}
          >
            {t === 'extrato' ? 'Extrato' : 'Investimentos'}
          </button>
        ))}
      </div>

      {tab === 'investimentos' && <Investments userId={userId} />}

      {tab === 'extrato' && <>
      {/* Import history */}
      {showImportHistory && (
        <Card className="flex flex-col gap-2">
          <p className="text-sm font-bold text-[var(--color-ink)]">Histórico de importações</p>
          {!importJobs?.length && (
            <p className="text-xs text-[var(--color-ink-subtle)]">Nenhum extrato importado ainda.</p>
          )}
          {importJobs?.map((job: ImportJob) => (
            <div key={job.id} className="flex items-center gap-3 py-2 border-t border-[var(--color-outline)] first:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-ink)] truncate">{job.fileName}</p>
                <p className="text-xs text-[var(--color-ink-subtle)]">
                  {new Date(job.createdAt).toLocaleDateString('pt-BR')} · {job.importedRecords} importadas · {job.duplicatedRecords} duplicadas
                </p>
              </div>
              <Badge color="leaf">{job.fileFormat}</Badge>
            </div>
          ))}
        </Card>
      )}

      {/* Summary — 3 colunas */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center flex flex-col items-center gap-2 py-4">
          <div className="p-2 rounded-full bg-[var(--color-leaf-soft)]">
            <TrendingUp size={18} className="text-[var(--color-leaf-deep)]" />
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] font-semibold">Receitas</p>
          <p className="font-bold text-[var(--color-leaf-deep)] text-base">{fmt(income)}</p>
        </Card>
        <Card className="text-center flex flex-col items-center gap-2 py-4">
          <div className="p-2 rounded-full bg-[var(--color-coral-soft)]">
            <TrendingDown size={18} className="text-[var(--color-coral)]" />
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] font-semibold">Gastos</p>
          <p className="font-bold text-[var(--color-coral)] text-base">{fmt(expense)}</p>
        </Card>
        <Card className="text-center flex flex-col items-center gap-2 py-4" style={{ borderColor: balance >= 0 ? 'var(--color-outline)' : 'var(--color-coral)' }}>
          <div className="p-2 rounded-full" style={{ background: balance >= 0 ? 'var(--color-sky-soft)' : 'var(--color-coral-soft)' }}>
            <DollarSign size={18} style={{ color: balance >= 0 ? 'var(--color-sky)' : 'var(--color-coral)' }} />
          </div>
          <p className="text-xs text-[var(--color-ink-muted)] font-semibold">Saldo</p>
          <p className="font-bold text-base" style={{ color: balance >= 0 ? 'var(--color-sky)' : 'var(--color-coral)' }}>{fmt(balance)}</p>
        </Card>
      </div>

      {/* History */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-bold text-[var(--color-ink)]">Histórico</h2>
        {!transactions?.length && (
          <Card className="flex flex-col items-center justify-center py-12 gap-2">
            <DollarSign size={36} className="text-[var(--color-ink-faint)]" />
            <p className="text-[var(--color-ink-subtle)] font-medium">Nenhuma transação ainda.</p>
            <p className="text-sm text-[var(--color-ink-faint)]">Adicione receitas e gastos para começar.</p>
          </Card>
        )}
        {transactions?.map((t: Transaction) => (
          <Card key={t.id} className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: t.type === 'income' ? 'var(--color-leaf-soft)' : 'var(--color-coral-soft)' }}>
              {t.type === 'income'
                ? <TrendingUp size={15} style={{ color: 'var(--color-leaf-deep)' }} />
                : <TrendingDown size={15} style={{ color: 'var(--color-coral)' }} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[var(--color-ink)] truncate">{t.description || t.category}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge color={t.type === 'income' ? 'leaf' : 'coral'}>{t.category}</Badge>
                <span className="text-xs text-[var(--color-ink-subtle)]">{new Date(t.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
            <p className="font-bold text-sm shrink-0" style={{ color: t.type === 'income' ? 'var(--color-leaf-deep)' : 'var(--color-coral)' }}>
              {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
            </p>
            <button onClick={() => t.id && db.transactions.delete(t.id)}
              className="p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--color-coral-soft)] text-[var(--color-ink-faint)] hover:text-[var(--color-coral)] transition-colors shrink-0">
              <Trash2 size={14} />
            </button>
          </Card>
        ))}
      </div>

      {showModal  && <AddTransactionModal userId={userId} onClose={() => setShowModal(false)} />}
      {showImport && <ImportModal userId={userId} onClose={() => setShowImport(false)} />}
      </>}
    </div>
  )
}
