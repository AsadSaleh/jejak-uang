import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
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
      className="grid grid-cols-1 gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 md:grid-cols-6"
    >
      <div className="md:col-span-2">
        <Label htmlFor="type">Type</Label>
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
      </div>

      <div className="md:col-span-1">
        <Label htmlFor="date">Date</Label>
        <input
          id="date"
          type="date"
          required
          value={form.date}
          onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          className={inputCls}
        />
      </div>

      <div className="md:col-span-1">
        <Label htmlFor="amount">Amount</Label>
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
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="category">Category</Label>
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
      </div>

      <div className="flex items-end md:col-span-2">
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={form.needsReview}
            onChange={(e) =>
              setForm((f) => ({ ...f, needsReview: e.target.checked }))
            }
            className="h-4 w-4 rounded border-slate-300"
          />
          Needs review
        </label>
      </div>

      {transferMode ? (
        <>
          <div className="md:col-span-3">
            <Label htmlFor="from">From account</Label>
            <AccountSelect
              id="from"
              accounts={accounts}
              value={form.fromAccountId}
              onChange={(v) => setForm((f) => ({ ...f, fromAccountId: v }))}
            />
          </div>
          <div className="md:col-span-3">
            <Label htmlFor="to">To account</Label>
            <AccountSelect
              id="to"
              accounts={accounts}
              value={form.toAccountId}
              onChange={(v) => setForm((f) => ({ ...f, toAccountId: v }))}
            />
          </div>
          {accounts.length === 0 && (
            <p className="md:col-span-6 text-sm text-amber-700">
              No accounts registered yet.{' '}
              <Link to="/accounts" className="font-medium underline">
                Add your accounts
              </Link>{' '}
              to label transfers.
            </p>
          )}
        </>
      ) : (
        <div className="md:col-span-3">
          <Label htmlFor="account">Account (optional)</Label>
          <AccountSelect
            id="account"
            accounts={accounts}
            value={form.accountId}
            onChange={(v) => setForm((f) => ({ ...f, accountId: v }))}
            allowEmpty
          />
        </div>
      )}

      <div className="md:col-span-6">
        <Label htmlFor="note">Note</Label>
        <input
          id="note"
          type="text"
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
          placeholder="Optional"
          className={inputCls}
        />
      </div>

      <div className="md:col-span-6 flex items-center justify-end gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !form.amount || transferIncomplete}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
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
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    >
      <option value="">{allowEmpty ? '— None —' : 'Select account…'}</option>
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
