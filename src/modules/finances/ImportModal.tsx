import { useRef, useState } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, TrendingUp, TrendingDown } from 'lucide-react'
import { db } from '../../db'
import { parseExtract, CSV_TEMPLATE, type ParsedTransaction } from '../../lib/extractParser'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

type Step = 'upload' | 'preview' | 'done'

interface PreviewRow extends ParsedTransaction {
  isDuplicate: boolean
}

interface DoneResult {
  imported: number
  duplicated: number
  failed: number
  jobId: number
}

interface Props {
  onClose: () => void
}

export function ImportModal({ onClose }: Props) {
  const [step, setStep]           = useState<Step>('upload')
  const [dragging, setDragging]   = useState(false)
  const [fileName, setFileName]   = useState('')
  const [rows, setRows]           = useState<PreviewRow[]>([])
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState<DoneResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── File reading ──────────────────────────────
  async function processFile(file: File) {
    setError('')
    setLoading(true)
    try {
      const content = await readFileAsText(file)
      const parsed  = parseExtract(file.name, content)

      // Busca FITIDs já existentes no banco para marcar duplicatas
      const existingFitids = new Set(
        (await db.transactions.where('fitid').above('').toArray()).map(t => t.fitid!)
      )

      const preview: PreviewRow[] = parsed.map(p => ({
        ...p,
        isDuplicate: existingFitids.has(p.fitid),
      }))

      setFileName(file.name)
      setRows(preview)
      setStep('preview')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao processar arquivo.')
    } finally {
      setLoading(false)
    }
  }

  function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo.'))
      // Tenta UTF-8 primeiro; fallback para latin1 (Windows-1252)
      try {
        reader.readAsText(file, 'UTF-8')
      } catch {
        reader.readAsText(file, 'latin1')
      }
    })
  }

  // ── Drag & drop ───────────────────────────────
  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  // ── Import ────────────────────────────────────
  async function handleImport() {
    setLoading(true)
    const newRows      = rows.filter(r => !r.isDuplicate)
    const dupRows      = rows.filter(r => r.isDuplicate)
    let importedCount  = 0
    let failedCount    = 0
    const now          = new Date().toISOString()

    const ext = fileName.split('.').pop()?.toUpperCase() as 'OFX' | 'CSV'

    const jobId = await db.importJobs.add({
      fileName,
      fileFormat: ext === 'OFX' ? 'OFX' : 'CSV',
      status: 'completed',
      totalRecords: rows.length,
      importedRecords: 0,
      duplicatedRecords: dupRows.length,
      createdAt: now,
    })

    for (const row of newRows) {
      try {
        await db.transactions.add({
          type: row.type,
          amount: row.amount,
          category: row.category || autoCategory(row.description),
          description: row.description,
          date: row.date,
          fitid: row.fitid,
          importJobId: jobId as number,
          createdAt: now,
        })
        importedCount++
      } catch {
        failedCount++
      }
    }

    await db.importJobs.update(jobId as number, { importedRecords: importedCount })

    setResult({ imported: importedCount, duplicated: dupRows.length, failed: failedCount, jobId: jobId as number })
    setStep('done')
    setLoading(false)
  }

  // ── Template download ─────────────────────────
  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = 'template_extrato_focus.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const newCount = rows.filter(r => !r.isDuplicate).length
  const dupCount = rows.filter(r =>  r.isDuplicate).length
  const fmt = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-[var(--color-surface-elevated)] rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] w-full max-w-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-outline)] shrink-0">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-ink)]">Importar Extrato</h2>
            <p className="text-xs text-[var(--color-ink-subtle)] mt-0.5">
              {step === 'upload' && 'Formatos suportados: OFX e CSV'}
              {step === 'preview' && fileName}
              {step === 'done' && 'Importação concluída'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-[var(--radius-sm)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink-muted)]">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

          {/* ── STEP: UPLOAD ── */}
          {step === 'upload' && (
            <>
              <div
                onDragEnter={() => setDragging(true)}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-[var(--radius-lg)] p-10 text-center cursor-pointer transition-colors flex flex-col items-center gap-3
                  ${dragging ? 'border-[var(--color-sky)] bg-[var(--color-sky-soft)]' : 'border-[var(--color-outline)] hover:border-[var(--color-sky)] hover:bg-[var(--color-sky-soft)]/30'}
                `}
              >
                <div className="p-4 rounded-full bg-[var(--color-sky-soft)]">
                  <Upload size={28} className="text-[var(--color-sky)]" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-ink)]">
                    {loading ? 'Processando...' : 'Arraste seu arquivo aqui'}
                  </p>
                  <p className="text-sm text-[var(--color-ink-muted)] mt-1">
                    ou <span className="text-[var(--color-sky)] font-semibold">clique para selecionar</span>
                  </p>
                  <p className="text-xs text-[var(--color-ink-subtle)] mt-2">Arquivos .OFX e .CSV · Máx. 5MB</p>
                </div>
                <input ref={inputRef} type="file" accept=".ofx,.ofc,.csv" className="hidden" onChange={onFileInput} />
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-[var(--color-coral-soft)] border border-[var(--color-coral)] rounded-[var(--radius-md)] px-4 py-3">
                  <AlertCircle size={16} className="text-[var(--color-coral)] shrink-0 mt-0.5" />
                  <p className="text-sm text-[var(--color-coral)]">{error}</p>
                </div>
              )}

              <button
                onClick={downloadTemplate}
                className="flex items-center gap-2 text-sm text-[var(--color-sky)] hover:underline self-start"
              >
                <Download size={14} />
                Baixar template CSV
              </button>

              <div className="bg-[var(--color-surface-sunken)] rounded-[var(--radius-md)] p-4 text-sm text-[var(--color-ink-muted)]">
                <p className="font-semibold text-[var(--color-ink)] mb-2">Como exportar seu extrato?</p>
                <ul className="list-disc pl-4 space-y-1 text-xs">
                  <li><strong>OFX:</strong> Acesse seu banco → Extratos → Exportar → selecione formato OFX/QIF</li>
                  <li><strong>CSV:</strong> Baixe o template acima, preencha e importe, ou use o formato do seu banco</li>
                  <li>Transações duplicadas são detectadas automaticamente e ignoradas</li>
                </ul>
              </div>
            </>
          )}

          {/* ── STEP: PREVIEW ── */}
          {step === 'preview' && (
            <>
              {/* Summary chips */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 bg-[var(--color-leaf-soft)] px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-leaf)]" />
                  <span className="text-sm font-semibold text-[var(--color-leaf-deep)]">{newCount} novas</span>
                </div>
                {dupCount > 0 && (
                  <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="text-sm font-semibold text-amber-700">{dupCount} duplicadas (ignoradas)</span>
                  </div>
                )}
                <span className="text-sm text-[var(--color-ink-subtle)]">{rows.length} total encontradas</span>
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-outline)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--color-surface-sunken)] text-left">
                      <th className="px-3 py-2.5 text-xs font-bold text-[var(--color-ink-muted)] whitespace-nowrap">Data</th>
                      <th className="px-3 py-2.5 text-xs font-bold text-[var(--color-ink-muted)]">Descrição</th>
                      <th className="px-3 py-2.5 text-xs font-bold text-[var(--color-ink-muted)] whitespace-nowrap text-right">Valor</th>
                      <th className="px-3 py-2.5 text-xs font-bold text-[var(--color-ink-muted)] whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-outline)]">
                    {rows.map((row, i) => (
                      <tr key={i} className={row.isDuplicate ? 'opacity-40' : ''}>
                        <td className="px-3 py-2.5 text-[var(--color-ink-subtle)] whitespace-nowrap">
                          {new Date(row.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-3 py-2.5 text-[var(--color-ink)] max-w-[200px] truncate">{row.description}</td>
                        <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap">
                          <span className="flex items-center justify-end gap-1">
                            {row.type === 'income'
                              ? <TrendingUp size={12} className="text-[var(--color-leaf)]" />
                              : <TrendingDown size={12} className="text-[var(--color-coral)]" />}
                            <span style={{ color: row.type === 'income' ? 'var(--color-leaf-deep)' : 'var(--color-coral)' }}>
                              {row.type === 'income' ? '+' : '−'}{fmt(row.amount)}
                            </span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          {row.isDuplicate
                            ? <Badge color="sun">Duplicada</Badge>
                            : <Badge color="leaf">Nova</Badge>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {newCount === 0 && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-[var(--radius-md)] px-4 py-3">
                  <AlertCircle size={16} className="text-amber-500 shrink-0" />
                  <p className="text-sm text-amber-700">Todas as transações já foram importadas anteriormente.</p>
                </div>
              )}
            </>
          )}

          {/* ── STEP: DONE ── */}
          {step === 'done' && result && (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
              <div className="p-5 rounded-full bg-[var(--color-leaf-soft)]">
                <CheckCircle size={40} className="text-[var(--color-leaf)]" />
              </div>
              <div>
                <p className="text-xl font-bold text-[var(--color-ink)]">Extrato importado!</p>
                <p className="text-[var(--color-ink-muted)] mt-1">As transações foram adicionadas ao seu histórico.</p>
              </div>
              <div className="grid grid-cols-3 gap-3 w-full">
                <div className="bg-[var(--color-leaf-soft)] rounded-[var(--radius-md)] p-3">
                  <p className="text-2xl font-bold text-[var(--color-leaf-deep)]">{result.imported}</p>
                  <p className="text-xs text-[var(--color-leaf-deep)] mt-1">Importadas</p>
                </div>
                <div className="bg-amber-50 rounded-[var(--radius-md)] p-3">
                  <p className="text-2xl font-bold text-amber-700">{result.duplicated}</p>
                  <p className="text-xs text-amber-700 mt-1">Duplicadas</p>
                </div>
                <div className={`rounded-[var(--radius-md)] p-3 ${result.failed > 0 ? 'bg-[var(--color-coral-soft)]' : 'bg-[var(--color-surface-sunken)]'}`}>
                  <p className={`text-2xl font-bold ${result.failed > 0 ? 'text-[var(--color-coral)]' : 'text-[var(--color-ink-subtle)]'}`}>{result.failed}</p>
                  <p className={`text-xs mt-1 ${result.failed > 0 ? 'text-[var(--color-coral)]' : 'text-[var(--color-ink-subtle)]'}`}>Erros</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-outline)] shrink-0 flex gap-3">
          {step === 'upload' && (
            <Button variant="ghost" onClick={onClose} fullWidth>Cancelar</Button>
          )}
          {step === 'preview' && (
            <>
              <Button variant="ghost" onClick={() => { setStep('upload'); setRows([]); setError('') }} fullWidth>
                Voltar
              </Button>
              <Button onClick={handleImport} fullWidth disabled={newCount === 0 || loading}>
                {loading ? 'Importando...' : `Importar ${newCount} transaç${newCount === 1 ? 'ão' : 'ões'}`}
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={onClose} fullWidth>Fechar</Button>
          )}
        </div>
      </div>
    </div>
  )
}

// Categorização automática por palavras-chave
function autoCategory(desc: string): string {
  const d = desc.toLowerCase()
  if (/pix|ted|doc|transfer/.test(d))   return 'Transferência'
  if (/supermercado|mercado|hortifruti|ifood|rappi|uber eat/.test(d)) return 'Alimentação'
  if (/uber|99|taxi|metro|onibus|combustivel|posto/.test(d)) return 'Transporte'
  if (/farmacia|medico|hospital|clinica|plano saude/.test(d)) return 'Saúde'
  if (/netflix|spotify|amazon|disney|youtube|assinatura/.test(d)) return 'Assinaturas'
  if (/salario|pagamento|folha/.test(d)) return 'Salário'
  if (/luz|energia|agua|gas|internet|telefone|aluguel|condominio/.test(d)) return 'Moradia'
  if (/amazon|mercadolivre|shopee|compra/.test(d)) return 'Compras'
  return 'Outros'
}
