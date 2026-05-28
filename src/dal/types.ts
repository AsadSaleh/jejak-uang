export type EntryType =
  | 'income'
  | 'expense'
  | 'transfer_internal' // same bank, pocket -> pocket (e.g. Jago pockets)
  | 'transfer_external' // own account, different bank (e.g. Mandiri -> BSI)

export type EntrySource = 'manual' | 'import'

export interface Entry {
  id: string
  date: string
  amount: number
  type: EntryType
  category: string
  note: string
  fromAccountId?: string
  toAccountId?: string
  accountId?: string
  needsReview: boolean
  confidence?: number
  source: EntrySource
  importBatchId?: string
  rawText?: string
  createdAt: string
  updatedAt: string
}

// Provenance/review fields are optional on creation; the repository defaults them.
export type NewEntry = {
  date: string
  amount: number
  type: EntryType
  category: string
  note: string
  fromAccountId?: string
  toAccountId?: string
  accountId?: string
  needsReview?: boolean
  confidence?: number
  source?: EntrySource
  importBatchId?: string
  rawText?: string
}

export type EntryPatch = Partial<NewEntry>

export interface Account {
  id: string
  bank: string
  label: string
  accountNumbers: string[]
  isPocket?: boolean
}

export type NewAccount = Omit<Account, 'id'>
export type AccountPatch = Partial<NewAccount>

export const TRANSFER_TYPES: EntryType[] = [
  'transfer_internal',
  'transfer_external',
]

export function isTransfer(type: EntryType): boolean {
  return type === 'transfer_internal' || type === 'transfer_external'
}

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  income: 'Income',
  expense: 'Expense',
  transfer_internal: 'Internal transfer',
  transfer_external: 'External transfer',
}

export const DEFAULT_CATEGORIES: Record<EntryType, readonly string[]> = {
  income: ['Salary', 'Bonus', 'Investment', 'Gift', 'Other'],
  expense: [
    'Food',
    'Transport',
    'Housing',
    'Utilities',
    'Entertainment',
    'Health',
    'Shopping',
    'Education',
    'Other',
  ],
  transfer_internal: ['Pocket Transfer', 'Savings', 'Other'],
  transfer_external: ['Own Account', 'Other'],
}
