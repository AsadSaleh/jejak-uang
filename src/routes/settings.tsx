import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AlertTriangle, KeyRound, PlayCircle } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { passwordRepository } from '../dal'
import { clearAllAppData } from '../lib/app-data'

export const Route = createFileRoute('/settings')({ component: SettingsPage })

function SettingsPage() {
  const navigate = useNavigate()
  const [passwordCount, setPasswordCount] = useState<number | null>(null)

  const refreshPasswords = useCallback(async () => {
    try {
      setPasswordCount((await passwordRepository.list()).length)
    } catch {
      setPasswordCount(0)
    }
  }, [])

  useEffect(() => {
    void refreshPasswords()
  }, [refreshPasswords])

  async function deletePasswords() {
    if (passwordCount === 0) {
      toast.info('No saved passwords to delete.')
      return
    }
    if (
      !confirm(
        'Delete all saved document passwords? Encrypted statements will ask for the password again on the next import.',
      )
    )
      return
    await passwordRepository.clear()
    await refreshPasswords()
    toast.success('Saved passwords deleted')
  }

  function clearEverything() {
    const first = confirm(
      'This permanently deletes ALL app data — transactions, accounts, import history, saved passwords and preferences. This cannot be undone.\n\nContinue?',
    )
    if (!first) return
    const typed = prompt('Type DELETE to confirm clearing all app data.')
    if (typed !== 'DELETE') {
      toast.info('Cancelled — nothing was deleted.')
      return
    }
    const removed = clearAllAppData()
    toast.success(`Cleared ${removed} stored item${removed === 1 ? '' : 's'}.`)
    // Hard reload so every hook/repository re-reads from the now-empty store.
    if (typeof window !== 'undefined') window.location.href = '/'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Replay the tutorial and manage the data this app keeps on your device.
        </p>
      </div>

      {/* Tutorial */}
      <Section
        icon={<PlayCircle className="h-5 w-5" />}
        title="Tutorial"
        description="Walk through adding an account and a transaction again. Your existing data is left untouched."
      >
        <button
          type="button"
          onClick={() => navigate({ to: '/onboarding' })}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          Play tutorial again
        </button>
      </Section>

      {/* Saved document passwords */}
      <Section
        icon={<KeyRound className="h-5 w-5" />}
        title="Saved document passwords"
        description={
          passwordCount === null
            ? 'Passwords used to unlock encrypted bank statements during import.'
            : `${passwordCount} password${passwordCount === 1 ? '' : 's'} saved for unlocking encrypted statements during import.`
        }
      >
        <button
          type="button"
          onClick={deletePasswords}
          disabled={passwordCount === 0}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800"
        >
          Delete saved document's password
        </button>
      </Section>

      {/* Danger zone */}
      <Section
        danger
        icon={<AlertTriangle className="h-5 w-5" />}
        title="Danger zone"
        description="Wipe everything — transactions, accounts, import history, saved passwords and preferences — and start completely fresh. This cannot be undone."
      >
        <button
          type="button"
          onClick={clearEverything}
          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700"
        >
          Clear all app data and start fresh
        </button>
      </Section>
    </div>
  )
}

function Section({
  icon,
  title,
  description,
  danger = false,
  children,
}: {
  icon: React.ReactNode
  title: string
  description: string
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <section
      className={[
        'rounded-xl bg-white p-5 shadow-sm ring-1 dark:bg-slate-900',
        danger
          ? 'ring-rose-200 dark:ring-rose-900/60'
          : 'ring-slate-200 dark:ring-slate-800',
      ].join(' ')}
    >
      <div className="flex items-start gap-3">
        <span
          className={[
            'mt-0.5 shrink-0',
            danger
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-500 dark:text-slate-400',
          ].join(' ')}
        >
          {icon}
        </span>
        <div className="flex-1">
          <h2
            className={[
              'text-base font-semibold',
              danger ? 'text-rose-700 dark:text-rose-400' : '',
            ].join(' ')}
          >
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </section>
  )
}
