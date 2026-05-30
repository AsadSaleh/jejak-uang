import {
  eachDayOfInterval,
  endOfMonth,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
} from 'date-fns'
import type { Entry } from '../dal/types'

export type PresetKey = '7d' | '30d' | '90d' | 'ytd' | 'all'

export type Period =
  | { kind: 'preset'; key: PresetKey }
  | { kind: 'month'; year: number; month: number } // month: 1-12

export interface PresetOption {
  key: PresetKey
  label: string
}

export const PRESETS: PresetOption[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'ytd', label: 'Year to date' },
  { key: 'all', label: 'All time' },
]

const PRESET_LABEL = Object.fromEntries(
  PRESETS.map((p) => [p.key, p.label]),
) as Record<PresetKey, string>

export function periodLabel(p: Period): string {
  if (p.kind === 'preset') return PRESET_LABEL[p.key]
  return format(new Date(p.year, p.month - 1, 1), 'LLLL yyyy')
}

export function periodToValue(p: Period): string {
  return p.kind === 'preset'
    ? `p:${p.key}`
    : `m:${p.year}-${String(p.month).padStart(2, '0')}`
}

export function valueToPeriod(v: string): Period {
  if (v.startsWith('p:')) return { kind: 'preset', key: v.slice(2) as PresetKey }
  const m = v.match(/^m:(\d{4})-(\d{2})$/)
  if (m) return { kind: 'month', year: Number(m[1]), month: Number(m[2]) }
  return { kind: 'preset', key: '30d' }
}

export function periodRange(period: Period, today = new Date()): {
  from: Date
  to: Date
} {
  if (period.kind === 'month') {
    const ref = new Date(period.year, period.month - 1, 1)
    return { from: startOfMonth(ref), to: endOfMonth(ref) }
  }
  const to = startOfDay(today)
  switch (period.key) {
    case '7d': {
      const from = new Date(to)
      from.setDate(from.getDate() - 6)
      return { from, to }
    }
    case '30d': {
      const from = new Date(to)
      from.setDate(from.getDate() - 29)
      return { from, to }
    }
    case '90d': {
      const from = new Date(to)
      from.setDate(from.getDate() - 89)
      return { from, to }
    }
    case 'ytd': {
      const from = new Date(to.getFullYear(), 0, 1)
      return { from, to }
    }
    case 'all':
    default:
      return { from: new Date(0), to }
  }
}

export function filterEntriesByPeriod(
  entries: Entry[],
  period: Period,
  today = new Date(),
): Entry[] {
  const { from, to } = periodRange(period, today)
  const fromIso = format(from, 'yyyy-MM-dd')
  const toIso = format(to, 'yyyy-MM-dd')
  return entries.filter((e) => e.date >= fromIso && e.date <= toIso)
}

export interface Totals {
  income: number
  expense: number
  net: number
}

export function totals(entries: Entry[]): Totals {
  let income = 0
  let expense = 0
  for (const e of entries) {
    if (e.type === 'income') income += e.amount
    else if (e.type === 'expense') expense += e.amount
  }
  return { income, expense, net: income - expense }
}

export interface DailyPoint {
  date: string
  label: string
  income: number
  expense: number
  cumulativeIncome: number
  cumulativeExpense: number
  cumulativeNet: number
}

export function buildDailySeries(
  entries: Entry[],
  period: Period,
  today = new Date(),
): DailyPoint[] {
  let from: Date
  let to: Date
  if (period.kind === 'preset' && period.key === 'all') {
    if (entries.length === 0) return []
    const dates = entries.map((e) => parseISO(e.date)).sort((a, b) => +a - +b)
    from = dates[0]
    to = startOfDay(today)
  } else {
    const range = periodRange(period, today)
    from = range.from
    to = range.to
  }

  const days = eachDayOfInterval({ start: from, end: to })
  const byDay = new Map<string, { income: number; expense: number }>()
  for (const e of entries) {
    if (e.date < format(from, 'yyyy-MM-dd') || e.date > format(to, 'yyyy-MM-dd')) continue
    if (e.type !== 'income' && e.type !== 'expense') continue
    const cur = byDay.get(e.date) ?? { income: 0, expense: 0 }
    if (e.type === 'income') cur.income += e.amount
    else cur.expense += e.amount
    byDay.set(e.date, cur)
  }

  let cumIn = 0
  let cumOut = 0
  const showShort = days.length <= 31
  return days.map((d) => {
    const key = format(d, 'yyyy-MM-dd')
    const day = byDay.get(key) ?? { income: 0, expense: 0 }
    cumIn += day.income
    cumOut += day.expense
    return {
      date: key,
      label: format(d, showShort ? 'MMM d' : 'MMM d'),
      income: day.income,
      expense: day.expense,
      cumulativeIncome: round2(cumIn),
      cumulativeExpense: round2(cumOut),
      cumulativeNet: round2(cumIn - cumOut),
    }
  })
}

export interface CategoryTotal {
  category: string
  total: number
  share: number
  count: number
}

export function expenseByCategory(entries: Entry[]): CategoryTotal[] {
  const byCat = new Map<string, { total: number; count: number }>()
  let grand = 0
  for (const e of entries) {
    if (e.type !== 'expense') continue
    const cur = byCat.get(e.category) ?? { total: 0, count: 0 }
    cur.total += e.amount
    cur.count += 1
    byCat.set(e.category, cur)
    grand += e.amount
  }
  const rows: CategoryTotal[] = []
  for (const [category, v] of byCat) {
    rows.push({
      category,
      total: round2(v.total),
      share: grand > 0 ? v.total / grand : 0,
      count: v.count,
    })
  }
  return rows.sort((a, b) => b.total - a.total)
}

export interface MonthlyPoint {
  ym: string // 'YYYY-MM'
  label: string // 'Dec 2025'
  income: number
  expense: number
  net: number
}

// Per-month income vs expense. Always derives months from the entries
// themselves (not the period filter), so the chart shows a stable history.
export function monthlyAggregate(entries: Entry[]): MonthlyPoint[] {
  const map = new Map<string, { income: number; expense: number }>()
  for (const e of entries) {
    if (e.type !== 'income' && e.type !== 'expense') continue
    const ym = e.date.slice(0, 7)
    const cur = map.get(ym) ?? { income: 0, expense: 0 }
    if (e.type === 'income') cur.income += e.amount
    else cur.expense += e.amount
    map.set(ym, cur)
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([ym, v]) => ({
      ym,
      label: format(parseISO(`${ym}-01`), 'MMM yyyy'),
      income: round2(v.income),
      expense: round2(v.expense),
      net: round2(v.income - v.expense),
    }))
}

export interface DayOfWeekPoint {
  dow: number // 0=Mon..6=Sun
  label: string // 'Mon'
  total: number
  count: number
  average: number
}

const DOW_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Average expense per day-of-week occurrence over the filtered range.
export function dayOfWeekExpense(entries: Entry[]): DayOfWeekPoint[] {
  const buckets: DayOfWeekPoint[] = DOW_LABELS.map((label, dow) => ({
    dow,
    label,
    total: 0,
    count: 0,
    average: 0,
  }))
  // Track unique dates per bucket so we average over actual occurrences.
  const datesSeen: Set<string>[] = DOW_LABELS.map(() => new Set())
  for (const e of entries) {
    if (e.type !== 'expense') continue
    const d = parseISO(e.date)
    const dow = (d.getDay() + 6) % 7 // Mon=0..Sun=6
    buckets[dow].total += e.amount
    datesSeen[dow].add(e.date)
  }
  for (let i = 0; i < buckets.length; i++) {
    buckets[i].count = datesSeen[i].size
    buckets[i].average =
      buckets[i].count > 0 ? round2(buckets[i].total / buckets[i].count) : 0
  }
  return buckets
}

export interface MonthOption {
  year: number
  month: number
  value: string // 'YYYY-MM'
  label: string // 'Dec 2025'
  count: number
}

// Months present in the data, newest first, with counts.
export function availableMonths(entries: Entry[]): MonthOption[] {
  const counts = new Map<string, number>()
  for (const e of entries) {
    const ym = e.date.slice(0, 7)
    counts.set(ym, (counts.get(ym) ?? 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([ym, count]) => {
      const [y, m] = ym.split('-').map(Number)
      return {
        year: y,
        month: m,
        value: ym,
        label: format(new Date(y, m - 1, 1), 'MMM yyyy'),
        count,
      }
    })
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}
