import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
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
import { useEntries } from '../dal/use-entries'
import {
  buildDailySeries,
  expenseByCategory,
  filterEntriesByPeriod,
  PERIODS,
  totals,
  type PeriodKey,
} from '../lib/analytics'
import { formatCurrency } from '../lib/format'

export const Route = createFileRoute('/')({ component: Dashboard })

const PIE_COLORS = [
  '#0f172a',
  '#7c3aed',
  '#0891b2',
  '#059669',
  '#d97706',
  '#dc2626',
  '#db2777',
  '#65a30d',
  '#2563eb',
  '#9333ea',
]

function Dashboard() {
  const { entries, loading } = useEntries()
  const [period, setPeriod] = useState<PeriodKey>('30d')

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Overview of your income and expenses.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg bg-white p-1 ring-1 ring-slate-200">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              type="button"
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                period === p.key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-10 text-center text-slate-400 ring-1 ring-slate-200">
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

          <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-sm font-semibold text-slate-700">
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
                    tickFormatter={(v) => formatCurrency(v).replace('.00', '')}
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

          <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-3">
              <h2 className="text-sm font-semibold text-slate-700">
                Expense by category
              </h2>
              {byCategory.length === 0 ? (
                <div className="flex h-64 items-center justify-center text-sm text-slate-400">
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
                      >
                        {byCategory.map((row, i) => (
                          <Cell
                            key={row.category}
                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v) => formatCurrency(Number(v))}
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
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
              <h2 className="text-sm font-semibold text-slate-700">
                Top categories
              </h2>
              <ul className="mt-4 space-y-3">
                {byCategory.length === 0 ? (
                  <li className="text-sm text-slate-400">
                    No expenses in this period.
                  </li>
                ) : (
                  byCategory.slice(0, 6).map((row, i) => (
                    <li key={row.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor:
                                PIE_COLORS[i % PIE_COLORS.length],
                            }}
                          />
                          <span className="font-medium text-slate-700">
                            {row.category}
                          </span>
                        </div>
                        <span className="tabular-nums text-slate-900">
                          {formatCurrency(row.total)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(2, row.share * 100)}%`,
                            backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                          }}
                        />
                      </div>
                    </li>
                  ))
                )}
              </ul>
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
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
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
    <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-slate-200">
      <div className="text-3xl">📊</div>
      <h2 className="mt-3 text-lg font-semibold">No data to display yet</h2>
      <p className="mt-1 text-sm text-slate-500">
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
