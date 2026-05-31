import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { Locale as DateFnsLocale } from 'date-fns'
import { id as idDateFns } from 'date-fns/locale'
import {
  STORAGE_KEY,
  detectLocale,
  readStoredLocale,
  type Locale,
} from './locale'
import {
  DICTS,
  interpolate,
  type TFunc,
  type TranslationKey,
} from './translations'

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: TFunc
  // date-fns locale object for the active language (undefined = default en-US).
  dfLocale: DateFnsLocale | undefined
}

const I18nContext = createContext<I18nContextValue | null>(null)

function applyHtmlLang(locale: Locale) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // First render uses a deterministic default on both server and client so
  // hydration matches; the saved/auto-detected preference is applied in the
  // effect below (mirrors ThemeProvider's approach).
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const next = readStoredLocale() ?? detectLocale()
    setLocaleState(next)
    applyHtmlLang(next)
  }, [])

  const setLocale = useCallback((l: Locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* ignore */
    }
    setLocaleState(l)
    applyHtmlLang(l)
  }, [])

  const value = useMemo<I18nContextValue>(() => {
    const dict = DICTS[locale]
    const t: TFunc = (key: TranslationKey, vars) =>
      interpolate(dict[key] ?? key, vars)
    return {
      locale,
      setLocale,
      t,
      dfLocale: locale === 'id' ? idDateFns : undefined,
    }
  }, [locale, setLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider')
  return ctx
}
