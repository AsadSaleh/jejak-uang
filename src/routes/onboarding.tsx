import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AccountForm } from '../components/AccountForm'
import { EntryForm } from '../components/EntryForm'
import { useAccounts } from '../dal/use-accounts'
import { useEntries } from '../dal/use-entries'
import { markOnboarded } from '../lib/app-data'

export const Route = createFileRoute('/onboarding')({ component: Onboarding })

const STEPS = [
  { n: 1, title: 'Add an account', blurb: 'Register a bank or pocket.' },
  { n: 2, title: 'Add a transaction', blurb: 'Record one entry by hand.' },
  { n: 3, title: 'See your dashboard', blurb: 'You are all set.' },
]

function Onboarding() {
  const navigate = useNavigate()
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
            Welcome to Jejak Uang 👋
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Two quick steps and you'll have your first numbers on the dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={finish}
          className="shrink-0 rounded-md px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Skip
        </button>
      </div>

      <Stepper current={step} />

      {step === 1 ? (
        <section className="space-y-3">
          <StepHeading
            n={1}
            title="Add an account"
            blurb="Pick your bank and give it a label. You can add the rest later from the Accounts page."
          />
          <AccountForm
            submitLabel="Add account & continue"
            onSubmit={async (input) => {
              await createAccount(input)
              toast.success('Account added')
              setStep(2)
            }}
          />
        </section>
      ) : (
        <section className="space-y-3">
          <StepHeading
            n={2}
            title="Add a transaction"
            blurb="Log one income or expense by hand so the dashboard has something to show."
          />
          <EntryForm
            submitLabel="Add transaction & finish"
            onCancel={() => setStep(1)}
            onSubmit={async (input) => {
              await createEntry({ ...input, source: 'manual' })
              toast.success('Transaction added')
              finish()
            }}
          />
          <p className="text-center text-xs text-slate-400 dark:text-slate-500">
            (Cancel takes you back to the account step.)
          </p>
        </section>
      )}
    </div>
  )
}

function Stepper({ current }: { current: number }) {
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
                  {s.title}
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

function StepHeading({
  n,
  title,
  blurb,
}: {
  n: number
  title: string
  blurb: string
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold tracking-tight">
        Step {n}: {title}
      </h2>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{blurb}</p>
    </div>
  )
}
