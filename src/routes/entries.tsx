import { createFileRoute } from '@tanstack/react-router'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CategoryBadge } from '../components/CategoryBadge'
import {
  applyFilters,
  DEFAULT_FILTERS,
  EntriesFilters,
  type EntriesFiltersState,
} from '../components/EntriesFilters'
import { EntryForm } from '../components/EntryForm'
import { SidePanel } from '../components/SidePanel'
import { TypeBadge } from '../components/TypeBadge'
import { useToast } from '../components/ToastProvider'
import { Badge } from '../components/ui/badge'
import { useAccounts } from '../dal/use-accounts'
import { useBatches } from '../dal/use-batches'
import { useEntries } from '../dal/use-entries'
import type { Entry, EntryType } from '../dal/types'
import { DEFAULT_CATEGORIES, isTransfer } from '../dal/types'
import { formatCurrency, formatDate } from '../lib/format'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '../components/ui/select'

export const Route = createFileRoute('/entries')({ component: EntriesPage })

function EntriesPage() {
  const { entries, loading, create, update, removeMany, restore } = useEntries()
  const { accounts } = useAccounts()
  const { batches, remove: removeBatch } = useBatches()
  const { addToast } = useToast()
  const [editing, setEditing] = useState<Entry | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<EntriesFiltersState>(DEFAULT_FILTERS)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(entry: Entry) {
    setEditing(entry)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  const accountLabel = useMemo(() => {
    const map = new Map(accounts.map((a) => [a.id, `${a.bank} — ${a.label}`]))
    return (id?: string) => (id ? (map.get(id) ?? 'Unknown account') : '—')
  }, [accounts])

  const visibleEntries = useMemo(
    () => applyFilters(entries, filters) as Entry[],
    [entries, filters],
  )

  const activeBatch = useMemo(
    () =>
      filters.batchId ? batches.find((b) => b.id === filters.batchId) : null,
    [filters.batchId, batches],
  )

  const allSelected =
    visibleEntries.length > 0 && selected.size === visibleEntries.length

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(
      allSelected ? new Set() : new Set(visibleEntries.map((e) => e.id)),
    )
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

  async function deleteBatch() {
    if (!activeBatch) return
    const batchId = activeBatch.id
    const batchEntries = entries.filter((e) => e.importBatchId === batchId)
    if (batchEntries.length === 0) return
    await deleteEntries(batchEntries)
    await removeBatch(batchId)
    setFilters({ ...filters, batchId: '' })
  }

  return (
    <div className="space-y-6 pb-28">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">Entries</h1>
            <span className="text-sm font-medium text-slate-500 tabular-nums dark:text-slate-400">
              {visibleEntries.length === entries.length
                ? `${entries.length} total`
                : `${visibleEntries.length} of ${entries.length}`}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Add, edit, and delete income, expense, and transfer entries.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          <Plus className="h-4 w-4" /> Add entry
        </button>
      </div>

      <EntriesFilters
        filters={filters}
        setFilters={setFilters}
        accounts={accounts}
        batches={batches}
      />

      {activeBatch && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800 ring-1 ring-sky-200 dark:bg-sky-900/20 dark:text-sky-200 dark:ring-sky-900/50">
          <div className="min-w-0">
            <span className="font-medium uppercase tracking-wide">
              {activeBatch.bank}
            </span>{' '}
            · <span className="truncate font-mono">{activeBatch.fileName}</span>
            <div className="text-xs opacity-80">
              Imported {format(parseISO(activeBatch.importedAt), 'd MMM yyyy HH:mm')}{' '}
              · {activeBatch.entryCount}{' '}
              {activeBatch.entryCount === 1 ? 'entry' : 'entries'} · income{' '}
              {formatCurrency(activeBatch.incomeTotal)} · expense{' '}
              {formatCurrency(activeBatch.expenseTotal)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void deleteBatch()}
            className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete batch
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-800 dark:bg-slate-800/50">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 ">
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
              <Th>Added</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                  Loading…
                </td>
              </tr>
            ) : visibleEntries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                  {entries.length === 0
                    ? 'No entries yet. Add your first one above.'
                    : 'No entries match the current filters.'}
                </td>
              </tr>
            ) : (
              visibleEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    selected.has(entry.id)
                      ? 'bg-sky-50 dark:bg-sky-900/30'
                      : editing?.id === entry.id
                        ? 'bg-amber-50 dark:bg-amber-900/30'
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
                  <Td className="whitespace-nowrap">
                    {formatDate(entry.date)}
                    {entry.time && (
                      <span className="ml-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        {entry.time}
                      </span>
                    )}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <TypeBadge type={entry.type} />
                      {entry.needsReview && <ReviewBadge />}
                    </div>
                  </Td>
                  <Td>
                    <Select
                      value={entry.category}
                      onValueChange={(v) => void update(entry.id, { category: v })}
                    >
                      <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent p-0 shadow-none ring-0 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-2">
                        <CategoryBadge category={entry.category} />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_CATEGORIES[entry.type].map((c) => (
                          <SelectItem key={c} value={c}>
                            <CategoryBadge category={c} />
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {isTransfer(entry.type) && (
                      <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                        {accountLabel(entry.fromAccountId)} →{' '}
                        {accountLabel(entry.toAccountId)}
                      </div>
                    )}
                  </Td>
                  <Td
                    className="max-w-xs truncate text-slate-500 dark:text-slate-400"
                    title={entry.note || undefined}
                  >
                    {entry.note || '—'}
                  </Td>
                  <Td
                    className={`text-right font-medium tabular-nums ${amountColor(entry.type)}`}
                  >
                    {amountSign(entry.type)}
                    {formatCurrency(entry.amount)}
                  </Td>
                  <Td>
                    <div className="flex flex-col text-xs text-slate-500 dark:text-slate-400">
                      <span
                        title={new Date(entry.createdAt).toLocaleString()}
                      >
                        {formatDistanceToNow(parseISO(entry.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {entry.source === 'import' && (
                        <span className="text-[10px] uppercase tracking-wider text-sky-600">
                          imported
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(entry)}
                        aria-label="Edit entry"
                        title="Edit"
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        type="button"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteEntries([entry])}
                        aria-label="Delete entry"
                        title="Delete"
                        className="rounded p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
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
                  deleteEntries(visibleEntries.filter((e) => selected.has(e.id)))
                }
                className="rounded-full bg-rose-600 px-4 py-1.5 font-medium text-white hover:bg-rose-500"
              >
                Delete selected
              </button>
            </div>
          </div>
        </div>
      )}

      <SidePanel
        open={formOpen}
        onClose={closeForm}
        title={editing ? 'Edit entry' : 'Add entry'}
      >
        <EntryForm
          key={editing?.id ?? 'new'}
          initial={editing}
          submitLabel={editing ? 'Update entry' : 'Add entry'}
          onCancel={closeForm}
          onSubmit={async (input) => {
            if (editing) {
              await update(editing.id, input)
              toast.success('Entry updated')
            } else {
              await create(input)
              toast.success('Entry created')
            }
            closeForm()
          }}
        />
      </SidePanel>
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
  title,
}: {
  children: React.ReactNode
  className?: string
  title?: string
}) {
  return (
    <td className={`px-4 py-3 ${className}`} title={title}>
      {children}
    </td>
  )
}

function ReviewBadge() {
  return <Badge variant="warning">review</Badge>
}

function amountColor(type: EntryType): string {
  if (type === 'income') return 'text-emerald-600'
  if (type === 'expense') return 'text-rose-600'
  return 'text-slate-500 dark:text-slate-400'
}

function amountSign(type: EntryType): string {
  if (type === 'income') return '+'
  if (type === 'expense') return '−'
  return '' // transfers are net-neutral
}
