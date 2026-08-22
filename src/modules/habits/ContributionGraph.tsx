import { useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db'

// 52 semanas = ~1 ano. Com CELL=11 e gap=2, em ~550px de container
// o SVG escala para ~0.78x → células ficam ~9px (tamanho ideal)
const WEEKS = 52
const DAYS  = 7
const CELL  = 11
const GAP   = 2
const LW    = 26   // largura da coluna de labels (Seg/Qua/Sex)
const LH    = 14   // altura da linha de labels de meses

const SVG_W = LW + WEEKS * (CELL + GAP) - GAP  // ≈ 701
const SVG_H = LH + DAYS  * (CELL + GAP) - GAP  // ≈ 103

const DAY_LABELS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const LEGEND      = ['#E2E8F0','#BFDBFE','#60A5FA','#3B82F6','#1D4ED8','#22C55E']

function toISO(d: Date) { return d.toISOString().split('T')[0] }

function buildGrid(): string[][] {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - (WEEKS * DAYS - 1))
  return Array.from({ length: WEEKS }, (_, w) =>
    Array.from({ length: DAYS }, (_, d) => {
      const dt = new Date(start)
      dt.setDate(start.getDate() + w * DAYS + d)
      return toISO(dt)
    })
  )
}

function cellColor(ratio: number, future: boolean): string {
  if (future)        return '#F1F5F9'
  if (ratio === 0)   return '#E2E8F0'
  if (ratio <= 0.25) return '#BFDBFE'
  if (ratio <= 0.5)  return '#60A5FA'
  if (ratio <= 0.75) return '#3B82F6'
  if (ratio < 1)     return '#1D4ED8'
  return '#22C55E'
}

interface Tip { x: number; y: number; date: string; done: number; total: number }

export function ContributionGraph() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [tip, setTip] = useState<Tip | null>(null)

  const today = toISO(new Date())
  const grid  = useMemo(buildGrid, [])

  const habits = useLiveQuery(() => db.habits.toArray(), [])
  const logs   = useLiveQuery(
    () => db.habitLogs.where('date').aboveOrEqual(grid[0][0]).toArray(),
    [grid[0][0]]
  )

  const logMap = useMemo(() => {
    const m: Record<string, number> = {}
    for (const l of logs ?? []) if (l.completed) m[l.date] = (m[l.date] ?? 0) + 1
    return m
  }, [logs])

  const total = habits?.length ?? 0

  const monthLabels = useMemo(() => {
    const out: { wi: number; label: string }[] = []
    let last = -1
    grid.forEach((week, wi) => {
      const m = new Date(week[0]).getMonth()
      if (m !== last) { out.push({ wi, label: MONTH_NAMES[m] }); last = m }
    })
    return out
  }, [grid])

  function onEnter(e: React.MouseEvent, date: string, done: number) {
    const rect = wrapRef.current?.getBoundingClientRect()
    if (!rect) return
    setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top, date, done, total })
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-[var(--color-ink)]">Histórico de hábitos</span>
        <span className="text-xs text-[var(--color-ink-subtle)]">Último ano</span>
      </div>

      <div ref={wrapRef} className="relative w-full">
        <svg
          width="100%"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setTip(null)}
          style={{ display: 'block' }}
        >
          {/* Meses */}
          {monthLabels.map(({ wi, label }) => (
            <text
              key={wi}
              x={LW + wi * (CELL + GAP)}
              y={LH - 3}
              fontSize={7} fill="var(--color-ink-subtle)" fontFamily="inherit"
            >
              {label}
            </text>
          ))}

          {/* Dias da semana (alternados) */}
          {[1, 3, 5].map(di => (
            <text
              key={di}
              x={LW - 3}
              y={LH + di * (CELL + GAP) + CELL - 1}
              fontSize={6.5} textAnchor="end" fill="var(--color-ink-subtle)" fontFamily="inherit"
            >
              {DAY_LABELS[di]}
            </text>
          ))}

          {/* Células */}
          {grid.map((week, wi) =>
            week.map((date, di) => {
              const done   = logMap[date] ?? 0
              const ratio  = total > 0 ? done / total : 0
              const future = date > today
              const cx = LW + wi * (CELL + GAP)
              const cy = LH + di * (CELL + GAP)

              return (
                <g key={`${wi}-${di}`}>
                  <rect
                    x={cx} y={cy} width={CELL} height={CELL} rx={2}
                    fill={cellColor(ratio, future)}
                    style={{ cursor: future ? 'default' : 'pointer' }}
                    onMouseEnter={e => !future && onEnter(e, date, done)}
                  />
                  {date === today && (
                    <rect x={cx} y={cy} width={CELL} height={CELL} rx={2}
                      fill="none" stroke="var(--color-sky-deep)" strokeWidth={1.5} />
                  )}
                </g>
              )
            })
          )}
        </svg>

        {/* Tooltip */}
        {tip && (
          <div
            className="absolute z-10 pointer-events-none bg-[var(--color-ink)] text-white text-xs rounded-[var(--radius-sm)] px-2.5 py-1.5 shadow-lg whitespace-nowrap"
            style={{ left: tip.x + 10, top: tip.y - 36 }}
          >
            <span className="font-semibold">
              {new Date(tip.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                weekday: 'short', day: 'numeric', month: 'short',
              })}
            </span>
            {' · '}
            {tip.total === 0
              ? 'Sem hábitos'
              : `${tip.done}/${tip.total} ${tip.total === 1 ? 'hábito' : 'hábitos'}`}
          </div>
        )}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-[var(--color-ink-subtle)]">Menos</span>
        {LEGEND.map(c => (
          <div key={c} className="w-3 h-3 rounded-[2px] shrink-0" style={{ background: c }} />
        ))}
        <span className="text-[10px] text-[var(--color-ink-subtle)]">Mais</span>
      </div>
    </div>
  )
}
