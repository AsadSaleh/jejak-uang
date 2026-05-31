import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from '../components/ui/select'
import { useEntries } from '../dal/use-entries'
import {
  availableMonths,
  buildDailySeries,
  dayOfWeekExpense,
  expenseByCategory,
  filterEntriesByPeriod,
  monthlyAggregate,
  PRESETS,
  periodLabel,
  periodToValue,
  totals,
  valueToPeriod,
  type Period,
} from '../lib/analytics'
import { formatCurrency } from '../lib/format'
import { hasOnboarded } from '../lib/app-data'

export const Route = createFileRoute('/')({ component: Dashboard })

// Mid-saturation Tailwind 500 palette — readable on both light (slate-50) and
// dark (slate-950) backgrounds. The previous palette led with slate-900, which
// disappeared into the card surface in dark mode.
const PIE_COLORS = [
  '#6366f1', // indigo-500
  '#06b6d4', // cyan-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#ec4899', // pink-500
  '#84cc16', // lime-500
  '#3b82f6', // blue-500
  '#a855f7', // purple-500
  '#f97316', // orange-500
]

function Dashboard() {
  const { entries, loading } = useEntries()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<Period>({ kind: 'preset', key: '30d' })

  // First run: a brand-new visitor with no data and who hasn't seen (or
  // skipped) the tour gets sent straight into onboarding.
  useEffect(() => {
    if (!loading && entries.length === 0 && !hasOnboarded()) {
      navigate({ to: '/onboarding' })
    }
  }, [loading, entries.length, navigate])

  const months = useMemo(() => availableMonths(entries), [entries])
  const filtered = useMemo(
    () => filterEntriesByPeriod(entries, period),
    [entries, period],
  )
  const t = useMemo(() => totals(filtered), [filtered])
  const series = useMemo(
    () => buildDailySeries(entries, period),
    [entries, period],
  )
  const byCategory = useMemo(() => expenseByCategory(filtered), [filtered])
  const monthly = useMemo(() => monthlyAggregate(entries), [entries])
  const dow = useMemo(() => dayOfWeekExpense(filtered), [filtered])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Overview of your income and expenses.
          </p>
        </div>
        <div className="w-full max-w-xs">
          <Select
            value={periodToValue(period)}
            onValueChange={(v) => setPeriod(valueToPeriod(v))}
          >
            <SelectTrigger>
              <span className="text-sm font-medium">{periodLabel(period)}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Range</SelectLabel>
                {PRESETS.map((p) => (
                  <SelectItem key={p.key} value={`p:${p.key}`}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectGroup>
              {months.length > 0 && (
                <>
                  <SelectSeparator />
                  <SelectGroup>
                    <SelectLabel>Month</SelectLabel>
                    {months.map((m) => (
                      <SelectItem key={m.value} value={`m:${m.value}`}>
                        <span className="flex w-full items-center justify-between gap-3">
                          <span>{m.label}</span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {m.count}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-10 text-center text-slate-400 dark:text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          Loading…
        </div>
      ) : entries.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard label="Income" value={t.income} tone="emerald" />
            <SummaryCard label="Expense" value={t.expense} tone="rose" />
            <SummaryCard label="Net" value={t.net} tone="slate" signed />
          </div>

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Cumulative income vs expense
            </h2>
            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={series}
                  margin={{ top: 10, right: 16, left: -8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    fontSize={11}
                    stroke="#94a3b8"
                    tickLine={false}
                    minTickGap={20}
                  />
                  <YAxis
                    fontSize={11}
                    stroke="#94a3b8"
                    tickLine={false}
                    tickFormatter={(v) => formatCurrency(Number(v)).replace('.00', '')}
                  />
                  <Tooltip
                    formatter={(v) => formatCurrency(Number(v))}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Area
                    type="monotone"
                    dataKey="cumulativeIncome"
                    name="Income"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#gIn)"
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulativeExpense"
                    name="Expense"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fill="url(#gOut)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {monthly.length >= 2 && (
            <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Monthly income vs expense
              </h2>
              <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                All months in your data — not affected by the period filter.
              </p>
              <div className="mt-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthly}
                    margin={{ top: 10, right: 16, left: -8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      fontSize={11}
                      stroke="#94a3b8"
                      tickLine={false}
                    />
                    <YAxis
                      fontSize={11}
                      stroke="#94a3b8"
                      tickLine={false}
                      tickFormatter={(v) =>
                        formatCurrency(Number(v)).replace('.00', '')
                      }
                    />
                    <Tooltip
                      formatter={(v) => formatCurrency(Number(v))}
                      contentStyle={{
                        borderRadius: 8,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 lg:col-span-3">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Expense by category
              </h2>
              {byCategory.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-slate-400 dark:text-slate-500">
                  No expenses in this period.
                </div>
              ) : (
                <div className="mt-4 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={byCategory}
                        dataKey="total"
                        nameKey="category"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={2}
                        // Start at 12 o'clock and render clockwise — the
                        // conventional "largest first" arrangement. Recharts'
                        // default (0° = 3 o'clock, counter-clockwise) buries
                        // the biggest slice on the right.
                        startAngle={90}
                        endAngle={-270}
                      >
                        {byCategory.map((row, i) => (
                          <Cell
                            key={row.category}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v, _name, item) => {
                          const count = (item?.payload as { count?: number } | undefined)?.count
                          const amount = formatCurrency(Number(v))
                          return count !== undefined
                            ? `${amount} (${count} ${count === 1 ? 'tx' : 'tx'})`
                            : amount
                        }}
                        contentStyle={{
                          borderRadius: 8,
                          border: '1px solid #e2e8f0',
                          fontSize: 12,
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 12 }}
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        // Recharts v3 reorders pie legend entries by slice
                        // angle even when an explicit `payload` is provided.
                        // Side-step the issue entirely by rendering our own
                        // list — order is then guaranteed to match byCategory
                        // (desc by total), same as the Top categories card.
                        content={() => (
                          <ul className="flex flex-col gap-1.5">
                            {byCategory.map((row, i) => (
                              <li
                                key={row.category}
                                className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200"
                              >
                                <span
                                  className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm"
                                  style={{
                                    backgroundColor:
                                      PIE_COLORS[i % PIE_COLORS.length],
                                  }}
                                />
                                <span>
                                  {row.category}{' '}
                                  <span className="text-slate-400 dark:text-slate-500">
                                    ({row.count})
                                  </span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 lg:col-span-2">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Top categories
              </h2>
              <ul className="mt-4 space-y-3">
                {byCategory.length === 0 ? (
                  <li className="text-sm text-slate-400 dark:text-slate-500">
                    No expenses in this period.
                  </li>
                ) : (
                  byCategory.slice(0, 6).map((row, i) => (
                    <li key={row.category}>
                      <Link
                        to="/entries"
                        search={{ category: row.category }}
                        className="group block space-y-1 rounded-md px-1 py-0.5 -mx-1 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        title={`Show ${row.count} ${row.category} ${row.count === 1 ? 'entry' : 'entries'}`}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  PIE_COLORS[i % PIE_COLORS.length],
                              }}
                            />
                            <span className="font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-200 dark:group-hover:text-white">
                              {row.category}
                            </span>
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              {row.count}
                            </span>
                          </div>
                          <span className="tabular-nums text-slate-900 dark:text-slate-100">
                            {formatCurrency(row.total)}
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(2, row.share * 100)}%`,
                              backgroundColor:
                                PIE_COLORS[i % PIE_COLORS.length],
                            }}
                          />
                        </div>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </section>

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Average daily expense by weekday
            </h2>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              Total expense for each weekday in this period, divided by the
              number of times that weekday occurred.
            </p>
            <div className="mt-4 h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dow}
                  margin={{ top: 10, right: 16, left: -8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" fontSize={11} stroke="#94a3b8" tickLine={false} />
                  <YAxis
                    fontSize={11}
                    stroke="#94a3b8"
                    tickLine={false}
                    tickFormatter={(v) =>
                      formatCurrency(Number(v)).replace('.00', '')
                    }
                  />
                  <Tooltip
                    formatter={(v) => formatCurrency(Number(v))}
                    contentStyle={{
                      borderRadius: 8,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="average"
                    name="Average"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function SummaryCard({
  label,
  value,
  tone,
  signed = false,
}: {
  label: string
  value: number
  tone: 'emerald' | 'rose' | 'slate'
  signed?: boolean
}) {
  const toneCls = {
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
    slate: value >= 0 ? 'text-emerald-600' : 'text-rose-600',
  }[tone]
  const sign = signed && value > 0 ? '+' : ''
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold tabular-nums ${toneCls}`}>
        {sign}
        {formatCurrency(value)}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-xl bg-white p-12 text-center dark:bg-slate-900 shadow-sm ring-1 ring-slate-200">
      <div className="text-3xl">📊</div>
      <h2 className="mt-3 text-lg font-semibold">No data to display yet</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Add a few entries to start seeing your dashboard come to life.
      </p>
      <Link
        to="/entries"
        className="mt-4 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        Add your first entry
      </Link>
    </div>
  )
}
