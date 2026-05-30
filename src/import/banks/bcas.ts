import type { ParsedDoc } from '../parse-pdf'
import type { Candidate, DetectedCounterparty } from '../import-types'
import { parseAmountIDR } from './util'

// BCA Syariah ("Tahapan iB") statement adapter.
//
// Layout (single-line records, columns drift between pages so we parse by
// the trailing-three-amounts pattern instead of fixed positions):
//
//   Tanggal | Keterangan Transaksi | Debit | Kredit | Saldo
//   dd/mm     <description>          NNN,NN  NNN,NN  NNN,NN
//
// Dates carry no year, so we read it from the "Periode" line in the header.

const HEADER_RE = /Tanggal\s+Keterangan\s+Transaksi\s+Debit\s+Kredit\s+Saldo/

// One transaction = date + description + three trailing IDR amounts.
const TX_RE =
  /^\s*(\d{2})\/(\d{2})\s+(.+?)\s+(\d{1,3}(?:\.\d{3})*,\d{2})\s+(\d{1,3}(?:\.\d{3})*,\d{2})\s+(\d{1,3}(?:\.\d{3})*,\d{2})\s*$/

// Counterparty patterns within "Keterangan Transaksi".
const MBSTRF_RE =
  /MBSTRF\s+(\d{6,})\s*\(([^)]+)\)\s+to\s+(\d{6,})\s*\(([^)]+)\)/i
const TRFBCA_RE = /TRFBCA\s*-\s*(\d{6,})\s*-\s*\(?\s*([A-Z .'-]+?)\s*\)?\s*(?:-|$)/i
const BIFIN_RE = /BIF\s+IN\s*-\s*([A-Z0-9]{4,12})\s*-\s*([^-]+?)\s*(?:-|$)/i
// "NAME-<8+ digits>-<3+ digits>" — informal incoming wire.
const PIPE_RE = /^([A-Z][A-Z .'-]+?)-(\d{6,})-\d+/

const PERIOD_YEAR_RE = /Periode[\s:]+\S+\s+(\d{4})/i

function parsePeriodYear(text: string): number {
  const m = text.slice(0, 4000).match(PERIOD_YEAR_RE)
  return m ? Number(m[1]) : new Date().getFullYear()
}

function parseCounterparty(
  detail: string,
  direction: Candidate['direction'],
): DetectedCounterparty | undefined {
  const m1 = detail.match(MBSTRF_RE)
  if (m1) {
    // "<from acct>(<from name>) to <to acct>(<to name>)"
    const [, acct1, name1, acct2, name2] = m1
    if (direction === 'credit') {
      return { bank: 'BCA Syariah', name: name1.trim(), accountNumber: acct1 }
    }
    if (direction === 'debit') {
      return { bank: 'BCA Syariah', name: name2.trim(), accountNumber: acct2 }
    }
    return { bank: 'BCA Syariah', name: name1.trim(), accountNumber: acct1 }
  }
  const m2 = detail.match(TRFBCA_RE)
  if (m2) {
    return { bank: 'BCA', name: m2[2].trim(), accountNumber: m2[1] }
  }
  const m3 = detail.match(BIFIN_RE)
  if (m3) {
    return { bank: m3[1].toUpperCase(), name: m3[2].trim() }
  }
  const m4 = detail.match(PIPE_RE)
  if (m4) {
    return { name: m4[1].trim(), accountNumber: m4[2] }
  }
  return undefined
}

export function extractBcas(parsed: ParsedDoc): Candidate[] {
  const text = parsed.text
  const lines = text.split('\n')
  const headerIdx = lines.findIndex((l) => HEADER_RE.test(l))
  if (headerIdx === -1) return []

  const year = parsePeriodYear(text)
  const candidates: Candidate[] = []

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const raw = lines[i]
    if (!raw.trim()) continue
    const m = raw.match(TX_RE)
    if (!m) continue

    const [, dd, mm, detail, debitStr, kreditStr] = m
    const debit = parseAmountIDR(debitStr)
    const kredit = parseAmountIDR(kreditStr)

    let direction: Candidate['direction'] = 'unknown'
    let amount = 0
    if (debit > 0 && kredit === 0) {
      direction = 'debit'
      amount = debit
    } else if (kredit > 0 && debit === 0) {
      direction = 'credit'
      amount = kredit
    } else if (debit === 0 && kredit === 0) {
      // Skip zero-amount rows (carry-forward / page noise).
      continue
    } else {
      amount = Math.max(debit, kredit)
    }

    const description = detail.trim()
    const counterparty = parseCounterparty(description, direction)

    candidates.push({
      date: `${year}-${mm}-${dd}`,
      rawDate: `${dd}/${mm}`,
      amount,
      direction,
      description,
      rawText: raw.trim(),
      counterparty,
    })
  }

  return candidates
}
