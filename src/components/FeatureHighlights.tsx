import {
  BarChart3,
  FileText,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import type { TranslationKey } from '../i18n/translations'

const FEATURES: {
  icon: LucideIcon
  titleKey: TranslationKey
  descKey: TranslationKey
}[] = [
  {
    icon: ShieldCheck,
    titleKey: 'features.privateTitle',
    descKey: 'features.privateDesc',
  },
  {
    icon: FileText,
    titleKey: 'features.importTitle',
    descKey: 'features.importDesc',
  },
  {
    icon: BarChart3,
    titleKey: 'features.dashboardTitle',
    descKey: 'features.dashboardDesc',
  },
  {
    icon: Smartphone,
    titleKey: 'features.everywhereTitle',
    descKey: 'features.everywhereDesc',
  },
]

export function FeatureHighlights() {
  const { t } = useI18n()
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('features.title')}
      </h2>
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, titleKey, descKey }) => (
          <li key={titleKey} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {t(titleKey)}
              </p>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {t(descKey)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
