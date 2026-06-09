import { useEffect, useRef, useState } from 'react'
import { format, parseISO } from 'date-fns'
import type { Locale as DateFnsLocale } from 'date-fns'
import { useI18n } from '../i18n/I18nProvider'
import { formatCurrency } from '../lib/format'

interface Day {
  date: string
  expense: number
}

interface CalendarHeatmapProps {
  data: Day[]
  dfLocale?: DateFnsLocale
}

// Expense-intensity classes, light → dark. Index 0 is "no spend". Rose scale to
// match the expense colour used elsewhere on the dashboard.
const LEVEL_CLASSES = [
  'bg-slate-100 dark:bg-slate-800',
  'bg-rose-200 dark:bg-rose-900/60',
  'bg-rose-300 dark:bg-rose-800/80',
  'bg-rose-400 dark:bg-rose-600',
  'bg-rose-500 dark:bg-rose-500',
]

// Monday-first weekday index (matches the weekday chart).
const dowMon = (d: Date) => (d.getDay() + 6) % 7

interface Hover {
  x: number
  y: number
  day: Day
}

// Wait a beat before showing the tooltip so it doesn't flash on every cell the
// pointer happens to cross.
const HOVER_DELAY = 400

// GitHub-style contribution calendar of daily expense. Weeks are columns,
// weekdays (Mon→Sun) are rows; cell shade scales with how much was spent that
// day, bucketed by quartiles of the non-zero days so a few big days don't wash
// everything else out.
export function CalendarHeatmap({ data, dfLocale }: CalendarHeatmapProps) {
  const { t, locale } = useI18n()
  const [hover, setHover] = useState<Hover | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showAfterDelay = (x: number, y: number, day: Day) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setHover({ x, y, day }), HOVER_DELAY)
  }
  const cancelHover = () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    setHover(null)
  }
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  // Quartile thresholds over non-zero days for a balanced colour spread.
  const sorted = data
    .map((d) => d.expense)
    .filter((v) => v > 0)
    .sort((a, b) => a - b)
  const q = (p: number) =>
    sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))] : 0
  const t1 = q(0.25)
  const t2 = q(0.5)
  const t3 = q(0.75)
  const level = (v: number) =>
    v <= 0 ? 0 : v <= t1 ? 1 : v <= t2 ? 2 : v <= t3 ? 3 : 4

  // Bucket the days into week columns; pad the first week so the first day
  // lands on its real weekday row.
  const weeks: (Day | null)[][] = []
  let col: (Day | null)[] = new Array(7).fill(null)
  data.forEach((day, i) => {
    const dow = dowMon(parseISO(day.date))
    if (dow === 0 && i !== 0) {
      weeks.push(col)
      col = new Array(7).fill(null)
    }
    col[dow] = day
  })
  if (col.some(Boolean)) weeks.push(col)

  // Month label above the column where a new month first appears.
  const monthLabel = (week: (Day | null)[], i: number): string => {
    const first = week.find(Boolean)
    if (!first) return ''
    const m = format(parseISO(first.date), 'MMM', { locale: dfLocale })
    const prev = weeks[i - 1]?.find(Boolean)
    const prevM = prev ? format(parseISO(prev.date), 'MMM', { locale: dfLocale }) : ''
    return m === prevM ? '' : m
  }

  return (
    <>
      <div className="overflow-x-auto pb-1">
        <div className="inline-flex flex-col gap-1">
          <div className="flex gap-1">
            {weeks.map((week, i) => (
              <div
                key={i}
                className="h-3 w-3.5 text-[9px] leading-3 text-slate-400 dark:text-slate-500"
              >
                <span className="whitespace-nowrap">{monthLabel(week, i)}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) =>
                  day ? (
                    <div
                      key={day.date}
                      onMouseEnter={(e) =>
                        showAfterDelay(e.clientX, e.clientY, day)
                      }
                      onMouseLeave={cancelHover}
                      className={`h-3.5 w-3.5 rounded-[3px] ${LEVEL_CLASSES[level(day.expense)]}`}
                    />
                  ) : (
                    <div key={di} className="h-3.5 w-3.5" />
                  ),
                )}
              </div>
            ))}
          </div>
          <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
            <span>{locale === 'id' ? 'Sedikit' : 'Less'}</span>
            {LEVEL_CLASSES.map((cls, i) => (
              <span key={i} className={`h-3 w-3 rounded-[3px] ${cls}`} />
            ))}
            <span>{locale === 'id' ? 'Banyak' : 'More'}</span>
          </div>
        </div>
      </div>

      {hover && (
        <div
          className="pointer-events-none fixed z-50 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs text-slate-50 shadow-lg dark:bg-slate-700"
          style={{
            top: hover.y,
            left: hover.x,
            transform: 'translate(-50%, calc(-100% - 10px))',
          }}
        >
          <div className="font-medium">
            {format(parseISO(hover.day.date), 'EEEE, d MMM yyyy', {
              locale: dfLocale,
            })}
          </div>
          <div className="text-slate-300">
            {hover.day.expense > 0
              ? formatCurrency(hover.day.expense)
              : t('dashboard.calendarNoSpend')}
          </div>
        </div>
      )}
    </>
  )
}
