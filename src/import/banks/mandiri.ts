import type { ParsedDoc } from '../parse-pdf'
import type { Candidate } from '../import-types'
import { extractGeneric } from './generic'

// Mandiri adapter — not yet tuned (no validated sample available).
// Falls back to the generic line-based extractor so the import flow still
// works; replace with column-aware parsing once a real statement is in hand.
export function extractMandiri(parsed: ParsedDoc): Candidate[] {
  return extractGeneric(parsed)
}
