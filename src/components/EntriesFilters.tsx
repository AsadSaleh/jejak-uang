import { Search, X } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { Account, EntryType, ImportBatch } from '../dal/types'
import { useI18n } from '../i18n/I18nProvider'
import { CategoryCombobox } from './CategoryCombobox'
import { TypeBadge } from './TypeBadge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from './ui/select'

export interface EntriesFiltersState {
  type: EntryType | 'all'
  source: 'all' | 'manual' | 'import'
  accountId: string // '' = all
  needsReview: 'all' | 'yes' | 'no'
  batchId: string // '' = all
  category: string // '' = all
  search: string
}

export const DEFAULT_FILTERS: EntriesFiltersState = {
  type: 'all',
  source: 'all',
  accountId: '',
  needsReview: 'all',
  batchId: '',
  category: '',
  search: '',
}

export function isFilterActive(filters: EntriesFiltersState): boolean {
  return (
    filters.type !== 'all' ||
    filters.source !== 'all' ||
    filters.accountId !== '' ||
    filters.needsReview !== 'all' ||
    filters.batchId !== '' ||
    filters.category !== '' ||
    filters.search !== ''
  )
}

interface Props {
  filters: EntriesFiltersState
  setFilters: (next: EntriesFiltersState) => void
  accounts: Account[]
  batches: ImportBatch[]
  categories: string[]
}

const TYPE_VALUES: (EntryType | 'all')[] = [
  'all',
  'income',
  'expense',
  'transfer_internal',
  'transfer_external',
]

function batchLabel(b: ImportBatch): string {
  const when = format(parseISO(b.importedAt), 'd MMM HH:mm')
  return `${b.bank.toUpperCase()} · ${b.fileName} · ${when}`
}

export function EntriesFilters({
  filters,
  setFilters,
  accounts,
  batches,
  categories,
}: Props) {
  const { t } = useI18n()
  const update = (patch: Partial<EntriesFiltersState>) =>
    setFilters({ ...filters, ...patch })

  return (
    <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex flex-wrap items-center gap-2">
        {/* Type */}
        <div className="w-44">
          <Select
            value={filters.type}
            onValueChange={(v) =>
              update({ type: v as EntryType | 'all' })
            }
          >
            <SelectTrigger className="h-8">
              {filters.type === 'all' ? (
                <span className="text-xs">{t('filters.allTypes')}</span>
              ) : (
                <TypeBadge type={filters.type} />
              )}
            </SelectTrigger>
            <SelectContent>
              {TYPE_VALUES.map((v) => (
                <SelectItem key={v} value={v}>
                  {v === 'all' ? (
                    <span className="text-xs">{t('filters.allTypes')}</span>
                  ) : (
                    <TypeBadge type={v} />
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Source */}
        <div className="w-32">
          <Select
            value={filters.source}
            onValueChange={(v) =>
              update({ source: v as EntriesFiltersState['source'] })
            }
          >
            <SelectTrigger className="h-8">
              <span className="text-xs">
                {filters.source === 'all'
                  ? t('filters.anySource')
                  : filters.source === 'manual'
                    ? t('filters.manual')
                    : t('filters.imported')}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.anySource')}</SelectItem>
              <SelectItem value="manual">{t('filters.manual')}</SelectItem>
              <SelectItem value="import">{t('filters.imported')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Account */}
        {accounts.length > 0 && (
          <div className="w-40">
            <Select
              value={filters.accountId || 'all'}
              onValueChange={(v) =>
                update({ accountId: v === 'all' ? '' : v })
              }
            >
              <SelectTrigger className="h-8">
                <span className="truncate text-xs">
                  {filters.accountId
                    ? (accounts.find((a) => a.id === filters.accountId)
                        ?.label ?? t('filters.account'))
                    : t('filters.anyAccount')}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.anyAccount')}</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.bank} — {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Category */}
        {categories.length > 0 && (
          <div className="w-40">
            <CategoryCombobox
              className="h-8"
              variant="badge"
              anyLabel={t('filters.anyCategory')}
              value={filters.category}
              onChange={(v) => update({ category: v })}
              categories={categories}
            />
          </div>
        )}

        {/* Needs review */}
        <div className="w-36">
          <Select
            value={filters.needsReview}
            onValueChange={(v) =>
              update({ needsReview: v as EntriesFiltersState['needsReview'] })
            }
          >
            <SelectTrigger className="h-8">
              <span className="text-xs">
                {filters.needsReview === 'all'
                  ? t('filters.anyStatus')
                  : filters.needsReview === 'yes'
                    ? t('filters.needsReview')
                    : t('filters.reviewed')}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.anyStatus')}</SelectItem>
              <SelectItem value="yes">{t('filters.needsReview')}</SelectItem>
              <SelectItem value="no">{t('filters.reviewed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Batch */}
        {batches.length > 0 && (
          <div className="w-56">
            <Select
              value={filters.batchId || 'all'}
              onValueChange={(v) =>
                update({ batchId: v === 'all' ? '' : v })
              }
            >
              <SelectTrigger className="h-8">
                <span className="truncate text-xs">
                  {filters.batchId
                    ? (batches.find((b) => b.id === filters.batchId)
                        ? batchLabel(
                            batches.find((b) => b.id === filters.batchId)!,
                          )
                        : t('filters.batch'))
                    : t('filters.anyBatch')}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filters.anyBatch')}</SelectItem>
                {batches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    <span className="flex w-full items-center justify-between gap-3">
                      <span className="truncate">{batchLabel(b)}</span>
                      <span className="text-[10px] text-slate-400">
                        {b.entryCount}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Search */}
        <div className="relative min-w-[12rem] flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            placeholder={t('filters.search')}
            className="h-8 w-full rounded-md border-0 bg-slate-50 dark:bg-slate-800 pl-8 pr-3 text-xs shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-200"
          />
        </div>

        {/* Clear */}
        {isFilterActive(filters) && (
          <button
            type="button"
            onClick={() => setFilters(DEFAULT_FILTERS)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-3 w-3" /> {t('common.clear')}
          </button>
        )}
      </div>
    </div>
  )
}

export function applyFilters(
  entries: { id: string; type: string; source: string; accountId?: string; fromAccountId?: string; toAccountId?: string; needsReview: boolean; importBatchId?: string; note: string; rawText?: string; category: string }[],
  filters: EntriesFiltersState,
) {
  return entries.filter((e) => {
    if (filters.type !== 'all' && e.type !== filters.type) return false
    if (filters.source !== 'all' && e.source !== filters.source) return false
    if (
      filters.accountId &&
      e.accountId !== filters.accountId &&
      e.fromAccountId !== filters.accountId &&
      e.toAccountId !== filters.accountId
    )
      return false
    if (filters.needsReview === 'yes' && !e.needsReview) return false
    if (filters.needsReview === 'no' && e.needsReview) return false
    if (filters.batchId && e.importBatchId !== filters.batchId) return false
    if (filters.category && e.category !== filters.category) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const hay = `${e.note} ${e.rawText ?? ''} ${e.category}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}
