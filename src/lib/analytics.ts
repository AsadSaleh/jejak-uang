import { eachDayOfInterval, format, parseISO, startOfDay } from 'date-fns'
import type { Entry } from '../dal/types'

export type PeriodKey = '7d' | '30d' | '90d' | 'ytd' | 'all'

export interface Period {
  key: PeriodKey
  label: string
}

export const PERIODS: Period[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'ytd', label: 'Year to date' },
  { key: 'all', label: 'All time' },
]

export function periodRange(period: PeriodKey, today = new Date()): {
  from: Date
  to: Date
} {
  const to = startOfDay(today)
  switch (period) {
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
  period: PeriodKey,
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
    else expense += e.amount
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
  period: PeriodKey,
  today = new Date(),
): DailyPoint[] {
  let from: Date
  let to: Date
  if (period === 'all') {
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
}

export function expenseByCategory(entries: Entry[]): CategoryTotal[] {
  const totalsByCat = new Map<string, number>()
  let grand = 0
  for (const e of entries) {
    if (e.type !== 'expense') continue
    totalsByCat.set(e.category, (totalsByCat.get(e.category) ?? 0) + e.amount)
    grand += e.amount
  }
  const rows: CategoryTotal[] = []
  for (const [category, total] of totalsByCat) {
    rows.push({
      category,
      total: round2(total),
      share: grand > 0 ? total / grand : 0,
    })
  }
  return rows.sort((a, b) => b.total - a.total)
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}
