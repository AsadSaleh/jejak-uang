import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AccountForm } from '../components/AccountForm'
import { useAccounts } from '../dal/use-accounts'
import type { Account } from '../dal/types'

export const Route = createFileRoute('/accounts')({ component: AccountsPage })

function AccountsPage() {
  const { accounts, loading, create, update, remove } = useAccounts()
  const [editing, setEditing] = useState<Account | null>(null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
        <p className="mt-1 text-sm text-slate-500">
          Register your own bank accounts and pockets. These let the importer
          tell an internal/external transfer apart from a regular expense.
        </p>
      </div>

      <AccountForm
        key={editing?.id ?? 'new'}
        initial={editing}
        submitLabel={editing ? 'Update account' : 'Add account'}
        onCancel={editing ? () => setEditing(null) : undefined}
        onSubmit={async (input) => {
          if (editing) {
            await update(editing.id, input)
            setEditing(null)
          } else {
            await create(input)
          }
        }}
      />

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Bank</th>
              <th className="px-4 py-3">Label</th>
              <th className="px-4 py-3">Account numbers</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Loading…
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                  No accounts yet. Add your Jago pockets and other banks above.
                </td>
              </tr>
            ) : (
              accounts.map((acc) => (
                <tr
                  key={acc.id}
                  className={`hover:bg-slate-50 ${editing?.id === acc.id ? 'bg-amber-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <span className="font-medium">{acc.bank}</span>
                      {acc.isPocket && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          pocket
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">{acc.label}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {acc.accountNumbers.length
                      ? acc.accountNumbers.join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(acc)}
                        className="rounded px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm('Delete this account?')) {
                            if (editing?.id === acc.id) setEditing(null)
                            await remove(acc.id)
                          }
                        }}
                        className="rounded px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
