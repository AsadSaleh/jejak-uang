import type { ParsedDoc } from '../parse-pdf'
import type { Candidate, DetectedCounterparty } from '../import-types'
import { col, digitRun, parseAmountIDR, parseIndoDate } from './util'

// Jago "Pockets Transactions History" adapter.
//
// Column layout (from header):
//   Date & Time | Source/Destination | Transaction Details | Notes | Amount | Balance
//
// A record spans 2–3 lines:
//   L1 (anchor):   date | counterparty name | details   | notes | +/-amount | balance
//   L2 (cont.):    time | bank (+ acct no.) | ID# <ref> | notes-cont
//   L3 (optional): blanks at col 0, account number in source col when the bank
//                  name was long enough to push it to its own line.

const HEADER_RE = /Date\s*&\s*Time.*Source\/Destination.*Transaction Details.*Amount.*Balance/

interface JagoCols {
  date: number
  source: number
  details: number
  notes: number
  amount: number
  balance: number
}

function findHeader(lines: string[]): { idx: number; cols: JagoCols } | null {
  for (let i = 0; i < lines.length; i++) {
    if (!HEADER_RE.test(lines[i])) continue
    const h = lines[i]
    const cols: JagoCols = {
      date: 0,
      source: h.indexOf('Source'),
      details: h.indexOf('Transaction'),
      notes: h.indexOf('Notes'),
      amount: h.indexOf('Amount'),
      balance: h.indexOf('Balance'),
    }
    return { idx: i, cols }
  }
  return null
}

const DATE_TEXT_RE = /^\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}$/
// The amount sits to the right of the description columns; the running balance
// follows it (unsigned). Search inline so misalignments in the right-edge
// columns don't cause false negatives.
const SIGNED_AMT_INLINE = /[+-]\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?/

function isAnchor(line: string, c: JagoCols): boolean {
  const date = col(line, c.date, c.source)
  return DATE_TEXT_RE.test(date) && SIGNED_AMT_INLINE.test(line)
}

function parseCounterparty(
  sourceLines: string[],
): DetectedCounterparty | undefined {
  // sourceLines = source-column slices from continuation lines.
  // L2 typically holds "<bank> [<account number>]" and L3 may hold a trailing
  // account number when the bank name was long.
  const combined = sourceLines.filter(Boolean).join(' ').trim()
  if (!combined) return undefined
  const accountNumber = digitRun(combined, 8) ?? undefined
  const bank = combined.replace(/\d{8,}/g, '').trim() || undefined
  return { bank, accountNumber }
}

export function extractJago(parsed: ParsedDoc): Candidate[] {
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
    const date = parseIndoDate(col(anchor, cols.date, cols.source))
    const amountMatch = anchor.match(SIGNED_AMT_INLINE)
    const amountToken = amountMatch?.[0] ?? ''
    const sign = amountToken[0] === '+' ? '+' : amountToken[0] === '-' ? '-' : ''
    const amount = Math.abs(parseAmountIDR(amountToken))
    const direction: Candidate['direction'] =
      sign === '+' ? 'credit' : sign === '-' ? 'debit' : 'unknown'

    const sourceName = col(anchor, cols.source, cols.details)
    const details = col(anchor, cols.details, cols.notes)
    const notesParts = [col(anchor, cols.notes, cols.amount)]
    const contSource: string[] = []
    let time: string | undefined

    let j = i + 1
    while (j < lines.length) {
      const line = lines[j]
      if (!line.trim()) break
      if (isAnchor(line, cols)) break
      // The transaction time sits in the date column on the first continuation
      // line. Subsequent continuation lines have empty space there.
      if (j === i + 1) {
        const t = col(line, cols.date, cols.source).match(/^\d{1,2}:\d{2}$/)
        if (t) time = t[0]
      }
      // continuation line: pull its source-col text and any notes-col text
      const s = col(line, cols.source, cols.details)
      if (s) contSource.push(s)
      const n = col(line, cols.notes, cols.amount)
      if (n) notesParts.push(n)
      j++
    }

    const description = [sourceName, details].filter(Boolean).join(' ').trim()
    const note = notesParts.filter(Boolean).join(' ').trim()
    const counterparty = parseCounterparty(contSource)
    if (counterparty && !counterparty.name) counterparty.name = sourceName

    candidates.push({
      date,
      time,
      rawDate: col(anchor, cols.date, cols.source),
      amount,
      direction,
      description: note ? `${description} — ${note}` : description,
      rawText: anchor,
      counterparty,
    })

    i = j
  }

  return candidates
}
