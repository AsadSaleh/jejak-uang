import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { ImportDropzone } from '../components/ImportDropzone'
import { ReviewTable } from '../components/ReviewTable'
import { useAccounts } from '../dal/use-accounts'
import { useEntries } from '../dal/use-entries'
import { isTransfer, type NewEntry } from '../dal/types'
import { parsePdf, PdfPasswordError } from '../import/parse-pdf'
import { extractCandidates } from '../import/extract'
import { toReviewRows } from '../import/classify'
import { detectStatementAccount } from '../import/detect-account'
import { findAccountByNumber } from '../import/account-match'
import type { ReviewRow } from '../import/import-types'
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
  const { accounts } = useAccounts()
  const { createMany, refresh } = useEntries()

  const [rows, setRows] = useState<ReviewRow[] | null>(null)
  const [parsing, setParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importedCount, setImportedCount] = useState<number | null>(null)
  const [detected, setDetected] = useState<DetectedStatementAccount | null>(null)

  const stats = useMemo(() => {
    if (!rows) return null
    const included = rows.filter((r) => r.include)
    return {
      total: rows.length,
      selected: included.length,
      review: included.filter((r) => r.needsReview).length,
    }
  }, [rows])

  async function handleParse(
    bytes: Uint8Array,
    _fileName: string,
    password?: string,
  ) {
    setParsing(true)
    setError(null)
    setImportedCount(null)
    try {
      const doc = await parsePdf(bytes, password)
      const candidates = extractCandidates(doc.text)
      if (candidates.length === 0) {
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
      setRows(toReviewRows(candidates, accounts, matched))
    } catch (err) {
      if (err instanceof PdfPasswordError) {
        setError('Incorrect or missing password. Please try again.')
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

  async function handleImport() {
    if (!rows) return
    const included = rows.filter((r) => r.include)
    if (included.length === 0) return
    setImporting(true)
    try {
      const batchId = makeBatchId()
      const inputs: NewEntry[] = included.map((r) => ({
        date: r.date,
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
      await refresh()
      setImportedCount(included.length)
      setRows(null)
      setDetected(null)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import statement</h1>
        <p className="mt-1 text-sm text-slate-500">
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

      {importedCount !== null && (
        <p className="rounded-md bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Imported {importedCount}{' '}
          {importedCount === 1 ? 'entry' : 'entries'}.{' '}
          <Link to="/entries" className="font-medium underline">
            View entries
          </Link>
        </p>
      )}

      {!rows ? (
        <ImportDropzone onParse={handleParse} parsing={parsing} error={error} />
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

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">
                {stats?.selected}
              </span>{' '}
              of {stats?.total} selected
              {stats && stats.review > 0 && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
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
                }}
                disabled={importing}
                className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || (stats?.selected ?? 0) === 0}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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
