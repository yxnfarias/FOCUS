import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Task } from '../../db'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input, Select } from '../../components/ui/Input'
import { useAuth } from '../../contexts/AuthContext'

type Priority = 'low' | 'medium' | 'high'
type Status   = 'todo' | 'in_progress' | 'done'

const priorityConfig: Record<Priority, { label: string; color: 'leaf' | 'sun' | 'coral' }> = {
  low:    { label: 'Baixa', color: 'leaf'  },
  medium: { label: 'Média', color: 'sun'   },
  high:   { label: 'Alta',  color: 'coral' },
}

const columns: {
  id: Status; label: string
  accent: string; bg: string; bgHover: string; dot: string
}[] = [
  { id: 'todo',        label: 'A fazer',      dot: 'var(--color-ink-subtle)', accent: 'var(--color-ink-muted)',  bg: 'var(--color-surface-sunken)', bgHover: 'var(--color-kanban-todo-hover)' },
  { id: 'in_progress', label: 'Em andamento', dot: 'var(--color-sky)',        accent: 'var(--color-sky-deep)',  bg: 'var(--color-sky-soft)',       bgHover: 'var(--color-kanban-sky-hover)'  },
  { id: 'done',        label: 'Concluído',    dot: 'var(--color-leaf)',       accent: 'var(--color-leaf-deep)', bg: 'var(--color-leaf-soft)',      bgHover: 'var(--color-kanban-leaf-hover)' },
]

function AddTaskModal({ userId, defaultStatus, onClose }: { userId: string; defaultStatus: Status; onClose: () => void }) {
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority]       = useState<Priority>('medium')
  const [dueDate, setDueDate]         = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await supabase.from('tasks').insert({
      user_id: userId,
      title: title.trim(), description, priority,
      due_date: dueDate || null, status: defaultStatus,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-[var(--color-surface-elevated)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] w-full max-w-md p-6 flex flex-col gap-4" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-[var(--color-ink)]">Nova tarefa</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input label="Título" placeholder="O que precisa ser feito?" value={title} onChange={e => setTitle(e.target.value)} required />
          <Input label="Descrição (opcional)" placeholder="Detalhes..." value={description} onChange={e => setDescription(e.target.value)} />
          <Select label="Prioridade" value={priority} onChange={e => setPriority((e.target as HTMLSelectElement).value as Priority)}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </Select>
          <Input label="Vencimento (opcional)" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          <div className="flex gap-2 mt-2">
            <Button type="button" variant="ghost" onClick={onClose} fullWidth>Cancelar</Button>
            <Button type="submit" fullWidth>Salvar</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface TaskCardProps {
  task: Task
  isDragging: boolean
  onDragStart: (id: number) => void
  onDelete: (id: number) => void
}

function TaskCard({ task, isDragging, onDragStart, onDelete }: TaskCardProps) {
  const p      = priorityConfig[task.priority]
  const isDone = task.status === 'done'

  return (
    <div
      draggable
      onDragStart={e => {
        if (!task.id) return
        const ghost = document.createElement('div')
        ghost.style.cssText = 'position:absolute;top:-9999px;width:1px;height:1px;'
        document.body.appendChild(ghost)
        e.dataTransfer.setDragImage(ghost, 0, 0)
        setTimeout(() => document.body.removeChild(ghost), 0)
        onDragStart(task.id)
      }}
      onDragEnd={() => {/* dragId cleared in parent drop */}}
      className={`
        group bg-[var(--color-surface-elevated)] border border-[var(--color-outline)]
        rounded-[var(--radius-md)] p-3 flex flex-col gap-2 select-none
        transition-all duration-200 ease-out
        ${isDragging
          ? 'opacity-30 scale-95 rotate-1 shadow-none cursor-grabbing'
          : 'cursor-grab hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--color-outline-strong)]'
        }
      `}
    >
      <div className="flex items-start gap-2">
        <GripVertical size={14} className="text-[var(--color-ink-faint)] mt-0.5 shrink-0 group-hover:text-[var(--color-ink-subtle)]" />
        <p className={`text-sm font-semibold flex-1 leading-snug ${isDone ? 'line-through text-[var(--color-ink-muted)]' : 'text-[var(--color-ink)]'}`}>
          {task.title}
        </p>
        <button
          onClick={e => { e.stopPropagation(); task.id && onDelete(task.id) }}
          className="p-0.5 rounded opacity-0 group-hover:opacity-100 text-[var(--color-ink-faint)] hover:text-[var(--color-coral)] transition-all shrink-0"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {task.description && (
        <p className="text-xs text-[var(--color-ink-muted)] pl-5 leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center gap-1.5 flex-wrap pl-5">
        <Badge color={p.color}>{p.label}</Badge>
        {task.due_date && (
          <span className="text-xs text-[var(--color-ink-muted)]">
            📅 {new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    </div>
  )
}

export function Tasks() {
  const { user } = useAuth()
  const userId = user!.id
  const [addTo, setAddTo]     = useState<Status | null>(null)
  const [dragId, setDragId]   = useState<number | null>(null)
  const [overCol, setOverCol] = useState<Status | null>(null)
  const [tasks, setTasks]     = useState<Task[]>([])

  const loadTasks = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    setTasks((data ?? []) as Task[])
  }, [userId])

  useEffect(() => { loadTasks() }, [loadTasks])

  const byStatus = (s: Status) => tasks.filter(t => t.status === s)

  async function deleteTask(id: number) {
    await supabase.from('tasks').delete().eq('id', id)
    await loadTasks()
  }

  async function onDrop(status: Status) {
    if (dragId !== null) {
      await supabase.from('tasks').update({ status }).eq('id', dragId)
      setDragId(null)
      setOverCol(null)
      await loadTasks()
    }
  }

  async function closeModal() {
    setAddTo(null)
    await loadTasks()
  }

  const total = tasks.length
  const done  = tasks.filter(t => t.status === 'done').length

  return (
    <div className="flex flex-col gap-5 pb-20 md:pb-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ink)]">Tarefas</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-0.5">{done} de {total} concluídas</p>
        </div>
        <Button size="sm" onClick={() => setAddTo('todo')}>
          <Plus size={16} /> Nova
        </Button>
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="h-1.5 rounded-full bg-[var(--color-surface-sunken)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${(done / total) * 100}%`, background: 'var(--color-leaf)' }}
          />
        </div>
      )}

      {/* Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map(col => {
          const colTasks = byStatus(col.id)
          const isOver   = overCol === col.id && dragId !== null

          return (
            <div
              key={col.id}
              onDragOver={e => { e.preventDefault(); if (dragId !== null) setOverCol(col.id) }}
              onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null)
              }}
              onDrop={() => onDrop(col.id)}
              className="flex flex-col gap-2 rounded-[var(--radius-lg)] p-3 min-h-[220px] transition-all duration-200"
              style={{
                background: isOver ? col.bgHover : col.bg,
                boxShadow: isOver ? `inset 0 0 0 2px var(--color-sky)` : 'none',
                transform:  isOver ? 'scale(1.01)' : 'scale(1)',
              }}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full transition-transform duration-200"
                    style={{ background: col.dot, transform: isOver ? 'scale(1.3)' : 'scale(1)' }}
                  />
                  <span className="text-sm font-bold" style={{ color: col.accent }}>{col.label}</span>
                  <span
                    className="text-xs font-semibold px-1.5 py-0.5 rounded-full text-[var(--color-ink-muted)]"
                    style={{ background: 'var(--color-card-badge)' }}
                  >
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => setAddTo(col.id)}
                  className="p-1 rounded-[var(--radius-sm)] text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)] transition-colors"
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-card-btn-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                  title={`Adicionar em ${col.label}`}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Drop placeholder */}
              {isOver && (
                <div
                  className="rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-sky)]"
                  style={{ height: 56, background: 'var(--color-card-badge)', animation: 'pulse 1s ease-in-out infinite' }}
                />
              )}

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isDragging={dragId === task.id}
                    onDragStart={setDragId}
                    onDelete={deleteTask}
                  />
                ))}
              </div>

              {/* Empty state */}
              {colTasks.length === 0 && !isOver && (
                <div className="flex-1 flex items-center justify-center py-8">
                  <p className="text-xs text-[var(--color-ink-faint)] text-center leading-relaxed">
                    Arraste um card aqui<br />ou clique em +
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {addTo && <AddTaskModal defaultStatus={addTo} userId={userId} onClose={closeModal} />}
    </div>
  )
}
