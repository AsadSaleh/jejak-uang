export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ID', {
    style: 'currency',
    currency: 'IDR',
    // Rupiah is effectively a whole-number currency, so drop the trailing ",00".
    // Real sen (e.g. a 100.896,96 balance) is still shown when present.
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Compact Indonesian rupiah for chart axes, where full grouped amounts overlap.
// 600000 -> "Rp 600rb", 1560000 -> "Rp 1,6jt", 15576000 -> "Rp 15,6jt".
export function formatCompactIDR(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  const abs = Math.abs(amount)
  const fmt = (n: number, suffix: string) =>
    `${sign}Rp ${(Math.round(n * 10) / 10).toString().replace('.', ',')}${suffix}`
  if (abs >= 1_000_000_000) return fmt(abs / 1_000_000_000, 'M')
  if (abs >= 1_000_000) return fmt(abs / 1_000_000, 'jt')
  if (abs >= 1_000) return fmt(abs / 1_000, 'rb')
  return `${sign}Rp ${abs}`
}

export function formatDate(iso: string, locale: 'en' | 'id' = 'en'): string {
  const d = new Date(iso)
  return d.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function todayISO(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
