import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  AlertTriangle,
  KeyRound,
  Palette,
  PlayCircle,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { LanguageToggle } from '../components/LanguageToggle'
import { ThemeToggle } from '../components/ThemeToggle'
import { passwordRepository } from '../dal'
import { useI18n } from '../i18n/I18nProvider'
import { clearAllAppData } from '../lib/app-data'

export const Route = createFileRoute('/settings')({ component: SettingsPage })

function SettingsPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
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
      toast.info(t('settings.noPasswords'))
      return
    }
    if (!confirm(t('settings.confirmDeletePasswords'))) return
    await passwordRepository.clear()
    await refreshPasswords()
    toast.success(t('settings.passwordsDeleted'))
  }

  function clearEverything() {
    if (!confirm(t('settings.confirmClear'))) return
    const typed = prompt(t('settings.confirmClearType'))
    if (typed !== 'DELETE') {
      toast.info(t('settings.clearCancelled'))
      return
    }
    const removed = clearAllAppData()
    toast.success(t('settings.clearedToast', { count: removed }))
    // Hard reload so every hook/repository re-reads from the now-empty store.
    if (typeof window !== 'undefined') window.location.href = '/'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t('settings.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {t('settings.subtitle')}
        </p>
      </div>

      {/* Appearance + language */}
      <Section
        icon={<Palette className="h-5 w-5" />}
        title={t('settings.appearanceTitle')}
        description={t('settings.appearanceDesc')}
      >
        <div className="space-y-4">
          <div>
            <Label>{t('settings.themeLabel')}</Label>
            <div className="mt-1 max-w-xs">
              <ThemeToggle fullWidth />
            </div>
          </div>
          <div>
            <Label>{t('settings.languageLabel')}</Label>
            <div className="mt-1 max-w-xs">
              <LanguageToggle />
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          {t('settings.languageDesc')}
        </p>
      </Section>

      {/* Tutorial */}
      <Section
        icon={<PlayCircle className="h-5 w-5" />}
        title={t('settings.tutorialTitle')}
        description={t('settings.tutorialDesc')}
      >
        <button
          type="button"
          onClick={() => navigate({ to: '/onboarding' })}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          {t('settings.playTutorial')}
        </button>
      </Section>

      {/* Saved document passwords */}
      <Section
        icon={<KeyRound className="h-5 w-5" />}
        title={t('settings.passwordsTitle')}
        description={
          passwordCount === null || passwordCount === 0
            ? t('settings.passwordsDescNone')
            : t('settings.passwordsDescCount', { count: passwordCount })
        }
      >
        <button
          type="button"
          onClick={deletePasswords}
          disabled={passwordCount === 0}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800"
        >
          {t('settings.deletePasswords')}
        </button>
      </Section>

      {/* Danger zone */}
      <Section
        danger
        icon={<AlertTriangle className="h-5 w-5" />}
        title={t('settings.dangerTitle')}
        description={t('settings.dangerDesc')}
      >
        <button
          type="button"
          onClick={clearEverything}
          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700"
        >
          {t('settings.clearAll')}
        </button>
      </Section>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
      {children}
    </span>
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
