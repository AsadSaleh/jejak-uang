// Detects the account number a statement belongs to by scanning its header
// region (everything before the transaction table). Statements print the owning
// account near the holder name / a "rekening"/product label.

const TABLE_HEADER_RE =
  /(date\s*&\s*time|tanggal|transaction details|detail transaksi|source\/destination)/i

// Statement-metadata lines that also carry a "tanggal"/date word but are NOT the
// transaction-table header — e.g. BRI's "Tanggal Laporan / Statement Date" and
// "Periode Transaksi" sit *above* the account number, so breaking on them would
// stop the header scan before it ever reaches "No. Rekening".
const META_DATE_RE = /laporan|statement date|periode|period/i

const ACCOUNT_KEYWORDS =
  /(rekening|account|wadiah|giro|tabungan|pocket|savings|a\/?c\b|no\.?\s*rek)/i

// Contiguous 8–20 digit run. Grouped amounts (45.363.795,11) and dates never
// produce a run this long, so they are naturally excluded.
const DIGIT_RUN = /\d{8,20}/g

export interface DetectedAccount {
  number: string
  context: string
}

export function detectStatementAccount(
  docText: string,
): DetectedAccount | null {
  const header: string[] = []
  for (const raw of docText.split('\n')) {
    if (TABLE_HEADER_RE.test(raw) && !META_DATE_RE.test(raw)) break
    header.push(raw)
    if (header.length >= 25) break
  }

  let fallback: DetectedAccount | null = null
  for (const line of header) {
    const runs = line.match(DIGIT_RUN)
    if (!runs) continue
    const candidate: DetectedAccount = { number: runs[0], context: line.trim() }
    // A digit run on a line with an account keyword is a strong signal.
    if (ACCOUNT_KEYWORDS.test(line)) return candidate
    if (!fallback) fallback = candidate
  }
  return fallback
}
