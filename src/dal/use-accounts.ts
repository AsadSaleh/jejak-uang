import { useCallback, useEffect, useState } from 'react'
import { accountRepository } from './index'
import type { Account, AccountPatch, NewAccount } from './types'

export interface UseAccountsResult {
  accounts: Account[]
  loading: boolean
  error: Error | null
  create: (input: NewAccount) => Promise<Account>
  update: (id: string, patch: AccountPatch) => Promise<Account>
  remove: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useAccounts(): UseAccountsResult {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setAccounts(await accountRepository.list())
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const create = useCallback(
    async (input: NewAccount) => {
      const created = await accountRepository.create(input)
      await refresh()
      return created
    },
    [refresh],
  )

  const update = useCallback(
    async (id: string, patch: AccountPatch) => {
      const updated = await accountRepository.update(id, patch)
      await refresh()
      return updated
    },
    [refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      await accountRepository.remove(id)
      await refresh()
    },
    [refresh],
  )

  return { accounts, loading, error, create, update, remove, refresh }
}
