import type { EntryType } from '../dal/types'

// A raw transaction line extracted from the PDF, before classification.
export interface Candidate {
  date: string // ISO yyyy-mm-dd, '' if not parseable
  rawDate: string
  amount: number // absolute value
  direction: 'debit' | 'credit' | 'unknown'
  description: string
  rawText: string
}

// An editable, classified row shown in the review table. Maps to NewEntry on import.
export interface ReviewRow {
  rowId: string
  include: boolean
  date: string
  amount: number
  type: EntryType
  category: string
  note: string
  accountId?: string
  fromAccountId?: string
  toAccountId?: string
  needsReview: boolean
  confidence: number
  rawText: string
}
