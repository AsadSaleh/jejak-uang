import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { CategoryBadge } from '../components/CategoryBadge'
import { EntryForm } from '../components/EntryForm'
import { TypeBadge } from '../components/TypeBadge'
import { useToast } from '../components/ToastProvider'
import { Badge } from '../components/ui/badge'
import { useEntries } from '../dal/use-entries'
import { useAccounts } from '../dal/use-accounts'
import type { Entry, EntryType } from '../dal/types'
import { isTransfer } from '../dal/types'
import { formatCurrency, formatDate } from '../lib/format'

export const Route = createFileRoute('/entries')({ component: EntriesPage })

function EntriesPage() {
  const { entries, loading, create, update, removeMany, restore } = useEntries()
  const { accounts } = useAccounts()
  const { addToast } = useToast()
  const [editing, setEditing] = useState<Entry | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const accountLabel = useMemo(() => {
    const map = new Map(accounts.map((a) => [a.id, `${a.bank} — ${a.label}`]))
    return (id?: string) => (id ? (map.get(id) ?? 'Unknown account') : '—')
  }, [accounts])

  const allSelected = entries.length > 0 && selected.size === entries.length

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(entries.map((e) => e.id)))
  }

  async function deleteEntries(toDelete: Entry[]) {
    if (toDelete.length === 0) return
    const ids = new Set(toDelete.map((e) => e.id))
    if (editing && ids.has(editing.id)) setEditing(null)
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of ids) next.delete(id)
      return next
    })
    await removeMany([...ids])
    addToast({
      message: `Deleted ${toDelete.length} ${toDelete.length === 1 ? 'entry' : 'entries'}`,
      onUndo: () => restore(toDelete),
    })
  }

  return (
    <div className="space-y-6 pb-28">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Entries</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add, edit, and delete income, expense, and transfer entries.
        </p>
      </div>

      <EntryForm
        key={editing?.id ?? 'new'}
        initial={editing}
        submitLabel={editing ? 'Update entry' : 'Add entry'}
        onCancel={editing ? () => setEditing(null) : undefined}
        onSubmit={async (input) => {
          if (editing) {
            await update(editing.id, input)
            setEditing(null)
          } else {
            await create(input)
          }
        }}
      />

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <Th className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all"
                  className="h-4 w-4 rounded border-slate-300"
                />
              </Th>
              <Th>Date</Th>
              <Th>Type</Th>
              <Th>Category</Th>
              <Th>Note</Th>
              <Th className="text-right">Amount</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  No entries yet. Add your first one above.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  className={`hover:bg-slate-50 ${
                    selected.has(entry.id)
                      ? 'bg-sky-50'
                      : editing?.id === entry.id
                        ? 'bg-amber-50'
                        : ''
                  }`}
                >
                  <Td>
                    <input
                      type="checkbox"
                      checked={selected.has(entry.id)}
                      onChange={() => toggleOne(entry.id)}
                      aria-label="Select entry"
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </Td>
                  <Td>{formatDate(entry.date)}</Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <TypeBadge type={entry.type} />
                      {entry.needsReview && <ReviewBadge />}
                    </div>
                  </Td>
                  <Td>
                    <CategoryBadge category={entry.category} />
                    {isTransfer(entry.type) && (
                      <div className="mt-1 text-xs text-slate-400">
                        {accountLabel(entry.fromAccountId)} →{' '}
                        {accountLabel(entry.toAccountId)}
                      </div>
                    )}
                  </Td>
                  <Td className="max-w-xs truncate text-slate-500">
                    {entry.note || '—'}
                  </Td>
                  <Td
                    className={`text-right font-medium tabular-nums ${amountColor(entry.type)}`}
                  >
                    {amountSign(entry.type)}
                    {formatCurrency(entry.amount)}
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditing(entry)}
                        className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteEntries([entry])}
                        className="rounded px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="flex items-center gap-4 rounded-full bg-slate-900 px-5 py-3 text-sm text-white shadow-xl ring-1 ring-black/5">
            <span className="font-medium">
              {selected.size} {selected.size === 1 ? 'entry' : 'entries'}{' '}
              selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="rounded-full px-3 py-1.5 font-medium text-slate-300 hover:text-white"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() =>
                  deleteEntries(entries.filter((e) => selected.has(e.id)))
                }
                className="rounded-full bg-rose-600 px-4 py-1.5 font-medium text-white hover:bg-rose-500"
              >
                Delete selected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Th({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <th className={`px-4 py-3 ${className}`}>{children}</th>
}

function Td({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>
}

function ReviewBadge() {
  return <Badge variant="warning">review</Badge>
}

function amountColor(type: EntryType): string {
  if (type === 'income') return 'text-emerald-600'
  if (type === 'expense') return 'text-rose-600'
  return 'text-slate-500'
}

function amountSign(type: EntryType): string {
  if (type === 'income') return '+'
  if (type === 'expense') return '−'
  return '' // transfers are net-neutral
}
