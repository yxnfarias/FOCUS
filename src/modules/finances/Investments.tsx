import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Trash2, Edit2, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react'
import { db, type Investment, type InvestmentType } from '../../db'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input, Select } from '../../components/ui/Input'

const TYPE_LABELS: Record<InvestmentType, string> = {
  stock: 'Ação', fii: 'FII', etf: 'ETF', bdr: 'BDR', crypto: 'Cripto', fixed: 'Renda Fixa',
}
const TYPE_COLORS: Record<InvestmentType, string> = {
  stock: '#3B82F6', fii: '#10B981', etf: '#8B5CF6', bdr: '#F59E0B', crypto: '#EF4444', fixed: '#6B7280',
}
const TYPE_BADGE: Record<InvestmentType, 'sky' | 'leaf' | 'berry' | 'sun' | 'coral' | 'neutral'> = {
  stock: 'sky', fii: 'leaf', etf: 'berry', bdr: 'sun', crypto: 'coral', fixed: 'neutral',
}

function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((s, d) => s + d.value, 0)
  if (!total) return null
  let cumulative = 0
  const stops = slices.map(d => {
    const start = (cumulative / total) * 100
    cumulative += d.value
    const end = (cumulative / total) * 100
    return `${d.color} ${start}% ${end}%`
  })
  return (
    <div className="relative w-28 h-28 shrink-0">
      <div className="w-full h-full rounded-full" style={{ background: `conic-gradient(${stops.join(', ')})` }} />
      <div className="absolute inset-[18%] rounded-full bg-[var(--color-surface-elevated)] flex items-center justify-center">
        <PieChart size={14} className="text-[var(--color-ink-faint)]" />
      </div>
    </div>
  )
}

function AddInvestmentModal({ userId, onClose }: { userId: number; onClose: () => void }) {
  const [ticker, setTicker]       = useState('')
  const [name, setName]           = useState('')
  const [type, setType]           = useState<InvestmentType>('stock')
  const [quantity, setQuantity]   = useState('')
  const [avgPrice, setAvgPrice]   = useState('')
  const [currentPrice, setCurrentPrice] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const now = new Date().toISOString()
    await db.investments.add({
      userId, ticker: ticker.toUpperCase(), name, type,
      quantity: parseFloat(quantity),
      avgPrice: parseFloat(avgPrice),
      currentPrice: parseFloat(currentPrice || avgPrice),
      createdAt: now, updatedAt: now,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-[var(--color-surface-elevated)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] w-full max-w-md p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-[var(--color-ink)]">Novo investimento</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input label="Ticker" placeholder="PETR4" value={ticker} onChange={e => setTicker(e.target.value)} required />
            </div>
            <div className="flex-1">
              <Select label="Tipo" value={type} onChange={e => setType(e.target.value as InvestmentType)}>
                {(Object.entries(TYPE_LABELS) as [InvestmentType, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>
          </div>
          <Input label="Nome" placeholder="Ex: Petrobras" value={name} onChange={e => setName(e.target.value)} required />
          <div className="flex gap-2">
            <div className="flex-1">
              <Input label="Quantidade" type="number" min="0.00001" step="any" value={quantity} onChange={e => setQuantity(e.target.value)} required />
            </div>
            <div className="flex-1">
              <Input label="Preço médio (R$)" type="number" min="0" step="0.01" value={avgPrice} onChange={e => setAvgPrice(e.target.value)} required />
            </div>
          </div>
          <Input label="Preço atual (R$)" type="number" min="0" step="0.01" placeholder="Deixe em branco para usar o preço médio" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)} />
          <div className="flex gap-2 mt-1">
            <Button type="button" variant="ghost" onClick={onClose} fullWidth>Cancelar</Button>
            <Button type="submit" fullWidth>Adicionar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Investments({ userId }: { userId: number }) {
  const [showAdd, setShowAdd]     = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editPrice, setEditPrice] = useState('')

  const investments = useLiveQuery(
    () => db.investments.where('userId').equals(userId).toArray(),
    [userId]
  )

  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

  const totalInvested = investments?.reduce((s, i) => s + i.quantity * i.avgPrice, 0) ?? 0
  const totalCurrent  = investments?.reduce((s, i) => s + i.quantity * i.currentPrice, 0) ?? 0
  const totalGain     = totalCurrent - totalInvested
  const totalReturn   = totalInvested ? (totalGain / totalInvested) * 100 : 0

  async function updatePrice(id: number) {
    const price = parseFloat(editPrice)
    if (!price) return
    await db.investments.update(id, { currentPrice: price, updatedAt: new Date().toISOString() })
    setEditingId(null)
    setEditPrice('')
  }

  // Donut slices grouped by type
  const byType = Object.fromEntries(
    (Object.keys(TYPE_LABELS) as InvestmentType[]).map(t => [t, 0])
  ) as Record<InvestmentType, number>
  investments?.forEach(i => { byType[i.type] += i.quantity * i.currentPrice })
  const donutSlices = (Object.entries(byType) as [InvestmentType, number][])
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ label: TYPE_LABELS[k], value: v, color: TYPE_COLORS[k] }))

  return (
    <div className="flex flex-col gap-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { label: 'Total investido', value: fmt(totalInvested), color: 'var(--color-ink-muted)', Icon: DollarSign },
          { label: 'Valor atual', value: fmt(totalCurrent), color: 'var(--color-sky)', Icon: TrendingUp },
          { label: 'Resultado', value: `${totalGain >= 0 ? '+' : ''}${fmt(totalGain)}`, color: totalGain >= 0 ? 'var(--color-leaf-deep)' : 'var(--color-coral)', Icon: totalGain >= 0 ? TrendingUp : TrendingDown },
          { label: 'Rentabilidade', value: pct(totalReturn), color: totalReturn >= 0 ? 'var(--color-leaf-deep)' : 'var(--color-coral)', Icon: totalReturn >= 0 ? TrendingUp : TrendingDown },
        ] as const).map(({ label, value, color, Icon }) => (
          <Card key={label} className="flex flex-col gap-1.5 py-3">
            <div className="flex items-center gap-1.5">
              <Icon size={13} style={{ color }} />
              <p className="text-xs text-[var(--color-ink-muted)] font-semibold">{label}</p>
            </div>
            <p className="text-base font-bold" style={{ color }}>{value}</p>
          </Card>
        ))}
      </div>

      {/* Charts */}
      {(investments?.length ?? 0) > 0 && (
        <div className="flex gap-4 flex-wrap">
          {/* Donut — allocation */}
          <Card className="flex-1 min-w-[200px] flex flex-col gap-3">
            <p className="text-sm font-bold text-[var(--color-ink)]">Alocação por tipo</p>
            <div className="flex items-center gap-5">
              <DonutChart slices={donutSlices} />
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                {donutSlices.map(s => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                    <span className="text-xs text-[var(--color-ink-muted)] truncate">{s.label}</span>
                    <span className="text-xs font-bold text-[var(--color-ink)] ml-auto shrink-0">
                      {totalCurrent ? ((s.value / totalCurrent) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Horizontal bars — performance */}
          <Card className="flex-1 min-w-[200px] flex flex-col gap-3">
            <p className="text-sm font-bold text-[var(--color-ink)]">Desempenho por ativo</p>
            <div className="flex flex-col gap-2.5">
              {investments?.map(inv => {
                const ret = inv.avgPrice ? ((inv.currentPrice - inv.avgPrice) / inv.avgPrice) * 100 : 0
                const barW = Math.min(Math.abs(ret), 50) / 50 * 100
                const positive = ret >= 0
                return (
                  <div key={inv.id} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--color-ink)] w-14 truncate shrink-0">{inv.ticker}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-sunken)] overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${barW}%`, background: positive ? 'var(--color-leaf-deep)' : 'var(--color-coral)' }} />
                    </div>
                    <span className="text-xs font-semibold w-14 text-right shrink-0" style={{ color: positive ? 'var(--color-leaf-deep)' : 'var(--color-coral)' }}>
                      {pct(ret)}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* List header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-[var(--color-ink)]">Carteira</h2>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Adicionar
        </Button>
      </div>

      {/* Empty state */}
      {!investments?.length && (
        <Card className="flex flex-col items-center justify-center py-12 gap-2">
          <TrendingUp size={36} className="text-[var(--color-ink-faint)]" />
          <p className="text-[var(--color-ink-subtle)] font-medium">Nenhum investimento ainda.</p>
          <p className="text-sm text-[var(--color-ink-faint)]">Adicione ativos para acompanhar sua carteira.</p>
        </Card>
      )}

      {/* Investment cards */}
      {investments?.map((inv: Investment) => {
        const gain     = (inv.currentPrice - inv.avgPrice) * inv.quantity
        const ret      = inv.avgPrice ? ((inv.currentPrice - inv.avgPrice) / inv.avgPrice) * 100 : 0
        const positive = gain >= 0
        const isEditing = editingId === inv.id

        return (
          <Card key={inv.id} className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[var(--color-ink)]">{inv.ticker}</span>
                  <Badge color={TYPE_BADGE[inv.type]}>{TYPE_LABELS[inv.type]}</Badge>
                  <span className="text-xs text-[var(--color-ink-subtle)] truncate">{inv.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div>
                    <p className="text-[10px] text-[var(--color-ink-faint)] font-semibold uppercase tracking-wide">Qtd</p>
                    <p className="text-sm font-semibold text-[var(--color-ink)] mt-0.5">{inv.quantity}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--color-ink-faint)] font-semibold uppercase tracking-wide">Preço médio</p>
                    <p className="text-sm font-semibold text-[var(--color-ink)] mt-0.5">{fmt(inv.avgPrice)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--color-ink-faint)] font-semibold uppercase tracking-wide">Preço atual</p>
                    {isEditing ? (
                      <div className="flex items-center gap-1 mt-0.5">
                        <input
                          type="number" step="0.01" min="0"
                          value={editPrice}
                          onChange={e => setEditPrice(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') updatePrice(inv.id!) }}
                          className="w-20 text-sm border border-[var(--color-sky)] rounded px-1 py-0.5 bg-[var(--color-surface)] text-[var(--color-ink)] outline-none"
                          autoFocus
                        />
                        <button onClick={() => updatePrice(inv.id!)} className="text-xs text-[var(--color-sky)] font-bold">OK</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(inv.id!); setEditPrice(String(inv.currentPrice)) }}
                        className="flex items-center gap-1 mt-0.5 group"
                      >
                        <span className="text-sm font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-sky)] transition-colors">
                          {fmt(inv.currentPrice)}
                        </span>
                        <Edit2 size={10} className="text-[var(--color-ink-faint)] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end gap-1">
                <p className="text-base font-bold" style={{ color: positive ? 'var(--color-leaf-deep)' : 'var(--color-coral)' }}>
                  {positive ? '+' : ''}{fmt(gain)}
                </p>
                <p className="text-xs font-semibold" style={{ color: positive ? 'var(--color-leaf-deep)' : 'var(--color-coral)' }}>
                  {pct(ret)}
                </p>
                <button
                  onClick={() => inv.id && db.investments.delete(inv.id)}
                  className="mt-1 p-1 rounded-[var(--radius-sm)] hover:bg-[var(--color-coral-soft)] text-[var(--color-ink-faint)] hover:text-[var(--color-coral)] transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[var(--color-outline)] text-xs text-[var(--color-ink-faint)]">
              <span>Total: <span className="font-semibold text-[var(--color-ink)]">{fmt(inv.quantity * inv.currentPrice)}</span></span>
              <span>Atualizado em {new Date(inv.updatedAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </Card>
        )
      })}

      {showAdd && <AddInvestmentModal userId={userId} onClose={() => setShowAdd(false)} />}
    </div>
  )
}
