import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AccountForm } from '../components/AccountForm'
import { EntryForm } from '../components/EntryForm'
import { useAccounts } from '../dal/use-accounts'
import { useEntries } from '../dal/use-entries'
import { markOnboarded } from '../lib/app-data'
import { useI18n } from '../i18n/I18nProvider'
import type { TranslationKey } from '../i18n/translations'

export const Route = createFileRoute('/onboarding')({ component: Onboarding })

const STEPS: { n: number; titleKey: TranslationKey }[] = [
  { n: 1, titleKey: 'onboarding.step1Title' },
  { n: 2, titleKey: 'onboarding.step2Title' },
  { n: 3, titleKey: 'onboarding.step3Title' },
]

function Onboarding() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const { create: createAccount } = useAccounts()
  const { create: createEntry } = useEntries()
  const [step, setStep] = useState<1 | 2>(1)

  function finish() {
    markOnboarded()
    navigate({ to: '/' })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t('onboarding.welcomeTitle')}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {t('onboarding.welcomeSubtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={finish}
          className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          {t('onboarding.skip')}
        </button>
      </div>

      <Stepper current={step} />

      {step === 1 ? (
        <section className="space-y-3">
          <StepHeading
            title={t('onboarding.step1Heading')}
            blurb={t('onboarding.step1Desc')}
          />
          <AccountForm
            submitLabel={t('onboarding.step1Submit')}
            onSubmit={async (input) => {
              await createAccount(input)
              toast.success(t('onboarding.accountAdded'))
              setStep(2)
            }}
          />
        </section>
      ) : (
        <section className="space-y-3">
          <StepHeading
            title={t('onboarding.step2Heading')}
            blurb={t('onboarding.step2Desc')}
          />
          <EntryForm
            submitLabel={t('onboarding.step2Submit')}
            onCancel={() => setStep(1)}
            onSubmit={async (input) => {
              await createEntry({ ...input, source: 'manual' })
              toast.success(t('onboarding.transactionAdded'))
              finish()
            }}
          />
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            {t('onboarding.cancelHint')}
          </p>
        </section>
      )}
    </div>
  )
}

function Stepper({ current }: { current: number }) {
  const { t } = useI18n()
  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const done = s.n < current
        const active = s.n === current
        return (
          <li key={s.n} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={[
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                  done
                    ? 'bg-emerald-500 text-white'
                    : active
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                ].join(' ')}
              >
                {done ? <Check className="h-4 w-4" /> : s.n}
              </span>
              <div className="hidden sm:block">
                <p
                  className={[
                    'text-xs font-medium',
                    active
                      ? 'text-slate-900 dark:text-slate-100'
                      : 'text-slate-500 dark:text-slate-400',
                  ].join(' ')}
                >
                  {t(s.titleKey)}
                </p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function StepHeading({ title, blurb }: { title: string; blurb: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{blurb}</p>
    </div>
  )
}
