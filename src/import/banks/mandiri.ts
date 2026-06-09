import type { Candidate } from '../import-types'
import type { ParsedDoc } from '../parse-pdf'
import { parseAmountIDR, parseIndoDate } from './util'

// Bank Mandiri e-Statement (Livin') adapter.
//
// Column layout (from the header):
//   No | Tanggal/Date | Keterangan/Remarks | Nominal (IDR) | Saldo (IDR)
//
// Records are separated by blank lines and span 2–4 lines. The "anchor" line is
// the one carrying the SIGNED Nominal amount (+ = credit, − = debit) and the
// running Saldo; it also holds the leading sequence number. Mandiri spreads the
// rest of the record around that anchor inconsistently — the date sometimes
// sits on a line above the anchor with the time on the anchor line, sometimes
// the reverse — and the Keterangan wraps over several lines. So rather than
// slice fixed columns, we collect the block's lines and pull each field by
// pattern: the signed amount fixes the direction, the first "dd Mmm yyyy" the
// date, the first "HH:MM(:SS) WIB" the time, and whatever text remains is the
// description.
//
// Non-transaction blocks are skipped for free: the summary box writes its signs
// detached ("+ 35.318.057,00", "- 35.319.056,00") and the opening/closing
// balances are unsigned, while page headers, footers, and the disclaimer carry
// no amounts at all — none of them contain a sign-adjacent amount, so they
// never look like an anchor.

// A signed transaction amount: "-1.000,00", "+34.771.806,00", "+15,00".
// The sign must sit flush against the digits so the summary box's "+ 35.…"
// (note the space) is not mistaken for a transaction.
const SIGNED_AMOUNT_RE = /([+-])(\d{1,3}(?:\.\d{3})*,\d{2})/
// Any IDR money token (Nominal or Saldo) — used to scrub the description.
const AMOUNT_TOKEN_RE = /[+-]?\d{1,3}(?:\.\d{3})*,\d{2}/g
// "01 Mar 2026" — the month is anchored to real abbreviations so a time zone
// like "…:27 WIB 0878…" can't masquerade as a "27 WIB 0878" date and eat the
// leading digits of the following reference number.
const DATE_TOKEN_RE =
  /\d{1,2}\s+(?:jan|feb|mar|apr|may|mei|jun|jul|aug|agu|agt|sep|oct|okt|nov|des|dec)[a-z]*\s+\d{4}/i
// "05:05:10 WIB" — seconds and zone optional; HH:MM is captured.
const TIME_TOKEN_RE = /(\d{1,2}:\d{2})(?::\d{2})?(?:\s*WIB)?/
const TIME_SCRUB_RE = /\d{1,2}:\d{2}(?::\d{2})?(?:\s*WIB)?/g

function isAnchor(line: string): boolean {
  return SIGNED_AMOUNT_RE.test(line)
}

// Strip the column noise (sequence No, date, time, Nominal, Saldo) from a line,
// leaving just its Keterangan fragment. The leading No only ever appears on the
// anchor line, so it is only stripped there.
function keteranganFragment(line: string, isAnchorLine: boolean): string {
  let s = line
  if (isAnchorLine) s = s.replace(/^\s*\d+\s+/, ' ')
  return s
    .replace(DATE_TOKEN_RE, ' ')
    .replace(TIME_SCRUB_RE, ' ')
    .replace(AMOUNT_TOKEN_RE, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function processBlock(block: string[], out: Candidate[]): void {
  const anchorIdx = block.findIndex(isAnchor)
  if (anchorIdx === -1) return // header / summary / footer / disclaimer

  const m = block[anchorIdx].match(SIGNED_AMOUNT_RE)
  if (!m) return
  const direction: Candidate['direction'] = m[1] === '+' ? 'credit' : 'debit'
  const amount = Math.abs(parseAmountIDR(m[2]))
  if (!amount) return

  // Date and time may live on any line of the block; take the first of each.
  let date = ''
  let time: string | undefined
  for (const line of block) {
    if (!date) {
      const dm = line.match(DATE_TOKEN_RE)
      if (dm) date = parseIndoDate(dm[0])
    }
    if (!time) {
      const tm = line.match(TIME_TOKEN_RE)
      if (tm) time = tm[1]
    }
  }

  const description = block
    .map((line, i) => keteranganFragment(line, i === anchorIdx))
    .filter(Boolean)
    .join(' ')

  out.push({
    date,
    time,
    rawDate: '',
    amount,
    direction,
    description,
    rawText: block.join(' / ').replace(/\s+/g, ' ').trim(),
  })
}

export function extractMandiri(parsed: ParsedDoc): Candidate[] {
  const text =
    parsed.text?.trim()
      ? parsed.text
      : parsed.pages.map((p) => p.text).join('\n')

  const candidates: Candidate[] = []
  let block: string[] = []
  const flush = () => {
    if (block.length) {
      processBlock(block, candidates)
      block = []
    }
  }
  for (const raw of text.split('\n')) {
    if (raw.trim() === '') flush()
    else block.push(raw)
  }
  flush()
  return candidates
}
