import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { DetectedAccountsPanel } from '../components/DetectedAccountsPanel'
import { ImportDropzone } from '../components/ImportDropzone'
import { ReviewTable } from '../components/ReviewTable'
import { useToast } from '../components/ToastProvider'
import { useAccounts } from '../dal/use-accounts'
import { useBatches } from '../dal/use-batches'
import { useEntries } from '../dal/use-entries'
import { isTransfer, type NewEntry } from '../dal/types'
import { parsePdf, PdfPasswordError, type ParsedDoc } from '../import/parse-pdf'
import { passwordRepository } from '../dal'
import { extractTransactions, type BankId } from '../import/banks'
import { toReviewRows } from '../import/classify'
import { detectStatementAccount } from '../import/detect-account'
import { findAccountByNumber } from '../import/account-match'
import type {
  DetectedCounterparty,
  ReviewRow,
} from '../import/import-types'
import type { Account } from '../dal/types'

interface DetectedStatementAccount {
  number: string
  matched: Account | null
}

export const Route = createFileRoute('/import')({ component: ImportPage })

function makeBatchId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function ImportPage() {
  const { accounts, create: createAccount } = useAccounts()
  const { createMany, refresh } = useEntries()
  const { create: createBatch } = useBatches()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const [rows, setRows] = useState<ReviewRow[] | null>(null)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [detected, setDetected] = useState<DetectedStatementAccount | null>(null)
  const [bank, setBank] = useState<BankId | null>(null)
  const [needsPassword, setNeedsPassword] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)

  const stats = useMemo(() => {
    if (!rows) return null
    const included = rows.filter((r) => r.include)
    return {
      total: rows.length,
      selected: included.length,
      review: included.filter((r) => r.needsReview).length,
    }
  }, [rows])

  // Try the no-password path, then every saved password (newest-used first).
  // Throws PdfPasswordError only if none of those work, at which point the
  // route reveals the password input.
  async function autoUnlock(
    bytes: Uint8Array,
    manualPassword?: string,
  ): Promise<{ doc: ParsedDoc; unlockedBySaved: boolean }> {
    if (manualPassword) {
      return { doc: await parsePdf(bytes, manualPassword), unlockedBySaved: false }
    }
    try {
      return { doc: await parsePdf(bytes), unlockedBySaved: false }
    } catch (err) {
      if (!(err instanceof PdfPasswordError)) throw err
    }
    const saved = await passwordRepository.list()
    for (const sp of saved) {
      try {
        const doc = await parsePdf(bytes, sp.password)
        await passwordRepository.touch(sp.id)
        return { doc, unlockedBySaved: true }
      } catch (err) {
        if (!(err instanceof PdfPasswordError)) throw err
      }
    }
    throw new PdfPasswordError()
  }

  async function handleParse(
    bytes: Uint8Array,
    incomingFileName: string,
    password?: string,
    rememberPassword?: boolean,
  ) {
    setParsing(true)
    setError(null)
    setFileName(incomingFileName)
    try {
      const { doc, unlockedBySaved } = await autoUnlock(bytes, password)
      if (unlockedBySaved) toast.success('Unlocked with a saved password')
      // First-time manual unlock: persist if the user opted in.
      if (password && rememberPassword) {
        await passwordRepository.upsert({ password })
        toast.success('Password saved for future imports')
      }
      const extracted = extractTransactions(doc)
      if (extracted.candidates.length === 0) {
        setError(
          'No transactions could be extracted from this PDF. It may use an unsupported layout.',
        )
        return
      }
      const detectedAccount = detectStatementAccount(doc.text)
      const matched = detectedAccount
        ? findAccountByNumber(detectedAccount.number, accounts)
        : null
      setDetected(
        detectedAccount
          ? { number: detectedAccount.number, matched }
          : null,
      )
      setBank(extracted.bank)
      setRows(toReviewRows(extracted.candidates, accounts, matched))
    } catch (err) {
      if (err instanceof PdfPasswordError) {
        setNeedsPassword(true)
        setError(
          password
            ? 'Incorrect password. Please try again.'
            : 'This PDF is password protected. Enter the password to continue.',
        )
      } else {
        setError(`Could not parse the PDF: ${(err as Error).message}`)
      }
    } finally {
      setParsing(false)
    }
  }

  function updateRow(rowId: string, patch: Partial<ReviewRow>) {
    setRows(
      (prev) =>
        prev?.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)) ?? null,
    )
  }

  // Walks rows: any row whose counterparty matches the newly-registered own
  // account is flipped to transfer_external (statement account stays on the
  // opposite side from the new counterparty side).
  function reclassifyRowsForOwnAccount(account: Account): number {
    const ownNumbers = new Set(account.accountNumbers)
    let touched = 0
    setRows((prev) => {
      if (!prev) return prev
      return prev.map((r) => {
        if (!r.counterparty?.accountNumber) return r
        if (!ownNumbers.has(r.counterparty.accountNumber)) return r
        touched++
        const direction = r.direction
        const next: ReviewRow = {
          ...r,
          type: 'transfer_external',
          category: 'Rekening Sendiri',
          needsReview: false,
          confidence: Math.max(r.confidence, 0.9),
        }
        if (direction === 'debit') next.toAccountId = account.id
        else if (direction === 'credit') next.fromAccountId = account.id
        return next
      })
    })
    return touched
  }

  async function handleRegisterCounterparty(cp: DetectedCounterparty) {
    if (!cp.accountNumber) return
    const created = await createAccount({
      bank: cp.bank ?? 'Other',
      label: cp.name ?? cp.accountNumber,
      accountNumbers: [cp.accountNumber],
      isPocket: false,
    })
    const touched = reclassifyRowsForOwnAccount(created)
    addToast({
      message:
        touched > 0
          ? `Registered ${created.bank} — ${created.label}, reclassified ${touched} ${touched === 1 ? 'row' : 'rows'}`
          : `Registered ${created.bank} — ${created.label}`,
    })
  }

  async function handleImport() {
    if (!rows) return
    const included = rows.filter((r) => r.include)
    if (included.length === 0) return
    setImporting(true)
    try {
      const batchId = makeBatchId()
      const inputs: NewEntry[] = included.map((r) => ({
        date: r.date,
        time: r.time,
        amount: r.amount,
        type: r.type,
        category: r.category,
        note: r.note,
        needsReview: r.needsReview,
        confidence: r.confidence,
        source: 'import',
        importBatchId: batchId,
        rawText: r.rawText,
        ...(isTransfer(r.type)
          ? { fromAccountId: r.fromAccountId, toAccountId: r.toAccountId }
          : { accountId: r.accountId }),
      }))
      await createMany(inputs)
      // Persist a Batch record alongside so the entries page can filter +
      // rollback by import.
      let incomeTotal = 0
      let expenseTotal = 0
      for (const r of included) {
        if (r.type === 'income') incomeTotal += r.amount
        else if (r.type === 'expense') expenseTotal += r.amount
      }
      await createBatch({
        id: batchId,
        importedAt: new Date().toISOString(),
        bank: bank ?? 'generic',
        fileName: fileName ?? 'document.pdf',
        statementAccountId: detected?.matched?.id,
        entryCount: included.length,
        incomeTotal,
        expenseTotal,
      })
      await refresh()
      toast.success(
        `Imported ${included.length} ${included.length === 1 ? 'entry' : 'entries'}`,
        {
          // Keep this one around longer so the View-entries action is
          // reachable; the regular 4s isn't enough.
          duration: 12000,
          action: {
            label: 'View entries',
            onClick: () => navigate({ to: '/entries' }),
          },
        },
      )
      setRows(null)
      setDetected(null)
      setBank(null)
      setNeedsPassword(false)
      setFileName(null)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import statement</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Drop a bank statement PDF to extract transactions. Review the proposed
          entries, fix anything flagged, then import.
        </p>
      </div>

      {accounts.length === 0 && (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Tip: register your accounts on{' '}
          <Link to="/accounts" className="font-medium underline">
            Accounts
          </Link>{' '}
          first so transfers between your own banks are detected automatically.
        </p>
      )}

      {!rows ? (
        <ImportDropzone
          onParse={handleParse}
          parsing={parsing}
          error={error}
          needsPassword={needsPassword}
          onFileChange={() => {
            setNeedsPassword(false)
            setError(null)
          }}
        />
      ) : (
        <>
          {detected && (
            <div
              className={`rounded-md px-4 py-3 text-sm ${
                detected.matched
                  ? 'bg-sky-50 text-sky-800'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {detected.matched ? (
                <>
                  Statement account detected:{' '}
                  <span className="font-medium">
                    {detected.matched.bank} — {detected.matched.label}
                  </span>{' '}
                  (<span className="font-mono">{detected.number}</span>). It has
                  been pre-filled on each row.
                </>
              ) : (
                <>
                  Detected account{' '}
                  <span className="font-mono">{detected.number}</span> is not in
                  your registry.{' '}
                  <Link to="/accounts" className="font-medium underline">
                    Add it
                  </Link>{' '}
                  so transfers from this statement are auto-detected next time.
                </>
              )}
            </div>
          )}

          <DetectedAccountsPanel
            rows={rows}
            accounts={accounts}
            onRegister={handleRegisterCounterparty}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              {bank && bank !== 'generic' && (
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  {bank} adapter
                </span>
              )}
              <span>
                <span className="font-medium text-slate-900">
                  {stats?.selected}
                </span>{' '}
                of {stats?.total} selected
              </span>
              {stats && stats.review > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {stats.review} need review
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setRows(null)
                  setError(null)
                  setDetected(null)
                  setBank(null)
                }}
                disabled={importing}
                className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || (stats?.selected ?? 0) === 0}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-600/40 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:disabled:bg-emerald-900/50"
              >
                {importing
                  ? 'Importing…'
                  : `Import ${stats?.selected ?? 0} ${
                      (stats?.selected ?? 0) === 1 ? 'entry' : 'entries'
                    }`}
              </button>
            </div>
          </div>

          <ReviewTable rows={rows} accounts={accounts} onChange={updateRow} />
        </>
      )}
    </div>
  )
}
