import { useEffect, useState } from 'react'
import type { Account, NewAccount } from '../dal/types'

interface AccountFormProps {
  initial?: Account | null
  onSubmit: (input: NewAccount) => Promise<void> | void
  onCancel?: () => void
  submitLabel?: string
}

const KNOWN_BANKS = ['Jago', 'Mandiri', 'BSI', 'BCA', 'Other']

const blank = {
  bank: 'Jago',
  label: '',
  accountNumbersText: '',
  isPocket: false,
}

export function AccountForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Save',
}: AccountFormProps) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          bank: initial.bank,
          label: initial.label,
          accountNumbersText: initial.accountNumbers.join(', '),
          isPocket: initial.isPocket ?? false,
        }
      : blank,
  )
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (initial) {
      setForm({
        bank: initial.bank,
        label: initial.label,
        accountNumbersText: initial.accountNumbers.join(', '),
        isPocket: initial.isPocket ?? false,
      })
    }
  }, [initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.label.trim()) return
    setSubmitting(true)
    try {
      await onSubmit({
        bank: form.bank,
        label: form.label.trim(),
        accountNumbers: form.accountNumbersText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        isPocket: form.isPocket,
      })
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
        <Label htmlFor="bank">Bank</Label>
        <select
          id="bank"
          value={form.bank}
          onChange={(e) => setForm((f) => ({ ...f, bank: e.target.value }))}
          className={inputCls}
        >
          {KNOWN_BANKS.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="label">Label</Label>
        <input
          id="label"
          type="text"
          required
          value={form.label}
          onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
          placeholder="e.g. Jago - Main Pocket"
          className={inputCls}
        />
      </div>

      <div className="md:col-span-2">
        <Label htmlFor="numbers">Account numbers / aliases</Label>
        <input
          id="numbers"
          type="text"
          value={form.accountNumbersText}
          onChange={(e) =>
            setForm((f) => ({ ...f, accountNumbersText: e.target.value }))
          }
          placeholder="Comma-separated, e.g. 508678037289, 7178129206"
          className={inputCls}
        />
      </div>

      <div className="flex items-end md:col-span-1">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={form.isPocket}
            onChange={(e) =>
              setForm((f) => ({ ...f, isPocket: e.target.checked }))
            }
            className="h-4 w-4 rounded border-slate-300"
          />
          Pocket
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 md:col-span-6">
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
          disabled={submitting || !form.label.trim()}
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
