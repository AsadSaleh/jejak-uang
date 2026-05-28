import { useCallback, useEffect, useState } from 'react'
import { entryRepository } from './index'
import type { Entry, EntryPatch, NewEntry } from './types'

export interface UseEntriesResult {
  entries: Entry[]
  loading: boolean
  error: Error | null
  create: (input: NewEntry) => Promise<Entry>
  createMany: (inputs: NewEntry[]) => Promise<Entry[]>
  update: (id: string, patch: EntryPatch) => Promise<Entry>
  remove: (id: string) => Promise<void>
  removeMany: (ids: string[]) => Promise<void>
  restore: (entries: Entry[]) => Promise<void>
  refresh: () => Promise<void>
}

export function useEntries(): UseEntriesResult {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const all = await entryRepository.list()
      setEntries(all)
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
    async (input: NewEntry) => {
      const created = await entryRepository.create(input)
      await refresh()
      return created
    },
    [refresh],
  )

  const createMany = useCallback(
    async (inputs: NewEntry[]) => {
      const created = await entryRepository.createMany(inputs)
      await refresh()
      return created
    },
    [refresh],
  )

  const update = useCallback(
    async (id: string, patch: EntryPatch) => {
      const updated = await entryRepository.update(id, patch)
      await refresh()
      return updated
    },
    [refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      await entryRepository.remove(id)
      await refresh()
    },
    [refresh],
  )

  const removeMany = useCallback(
    async (ids: string[]) => {
      await entryRepository.removeMany(ids)
      await refresh()
    },
    [refresh],
  )

  const restore = useCallback(
    async (toRestore: Entry[]) => {
      await entryRepository.restore(toRestore)
      await refresh()
    },
    [refresh],
  )

  return {
    entries,
    loading,
    error,
    create,
    createMany,
    update,
    remove,
    removeMany,
    restore,
    refresh,
  }
}
