import type { Entry, EntryPatch, NewEntry } from './types'
import type { EntryRepository } from './repository'

const STORAGE_KEY = 'money-tracker.entries.v2'
const LEGACY_KEY = 'money-tracker.entries.v1'

function nowISO() {
  return new Date().toISOString()
}

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// Backfills fields added after v1 so older records stay valid.
function normalize(raw: Partial<Entry>): Entry {
  return {
    id: raw.id ?? makeId(),
    date: raw.date ?? '',
    amount: raw.amount ?? 0,
    type: raw.type ?? 'expense',
    category: raw.category ?? 'Other',
    note: raw.note ?? '',
    fromAccountId: raw.fromAccountId,
    toAccountId: raw.toAccountId,
    accountId: raw.accountId,
    needsReview: raw.needsReview ?? false,
    confidence: raw.confidence,
    source: raw.source ?? 'manual',
    importBatchId: raw.importBatchId,
    rawText: raw.rawText,
    createdAt: raw.createdAt ?? nowISO(),
    updatedAt: raw.updatedAt ?? nowISO(),
  }
}

function toEntry(input: NewEntry): Entry {
  return normalize({
    ...input,
    id: makeId(),
    createdAt: nowISO(),
    updatedAt: nowISO(),
  })
}

function readAll(): Entry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed.map(normalize) : []
    }
    // Migrate legacy v1 data on first read.
    const legacy = window.localStorage.getItem(LEGACY_KEY)
    if (legacy) {
      const parsed = JSON.parse(legacy)
      const migrated = Array.isArray(parsed) ? parsed.map(normalize) : []
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return migrated
    }
    return []
  } catch {
    return []
  }
}

function writeAll(entries: Entry[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export class LocalStorageEntryRepository implements EntryRepository {
  async list(): Promise<Entry[]> {
    return readAll().sort((a, b) => b.date.localeCompare(a.date))
  }

  async get(id: string): Promise<Entry | null> {
    return readAll().find((e) => e.id === id) ?? null
  }

  async create(input: NewEntry): Promise<Entry> {
    const entry = toEntry(input)
    const all = readAll()
    all.push(entry)
    writeAll(all)
    return entry
  }

  async createMany(inputs: NewEntry[]): Promise<Entry[]> {
    const created = inputs.map(toEntry)
    const all = readAll()
    all.push(...created)
    writeAll(all)
    return created
  }

  async update(id: string, patch: EntryPatch): Promise<Entry> {
    const all = readAll()
    const idx = all.findIndex((e) => e.id === id)
    if (idx === -1) throw new Error(`Entry not found: ${id}`)
    const updated: Entry = {
      ...all[idx],
      ...patch,
      updatedAt: nowISO(),
    }
    all[idx] = updated
    writeAll(all)
    return updated
  }

  async remove(id: string): Promise<void> {
    const all = readAll().filter((e) => e.id !== id)
    writeAll(all)
  }

  async removeMany(ids: string[]): Promise<void> {
    const set = new Set(ids)
    writeAll(readAll().filter((e) => !set.has(e.id)))
  }

  async restore(entries: Entry[]): Promise<void> {
    const all = readAll()
    const existing = new Set(all.map((e) => e.id))
    for (const e of entries) {
      if (!existing.has(e.id)) all.push(normalize(e))
    }
    writeAll(all)
  }

  async clear(): Promise<void> {
    writeAll([])
  }
}
