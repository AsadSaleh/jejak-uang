import type { ParsedDoc } from '../parse-pdf'
import type { Candidate, DetectedCounterparty } from '../import-types'
import { col, parseAmountIDR, parseIndoDate } from './util'

// BSI EASY WADIAH (BYOND) statement adapter.
//
// Column layout (from header):
//   Date & Time | Detail Transaksi | No Reff | Debit | Kredit | Saldo
//
// Records span 2+ lines:
//   L1 (anchor): date  | Dana Keluar | BIFAST - TRF Ke | FT...REF | debit | kredit | saldo
//   L2 (cont.):  time  | "- Bank BCA - MAHDA"   (counterparty)
//   L3+ (rare): more cont. (e.g., QRIS payment id wrap)

const HEADER_RE = /Date\s*&\s*Time.*Detail Transaksi.*No Reff.*Debit.*Kredit.*Saldo/
// Signals that the continuation has crossed a page break. Stop accumulating.
const PAGE_BREAK_RE = /(RINGKASAN TRANSAKSI|SALDO BULAN LALU|EASY WADIAH|Detail Transaksi|Date\s*&\s*Time|LAPORAN REKENING)/i

interface BsiCols {
  date: number
  detail: number
  reff: number
  debit: number
  kredit: number
  saldo: number
}

function findHeader(lines: string[]): { idx: number; cols: BsiCols } | null {
  for (let i = 0; i < lines.length; i++) {
    if (!HEADER_RE.test(lines[i])) continue
    const h = lines[i]
    return {
      idx: i,
      cols: {
        date: 0,
        detail: h.indexOf('Detail'),
        reff: h.indexOf('No Reff'),
        debit: h.indexOf('Debit'),
        kredit: h.indexOf('Kredit'),
        saldo: h.indexOf('Saldo'),
      },
    }
  }
  return null
}

const DATE_TEXT_RE = /^\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}$/
const NUMERIC_AMT_RE = /\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?/

function isAnchor(line: string, c: BsiCols): boolean {
  return DATE_TEXT_RE.test(col(line, c.date, c.detail))
}

// Recipient names in BSI BIFAST lines are conventionally ALL-CAPS; lowercase
// tokens after the name are freeform notes from the sender. Keep only the
// leading uppercase run as the actual name.
function cleanBsiName(raw: string): string {
  const tokens = raw.trim().split(/\s+/)
  const nameTokens: string[] = []
  for (const t of tokens) {
    if (/^[A-Z][A-Z.'-]*$/.test(t)) nameTokens.push(t)
    else break
  }
  return nameTokens.length ? nameTokens.join(' ') : raw.trim()
}

function parseBifastCounterparty(text: string): DetectedCounterparty | undefined {
  // "- Bank BCA - MAHDA" / "BCA - MAHDA"
  const t = text.replace(/^[-\s]+/, '').trim()
  if (!t) return undefined
  const parts = t.split(/\s+-\s+/).map((p) => p.trim()).filter(Boolean)
  if (parts.length >= 2) {
    return {
      bank: parts[0].replace(/^Bank\s+/i, ''),
      name: cleanBsiName(parts.slice(1).join(' - ')),
    }
  }
  return { bank: parts[0].replace(/^Bank\s+/i, '') }
}

export function extractBsi(parsed: ParsedDoc): Candidate[] {
  const lines = parsed.text.split('\n')
  const header = findHeader(lines)
  if (!header) return []
  const { cols } = header

  const candidates: Candidate[] = []
  let i = header.idx + 1

  while (i < lines.length) {
    if (!isAnchor(lines[i], cols)) {
      i++
      continue
    }
    const anchor = lines[i]
    const date = parseIndoDate(col(anchor, cols.date, cols.detail))
    const detail = col(anchor, cols.detail, cols.reff)
    const reff = col(anchor, cols.reff, cols.debit)
    const debitRaw = col(anchor, cols.debit, cols.kredit).match(NUMERIC_AMT_RE)?.[0]
    const kreditRaw = col(anchor, cols.kredit, cols.saldo).match(NUMERIC_AMT_RE)?.[0]
    const debit = debitRaw ? parseAmountIDR(debitRaw) : 0
    const kredit = kreditRaw ? parseAmountIDR(kreditRaw) : 0

    let direction: Candidate['direction'] = 'unknown'
    let amount = 0
    if (debit > 0 && kredit === 0) {
      direction = 'debit'
      amount = debit
    } else if (kredit > 0 && debit === 0) {
      direction = 'credit'
      amount = kredit
    } else {
      amount = Math.max(debit, kredit)
    }

    const contLines: string[] = []
    let time: string | undefined
    let j = i + 1
    while (j < lines.length && j - i < 4) {
      const line = lines[j]
      if (!line.trim()) {
        j++
        continue
      }
      if (isAnchor(line, cols)) break
      if (PAGE_BREAK_RE.test(line)) break
      // BSI prints the transaction time in the date column of the first
      // continuation line; later continuation lines have whitespace there.
      if (time === undefined) {
        const t = col(line, cols.date, cols.detail).match(/^\d{1,2}:\d{2}$/)
        if (t) time = t[0]
      }
      const d = col(line, cols.detail, cols.reff)
      if (d) contLines.push(d)
      j++
    }

    // The counterparty (when present) sits on the first continuation line; any
    // further continuation lines are additional notes that should not pollute
    // the counterparty name.
    const cpLine = contLines[0] ?? ''
    const noteLines = contLines.slice(1).join(' ').trim()
    let counterparty: DetectedCounterparty | undefined
    if (/^-?\s*Bank\b/i.test(cpLine) || /\bBank\s+[A-Z]{2,}/.test(cpLine)) {
      counterparty = parseBifastCounterparty(cpLine)
    }

    const description = [detail, cpLine, noteLines]
      .filter(Boolean)
      .join(' — ')
      .trim()

    if (amount === 0) {
      // Anchor turned out to be a non-transaction (carry-forward / page noise).
      i = j
      continue
    }

    candidates.push({
      date,
      time,
      rawDate: col(anchor, cols.date, cols.detail),
      amount,
      direction,
      description,
      rawText: `${anchor} | ${reff}`,
      counterparty,
    })

    i = j
  }

  return candidates
}
