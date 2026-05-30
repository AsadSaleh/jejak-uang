import type { ParsedDoc } from '../parse-pdf'
import type { Candidate, DetectedCounterparty } from '../import-types'

// BCA (conventional, "REKENING TAHAPAN") statement adapter.
//
// Layout per record:
//   ANCHOR:    dd/mm  KETERANGAN  REFF                      MUTASI [DB]  SALDO?
//   CONT 1–4:                     recipient lines (amount restated, code, name, channel, …)
//
// BCA prints amounts in US format (thousands "," decimal ".") — opposite of
// BCAS/BSI's ID format — so we use a dedicated parser here.

const HEADER_RE = /TANGGAL\s+KETERANGAN.*MUTASI\s+SALDO/i
const PAGE_BREAK_RE =
  /(REKENING TAHAPAN|TANGGAL\s+KETERANGAN|BERSAMBUNG|SALDO AWAL|SALDO AKHIR|HALAMAN)/i

const DATE_RE = /^\s*(\d{2})\/(\d{2})\b/
const AMOUNT_RE = /(\d{1,3}(?:,\d{3})*\.\d{2})/g
const PERIOD_YEAR_RE = /PERIODE\s*:?\s*\S+\s+(\d{4})/i

function parseBcaAmount(token: string): number {
  return parseFloat(token.replace(/,/g, ''))
}

function parsePeriodYear(text: string): number {
  const m = text.slice(0, 4000).match(PERIOD_YEAR_RE)
  return m ? Number(m[1]) : new Date().getFullYear()
}

function isAnchor(line: string): boolean {
  return DATE_RE.test(line)
}

// Picks a name out of the continuation lines: typically the last ALL-CAPS
// alphabetic line (recipient name). Falls back to undefined.
function findName(lines: string[]): string | undefined {
  for (const raw of lines) {
    const t = raw.trim()
    if (!t || t === '-') continue
    // Skip lines that are pure digits (amount restatement, codes).
    if (/^\d+(\.\d+)?$/.test(t)) continue
    // Skip merchant-code lines that contain a slash.
    if (t.includes('/')) continue
    // Skip channel markers like "MyBCA" (mixed case).
    if (!/^[A-Z][A-Z .'-]*[A-Z]$/.test(t)) continue
    // Skip very short tokens that are likely codes (`451`, `542`, etc.).
    if (t.replace(/[^A-Z]/g, '').length < 3) continue
    return t
  }
  return undefined
}

function findCounterpartyNumber(lines: string[]): string | undefined {
  for (const raw of lines) {
    const t = raw.trim()
    if (!t) continue
    // Skip amount-restatement lines like "17675000.00" / "2500.00" — BCA
    // prints these on a continuation line right after the transfer amount.
    if (/^\d+\.\d{2}$/.test(t)) continue
    const m = t.match(/\b\d{8,}\b/)
    if (m) return m[0]
  }
  return undefined
}

export function extractBca(parsed: ParsedDoc): Candidate[] {
  const lines = parsed.text.split('\n')
  const headerIdx = lines.findIndex((l) => HEADER_RE.test(l))
  if (headerIdx === -1) return []

  const year = parsePeriodYear(parsed.text)
  const candidates: Candidate[] = []

  let i = headerIdx + 1
  while (i < lines.length) {
    const anchor = lines[i]
    if (!isAnchor(anchor)) {
      i++
      continue
    }
    const dateMatch = anchor.match(DATE_RE)!
    const dd = dateMatch[1]
    const mm = dateMatch[2]

    // SALDO AWAL is the opening-balance header row, not a transaction.
    if (/SALDO AWAL/i.test(anchor)) {
      i++
      continue
    }

    // Find all amounts on the anchor line; the LAST one is saldo (if present),
    // the second-to-last is mutasi. If only one amount is present, it's mutasi.
    const amounts = [...anchor.matchAll(AMOUNT_RE)]
    if (amounts.length === 0) {
      i++
      continue
    }
    // 'DB' marker sits between mutasi and saldo, so its absence means the row
    // is a credit. Check it relative to the mutasi position.
    const hasDb = /\sDB\b/.test(anchor)
    // Use the second-to-last amount as mutasi when saldo is present, else last.
    const mutasiToken =
      amounts.length >= 2
        ? amounts[amounts.length - 2][1]
        : amounts[amounts.length - 1][1]
    const amount = parseBcaAmount(mutasiToken)
    if (!Number.isFinite(amount) || amount <= 0) {
      i++
      continue
    }
    const direction: Candidate['direction'] = hasDb ? 'debit' : 'credit'

    // Extract keterangan: text between the date and the first amount, minus
    // trailing 'DB'.
    const afterDate = anchor.slice(dateMatch.index! + dateMatch[0].length)
    const firstAmtIdx = afterDate.search(AMOUNT_RE)
    const keterangan =
      (firstAmtIdx > 0 ? afterDate.slice(0, firstAmtIdx) : afterDate)
        .replace(/\s+DB\b.*$/, '')
        .trim()

    // Continuation lines: non-anchor, non-blank, until next anchor or page break.
    const contLines: string[] = []
    let j = i + 1
    while (j < lines.length && j - i < 8) {
      const line = lines[j]
      if (!line.trim()) {
        j++
        continue
      }
      if (isAnchor(line)) break
      if (PAGE_BREAK_RE.test(line)) break
      contLines.push(line.trim())
      j++
    }

    const name = findName(contLines)
    const accountNumber = findCounterpartyNumber(contLines)
    let counterparty: DetectedCounterparty | undefined
    if (name || accountNumber) {
      counterparty = { name, accountNumber }
    }

    const noteLines = contLines.filter((l) => {
      if (!l || l === '-') return false
      if (/^\d+(\.\d+)?$/.test(l)) return false
      return true
    })
    const description = [keterangan, ...noteLines]
      .filter(Boolean)
      .join(' — ')
      .trim()

    candidates.push({
      date: `${year}-${mm}-${dd}`,
      rawDate: `${dd}/${mm}`,
      amount,
      direction,
      description,
      rawText: anchor.trim(),
      counterparty,
    })

    i = j
  }

  return candidates
}
