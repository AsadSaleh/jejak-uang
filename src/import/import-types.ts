import type { EntryType } from '../dal/types'

// Counterparty info extracted by a bank adapter from multi-line records.
export interface DetectedCounterparty {
  bank?: string
  name?: string
  accountNumber?: string
}

// A raw transaction line extracted from the PDF, before classification.
export interface Candidate {
  date: string // ISO yyyy-mm-dd, '' if not parseable
  time?: string // HH:MM if the statement carried one
  rawDate: string
  amount: number // absolute value
  direction: 'debit' | 'credit' | 'unknown'
  description: string
  rawText: string
  counterparty?: DetectedCounterparty
}

// An editable, classified row shown in the review table. Maps to NewEntry on import.
export interface ReviewRow {
  rowId: string
  include: boolean
  date: string
  time?: string
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
  counterparty?: DetectedCounterparty
  // Retained at review time so registering a counterparty as an own account can
  // flip the row to transfer_external in place.
  direction?: 'debit' | 'credit' | 'unknown'
}
