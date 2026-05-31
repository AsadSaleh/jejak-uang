import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTheme, type Theme } from './ThemeProvider'
import { useI18n } from '../i18n/I18nProvider'
import type { TranslationKey } from '../i18n/translations'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from './ui/select'

const ICONS: Record<Theme, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const OPTIONS: { value: Theme; labelKey: TranslationKey; icon: LucideIcon }[] = [
  { value: 'light', labelKey: 'theme.light', icon: Sun },
  { value: 'dark', labelKey: 'theme.dark', icon: Moon },
  { value: 'system', labelKey: 'theme.system', icon: Monitor },
]

export function ThemeToggle({ fullWidth = false }: { fullWidth?: boolean }) {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()
  const Icon = ICONS[theme]
  const current = OPTIONS.find((o) => o.value === theme)
  return (
    <Select value={theme} onValueChange={(v) => setTheme(v as Theme)}>
      <SelectTrigger
        aria-label={t('theme.change')}
        className={
          fullWidth
            ? 'w-full'
            : 'h-8 w-auto gap-1 border-0 bg-transparent px-2 py-1 shadow-none ring-0 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-2 dark:hover:bg-slate-800'
        }
      >
        {fullWidth ? (
          <span className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            {current && t(current.labelKey)}
          </span>
        ) : (
          <Icon className="h-4 w-4 text-slate-600 dark:text-slate-300" />
        )}
      </SelectTrigger>
      <SelectContent align="end">
        {OPTIONS.map(({ value, labelKey, icon: ItemIcon }) => (
          <SelectItem key={value} value={value}>
            <ItemIcon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            {t(labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
