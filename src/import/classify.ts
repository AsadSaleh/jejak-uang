import type { Account, EntryType } from '../dal/types'
import type { Candidate, ReviewRow } from './import-types'
import { findAccountByNumber, findAccountsByNumber } from './account-match'
import { guessCategory } from '../lib/category-map'

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

  // Prefer the structured counterparty number when an adapter extracted one;
  // fall back to scanning the raw text.
  const ownByNumber = c.counterparty?.accountNumber
    ? findAccountByNumber(c.counterparty.accountNumber, accounts)
    : null
  const ownByText = ownByNumber
    ? [ownByNumber]
    : findAccountsByNumber(`${c.description} ${c.rawText}`, accounts)

  // Pocket-to-pocket movement within the same bank.
  if (INTERNAL_RE.test(text)) {
    return {
      type: 'transfer_internal',
      category: 'Antar Kantong',
      confidence: 0.7,
      needsReview: true, // user still picks the specific pockets
    }
  }

  // Counterparty is one of the user's own accounts -> transfer between own banks.
  if (ownByText.length > 0) {
    const ownId = ownByText[0].id
    const fromAdapter = !!ownByNumber
    return {
      type: 'transfer_external',
      category: 'Rekening Sendiri',
      confidence: fromAdapter ? 0.85 : 0.65,
      needsReview: !fromAdapter,
      // Owned counterparty sits on the opposite side of the money flow.
      ...(debit ? { toAccountId: ownId } : { fromAccountId: ownId }),
    }
  }

  // Best-effort keyword-based category for income/expense rows. Falls back to
  // 'Lainnya' when no rule matches.
  const guess = (type: EntryType) =>
    guessCategory(`${c.description} ${c.rawText}`, type, c.amount) ?? 'Lainnya'

  // A transfer to/from someone who is not the user -> income/expense.
  if (TRANSFER_RE.test(text)) {
    if (debit)
      return { type: 'expense', category: guess('expense'), confidence: 0.6, needsReview: false }
    if (credit)
      return { type: 'income', category: guess('income'), confidence: 0.6, needsReview: false }
  }

  if (credit) return { type: 'income', category: guess('income'), confidence: 0.6, needsReview: false }
  if (debit) return { type: 'expense', category: guess('expense'), confidence: 0.6, needsReview: false }

  // Direction unknown -> can't tell income from expense.
  return { type: 'expense', category: 'Lainnya', confidence: 0.2, needsReview: true }
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
      time: c.time,
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
      counterparty: c.counterparty,
      direction: c.direction,
    }
  })
}
