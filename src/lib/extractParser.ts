export interface ParsedTransaction {
  fitid: string
  date: string        // ISO YYYY-MM-DD
  amount: number      // sempre positivo
  type: 'income' | 'expense'
  description: string
  category?: string
}

// --- Hash determinístico (djb2) para fallback FITID ---
function djb2(str: string): string {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

export function makeFitid(date: string, amount: number, desc: string): string {
  return `gen_${djb2(`${date}|${amount.toFixed(2)}|${desc}`)}`
}

// ──────────────────────────────────────────────────
// OFX PARSER (1.02 SGML + 2.x XML)
// ──────────────────────────────────────────────────

function extractTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i')
  return re.exec(block)?.[1]?.trim() ?? ''
}

function parseOFXDate(raw: string): string {
  const s = raw.replace(/\[.*\]/, '').trim()
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

export function parseOFX(content: string): ParsedTransaction[] {
  // Remove BOM e normaliza encoding básico
  const text = content.replace(/^﻿/, '').replace(/\r\n/g, '\n')

  const start = text.indexOf('<OFX>')
  const body  = start >= 0 ? text.slice(start) : text

  // Divide nos blocos <STMTTRN>
  const parts = body.split(/<STMTTRN>/i)
  const results: ParsedTransaction[] = []

  for (let i = 1; i < parts.length; i++) {
    let block = parts[i]
    const end = block.search(/<\/STMTTRN>/i)
    if (end >= 0) block = block.slice(0, end)

    const dtRaw  = extractTag(block, 'DTPOSTED')
    const amtRaw = extractTag(block, 'TRNAMT')
    const fitid  = extractTag(block, 'FITID')
    const memo   = extractTag(block, 'MEMO') || extractTag(block, 'NAME')

    if (!dtRaw || !amtRaw) continue

    const amount = parseFloat(amtRaw.replace(',', '.'))
    if (isNaN(amount)) continue

    const date = parseOFXDate(dtRaw)
    const desc = memo || 'Sem descrição'

    results.push({
      fitid: fitid || makeFitid(date, Math.abs(amount), desc),
      date,
      amount: Math.abs(amount),
      type: amount >= 0 ? 'income' : 'expense',
      description: desc,
    })
  }

  if (results.length === 0) throw new Error('Nenhuma transação encontrada no arquivo OFX.')
  return results
}

// ──────────────────────────────────────────────────
// CSV PARSER
// ──────────────────────────────────────────────────

function splitCsvLine(line: string): string[] {
  const result: string[] = []
  let cur = '', inQ = false
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = '' }
    else cur += ch
  }
  result.push(cur.trim())
  return result
}

function normalizeDate(raw: string): string {
  const s = raw.replace(/['"]/g, '').trim()
  const m1 = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s)
  if (m1) return `${m1[3]}-${m1[2].padStart(2, '0')}-${m1[1].padStart(2, '0')}`
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const m2 = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(s)
  if (m2) return `${m2[3]}-${m2[2].padStart(2, '0')}-${m2[1].padStart(2, '0')}`
  return s
}

function parseAmount(raw: string): number {
  const s = raw.replace(/['"R$\s]/g, '').trim()
  const commaIdx = s.lastIndexOf(',')
  const dotIdx   = s.lastIndexOf('.')
  if (commaIdx > dotIdx) {
    // Formato BR: 1.500,00
    return parseFloat(s.replace(/\./g, '').replace(',', '.'))
  }
  // Formato US ou sem separador de milhar: 1500.00
  return parseFloat(s.replace(/,/g, ''))
}

function findCol(headers: string[], keywords: string[]): number {
  return headers.findIndex(h => keywords.some(k => h.includes(k)))
}

export function parseCSV(content: string): ParsedTransaction[] {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim())
  if (lines.length < 2) throw new Error('CSV vazio ou sem linhas de dados.')

  const headers = splitCsvLine(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, '').trim())

  const di  = findCol(headers, ['data', 'date', 'dt'])
  const ai  = findCol(headers, ['valor', 'amount', 'vl', 'quantia', 'value'])
  const dsi = findCol(headers, ['descri', 'memo', 'hist', 'lancamento', 'description', 'observ'])
  const ci  = findCol(headers, ['categ'])

  if (di < 0) throw new Error('Coluna "Data" não encontrada. Use o template CSV padrão.')
  if (ai < 0) throw new Error('Coluna "Valor" não encontrada. Use o template CSV padrão.')

  const results: ParsedTransaction[] = []

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue
    const cols = splitCsvLine(line)

    const rawDate = cols[di] ?? ''
    const rawAmt  = cols[ai] ?? ''
    const desc    = dsi >= 0 ? (cols[dsi] ?? '').replace(/['"]/g, '').trim() : 'Importado'
    const cat     = ci  >= 0 ? (cols[ci]  ?? '').replace(/['"]/g, '').trim() : undefined

    if (!rawDate.trim() || !rawAmt.trim()) continue

    const amount = parseAmount(rawAmt)
    if (isNaN(amount)) continue

    const date = normalizeDate(rawDate)
    results.push({
      fitid: makeFitid(date, Math.abs(amount), desc),
      date,
      amount: Math.abs(amount),
      type: amount >= 0 ? 'income' : 'expense',
      description: desc,
      category: cat || undefined,
    })
  }

  if (results.length === 0) throw new Error('Nenhuma transação válida encontrada no CSV.')
  return results
}

// ──────────────────────────────────────────────────
// DETECÇÃO AUTOMÁTICA DE FORMATO
// ──────────────────────────────────────────────────
export function parseExtract(fileName: string, content: string): ParsedTransaction[] {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'ofx' || ext === 'ofc') return parseOFX(content)
  if (ext === 'csv') return parseCSV(content)

  // Tenta detectar pelo conteúdo
  const trimmed = content.trim()
  if (trimmed.includes('OFXHEADER') || trimmed.includes('<OFX>')) return parseOFX(content)
  return parseCSV(content)
}

// Template CSV para download
export const CSV_TEMPLATE = `Data,Descricao,Valor,Categoria,Tipo
05/08/2026,"PIX RECEBIDO",1500.00,"Vendas","CREDIT"
10/08/2026,"SUPERMERCADO",-120.50,"Alimentacao","DEBIT"
`
