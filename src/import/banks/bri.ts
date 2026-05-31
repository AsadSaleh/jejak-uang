import type { ParsedDoc } from '../parse-pdf'
import type { Candidate } from '../import-types'

// BRI "LAPORAN TRANSAKSI FINANSIAL" (BRImo e-statement) adapter.
//
// Column layout (from the table header):
//   Tanggal Transaksi | Uraian Transaksi | Teller/User ID | Debet | Kredit | Saldo
//
// Notable quirks vs the other Indonesian banks:
//   * Amounts are US-formatted — "3,420,000.00" (comma thousands, dot decimals).
//   * Each row carries all three money columns; the inactive side prints "0.00".
//   * The date column is "DD/MM/YY HH:MM:SS".
//   * A long description wraps onto continuation lines that carry no date.
//
// A record's anchor line begins with the date+time and ends with the three
// amounts (Debet, Kredit, Saldo), optionally preceded by a teller/user id.

// "01/05/26 10:19:09   <description …>" — captures date, HH:MM, and the rest.
const ANCHOR_RE = /^\s*(\d{2}\/\d{2}\/\d{2})\s+(\d{2}:\d{2}):\d{2}\s+(.*\S)\s*$/

// Trailing block of the anchor line: optional teller id, then Debet, Kredit,
// Saldo. Anchored to end-of-line so only the real money columns match — any
// digits inside the description (account/phone numbers) lack the ".dd" decimal.
const TAIL_RE =
  /(?:\s{2,}(\d{4,}))?\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*$/

// Lines that look like page furniture rather than a wrapped description.
const CONT_NOISE_RE =
  /LAPORAN TRANSAKSI|STATEMENT OF FINANCIAL|Halaman|Page\b|Created By|Tanggal Transaksi|Transaction Date|Saldo Awal|Saldo Akhir|Bersambung/i

// "3,420,000.00" -> 3420000
function parseAmountUS(token: string): number {
  return parseFloat(token.replace(/,/g, ''))
}

// "01/05/26" (DD/MM/YY) -> "2026-05-01". Returns '' if unparseable.
function parseSlashDate(s: string): string {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{2})$/)
  if (!m) return ''
  return `20${m[3]}-${m[2]}-${m[1]}`
}

export function extractBri(parsed: ParsedDoc): Candidate[] {
  const lines = parsed.text.split('\n')
  const candidates: Candidate[] = []

  for (let i = 0; i < lines.length; i++) {
    const anchor = lines[i].match(ANCHOR_RE)
    if (!anchor) continue

    const [, rawDate, time, rest] = anchor
    const tail = rest.match(TAIL_RE)
    if (!tail || tail.index === undefined) continue // header row / not a txn

    const debit = parseAmountUS(tail[2])
    const credit = parseAmountUS(tail[3])
    if (!(debit > 0) && !(credit > 0)) continue // zero-value noise

    const direction: Candidate['direction'] =
      debit > 0 ? 'debit' : credit > 0 ? 'credit' : 'unknown'
    const amount = debit > 0 ? debit : credit

    // Description is everything left of the teller/amount block, plus any
    // continuation lines (the wrapped tail of a long description).
    const parts = [rest.slice(0, tail.index).trim()]
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j]
      if (!next.trim()) break // blank line separates records
      if (ANCHOR_RE.test(next)) break // next record
      if (CONT_NOISE_RE.test(next)) break // page header/footer
      parts.push(next.trim())
    }

    candidates.push({
      date: parseSlashDate(rawDate),
      time,
      rawDate,
      amount,
      direction,
      description: parts.filter(Boolean).join(' '),
      rawText: lines[i],
    })
  }

  return candidates
}
