import { Languages } from 'lucide-react'
import { useI18n } from '../i18n/I18nProvider'
import { LOCALES, LOCALE_LABELS, type Locale } from '../i18n/locale'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from './ui/select'

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n()
  return (
    <Select value={locale} onValueChange={(v) => setLocale(v as Locale)}>
      <SelectTrigger aria-label={t('language.change')} className="w-full">
        <span className="flex items-center gap-2">
          <Languages className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          {LOCALE_LABELS[locale]}
        </span>
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((l) => (
          <SelectItem key={l} value={l}>
            {LOCALE_LABELS[l]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
