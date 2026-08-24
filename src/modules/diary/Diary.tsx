import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Trash2, BookOpen, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { DiaryEntry } from '../../db'
import { useAuth } from '../../contexts/AuthContext'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function Diary() {
  const { user } = useAuth()
  const userId = user!.id

  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [selectedId, setSelectedId] = useState<number | 'new' | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [date, setDate] = useState(todayISO())
  const [saved, setSaved] = useState(false)
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadEntries = useCallback(async () => {
    const { data } = await supabase
      .from('diary_entries').select('*').eq('user_id', userId).order('date', { ascending: false })
    setEntries((data ?? []) as DiaryEntry[])
  }, [userId])

  useEffect(() => { loadEntries() }, [loadEntries])

  function openEntry(entry: DiaryEntry) {
    setSelectedId(entry.id!)
    setTitle(entry.title)
    setContent(entry.content)
    setDate(entry.date)
    setSaved(false)
  }

  function newEntry() {
    setSelectedId('new')
    setTitle('')
    setContent('')
    setDate(todayISO())
    setSaved(false)
  }

  async function save() {
    const now = new Date().toISOString()
    if (selectedId === 'new') {
      const { data } = await supabase.from('diary_entries').insert({
        user_id: userId, title, content, mood: '', date,
      }).select('id').single()
      if (data?.id) setSelectedId(data.id as number)
    } else if (selectedId !== null) {
      await supabase.from('diary_entries').update({ title, content, date, updated_at: now }).eq('id', selectedId)
    }
    setSaved(true)
    await loadEntries()
  }

  async function deleteEntry(id: number) {
    await supabase.from('diary_entries').delete().eq('id', id)
    if (selectedId === id) {
      setSelectedId(null)
      setTitle('')
      setContent('')
    }
    await loadEntries()
  }

  // Auto-save on content change
  useEffect(() => {
    if (selectedId === null || (!title && !content)) return
    setSaved(false)
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(save, 1500)
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, date])

  const hasEditor = selectedId !== null

  return (
    <div className="flex flex-col gap-0 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">Diário</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">
            {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'}
          </p>
        </div>
        <button
          onClick={newEntry}
          className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-ink)] text-[var(--color-surface)] text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus size={15} /> Nova entrada
        </button>
      </div>

      <div className="flex gap-5 items-start">
        {/* Entry list */}
        <div className={`flex flex-col gap-2 ${hasEditor ? 'hidden md:flex md:w-52 shrink-0' : 'w-full'}`}>
          {!entries.length && !hasEditor && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <BookOpen size={40} className="text-[var(--color-ink-faint)]" />
              <p className="text-[var(--color-ink-subtle)] font-medium">Nenhuma entrada ainda.</p>
              <p className="text-sm text-[var(--color-ink-faint)]">Comece escrevendo sobre o seu dia.</p>
            </div>
          )}
          {entries.map(entry => (
            <button
              key={entry.id}
              onClick={() => openEntry(entry)}
              className={`w-full text-left px-3 py-2.5 rounded-[var(--radius-md)] border transition-all ${
                selectedId === entry.id
                  ? 'border-[var(--color-sky)] bg-[var(--color-sky-soft)]'
                  : 'border-[var(--color-outline)] bg-[var(--color-surface-elevated)] hover:border-[var(--color-sky)]/40'
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-[var(--color-ink-muted)] capitalize truncate">
                  {new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </span>
              </div>
              <p className="text-sm font-semibold text-[var(--color-ink)] truncate mt-0.5">
                {entry.title || 'Sem título'}
              </p>
              <p className="text-xs text-[var(--color-ink-faint)] truncate mt-0.5 leading-relaxed">
                {entry.content.slice(0, 60) || '...'}
              </p>
            </button>
          ))}
        </div>

        {/* Editor — notebook style */}
        {hasEditor && (
          <div className="flex-1 min-w-0">
            {/* Notebook paper */}
            <div
              className="relative rounded-[var(--radius-lg)] overflow-hidden shadow-md"
              style={{
                background: 'var(--color-surface-elevated)',
                borderLeft: '4px solid var(--color-coral)',
              }}
            >
              {/* Lined background via repeating-linear-gradient */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    transparent,
                    transparent 31px,
                    var(--color-outline) 31px,
                    var(--color-outline) 32px
                  )`,
                  backgroundPositionY: '52px',
                  opacity: 0.5,
                }}
              />

              {/* Top bar with date */}
              <div className="relative flex items-center gap-3 px-6 pt-4 pb-3 border-b border-[var(--color-outline)]">
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="text-xs text-[var(--color-ink-muted)] bg-transparent border-none outline-none cursor-pointer"
                />
                <span className="text-xs text-[var(--color-ink-faint)] capitalize flex-1">
                  {formatDate(date)}
                </span>
              </div>

              {/* Title */}
              <div className="relative px-6 pt-4">
                <input
                  type="text"
                  placeholder="Título do dia..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-transparent outline-none text-xl font-bold text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] border-none"
                  style={{ lineHeight: '32px' }}
                />
              </div>

              {/* Content */}
              <div className="relative px-6 pt-1 pb-6">
                <textarea
                  placeholder="Como foi o seu dia? O que aconteceu? O que você sentiu?"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={16}
                  className="w-full bg-transparent outline-none resize-none text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] leading-8"
                  style={{ lineHeight: '32px' }}
                />
              </div>

              {/* Bottom toolbar */}
              <div className="relative flex items-center justify-between px-6 py-3 border-t border-[var(--color-outline)]">
                <button
                  onClick={() => selectedId !== 'new' && typeof selectedId === 'number' && deleteEntry(selectedId)}
                  className="flex items-center gap-1.5 text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-coral)] transition-colors"
                >
                  <Trash2 size={13} /> Excluir
                </button>
                <button
                  onClick={save}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-sky)] hover:opacity-80 transition-opacity"
                >
                  <Save size={13} />
                  {saved ? 'Salvo ✓' : 'Salvar'}
                </button>
              </div>
            </div>

            {/* Back button on mobile */}
            <button
              onClick={() => setSelectedId(null)}
              className="md:hidden mt-3 text-sm text-[var(--color-ink-muted)] underline underline-offset-4"
            >
              ← Voltar para entradas
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
