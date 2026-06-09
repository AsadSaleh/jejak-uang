import { createFileRoute } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { AccountForm } from '../components/AccountForm'
import { SidePanel } from '../components/SidePanel'
import { useAccounts } from '../dal/use-accounts'
import { bankFor } from '../lib/banks'
import { useI18n } from '../i18n/I18nProvider'
import type { Account } from '../dal/types'

export const Route = createFileRoute('/accounts')({ component: AccountsPage })

function AccountsPage() {
  const { accounts, loading, create, update, remove } = useAccounts()
  const { t } = useI18n()
  const [editing, setEditing] = useState<Account | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(account: Account) {
    setEditing(account)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditing(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('accounts.title')}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('accounts.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          <Plus className="h-4 w-4" /> {t('accounts.add')}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr className="text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <th className="px-4 py-3">{t('accounts.colBank')}</th>
              <th className="px-4 py-3">{t('accounts.colLabel')}</th>
              <th className="px-4 py-3">{t('accounts.colNumbers')}</th>
              <th className="px-4 py-3 text-right">{t('accounts.colActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                  {t('common.loading')}
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500">
                  {t('accounts.empty')}
                </td>
              </tr>
            ) : (
              accounts.map((acc) => (
                <tr
                  key={acc.id}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800 ${editing?.id === acc.id ? 'bg-amber-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      <img
                        src={bankFor(acc.bank).logo}
                        alt=""
                        aria-hidden
                        className="h-5 w-5 shrink-0 rounded"
                      />
                      <span className="font-medium">{acc.bank}</span>
                      {acc.isPocket && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          {t('accounts.pocketBadge')}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">{acc.label}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {acc.accountNumbers.length
                      ? acc.accountNumbers.join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(acc)}
                        className="rounded px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {t('accounts.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(t('accounts.confirmDelete'))) {
                            if (editing?.id === acc.id) closeForm()
                            await remove(acc.id)
                          }
                        }}
                        className="rounded px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        {t('accounts.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <SidePanel
        open={formOpen}
        onClose={closeForm}
        title={editing ? t('accounts.editTitle') : t('accounts.add')}
      >
        <AccountForm
          key={editing?.id ?? 'new'}
          initial={editing}
          submitLabel={editing ? t('accounts.update') : t('accounts.add')}
          onCancel={closeForm}
          onSubmit={async (input) => {
            if (editing) {
              await update(editing.id, input)
            } else {
              await create(input)
            }
            closeForm()
          }}
        />
      </SidePanel>
    </div>
  )
}
