export type BankId = 'jago' | 'bsi' | 'bcas' | 'bca' | 'mandiri' | 'bri' | 'generic'

// Sniffs the issuing bank by looking at the header region of the parsed text.
// Conservative: returns 'generic' unless a strong signature matches.
export function detectBank(docText: string): BankId {
  const head = docText.slice(0, 4000)
  if (/Pockets Transactions History|Movement between Pockets/i.test(head))
    return 'jago'
  if (/BYOND|EASY WADIAH/.test(head)) return 'bsi'
  // BCAS first — its "Tahapan iB" string would otherwise also match BCA's
  // looser "REKENING TAHAPAN" header.
  if (/Tahapan\s*iB|BCA\s*Syariah/i.test(head)) return 'bcas'
  if (/REKENING TAHAPAN|TRSF E-BANKING|^\s*BCA\b/i.test(head)) return 'bca'
  if (/Bank Mandiri/i.test(head)) return 'mandiri'
  // BRI BRImo e-statement: distinctive report title / app footer / product line.
  if (
    /LAPORAN TRANSAKSI FINANSIAL|STATEMENT OF FINANCIAL TRANSACTION|Created By BRIMO|\bBRImo\b/i.test(
      head,
    )
  )
    return 'bri'
  return 'generic'
}
