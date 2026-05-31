// Catalogue of the banks (and e-wallet-style accounts) we offer in the account
// form. `name` is the value persisted on the Account — kept identical to the
// pre-existing options ('Jago', 'Mandiri', 'BSI', 'BCA', 'Other') so old data
// keeps matching. `logo` points at a tiny brand-coloured SVG chip in
// /public/banks (a few hundred bytes each — no network, works offline).

export interface BankOption {
  id: string
  name: string
  logo: string
}

export const BANKS: BankOption[] = [
  { id: 'jago', name: 'Jago', logo: '/banks/jago.svg' },
  { id: 'bca', name: 'BCA', logo: '/banks/bca.svg' },
  { id: 'mandiri', name: 'Mandiri', logo: '/banks/mandiri.svg' },
  { id: 'bni', name: 'BNI', logo: '/banks/bni.svg' },
  { id: 'bri', name: 'BRI', logo: '/banks/bri.svg' },
  { id: 'bsi', name: 'BSI', logo: '/banks/bsi.svg' },
  { id: 'cimb', name: 'CIMB Niaga', logo: '/banks/cimb.svg' },
  { id: 'permata', name: 'Permata', logo: '/banks/permata.svg' },
  { id: 'danamon', name: 'Danamon', logo: '/banks/danamon.svg' },
  { id: 'btn', name: 'BTN', logo: '/banks/btn.svg' },
  { id: 'ocbc', name: 'OCBC', logo: '/banks/ocbc.svg' },
  { id: 'panin', name: 'Panin', logo: '/banks/panin.svg' },
  { id: 'seabank', name: 'SeaBank', logo: '/banks/seabank.svg' },
  { id: 'other', name: 'Other', logo: '/banks/other.svg' },
]

const BY_NAME = new Map(BANKS.map((b) => [b.name.toLowerCase(), b]))

// Resolve a stored bank string to its catalogue entry. Falls back to the
// generic "Other" chip so legacy/custom values still render an icon.
export function bankFor(name: string): BankOption {
  return BY_NAME.get(name.trim().toLowerCase()) ?? BANKS[BANKS.length - 1]
}
