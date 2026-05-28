import type { Account, EntryType } from '../dal/types'
import type { Candidate, ReviewRow } from './import-types'
import { findAccountsByNumber } from './account-match'

const INTERNAL_RE = /(movement between pockets|between pockets|pocket money|antar kantong)/i
const TRANSFER_RE = /(transfer|trf|kirim|setor|incoming|outgoing|bifast)/i

function makeRowId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

interface Classification {
  type: EntryType
  category: string
  confidence: number
  needsReview: boolean
  fromAccountId?: string
  toAccountId?: string
  accountId?: string
}

function classify(c: Candidate, accounts: Account[]): Classification {
  const text = `${c.description} ${c.rawText}`.toLowerCase()
  const debit = c.direction === 'debit'
  const credit = c.direction === 'credit'
  const owned = findAccountsByNumber(`${c.description} ${c.rawText}`, accounts)

  // Pocket-to-pocket movement within the same bank.
  if (INTERNAL_RE.test(text)) {
    return {
      type: 'transfer_internal',
      category: 'Pocket Transfer',
      confidence: 0.6,
      needsReview: true, // user still picks the specific pockets
    }
  }

  // Counterparty is one of the user's own accounts -> transfer between own banks.
  if (owned.length > 0) {
    const ownId = owned[0].id
    return {
      type: 'transfer_external',
      category: 'Own Account',
      confidence: 0.65,
      needsReview: true,
      // Owned counterparty sits on the opposite side of the money flow.
      ...(debit ? { toAccountId: ownId } : { fromAccountId: ownId }),
    }
  }

  // A transfer to/from someone who is not the user -> income/expense.
  if (TRANSFER_RE.test(text)) {
    if (debit)
      return { type: 'expense', category: 'Other', confidence: 0.55, needsReview: true }
    if (credit)
      return { type: 'income', category: 'Other', confidence: 0.55, needsReview: true }
  }

  if (credit) return { type: 'income', category: 'Other', confidence: 0.6, needsReview: false }
  if (debit) return { type: 'expense', category: 'Other', confidence: 0.6, needsReview: false }

  // Direction unknown -> can't tell income from expense.
  return { type: 'expense', category: 'Other', confidence: 0.2, needsReview: true }
}

// Fills the account side that belongs to the statement itself, based on the
// money-flow direction (debit leaves the statement account, credit enters it).
function applyStatementAccount(
  cls: Classification,
  candidate: Candidate,
  statementAccount: Account | null,
): Classification {
  if (!statementAccount) return cls
  const id = statementAccount.id

  if (cls.type === 'income' || cls.type === 'expense') {
    return { ...cls, accountId: cls.accountId ?? id }
  }

  if (candidate.direction === 'debit') {
    return { ...cls, fromAccountId: cls.fromAccountId ?? id }
  }
  if (candidate.direction === 'credit') {
    return { ...cls, toAccountId: cls.toAccountId ?? id }
  }
  return cls
}

export function toReviewRows(
  candidates: Candidate[],
  accounts: Account[],
  statementAccount: Account | null = null,
): ReviewRow[] {
  return candidates.map((c) => {
    const cls = applyStatementAccount(classify(c, accounts), c, statementAccount)
    const dataIncomplete = !c.date || c.amount <= 0
    const needsReview = cls.needsReview || dataIncomplete || cls.confidence < 0.5
    return {
      rowId: makeRowId(),
      include: true,
      date: c.date,
      amount: c.amount,
      type: cls.type,
      category: cls.category,
      note: c.description,
      accountId: cls.accountId,
      fromAccountId: cls.fromAccountId,
      toAccountId: cls.toAccountId,
      needsReview,
      confidence: cls.confidence,
      rawText: c.rawText,
    }
  })
}
