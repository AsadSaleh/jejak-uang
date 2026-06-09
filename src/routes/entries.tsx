import { createFileRoute, Link } from '@tanstack/react-router'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CategoryCombobox } from '../components/CategoryCombobox'
import { ColumnPicker } from '../components/ColumnPicker'
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
import { InfoTooltip } from '../components/ui/tooltip'
import { useAccounts } from '../dal/use-accounts'
import { useBatches } from '../dal/use-batches'
import { useEntries } from '../dal/use-entries'
import type { Entry, EntryType } from '../dal/types'
import { DEFAULT_CATEGORIES, isTransfer } from '../dal/types'
import { formatCurrency, formatDate } from '../lib/format'
import { useI18n } from '../i18n/I18nProvider'
import type { TranslationKey } from '../i18n/translations'

const COLUMN_LABEL_KEYS: Record<ToggleableColumn, TranslationKey> = {
  date: 'entries.colDate',
  type: 'entries.colType',
  category: 'entries.colCategory',
  account: 'entries.colAccount',
  note: 'entries.colNote',
  amount: 'entries.colAmount',
  added: 'entries.colAdded',
}

type EntriesSearch = { category?: string }

// Toggleable columns. `select` (checkbox) and `actions` are always visible
// and not exposed in the picker.
type ToggleableColumn =
  | 'date'
  | 'type'
  | 'category'
  | 'account'
  | 'note'
  | 'amount'
  | 'added'

const COLUMN_ORDER: ToggleableColumn[] = [
  'date',
  'type',
  'category',
  'account',
  'note',
  'amount',
  'added',
]

const COLUMN_WIDTHS: Record<ToggleableColumn | 'select' | 'actions', string> = {
  select: '48px',
  date: '150px',
  type: '160px',
  category: '200px',
  account: '180px',
  note: 'minmax(0, 1fr)',
  amount: '150px',
  added: '140px',
  actions: '90px',
}

type ColumnVisibility = Record<ToggleableColumn, boolean>

const DEFAULT_VISIBILITY: ColumnVisibility = {
  date: true,
  type: true,
  category: true,
  account: true,
  note: true,
  amount: true,
  added: true,
}

const VISIBILITY_STORAGE_KEY = 'jejak-uang.entries.column-visibility'
const LEGACY_VISIBILITY_STORAGE_KEY = 'money-tracker.entries.column-visibility'

export const Route = createFileRoute('/entries')({
  component: EntriesPage,
  // Allow ?category=… to deep-link with a preset filter (used by the
  // "Top categories" list on the dashboard). Returns a partial so other
  // navigations to /entries don't need to pass a `search` object.
  validateSearch: (search: Record<string, unknown>): EntriesSearch => {
    const c = search.category
    return typeof c === 'string' && c ? { category: c } : {}
  },
})

function EntriesPage() {
  const { entries, loading, create, update, removeMany, restore } = useEntries()
  const { accounts } = useAccounts()
  const { batches, remove: removeBatch } = useBatches()
  const { addToast } = useToast()
  const { t, locale, dfLocale } = useI18n()
  const colLabel = (id: ToggleableColumn) => t(COLUMN_LABEL_KEYS[id])
  const entriesWord = (n: number) =>
    n === 1 ? t('common.entry') : t('common.entries')
  const { category: categoryFromUrl } = Route.useSearch()
  const [editing, setEditing] = useState<Entry | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<EntriesFiltersState>(() => ({
    ...DEFAULT_FILTERS,
    category: categoryFromUrl ?? '',
  }))

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
    return (id?: string) =>
      id ? (map.get(id) ?? t('entries.unknownAccount')) : '—'
  }, [accounts, t])

  const visibleEntries = useMemo(
    () => applyFilters(entries, filters) as Entry[],
    [entries, filters],
  )

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const e of entries) set.add(e.category)
    return [...set].sort()
  }, [entries])

  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(
    () => {
      if (typeof window === 'undefined') return DEFAULT_VISIBILITY
      try {
        const raw =
          window.localStorage.getItem(VISIBILITY_STORAGE_KEY) ??
          window.localStorage.getItem(LEGACY_VISIBILITY_STORAGE_KEY)
        if (!raw) return DEFAULT_VISIBILITY
        const parsed = JSON.parse(raw) as Partial<ColumnVisibility>
        return { ...DEFAULT_VISIBILITY, ...parsed }
      } catch {
        return DEFAULT_VISIBILITY
      }
    },
  )

  useEffect(() => {
    try {
      window.localStorage.setItem(
        VISIBILITY_STORAGE_KEY,
        JSON.stringify(columnVisibility),
      )
    } catch {
      /* ignore */
    }
  }, [columnVisibility])

  const visibleColumnIds = useMemo(
    () => COLUMN_ORDER.filter((id) => columnVisibility[id]),
    [columnVisibility],
  )

  // Build the grid template from currently-visible columns. select and
  // actions are always present and bracket the toggleable columns.
  const gridTemplateColumns = useMemo(() => {
    const parts: string[] = [COLUMN_WIDTHS.select]
    for (const id of visibleColumnIds) parts.push(COLUMN_WIDTHS[id])
    parts.push(COLUMN_WIDTHS.actions)
    return parts.join(' ')
  }, [visibleColumnIds])

  // Virtualize the entries list against the window scroll so the page keeps
  // its natural scroll behaviour and only the visible rows mount/render.
  // scrollMargin must be the absolute Y of the list start in the document —
  // offsetTop is relative to the nearest positioned ancestor and can lie
  // about that, so we use getBoundingClientRect + window.scrollY.
  const tableRef = useRef<HTMLDivElement>(null)
  const [scrollMargin, setScrollMargin] = useState(0)
  useLayoutEffect(() => {
    const el = tableRef.current
    if (!el) return
    const next = el.getBoundingClientRect().top + window.scrollY
    setScrollMargin((prev) => (prev === next ? prev : next))
  })

  const virtualizer = useWindowVirtualizer({
    count: visibleEntries.length,
    estimateSize: () => 64,
    overscan: 10,
    scrollMargin,
    getItemKey: (i) => visibleEntries[i]?.id ?? i,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const totalSize = virtualizer.getTotalSize()
  // virtualItem.start / .end are absolute page-Y values (they already include
  // scrollMargin), while getTotalSize() is the *list height alone* — it
  // already subtracts scrollMargin internally. For the spacer pattern we
  // want the container to be exactly listHeight tall, so the trailing spacer
  // needs `+ scrollMargin` to compensate for the fact that `item.end` carries
  // scrollMargin but `totalSize` does not.
  const startPad =
    virtualItems.length > 0
      ? virtualItems[0].start - virtualizer.options.scrollMargin
      : 0
  const endPad =
    virtualItems.length > 0
      ? totalSize -
        virtualItems[virtualItems.length - 1].end +
        virtualizer.options.scrollMargin
      : 0

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
      message: `${t('entries.deletedToast', { count: toDelete.length })} ${entriesWord(toDelete.length)}`,
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
            <h1 className="text-2xl font-semibold tracking-tight">
              {t('entries.title')}
            </h1>
            <span className="text-sm font-medium text-slate-500 tabular-nums dark:text-slate-400">
              {visibleEntries.length === entries.length
                ? t('entries.countTotal', { count: entries.length })
                : t('entries.countOf', {
                    shown: visibleEntries.length,
                    total: entries.length,
                  })}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('entries.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ColumnPicker
            columns={COLUMN_ORDER.map((id) => ({
              id,
              label: colLabel(id),
            }))}
            visibility={columnVisibility}
            onChange={(id, visible) =>
              setColumnVisibility((prev) => ({
                ...prev,
                [id as ToggleableColumn]: visible,
              }))
            }
          />
          <InfoTooltip content={t('entries.importTooltip')}>
            <Link
              to="/import"
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800"
            >
              <Upload className="h-4 w-4" /> {t('entries.import')}
            </Link>
          </InfoTooltip>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <Plus className="h-4 w-4" /> {t('entries.add')}
          </button>
        </div>
      </div>

      <EntriesFilters
        filters={filters}
        setFilters={setFilters}
        accounts={accounts}
        batches={batches}
        categories={categories}
      />

      {activeBatch && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-800 ring-1 ring-sky-200 dark:bg-sky-900/20 dark:text-sky-200 dark:ring-sky-900/50">
          <div className="min-w-0">
            <span className="font-medium uppercase tracking-wide">
              {activeBatch.bank}
            </span>{' '}
            · <span className="truncate font-mono">{activeBatch.fileName}</span>
            <div className="text-xs opacity-80">
              {t('entries.batchImported', {
                when: format(parseISO(activeBatch.importedAt), 'd MMM yyyy HH:mm', {
                  locale: dfLocale,
                }),
              })}{' '}
              · {activeBatch.entryCount} {entriesWord(activeBatch.entryCount)} ·{' '}
              {t('entries.batchIncome')} {formatCurrency(activeBatch.incomeTotal)} ·{' '}
              {t('entries.batchExpense')} {formatCurrency(activeBatch.expenseTotal)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => void deleteBatch()}
            className="inline-flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500"
          >
            <Trash2 className="h-3.5 w-3.5" /> {t('entries.deleteBatch')}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="min-w-max">
          {/* Header */}
          <div
            className="grid items-center border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400"
            role="row"
            style={{ gridTemplateColumns }}
          >
            <div className="flex justify-center px-2 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label={t('entries.selectAll')}
                className="h-4 w-4 rounded border-slate-300"
              />
            </div>
            {visibleColumnIds.map((id) => (
              <div
                key={id}
                className={`px-3 py-3 ${id === 'amount' ? 'text-right' : ''}`}
              >
                {colLabel(id)}
              </div>
            ))}
            <div className="px-3 py-3 text-right">{t('entries.colActions')}</div>
          </div>

          {/* Body — window-virtualized */}
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
              {t('common.loading')}
            </div>
          ) : visibleEntries.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500">
              {entries.length === 0
                ? t('entries.emptyNone')
                : t('entries.emptyFiltered')}
            </div>
          ) : (
            <div ref={tableRef}>
              <div style={{ height: startPad }} />
              {virtualItems.map((vi) => {
                const entry = visibleEntries[vi.index]
                if (!entry) return null
                const rowBg = selected.has(entry.id)
                  ? 'bg-sky-50 dark:bg-sky-900/30'
                  : editing?.id === entry.id
                    ? 'bg-amber-50 dark:bg-amber-900/30'
                    : ''
                return (
                  <div
                    key={entry.id}
                    ref={virtualizer.measureElement}
                    data-index={vi.index}
                    role="row"
                    className={`grid items-start border-b border-slate-100 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 ${rowBg}`}
                    style={{ gridTemplateColumns }}
                  >
                    <div className="flex items-center justify-center px-2 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(entry.id)}
                        onChange={() => toggleOne(entry.id)}
                        aria-label={t('entries.selectEntry')}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                    </div>
                    {visibleColumnIds.map((id) => {
                      switch (id) {
                        case 'date':
                          return (
                            <div
                              key={id}
                              className="whitespace-nowrap px-3 py-3 text-sm"
                            >
                              {formatDate(entry.date, locale)}
                              {entry.time && (
                                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                  {entry.time}
                                </span>
                              )}
                            </div>
                          )
                        case 'type':
                          return (
                            <div key={id} className="px-3 py-3">
                              <div className="flex items-center gap-1.5">
                                <TypeBadge type={entry.type} />
                                {entry.needsReview && <ReviewBadge />}
                              </div>
                            </div>
                          )
                        case 'category':
                          return (
                            <div key={id} className="px-3 py-3">
                              <CategoryCombobox
                                className="h-7 w-auto gap-1 border-0 bg-transparent dark:bg-transparent p-0 shadow-none ring-0 hover:bg-slate-100 focus:ring-2 dark:hover:bg-slate-800"
                                value={entry.category}
                                onChange={(v) =>
                                  void update(entry.id, { category: v })
                                }
                                categories={DEFAULT_CATEGORIES[entry.type]}
                              />
                            </div>
                          )
                        case 'account': {
                          const accountText = isTransfer(entry.type)
                            ? `${accountLabel(entry.fromAccountId)} → ${accountLabel(entry.toAccountId)}`
                            : accountLabel(entry.accountId)
                          return (
                            <div
                              key={id}
                              className="truncate px-3 py-3 text-sm text-slate-700 dark:text-slate-200"
                              title={accountText}
                            >
                              {accountText}
                            </div>
                          )
                        }
                        case 'note':
                          return (
                            <div
                              key={id}
                              className="px-3 py-3 text-sm text-slate-500 dark:text-slate-400"
                              title={entry.note || undefined}
                            >
                              <div className="line-clamp-3 whitespace-normal break-words">
                                {entry.note || '—'}
                              </div>
                            </div>
                          )
                        case 'amount':
                          return (
                            <div
                              key={id}
                              className={`px-3 py-3 text-right text-sm font-medium tabular-nums ${amountColor(entry.type)}`}
                            >
                              {amountSign(entry.type)}
                              {formatCurrency(entry.amount)}
                            </div>
                          )
                        case 'added':
                          return (
                            <div key={id} className="px-3 py-3">
                              <div className="flex flex-col text-xs text-slate-500 dark:text-slate-400">
                                <span
                                  title={new Date(
                                    entry.createdAt,
                                  ).toLocaleString()}
                                >
                                  {formatDistanceToNow(
                                    parseISO(entry.createdAt),
                                    { addSuffix: true, locale: dfLocale },
                                  )}
                                </span>
                                {entry.source === 'import' && (
                                  <span className="text-[10px] uppercase tracking-wider text-sky-600">
                                    {t('entries.imported')}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                      }
                    })}
                    <div className="flex justify-end gap-1 px-3 py-3">
                      <button
                        onClick={() => openEdit(entry)}
                        aria-label={t('entries.editAria')}
                        title={t('entries.editAria')}
                        className="rounded p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        type="button"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteEntries([entry])}
                        aria-label={t('entries.deleteAria')}
                        title={t('entries.deleteAria')}
                        className="rounded p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
              <div style={{ height: endPad }} />
            </div>
          )}
        </div>
      </div>

      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
          <div className="flex items-center gap-4 rounded-full bg-slate-900 px-5 py-3 text-sm text-white shadow-xl ring-1 ring-black/5">
            <span className="font-medium">
              {t('entries.selected', { count: selected.size })}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="rounded-full px-3 py-1.5 font-medium text-slate-300 hover:text-white"
              >
                {t('common.clear')}
              </button>
              <button
                type="button"
                onClick={() =>
                  deleteEntries(visibleEntries.filter((e) => selected.has(e.id)))
                }
                className="rounded-full bg-rose-600 px-4 py-1.5 font-medium text-white hover:bg-rose-500"
              >
                {t('entries.deleteSelected')}
              </button>
            </div>
          </div>
        </div>
      )}

      <SidePanel
        open={formOpen}
        onClose={closeForm}
        title={editing ? t('entries.edit') : t('entries.add')}
      >
        <EntryForm
          key={editing?.id ?? 'new'}
          initial={editing}
          submitLabel={editing ? t('entries.update') : t('entries.add')}
          onCancel={closeForm}
          onSubmit={async (input) => {
            if (editing) {
              await update(editing.id, input)
              toast.success(t('entries.updatedToast'))
            } else {
              await create(input)
              toast.success(t('entries.createdToast'))
            }
            closeForm()
          }}
        />
      </SidePanel>
    </div>
  )
}

function ReviewBadge() {
  const { t } = useI18n()
  return <Badge variant="warning">{t('entries.reviewBadge')}</Badge>
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
