import { useEffect, useState } from 'react'
import { NumericFormat } from 'react-number-format'
import type { Entry, EntryType, NewEntry } from '../dal/types'
import { DEFAULT_CATEGORIES } from '../dal/types'
import { todayISO } from '../lib/format'

interface EntryFormProps {
  initial?: Entry | null
  onSubmit: (input: NewEntry) => Promise<void> | void
  onCancel?: () => void
  submitLabel?: string
}

const blank: NewEntry = {
  date: todayISO(),
  amount: 0,
  type: 'expense',
  category: 'Food',
  note: '',
}

export function EntryForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}: EntryFormProps) {
  const [form, setForm] = useState<NewEntry>(() =>
    initial
      ? {
          date: initial.date,
          amount: initial.amount,
          type: initial.type,
          category: initial.category,
          note: initial.note,
        }
      : blank,
  )
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initial) {
      setForm({
        date: initial.date,
        amount: initial.amount,
        type: initial.type,
        category: initial.category,
        note: initial.note,
      })
    }
  }, [initial])

  const categories = DEFAULT_CATEGORIES[form.type]

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
    setSubmitting(true)
    try {
      await onSubmit({ ...form, amount: Number(form.amount) })
      if (!initial) setForm(blank)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-6"
    >
      <div className="md:col-span-1">
        <Label>Type</Label>
        <div className="flex rounded-md ring-1 ring-slate-300 p-0.5">
          <TypeBtn
            active={form.type === 'expense'}
            onClick={() => handleTypeChange('expense')}
            tone="rose"
          >
            Expense
          </TypeBtn>
          <TypeBtn
            active={form.type === 'income'}
            onClick={() => handleTypeChange('income')}
            tone="emerald"
          >
            Income
          </TypeBtn>
        </div>
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

      <div className="md:col-span-1">
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className={inputCls}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
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
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !form.amount}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

const inputCls =
  'mt-1 w-full rounded-md border-0 bg-slate-50 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900'

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
      className="block text-xs font-medium uppercase tracking-wide text-slate-500"
    >
      {children}
    </label>
  )
}

function TypeBtn({
  active,
  onClick,
  tone,
  children,
}: {
  active: boolean
  onClick: () => void
  tone: 'rose' | 'emerald'
  children: React.ReactNode
}) {
  const activeCls =
    tone === 'rose'
      ? 'bg-rose-600 text-white'
      : 'bg-emerald-600 text-white'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded px-3 py-1.5 text-sm font-medium transition ${
        active ? activeCls : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}
