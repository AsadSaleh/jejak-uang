import type { Entry, EntryPatch, NewEntry } from './types'
import type { EntryRepository } from './repository'

const STORAGE_KEY = 'money-tracker.entries.v1'

function nowISO() {
  return new Date().toISOString()
}

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function readAll(): Entry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Entry[]) : []
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
    const entry: Entry = {
      ...input,
      id: makeId(),
      createdAt: nowISO(),
      updatedAt: nowISO(),
    }
    const all = readAll()
    all.push(entry)
    writeAll(all)
    return entry
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

  async clear(): Promise<void> {
    writeAll([])
  }
}
