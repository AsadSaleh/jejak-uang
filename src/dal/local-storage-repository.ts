import type { Entry, EntryPatch, EntryType, NewEntry } from './types'
import type { EntryRepository } from './repository'
import { guessCategory } from '../lib/category-map'

const STORAGE_KEY = 'money-tracker.entries.v2'
const LEGACY_KEY = 'money-tracker.entries.v1'

// Direct translations for legacy English category labels -> Bahasa Indonesia.
// "Food" and "Utilities" are special-cased: we re-run the keyword guesser so
// old rows can be split into Kopi / Makan and Listrik / Pulsa / Internet / Air.
const CATEGORY_TRANSLATIONS: Record<string, string> = {
  // 2026-05 rename: tea chains moved into the coffee category.
  Kopi: 'Kopi & Teh',
  Groceries: 'Belanja Harian',
  Transport: 'Transportasi',
  Housing: 'Tempat Tinggal',
  Entertainment: 'Hiburan',
  Health: 'Kesehatan',
  Shopping: 'Belanja',
  Education: 'Pendidikan',
  Other: 'Lainnya',
  Salary: 'Gaji',
  Investment: 'Investasi',
  Gift: 'Hadiah',
  'Pocket Transfer': 'Antar Kantong',
  Savings: 'Tabungan',
  'Own Account': 'Rekening Sendiri',
}

function translateCategory(
  category: string,
  type: EntryType,
  text: string,
  amount: number,
): string {
  if (category === 'Food') return guessCategory(text, type, amount) ?? 'Makan'
  if (category === 'Utilities')
    return guessCategory(text, type, amount) ?? 'Listrik'
  return CATEGORY_TRANSLATIONS[category] ?? category
}

function nowISO() {
  return new Date().toISOString()
}

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// Backfills fields added after v1 so older records stay valid, and translates
// legacy English category labels into Bahasa Indonesia (idempotent — already-
// translated labels pass through unchanged).
function normalize(raw: Partial<Entry>): Entry {
  const type: EntryType = raw.type ?? 'expense'
  const text = `${raw.rawText ?? ''} ${raw.note ?? ''}`
  return {
    id: raw.id ?? makeId(),
    date: raw.date ?? '',
    time: raw.time,
    amount: raw.amount ?? 0,
    type,
    category: translateCategory(
      raw.category ?? 'Lainnya',
      type,
      text,
      raw.amount ?? 0,
    ),
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
    // Sort newest first. Tiebreak entries on the same date by HH:MM (later
    // first). Rows without a time sort to the bottom of their date group.
    return readAll().sort((a, b) => {
      const ka = `${a.date} ${a.time ?? '00:00'}`
      const kb = `${b.date} ${b.time ?? '00:00'}`
      return kb.localeCompare(ka)
    })
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
