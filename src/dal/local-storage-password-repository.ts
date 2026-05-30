import type { NewSavedPassword, PasswordRepository, SavedPassword } from './password-repository'

const STORAGE_KEY = 'money-tracker.pdf-passwords.v1'

function nowISO() {
  return new Date().toISOString()
}

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function readAll(): SavedPassword[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as SavedPassword[]) : []
  } catch {
    return []
  }
}

function writeAll(items: SavedPassword[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export class LocalStoragePasswordRepository implements PasswordRepository {
  async list(): Promise<SavedPassword[]> {
    // Most recently used first — we try in this order during auto-unlock.
    return readAll().sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt))
  }

  async upsert(input: NewSavedPassword): Promise<SavedPassword> {
    const all = readAll()
    const existing = all.find((p) => p.password === input.password)
    if (existing) {
      existing.lastUsedAt = nowISO()
      if (input.label && !existing.label) existing.label = input.label
      writeAll(all)
      return existing
    }
    const fresh: SavedPassword = {
      id: makeId(),
      password: input.password,
      label: input.label,
      createdAt: nowISO(),
      lastUsedAt: nowISO(),
    }
    all.push(fresh)
    writeAll(all)
    return fresh
  }

  async touch(id: string): Promise<void> {
    const all = readAll()
    const it = all.find((p) => p.id === id)
    if (!it) return
    it.lastUsedAt = nowISO()
    writeAll(all)
  }

  async remove(id: string): Promise<void> {
    writeAll(readAll().filter((p) => p.id !== id))
  }

  async clear(): Promise<void> {
    writeAll([])
  }
}
