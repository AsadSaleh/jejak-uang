export type EntryType =
  | 'income'
  | 'expense'
  | 'transfer_internal' // same bank, pocket -> pocket (e.g. Jago pockets)
  | 'transfer_external' // own account, different bank (e.g. Mandiri -> BSI)

export type EntrySource = 'manual' | 'import'

export interface Entry {
  id: string
  date: string
  // Optional HH:MM of the transaction. Adapters that have it (Jago, BSI)
  // populate it; BCAS and manual entries leave it undefined.
  time?: string
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
  time?: string
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

export interface ImportBatch {
  id: string
  importedAt: string
  bank: string // BankId, kept as string to avoid coupling DAL to import module
  fileName: string
  statementAccountId?: string
  entryCount: number
  incomeTotal: number
  expenseTotal: number
}

export type NewImportBatch = Omit<ImportBatch, 'id'> & { id?: string }

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
  income: 'Pemasukan',
  expense: 'Pengeluaran',
  transfer_internal: 'Transfer internal',
  transfer_external: 'Transfer antar bank',
}

export const DEFAULT_CATEGORIES: Record<EntryType, readonly string[]> = {
  income: ['Gaji', 'Bonus', 'Investasi', 'Hadiah', 'Lainnya'],
  expense: [
    'Makan',
    'Kopi & Teh',
    'Belanja Harian',
    'Transportasi',
    'Tempat Tinggal',
    'Listrik',
    'Pulsa',
    'Internet',
    'Air',
    'Hiburan',
    'Kesehatan',
    'Kecantikan',
    'Belanja',
    'Pendidikan',
    'Top-up',
    'Bank Admin',
    'Lainnya',
  ],
  transfer_internal: ['Antar Kantong', 'Tabungan', 'Lainnya'],
  transfer_external: ['Rekening Sendiri', 'Lainnya'],
}
