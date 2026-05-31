import { useEffect, useState } from 'react'
import { Info } from 'lucide-react'
import type { Account, NewAccount } from '../dal/types'
import { BANKS, bankFor } from '../lib/banks'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from './ui/select'
import { InfoTooltip } from './ui/tooltip'

interface AccountFormProps {
  initial?: Account | null
  onSubmit: (input: NewAccount) => Promise<void> | void
  onCancel?: () => void
  submitLabel?: string
}

const POCKET_HELP =
  'A pocket is a sub-balance inside one bank (e.g. a Jago "Kantong" or a savings goal). Marking an account as a pocket lets the importer recognise pocket-to-pocket moves as internal transfers instead of counting them as spending.'

function BankLogo({ name }: { name: string }) {
  const bank = bankFor(name)
  return (
    <img
      src={bank.logo}
      alt=""
      aria-hidden
      className="h-5 w-5 shrink-0 rounded"
    />
  )
}

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

  // Surface a legacy/custom bank value that isn't in the catalogue so editing
  // an old account doesn't silently drop its bank from the dropdown.
  const bankOptions = BANKS.some(
    (b) => b.name.toLowerCase() === form.bank.trim().toLowerCase(),
  )
    ? BANKS
    : [{ id: '__custom', name: form.bank, logo: bankFor(form.bank).logo }, ...BANKS]

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
      className="grid grid-cols-1 gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 md:grid-cols-6"
    >
      <div className="md:col-span-1">
        <Label htmlFor="bank">Bank</Label>
        <Select
          value={form.bank}
          onValueChange={(v) => setForm((f) => ({ ...f, bank: v }))}
        >
          <SelectTrigger id="bank" className="mt-1">
            <span className="flex items-center gap-2 truncate">
              <BankLogo name={form.bank} />
              <span className="truncate">{form.bank}</span>
            </span>
          </SelectTrigger>
          <SelectContent>
            {bankOptions.map((b) => (
              <SelectItem key={b.id} value={b.name}>
                <BankLogo name={b.name} />
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      <div className="md:col-span-1">
        <div className="flex items-center gap-1">
          <Label>Pocket</Label>
          <InfoTooltip content={POCKET_HELP}>
            <button
              type="button"
              aria-label="What is a pocket?"
              className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </InfoTooltip>
        </div>
        <label className="mt-1 flex h-9 items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={form.isPocket}
            onChange={(e) =>
              setForm((f) => ({ ...f, isPocket: e.target.checked }))
            }
            className="h-4 w-4 rounded border-slate-300"
          />
          Is a pocket
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 md:col-span-6">
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
  'mt-1 w-full rounded-md border-0 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm shadow-sm ring-1 ring-inset ring-slate-300 dark:ring-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900'

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
