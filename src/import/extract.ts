import type { Candidate } from './import-types'

// Generic, bank-agnostic extractor for Indonesian-style statements.
// It scans the layout-preserved text line by line and emits one candidate per
// line that contains a currency-formatted amount. Bank-specific adapters in a
// later phase can produce richer candidates (counterparty, account numbers).

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  // common Indonesian month abbreviations
  agu: 8, agt: 8, okt: 10, des: 12, mei: 5,
}

const HEADER_RE =
  /^(date|tanggal|amount|balance|saldo|showing|page|latest balance|source\/destination|transaction details|notes)\b/i

// Requires grouped thousands (e.g. 39.500.000) or a sign, so account numbers,
// IDs and times are not mistaken for amounts. Decimal part uses ',' (id-ID).
const AMOUNT_RE = /([+-]?)\s*(?:Rp\.?\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?)/g

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toISO(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

function parseDate(line: string): { iso: string; raw: string } | null {
  const dmy = line.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/)
  if (dmy) {
    const month = MONTHS[dmy[2].slice(0, 3).toLowerCase()]
    if (month) return { iso: toISO(+dmy[3], month, +dmy[1]), raw: dmy[0] }
  }
  const iso = line.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return { iso: `${iso[1]}-${iso[2]}-${iso[3]}`, raw: iso[0] }
  const slash = line.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/)
  if (slash) return { iso: toISO(+slash[3], +slash[2], +slash[1]), raw: slash[0] }
  return null
}

function parseAmount(token: string): number {
  return parseFloat(token.replace(/\./g, '').replace(',', '.'))
}

interface AmountHit {
  sign: string
  value: number
  match: string
}

function findAmounts(line: string): AmountHit[] {
  const hits: AmountHit[] = []
  for (const m of line.matchAll(AMOUNT_RE)) {
    hits.push({ sign: m[1], value: parseAmount(m[2]), match: m[0] })
  }
  return hits
}

export function extractCandidates(docText: string): Candidate[] {
  const candidates: Candidate[] = []
  let currentDate = ''

  for (const rawLine of docText.split('\n')) {
    const line = rawLine.trim()
    if (!line || HEADER_RE.test(line)) continue

    const date = parseDate(line)
    if (date) currentDate = date.iso

    const amounts = findAmounts(line)
    if (amounts.length === 0) continue

    // Prefer a signed amount (the transaction); unsigned grouped numbers are
    // often the running balance.
    const signed = amounts.find((a) => a.sign === '+' || a.sign === '-')
    const chosen = signed ?? amounts[0]

    const direction: Candidate['direction'] =
      chosen.sign === '+' ? 'credit' : chosen.sign === '-' ? 'debit' : 'unknown'

    // Description = line minus the date token and all amount tokens.
    let description = line
    if (date) description = description.replace(date.raw, ' ')
    for (const a of amounts) description = description.replace(a.match, ' ')
    description = description.replace(/\s+/g, ' ').trim()

    candidates.push({
      date: currentDate,
      rawDate: date?.raw ?? '',
      amount: Math.abs(chosen.value),
      direction,
      description,
      rawText: line,
    })
  }

  return candidates
}
