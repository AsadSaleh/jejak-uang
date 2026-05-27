export type EntryType = 'income' | 'expense'

export interface Entry {
  id: string
  date: string
  amount: number
  type: EntryType
  category: string
  note: string
  createdAt: string
  updatedAt: string
}

export type NewEntry = Omit<Entry, 'id' | 'createdAt' | 'updatedAt'>
export type EntryPatch = Partial<NewEntry>

export const DEFAULT_CATEGORIES = {
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
} as const
