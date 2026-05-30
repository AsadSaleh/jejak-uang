import { useMemo } from 'react'
import { Check, UserRound } from 'lucide-react'
import type { Account } from '../dal/types'
import { findAccountByNumber } from '../import/account-match'
import type { DetectedCounterparty, ReviewRow } from '../import/import-types'
import { Badge } from './ui/badge'

interface AggregatedCp extends DetectedCounterparty {
  key: string
  count: number
  registered: Account | null
}

interface Props {
  rows: ReviewRow[]
  accounts: Account[]
  onRegister: (cp: DetectedCounterparty) => Promise<void> | void
}

function aggregate(rows: ReviewRow[], accounts: Account[]): AggregatedCp[] {
  const map = new Map<string, AggregatedCp>()
  for (const r of rows) {
    const cp = r.counterparty
    if (!cp || (!cp.accountNumber && !cp.name)) continue
    const key = cp.accountNumber ?? `${cp.bank ?? ''}|${cp.name ?? ''}`
    const existing = map.get(key)
    if (existing) {
      existing.count++
    } else {
      const registered = cp.accountNumber
        ? findAccountByNumber(cp.accountNumber, accounts)
        : null
      map.set(key, { ...cp, key, count: 1, registered })
    }
  }
  // Sort: not-yet-registered first, then by transaction count desc.
  return [...map.values()].sort((a, b) => {
    if ((a.registered ? 1 : 0) !== (b.registered ? 1 : 0)) {
      return a.registered ? 1 : -1
    }
    return b.count - a.count
  })
}

export function DetectedAccountsPanel({ rows, accounts, onRegister }: Props) {
  const items = useMemo(() => aggregate(rows, accounts), [rows, accounts])
  if (items.length === 0) return null

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          Detected counterparties ({items.length})
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Register one as your own account to flip matching rows to{' '}
          <span className="font-medium">External transfer</span>.
        </p>
      </header>
      <ul className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between gap-3 py-2.5"
          >
            <div className="flex min-w-0 items-center gap-3">
              <UserRound className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {item.bank && (
                    <Badge variant="outline" className="text-[10px]">
                      {item.bank}
                    </Badge>
                  )}
                  <span className="truncate text-sm font-medium text-slate-800">
                    {item.name ?? '(unnamed)'}
                  </span>
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {item.accountNumber ? (
                    <span className="font-mono">{item.accountNumber}</span>
                  ) : (
                    <span className="italic text-slate-400 dark:text-slate-500">
                      no account number
                    </span>
                  )}
                  <span>·</span>
                  <span>
                    {item.count}{' '}
                    {item.count === 1 ? 'transaction' : 'transactions'}
                  </span>
                </div>
              </div>
            </div>
            <div className="shrink-0">
              {item.registered ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                  <Check className="h-3.5 w-3.5" />
                  {item.registered.bank} — {item.registered.label}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => void onRegister(item)}
                  disabled={!item.accountNumber}
                  title={
                    item.accountNumber
                      ? 'Register as your own account'
                      : 'No account number detected — register manually if needed'
                  }
                  className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 dark:text-slate-500"
                >
                  Register as own
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
