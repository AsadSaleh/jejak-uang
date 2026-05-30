// Shared helpers used by bank-specific adapters.

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  agu: 8, agt: 8, okt: 10, des: 12, mei: 5,
}

const pad2 = (n: number) => String(n).padStart(2, '0')

// "08 Jul 2024" / "17 Apr 2026" -> ISO yyyy-mm-dd. Returns '' if unparseable.
export function parseIndoDate(s: string): string {
  const m = s.match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})/)
  if (!m) return ''
  const month = MONTHS[m[2].slice(0, 3).toLowerCase()]
  if (!month) return ''
  return `${m[3]}-${pad2(month)}-${pad2(+m[1])}`
}

// "39.500.000" / "2.500,00" -> 39500000 / 2500. Returns NaN on miss.
export function parseAmountIDR(token: string): number {
  const clean = token.replace(/[+\s]/g, '').replace(/^[-]/, '-')
  return parseFloat(clean.replace(/\./g, '').replace(',', '.'))
}

export function col(line: string, start: number, end: number | null): string {
  return (end === null ? line.slice(start) : line.slice(start, end)).trim()
}

// First contiguous digit run of length >= minLen, or null.
export function digitRun(text: string, minLen = 6): string | null {
  const m = text.match(new RegExp(`\\d{${minLen},}`))
  return m ? m[0] : null
}
