import { useState, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Plus, Star, Check, Trash2, ShoppingBag, Compass, Trophy, Flag, ImagePlus, X } from 'lucide-react'
import { db, type WishItem } from '../../db'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input, Select } from '../../components/ui/Input'
import { useAuth } from '../../contexts/AuthContext'

type Category = 'purchase' | 'experience' | 'goal' | 'milestone'
type Priority = 'low' | 'medium' | 'high'

const categoryConfig: Record<Category, { label: string; icon: typeof ShoppingBag; color: string }> = {
  purchase:   { label: 'Compra',        icon: ShoppingBag, color: 'var(--color-sky)'   },
  experience: { label: 'Experiência',   icon: Compass,     color: 'var(--color-berry)' },
  goal:       { label: 'Meta',          icon: Trophy,      color: 'var(--color-sun)'   },
  milestone:  { label: 'Marco de vida', icon: Flag,        color: 'var(--color-leaf)'  },
}

const priorityConfig: Record<Priority, { label: string; color: 'leaf' | 'sun' | 'coral' }> = {
  low:    { label: 'Baixa', color: 'leaf'  },
  medium: { label: 'Média', color: 'sun'   },
  high:   { label: 'Alta',  color: 'coral' },
}

function AddWishModal({ userId, onClose }: { userId: number; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<Category>('purchase')
  const [priority, setPriority] = useState<Priority>('medium')
  const [price, setPrice] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setImageUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await db.wishItems.add({
      userId,
      title: title.trim(),
      description,
      category,
      priority,
      price: price ? parseFloat(price) : undefined,
      targetDate: targetDate || undefined,
      completed: false,
      imageUrl,
      createdAt: new Date().toISOString(),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-[var(--color-surface-elevated)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] w-full max-w-md p-6 flex flex-col gap-4 max-h-[90dvh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold text-[var(--color-ink)]">Novo desejo</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">

          {/* Image upload */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-[var(--color-ink-muted)]">Imagem</label>
            {imageUrl ? (
              <div className="relative w-full h-36 rounded-[var(--radius-md)] overflow-hidden border border-[var(--color-outline)]">
                <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => { setImageUrl(undefined); if (fileRef.current) fileRef.current.value = '' }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/70 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 w-full h-28 rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-outline)] hover:border-[var(--color-sky)] hover:bg-[var(--color-sky-soft)] transition-colors text-[var(--color-ink-subtle)] hover:text-[var(--color-sky)]"
              >
                <ImagePlus size={22} />
                <span className="text-xs font-medium">Clique para adicionar imagem</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <Input label="Título" placeholder="O que você deseja?" value={title} onChange={e => setTitle(e.target.value)} required />
          <Input label="Descrição (opcional)" placeholder="Mais detalhes..." value={description} onChange={e => setDescription(e.target.value)} />
          <Select label="Categoria" value={category} onChange={e => setCategory((e.target as HTMLSelectElement).value as Category)}>
            {(Object.entries(categoryConfig) as [Category, typeof categoryConfig[Category]][]).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
          <Select label="Prioridade" value={priority} onChange={e => setPriority((e.target as HTMLSelectElement).value as Priority)}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </Select>
          <Input label="Valor estimado (opcional)" type="number" min="0" step="0.01" placeholder="R$ 0,00" value={price} onChange={e => setPrice(e.target.value)} />
          <Input label="Data alvo (opcional)" type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          <div className="flex gap-2 mt-2">
            <Button type="button" variant="ghost" onClick={onClose} fullWidth>Cancelar</Button>
            <Button type="submit" fullWidth>Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface WishCardProps {
  item: WishItem
  onToggle: () => void
  onDelete: () => void
}

function WishCard({ item, onToggle, onDelete }: WishCardProps) {
  const cat = categoryConfig[item.category]
  const CatIcon = cat.icon
  const p = priorityConfig[item.priority]

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-outline)] bg-[var(--color-surface-elevated)] shadow-md p-3 gap-0 transition-opacity ${item.completed ? 'opacity-55' : ''}`}
    >
      {/* Cover image or placeholder */}
      {item.imageUrl ? (
        <div className="relative h-36 w-full mb-2">
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover rounded-[var(--radius-lg)]"
          />
          {item.completed && (
            <div className="absolute inset-0 rounded-[var(--radius-lg)] bg-[var(--color-leaf)] bg-opacity-20 flex items-center justify-center">
              <Check size={28} className="text-[var(--color-leaf-deep)]" strokeWidth={3} />
            </div>
          )}
        </div>
      ) : (
        <div
          className="h-20 w-full mb-2 rounded-[var(--radius-lg)] flex items-center justify-center"
          style={{ background: `${cat.color}18` }}
        >
          <CatIcon size={30} style={{ color: cat.color }} />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-2 px-1 pb-1 flex-1">
        {/* Category + Priority */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'var(--color-surface-sunken)', color: 'var(--color-ink-muted)' }}
          >
            <CatIcon size={11} />
            {cat.label}
          </span>
          <span className="text-[var(--color-ink-faint)] text-xs">•</span>
          <Badge color={p.color}>{p.label}</Badge>
        </div>

        {/* Title */}
        <h3
          className={`text-base font-bold leading-tight ${item.completed ? 'line-through text-[var(--color-ink-subtle)]' : 'text-[var(--color-ink)]'}`}
        >
          {item.title}
        </h3>

        {/* Description */}
        {item.description && (
          <p
            className="text-sm text-[var(--color-ink-muted)] overflow-hidden"
            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const }}
          >
            {item.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-end justify-between px-1 pt-3 mt-auto">
        <div className="flex flex-col gap-0.5">
          {item.price !== undefined && (
            <>
              <p className="text-xs text-[var(--color-ink-subtle)]">Valor estimado</p>
              <p className="text-sm font-bold text-[var(--color-ink)]">
                R$ {item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </>
          )}
          {item.targetDate && (
            <>
              <p className="text-xs text-[var(--color-ink-subtle)]">{item.price !== undefined ? '' : 'Meta para'}
              </p>
              <p className="text-sm font-semibold text-[var(--color-ink-muted)]">
                📅 {new Date(item.targetDate + 'T00:00:00').toLocaleDateString('pt-BR')}
              </p>
            </>
          )}
          {!item.price && !item.targetDate && (
            <span />
          )}
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            onClick={onToggle}
            title={item.completed ? 'Marcar como pendente' : 'Marcar como realizado'}
            className={`p-2 rounded-[var(--radius-md)] transition-colors ${
              item.completed
                ? 'bg-[var(--color-leaf-soft)] text-[var(--color-leaf-deep)]'
                : 'hover:bg-[var(--color-leaf-soft)] text-[var(--color-ink-faint)] hover:text-[var(--color-leaf)]'
            }`}
          >
            <Check size={15} />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-coral-soft)] text-[var(--color-ink-faint)] hover:text-[var(--color-coral)] transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function Wishlist() {
  const { user } = useAuth()
  const userId = user!.id!
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState<Category | 'all'>('all')

  const items = useLiveQuery(() =>
    db.wishItems.where('userId').equals(userId).toArray()
      .then(arr => arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
    [userId])

  async function toggleComplete(item: WishItem) {
    if (!item.id) return
    await db.wishItems.update(item.id, { completed: !item.completed })
  }

  async function deleteItem(id: number) {
    await db.wishItems.delete(id)
  }

  const allItems = items ?? []
  const filtered = filter === 'all' ? allItems : allItems.filter(i => i.category === filter)
  const completedCount = allItems.filter(i => i.completed).length
  const totalCount = allItems.length

  const filterOptions: { value: Category | 'all'; label: string }[] = [
    { value: 'all',        label: 'Todos'        },
    { value: 'purchase',   label: 'Compras'      },
    { value: 'experience', label: 'Experiências' },
    { value: 'goal',       label: 'Metas'        },
    { value: 'milestone',  label: 'Marcos'       },
  ]

  return (
    <div className="flex flex-col gap-5 pb-20 md:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">Desejos & Metas</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">{completedCount} de {totalCount} realizados</p>
        </div>
        <Button size="sm" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Novo
        </Button>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <Card className="flex items-center gap-3">
          <Star size={18} className="text-[var(--color-sun)] shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between text-xs font-semibold text-[var(--color-ink-muted)] mb-1">
              <span>Progresso geral</span>
              <span>{totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%</span>
            </div>
            <div className="h-2 rounded-full bg-[var(--color-surface-sunken)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`, background: 'var(--color-sun)' }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {filterOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              filter === opt.value
                ? 'bg-[var(--color-sky)] text-white'
                : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)] hover:bg-[var(--color-outline)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Items grid */}
      {filtered.length === 0 ? (
        <Card className="text-center py-10">
          <Star size={32} className="mx-auto text-[var(--color-ink-faint)] mb-2" />
          <p className="text-[var(--color-ink-subtle)]">Nenhum desejo aqui ainda.</p>
          <p className="text-sm text-[var(--color-ink-faint)] mt-1">O que você quer conquistar?</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((item: WishItem) => (
            <WishCard
              key={item.id}
              item={item}
              onToggle={() => toggleComplete(item)}
              onDelete={() => item.id && deleteItem(item.id)}
            />
          ))}
        </div>
      )}

      {showModal && <AddWishModal userId={userId} onClose={() => setShowModal(false)} />}
    </div>
  )
}
