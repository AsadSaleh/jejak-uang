import type { ImportBatch, NewImportBatch } from './types'

export interface BatchRepository {
  list(): Promise<ImportBatch[]>
  get(id: string): Promise<ImportBatch | null>
  create(input: NewImportBatch): Promise<ImportBatch>
  remove(id: string): Promise<void>
}
