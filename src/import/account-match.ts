import type { Account } from '../dal/types'

// Matches registered account numbers against free text (statement lines or
// headers), ignoring spaces and dashes. Shared by the classifier and the
// statement-account detector.

function compact(s: string): string {
  return s.replace(/[\s-]/g, '')
}

export function findAccountsByNumber(
  text: string,
  accounts: Account[],
): Account[] {
  const haystack = compact(text)
  return accounts.filter((a) =>
    a.accountNumbers.some((n) => {
      const num = compact(n)
      return num.length >= 4 && haystack.includes(num)
    }),
  )
}

export function findAccountByNumber(
  text: string,
  accounts: Account[],
): Account | null {
  return findAccountsByNumber(text, accounts)[0] ?? null
}
