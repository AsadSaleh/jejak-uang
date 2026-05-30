import type { ParsedDoc } from '../parse-pdf'
import type { Candidate } from '../import-types'
import { detectBank, type BankId } from '../detect-bank'
import { extractGeneric } from './generic'
import { extractJago } from './jago'
import { extractBsi } from './bsi'
import { extractBcas } from './bcas'
import { extractBca } from './bca'
import { extractMandiri } from './mandiri'

export type { BankId }
export {
  extractGeneric,
  extractJago,
  extractBsi,
  extractBcas,
  extractBca,
  extractMandiri,
}

export interface ExtractedDoc {
  bank: BankId
  candidates: Candidate[]
}

export function extractTransactions(parsed: ParsedDoc): ExtractedDoc {
  const bank = detectBank(parsed.text)
  switch (bank) {
    case 'jago':
      return { bank, candidates: extractJago(parsed) }
    case 'bsi':
      return { bank, candidates: extractBsi(parsed) }
    case 'bcas':
      return { bank, candidates: extractBcas(parsed) }
    case 'bca':
      return { bank, candidates: extractBca(parsed) }
    case 'mandiri':
      return { bank, candidates: extractMandiri(parsed) }
    default:
      return { bank: 'generic', candidates: extractGeneric(parsed) }
  }
}
