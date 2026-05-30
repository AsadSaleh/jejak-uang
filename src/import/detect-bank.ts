export type BankId = 'jago' | 'bsi' | 'bcas' | 'mandiri' | 'generic'

// Sniffs the issuing bank by looking at the header region of the parsed text.
// Conservative: returns 'generic' unless a strong signature matches.
export function detectBank(docText: string): BankId {
  const head = docText.slice(0, 4000)
  if (/Pockets Transactions History|Movement between Pockets/i.test(head))
    return 'jago'
  if (/BYOND|EASY WADIAH/.test(head)) return 'bsi'
  if (/Tahapan\s*iB|BCA\s*Syariah/i.test(head)) return 'bcas'
  if (/Bank Mandiri/i.test(head)) return 'mandiri'
  return 'generic'
}
