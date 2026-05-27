import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { EntryForm } from '../components/EntryForm'
import { useEntries } from '../dal/use-entries'
import type { Entry } from '../dal/types'
import { formatCurrency, formatDate } from '../lib/format'

export const Route = createFileRoute('/entries')({ component: EntriesPage })

function EntriesPage() {
  const { entries, loading, create, update, remove } = useEntries()
  const [editing, setEditing] = useState<Entry | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Entries</h1>
        <p className="mt-1 text-sm text-slate-500">
          Add, edit, and delete income and expense entries.
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
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                  No entries yet. Add your first one above.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  className={`hover:bg-slate-50 ${editing?.id === entry.id ? 'bg-amber-50' : ''}`}
                >
                  <Td>{formatDate(entry.date)}</Td>
                  <Td>
                    <TypeBadge type={entry.type} />
                  </Td>
                  <Td>{entry.category}</Td>
                  <Td className="max-w-xs truncate text-slate-500">
                    {entry.note || '—'}
                  </Td>
                  <Td
                    className={`text-right font-medium tabular-nums ${
                      entry.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {entry.type === 'income' ? '+' : '−'}
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
                        onClick={async () => {
                          if (confirm('Delete this entry?')) {
                            if (editing?.id === entry.id) setEditing(null)
                            await remove(entry.id)
                          }
                        }}
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

function TypeBadge({ type }: { type: Entry['type'] }) {
  const cls =
    type === 'income'
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-rose-100 text-rose-700'
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {type}
    </span>
  )
}
