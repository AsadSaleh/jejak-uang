import type { ImportBatch, NewImportBatch } from './types'
import type { BatchRepository } from './batch-repository'

const STORAGE_KEY = 'money-tracker.batches.v1'

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function readAll(): ImportBatch[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ImportBatch[]) : []
  } catch {
    return []
  }
}

function writeAll(batches: ImportBatch[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(batches))
}

export class LocalStorageBatchRepository implements BatchRepository {
  async list(): Promise<ImportBatch[]> {
    // Newest first.
    return readAll().sort((a, b) => b.importedAt.localeCompare(a.importedAt))
  }

  async get(id: string): Promise<ImportBatch | null> {
    return readAll().find((b) => b.id === id) ?? null
  }

  async create(input: NewImportBatch): Promise<ImportBatch> {
    const batch: ImportBatch = { ...input, id: input.id ?? makeId() }
    const all = readAll()
    all.push(batch)
    writeAll(all)
    return batch
  }

  async remove(id: string): Promise<void> {
    writeAll(readAll().filter((b) => b.id !== id))
  }
}
