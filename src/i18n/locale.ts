export type Locale = 'en' | 'id'

export const LOCALES: Locale[] = ['en', 'id']

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  id: 'Bahasa Indonesia',
}

export const STORAGE_KEY = 'jejak-uang.lang'
export const LEGACY_STORAGE_KEY = 'money-tracker.lang'

export function isLocale(v: unknown): v is Locale {
  return v === 'en' || v === 'id'
}

// Read a previously saved preference (new key first, then the legacy one).
export function readStoredLocale(): Locale | null {
  if (typeof window === 'undefined') return null
  try {
    const v =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_STORAGE_KEY)
    return isLocale(v) ? v : null
  } catch {
    return null
  }
}

// Best-effort guess from the browser. Anything Indonesian → 'id', else 'en'.
export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en'
  const langs = [navigator.language, ...(navigator.languages ?? [])]
  for (const l of langs) {
    if (l && l.toLowerCase().startsWith('id')) return 'id'
  }
  return 'en'
}
