import type { ParsedDoc } from '../parse-pdf'
import type { Candidate } from '../import-types'
import { parseAmountIDR, parseIndoDate } from './util'

// Bank-agnostic, line-by-line extractor for Indonesian-style statements.
// Required as a fallback when no adapter recognises the bank.

const HEADER_RE =
  /^(date|tanggal|amount|balance|saldo|showing|page|latest balance|source\/destination|transaction details|notes)\b/i

// Requires grouped thousands or a sign so IDs/timestamps are not mistaken for
// money. Indonesian decimal separator is ','.
const AMOUNT_RE = /([+-]?)\s*(?:Rp\.?\s*)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?)/g

function findAmounts(line: string) {
  const hits: { sign: string; value: number; match: string }[] = []
  for (const m of line.matchAll(AMOUNT_RE)) {
    hits.push({ sign: m[1], value: parseAmountIDR(m[2]), match: m[0] })
  }
  return hits
}

export function extractGeneric(parsed: ParsedDoc): Candidate[] {
  const candidates: Candidate[] = []
  let currentDate = ''

  for (const rawLine of parsed.text.split('\n')) {
    const line = rawLine.trim()
    if (!line || HEADER_RE.test(line)) continue

    const parsedDate = parseIndoDate(line)
    if (parsedDate) currentDate = parsedDate

    const amounts = findAmounts(line)
    if (amounts.length === 0) continue

    // Prefer a signed amount (transaction); unsigned grouped numbers are
    // usually the running balance.
    const signed = amounts.find((a) => a.sign === '+' || a.sign === '-')
    const chosen = signed ?? amounts[0]

    const direction: Candidate['direction'] =
      chosen.sign === '+' ? 'credit' : chosen.sign === '-' ? 'debit' : 'unknown'

    let description = line
    if (parsedDate) {
      // strip the matched date token from description if it was on this line
      const dateMatch = line.match(/\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}/)
      if (dateMatch) description = description.replace(dateMatch[0], ' ')
    }
    for (const a of amounts) description = description.replace(a.match, ' ')
    description = description.replace(/\s+/g, ' ').trim()

    candidates.push({
      date: currentDate,
      rawDate: '',
      amount: Math.abs(chosen.value),
      direction,
      description,
      rawText: line,
    })
  }

  return candidates
}
