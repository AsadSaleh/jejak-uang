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
import { BANKS } from '../lib/banks'
import { toReviewRows } from '../import/classify'
import { detectStatementAccount } from '../import/detect-account'
import { findAccountByNumber } from '../import/account-match'
import { useI18n } from '../i18n/I18nProvider'
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
  const { t } = useI18n()
  const entriesWord = (n: number) =>
    n === 1 ? t('common.entry') : t('common.entries')

  const [rows, setRows] = useState<ReviewRow[] | null>(null)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [detected, setDetected] = useState<DetectedStatementAccount | null>(null)
  const [addingAccount, setAddingAccount] = useState(false)
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
      if (unlockedBySaved) toast.success(t('import.unlockedSaved'))
      // First-time manual unlock: persist if the user opted in.
      if (password && rememberPassword) {
        await passwordRepository.upsert({ password })
        toast.success(t('import.passwordSaved'))
      }
      const extracted = extractTransactions(doc)
      if (extracted.candidates.length === 0) {
        setError(t('import.noTransactions'))
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
            ? t('import.incorrectPassword')
            : t('import.passwordProtected'),
        )
      } else {
        setError(t('import.parseError', { message: (err as Error).message }))
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
    const label = `${created.bank} — ${created.label}`
    addToast({
      message:
        touched > 0
          ? t('import.registeredReclass', {
              label,
              count: touched,
              rows: touched === 1 ? t('import.row') : t('import.rows'),
            })
          : t('import.registered', { label }),
    })
  }

  // Fills the statement's own account onto every row that lacks it, mirroring
  // classify.ts's applyStatementAccount: income/expense get accountId; transfers
  // get the side opposite the money flow (debit leaves, credit enters).
  function applyStatementAccountToRows(account: Account): number {
    if (!rows) return 0
    let touched = 0
    const next = rows.map((r) => {
      if (r.type === 'income' || r.type === 'expense') {
        if (r.accountId) return r
        touched++
        return { ...r, accountId: account.id }
      }
      if (r.direction === 'debit' && !r.fromAccountId) {
        touched++
        return { ...r, fromAccountId: account.id }
      }
      if (r.direction === 'credit' && !r.toAccountId) {
        touched++
        return { ...r, toAccountId: account.id }
      }
      return r
    })
    setRows(next)
    return touched
  }

  // Registers the detected statement account inline and back-fills it onto the
  // already-parsed rows, so the user never has to leave the import page.
  async function handleAddStatementAccount() {
    if (!detected || detected.matched || addingAccount) return
    setAddingAccount(true)
    try {
      const bankName = BANKS.find((b) => b.id === bank)?.name ?? 'Other'
      const created = await createAccount({
        bank: bankName,
        label: `••••${detected.number.slice(-4)} (Auto created)`,
        accountNumbers: [detected.number],
        isPocket: false,
      })
      const touched = applyStatementAccountToRows(created)
      setDetected({ number: detected.number, matched: created })
      const label = `${created.bank} — ${created.label}`
      addToast({
        message:
          touched > 0
            ? t('import.statementAddedFilled', {
                label,
                count: touched,
                rows: touched === 1 ? t('import.row') : t('import.rows'),
              })
            : t('import.statementAdded', { label }),
      })
    } finally {
      setAddingAccount(false)
    }
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
        `${t('import.importedToast', { count: included.length })} ${entriesWord(included.length)}`,
        {
          // Keep this one around longer so the View-entries action is
          // reachable; the regular 4s isn't enough.
          duration: 12000,
          action: {
            label: t('import.viewEntries'),
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
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('import.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('import.subtitle')}
        </p>
      </div>

      {accounts.length === 0 && (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {t('import.tip1')}{' '}
          <Link to="/accounts" className="font-medium underline">
            {t('nav.accounts')}
          </Link>{' '}
          {t('import.tip2')}
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
              className={`flex flex-wrap items-center justify-between gap-3 rounded-md px-4 py-3 text-sm ${
                detected.matched
                  ? 'bg-sky-50 text-sky-800'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {detected.matched ? (
                <span>
                  {t('import.detectedMatched')}{' '}
                  <span className="font-medium">
                    {detected.matched.bank} — {detected.matched.label}
                  </span>{' '}
                  (<span className="font-mono">{detected.number}</span>).{' '}
                  {t('import.detectedMatchedTail')}
                </span>
              ) : (
                <>
                  <span>
                    {t('import.detectedUnmatched')}{' '}
                    <span className="font-mono">{detected.number}</span>{' '}
                    {t('import.detectedUnmatchedMid')}{' '}
                    {t('import.detectedUnmatchedTail')}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleAddStatementAccount()}
                    disabled={addingAccount}
                    className="shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {addingAccount ? t('common.saving') : t('import.addIt')}
                  </button>
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
                  {t('import.adapter', { bank })}
                </span>
              )}
              <span>
                {t('import.selectedOf', {
                  selected: stats?.selected ?? 0,
                  total: stats?.total ?? 0,
                })}
              </span>
              {stats && stats.review > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {t('import.needReview', { count: stats.review })}
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
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || (stats?.selected ?? 0) === 0}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-600/40 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:disabled:bg-emerald-900/50"
              >
                {importing
                  ? t('import.importing')
                  : `${t('import.importBtn', { count: stats?.selected ?? 0 })} ${entriesWord(stats?.selected ?? 0)}`}
              </button>
            </div>
          </div>

          <ReviewTable rows={rows} accounts={accounts} onChange={updateRow} />
        </>
      )}
    </div>
  )
}
