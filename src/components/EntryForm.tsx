import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Info } from 'lucide-react'
import { NumericFormat } from 'react-number-format'
import type { Entry, EntryType, NewEntry } from '../dal/types'
import { DEFAULT_CATEGORIES, isTransfer } from '../dal/types'
import { useAccounts } from '../dal/use-accounts'
import { todayISO } from '../lib/format'
import { CategoryBadge } from './CategoryBadge'
import { TypeBadge } from './TypeBadge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from './ui/select'
import { InfoTooltip } from './ui/tooltip'
import { useI18n } from '../i18n/I18nProvider'

const TYPE_VALUES: EntryType[] = [
  'expense',
  'income',
  'transfer_internal',
  'transfer_external',
]

interface EntryFormProps {
  initial?: Entry | null
  onSubmit: (input: NewEntry) => Promise<void> | void
  onCancel?: () => void
  submitLabel?: string
}

interface FormState {
  date: string
  amount: number
  type: EntryType
  category: string
  note: string
  accountId: string
  fromAccountId: string
  toAccountId: string
  needsReview: boolean
}

const blank: FormState = {
  date: todayISO(),
  amount: 0,
  type: 'expense',
  category: 'Makan',
  note: '',
  accountId: '',
  fromAccountId: '',
  toAccountId: '',
  needsReview: false,
}


function fromEntry(entry: Entry): FormState {
  return {
    date: entry.date,
    amount: entry.amount,
    type: entry.type,
    category: entry.category,
    note: entry.note,
    accountId: entry.accountId ?? '',
    fromAccountId: entry.fromAccountId ?? '',
    toAccountId: entry.toAccountId ?? '',
    needsReview: entry.needsReview,
  }
}

export function EntryForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}: EntryFormProps) {
  const { accounts } = useAccounts()
  const { t } = useI18n()
  const [form, setForm] = useState<FormState>(() =>
    initial ? fromEntry(initial) : blank,
  )
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initial) setForm(fromEntry(initial))
  }, [initial])

  const categories = DEFAULT_CATEGORIES[form.type]
  const transferMode = isTransfer(form.type)
  const transferIncomplete =
    transferMode &&
    (!form.fromAccountId ||
      !form.toAccountId ||
      form.fromAccountId === form.toAccountId)

  function handleTypeChange(type: EntryType) {
    setForm((f) => ({
      ...f,
      type,
      category: DEFAULT_CATEGORIES[type][0],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || form.amount <= 0) return
    if (transferIncomplete) return
    setSubmitting(true)
    try {
      const base = {
        date: form.date,
        amount: Number(form.amount),
        type: form.type,
        category: form.category,
        note: form.note,
        needsReview: form.needsReview,
      }
      const payload: NewEntry = transferMode
        ? {
            ...base,
            fromAccountId: form.fromAccountId,
            toAccountId: form.toAccountId,
          }
        : { ...base, accountId: form.accountId || undefined }
      await onSubmit(payload)
      if (!initial) setForm(blank)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
    >
      <Field label={t('entryForm.type')} htmlFor="type">
        <Select
          value={form.type}
          onValueChange={(v) => handleTypeChange(v as EntryType)}
        >
          <SelectTrigger id="type" className="mt-1">
            <TypeBadge type={form.type} />
          </SelectTrigger>
          <SelectContent>
            {TYPE_VALUES.map((t) => (
              <SelectItem key={t} value={t}>
                <TypeBadge type={t} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Date + Amount remain side-by-side: both short, paired logically. */}
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('entryForm.date')} htmlFor="date">
          <input
            id="date"
            type="date"
            required
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className={inputCls}
          />
        </Field>
        <Field label={t('entryForm.amount')} htmlFor="amount">
          <NumericFormat
            id="amount"
            value={form.amount || ''}
            prefix="Rp "
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            allowNegative={false}
            inputMode="decimal"
            placeholder="Rp 0"
            onValueChange={(values) =>
              setForm((f) => ({ ...f, amount: values.floatValue ?? 0 }))
            }
            className={inputCls}
          />
        </Field>
      </div>

      <Field label={t('entryForm.category')} htmlFor="category">
        <Select
          value={form.category}
          onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
        >
          <SelectTrigger id="category" className="mt-1">
            <CategoryBadge category={form.category} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                <CategoryBadge category={c} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {transferMode ? (
        <>
          <Field label={t('entryForm.fromAccount')} htmlFor="from">
            <AccountSelect
              id="from"
              accounts={accounts}
              value={form.fromAccountId}
              onChange={(v) => setForm((f) => ({ ...f, fromAccountId: v }))}
            />
          </Field>
          <Field label={t('entryForm.toAccount')} htmlFor="to">
            <AccountSelect
              id="to"
              accounts={accounts}
              value={form.toAccountId}
              onChange={(v) => setForm((f) => ({ ...f, toAccountId: v }))}
            />
          </Field>
          {accounts.length === 0 && (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              {t('entryForm.noAccounts')}{' '}
              <Link to="/accounts" className="font-medium underline">
                {t('entryForm.addAccounts')}
              </Link>{' '}
              {t('entryForm.toLabelTransfers')}
            </p>
          )}
        </>
      ) : (
        <Field label={t('entryForm.account')} htmlFor="account">
          <AccountSelect
            id="account"
            accounts={accounts}
            value={form.accountId}
            onChange={(v) => setForm((f) => ({ ...f, accountId: v }))}
            allowEmpty
          />
        </Field>
      )}

      <Field label={t('entryForm.note')} htmlFor="note">
        <input
          id="note"
          type="text"
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          placeholder={t('entryForm.notePlaceholder')}
          className={inputCls}
        />
      </Field>

      <div className="flex items-center gap-1.5">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={form.needsReview}
            onChange={(e) =>
              setForm((f) => ({ ...f, needsReview: e.target.checked }))
            }
            className="h-4 w-4 rounded border-slate-300"
          />
          {t('entryForm.needsReview')}
        </label>
        <InfoTooltip content={t('entryForm.needsReviewHelp')}>
          <button
            type="button"
            aria-label={t('entryForm.needsReviewAria')}
            className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </InfoTooltip>
      </div>

      <div className="mt-2 flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {t('common.cancel')}
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !form.amount || transferIncomplete}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:disabled:bg-slate-700 dark:disabled:text-slate-500"
        >
          {submitting ? t('common.saving') : submitLabel}
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

const inputCls =
  'mt-1 w-full rounded-md border-0 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900'

function AccountSelect({
  id,
  accounts,
  value,
  onChange,
  allowEmpty = false,
}: {
  id: string
  accounts: { id: string; bank: string; label: string }[]
  value: string
  onChange: (value: string) => void
  allowEmpty?: boolean
}) {
  const { t } = useI18n()
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    >
      <option value="">
        {allowEmpty ? t('entryForm.none') : t('entryForm.selectAccount')}
      </option>
      {accounts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.bank} — {a.label}
        </option>
      ))}
    </select>
  )
}

function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode
  htmlFor?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
    >
      {children}
    </label>
  )
}
