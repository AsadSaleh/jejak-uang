// Everything Jejak Uang persists lives in localStorage under one of these two
// prefixes (the `money-tracker.*` keys are the pre-rebrand legacy ones that the
// repositories still migrate from). Clearing both wipes the app back to a fresh
// install — entries, accounts, import batches, saved PDF passwords, theme and
// table preferences alike.
const APP_PREFIXES = ['jejak-uang.', 'money-tracker.']

// Remove every app-owned key, returning how many were cleared.
export function clearAllAppData(): number {
  if (typeof window === 'undefined') return 0
  const keys: string[] = []
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i)
    if (key && APP_PREFIXES.some((p) => key.startsWith(p))) keys.push(key)
  }
  keys.forEach((k) => window.localStorage.removeItem(k))
  return keys.length
}

// Whether the user has already been through (or skipped) the onboarding tour.
const ONBOARDING_KEY = 'jejak-uang.onboarding.v1'

export function hasOnboarded(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) === 'done'
  } catch {
    return true
  }
}

export function markOnboarded(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(ONBOARDING_KEY, 'done')
  } catch {
    /* ignore */
  }
}
