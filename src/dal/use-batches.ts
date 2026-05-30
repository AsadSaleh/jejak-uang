import { useCallback, useEffect, useState } from 'react'
import { batchRepository } from './index'
import type { ImportBatch, NewImportBatch } from './types'

export interface UseBatchesResult {
  batches: ImportBatch[]
  loading: boolean
  error: Error | null
  create: (input: NewImportBatch) => Promise<ImportBatch>
  remove: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useBatches(): UseBatchesResult {
  const [batches, setBatches] = useState<ImportBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    // See use-entries.ts: don't flip loading on background refreshes.
    try {
      setBatches(await batchRepository.list())
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
    async (input: NewImportBatch) => {
      const created = await batchRepository.create(input)
      await refresh()
      return created
    },
    [refresh],
  )

  const remove = useCallback(
    async (id: string) => {
      await batchRepository.remove(id)
      await refresh()
    },
    [refresh],
  )

  return { batches, loading, error, create, remove, refresh }
}
