import { NumericFormat } from 'react-number-format'
import type { Account, EntryType } from '../dal/types'
import { DEFAULT_CATEGORIES, isTransfer } from '../dal/types'
import type { ReviewRow } from '../import/import-types'
import { CategoryBadge } from './CategoryBadge'
import { TypeBadge } from './TypeBadge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from './ui/select'

interface ReviewTableProps {
  rows: ReviewRow[]
  accounts: Account[]
  onChange: (rowId: string, patch: Partial<ReviewRow>) => void
}

const TYPE_ORDER: EntryType[] = [
  'income',
  'expense',
  'transfer_internal',
  'transfer_external',
]

const cellInput =
  'w-full rounded border-0 bg-white px-2 py-1 text-sm ring-1 ring-inset ring-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900'

export function ReviewTable({ rows, accounts, onChange }: ReviewTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
            <th className="px-3 py-3">Import</th>
            <th className="px-3 py-3">Date</th>
            <th className="px-3 py-3">Type</th>
            <th className="px-3 py-3">Category</th>
            <th className="px-3 py-3 min-w-[16rem]">Note / accounts</th>
            <th className="px-3 py-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr
              key={row.rowId}
              className={`align-top ${
                !row.include
                  ? 'opacity-40'
                  : row.needsReview
                    ? 'bg-amber-50'
                    : ''
              }`}
            >
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={row.include}
                    onChange={(e) =>
                      onChange(row.rowId, { include: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {row.needsReview && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      review
                    </span>
                  )}
                </div>
              </td>

              <td className="px-3 py-2">
                <input
                  type="date"
                  value={row.date}
                  onChange={(e) => onChange(row.rowId, { date: e.target.value })}
                  className={cellInput}
                />
              </td>

              <td className="px-3 py-2">
                <Select
                  value={row.type}
                  onValueChange={(v) => {
                    const type = v as EntryType
                    onChange(row.rowId, {
                      type,
                      category: DEFAULT_CATEGORIES[type][0],
                    })
                  }}
                >
                  <SelectTrigger className="h-8 px-2">
                    <TypeBadge type={row.type} />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_ORDER.map((t) => (
                      <SelectItem key={t} value={t}>
                        <TypeBadge type={t} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>

              <td className="px-3 py-2">
                <Select
                  value={row.category}
                  onValueChange={(v) =>
                    onChange(row.rowId, { category: v })
                  }
                >
                  <SelectTrigger className="h-8 px-2">
                    <CategoryBadge category={row.category} />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_CATEGORIES[row.type].map((c) => (
                      <SelectItem key={c} value={c}>
                        <CategoryBadge category={c} />
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </td>

              <td className="px-3 py-2">
                <input
                  type="text"
                  value={row.note}
                  onChange={(e) => onChange(row.rowId, { note: e.target.value })}
                  className={cellInput}
                />
                {isTransfer(row.type) ? (
                  <div className="mt-1 flex gap-1">
                    <AccountSelect
                      accounts={accounts}
                      value={row.fromAccountId ?? ''}
                      placeholder="From…"
                      onChange={(v) =>
                        onChange(row.rowId, { fromAccountId: v || undefined })
                      }
                    />
                    <span className="self-center text-slate-400">→</span>
                    <AccountSelect
                      accounts={accounts}
                      value={row.toAccountId ?? ''}
                      placeholder="To…"
                      onChange={(v) =>
                        onChange(row.rowId, { toAccountId: v || undefined })
                      }
                    />
                  </div>
                ) : (
                  accounts.length > 0 && (
                    <div className="mt-1">
                      <AccountSelect
                        accounts={accounts}
                        value={row.accountId ?? ''}
                        placeholder="Account (optional)…"
                        onChange={(v) =>
                          onChange(row.rowId, { accountId: v || undefined })
                        }
                      />
                    </div>
                  )
                )}
              </td>

              <td className="px-3 py-2 text-right">
                <NumericFormat
                  value={row.amount || ''}
                  prefix="Rp "
                  thousandSeparator="."
                  decimalSeparator=","
                  decimalScale={2}
                  allowNegative={false}
                  inputMode="decimal"
                  onValueChange={(values) =>
                    onChange(row.rowId, { amount: values.floatValue ?? 0 })
                  }
                  className={`${cellInput} text-right tabular-nums`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function AccountSelect({
  accounts,
  value,
  placeholder,
  onChange,
}: {
  accounts: Account[]
  value: string
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border-0 bg-white px-2 py-1 text-xs ring-1 ring-inset ring-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
    >
      <option value="">{placeholder}</option>
      {accounts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.bank} — {a.label}
        </option>
      ))}
    </select>
  )
}
