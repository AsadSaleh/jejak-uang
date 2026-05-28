import type { Account, AccountPatch, NewAccount } from './types'
import type { AccountRepository } from './account-repository'

const STORAGE_KEY = 'money-tracker.accounts.v1'

function makeId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function readAll(): Account[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as Account[]) : []
  } catch {
    return []
  }
}

function writeAll(accounts: Account[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
}

export class LocalStorageAccountRepository implements AccountRepository {
  async list(): Promise<Account[]> {
    return readAll().sort((a, b) => a.label.localeCompare(b.label))
  }

  async get(id: string): Promise<Account | null> {
    return readAll().find((a) => a.id === id) ?? null
  }

  async create(input: NewAccount): Promise<Account> {
    const account: Account = { ...input, id: makeId() }
    const all = readAll()
    all.push(account)
    writeAll(all)
    return account
  }

  async update(id: string, patch: AccountPatch): Promise<Account> {
    const all = readAll()
    const idx = all.findIndex((a) => a.id === id)
    if (idx === -1) throw new Error(`Account not found: ${id}`)
    const updated: Account = { ...all[idx], ...patch }
    all[idx] = updated
    writeAll(all)
    return updated
  }

  async remove(id: string): Promise<void> {
    writeAll(readAll().filter((a) => a.id !== id))
  }
}
