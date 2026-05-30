import { DEFAULT_CATEGORIES, type EntryType } from '../dal/types'

// Keyword → category guesses. Ordered: more specific patterns first.
// All categories returned here use the Indonesian labels declared in
// DEFAULT_CATEGORIES; rules that don't resolve to an allowed category for the
// given type are dropped.

const EXPENSE_RULES: Array<[RegExp, string]> = [
  // Bank fees (BI-FAST transfer fee, VA fee, monthly admin) — placed above the
  // Top-up rule so a line like "Trf VA BCA Fee (GOPAY TOPUP …)" wins as a fee
  // instead of getting tagged as Top-up by the embedded "TOPUP".
  [
    /\b(biaya\s+(?:transfer|admin|administrasi|bulanan|pemindahan)|bi[-\s]?fast\s+fee|trf\s+va\s+\S+\s+fee)\b/i,
    'Bank Admin',
  ],
  [/\b(bank\s+fee|transaction\s+fee|monthly\s+fee|admin\s+fee)\b/i, 'Bank Admin'],

  // E-wallet top-ups (so "Top-Up OVO" doesn't get mis-tagged as Belanja).
  // "dana" is deliberately omitted from the wallet keyword list — Indonesian
  // statements use the same word for "fund" (e.g., "Dana Keluar"). DANA top-ups
  // still hit the first rule via the explicit "top-up" keyword.
  [/\btop[- ]?up\b/i, 'Top-up'],
  [/\b(ovo|gopay|shopeepay|linkaja|jenius pay)\b/i, 'Top-up'],

  // Coffee — kept above the broader Food rules so cafés don't get tagged as
  // Makan. "indomaret point" must precede the plain "indomaret" Groceries
  // rule below (the Coffee block already runs first, so this works).
  [/\b(kopi|coffee|cafe|kafe|kopitiam)\b/i, 'Kopi'],
  [
    /\b(starbucks|excelso|coffee bean|tomoro|janji jiwa|kopi kenangan|fore|filosofi kopi|anomali|common grounds|tuku|indomaret\s+point)\b/i,
    'Kopi',
  ],

  // Groceries — Indonesian mini-marts, supermarkets, and convenience stores.
  // FMI = Family Mart Indonesia (convenience store, not a food court).
  [
    /\b(alfamart|alfa midi|alfamidi|indomaret|hypermart|carrefour|superindo|ranch market|farmers market|grand lucky|kemchicks|hero|family\s*mart|fmi|astro|tiptop|tip\s+top)\b/i,
    'Belanja Harian',
  ],

  // Food chains + Indonesian food keywords.
  [
    /\b(mcdonald|mcd|kfc|burger king|cfc|pizza|domino|hokben|hoka|chatime|yoshinoya|wendy|j\.?co|dunkin|geprek|hisana|bakmi|sushi|ramen|pipiltin|roscik)\b/i,
    'Makan',
  ],
  [
    /\b(resto|restoran|restaurant|warung|warkop|warmindo|rumah makan|rm\s|food court|kantin)\b/i,
    'Makan',
  ],
  [/\b(ayam|nasi|bakso|mie|soto|sate|gado|martabak|pecel|rendang|bubur)\b/i, 'Makan'],
  [/\bqr\s+(rm|warung|wikusama|royal|galaxy)\b/i, 'Makan'],

  // Transportation.
  [
    /\b(grab|gojek|gocar|gosend|gofood|ojol|ojek|maxim|in?driver|bluebird)\b/i,
    'Transportasi',
  ],
  [/\b(pertamina|shell|vivo|bp\s|bensin|bbm|spbu|fuel)\b/i, 'Transportasi'],
  [
    /\b(transjakarta|krl|mrt|lrt|kereta|commuter|busway|tol|toll|parkir|parking)\b/i,
    'Transportasi',
  ],

  // Utility splits.
  [/\b(pulsa|telkomsel|xl axiata|indosat|smartfren|by\.u|byu|axis|tri\s|3 hutchison)\b/i, 'Pulsa'],
  [/\b(pln|listrik|electricity)\b/i, 'Listrik'],
  [/\b(wifi|internet|first media|indihome|biznet|myrepublic|iconnet)\b/i, 'Internet'],
  [/\b(pdam|air pam|air bersih)\b/i, 'Air'],

  // Entertainment.
  [
    /\b(netflix|spotify|youtube premium|disney\+?|hbo|prime video|apple tv|xbox|playstation|psn|steam|epic games|cgv|xxi|cinema xx?i|bioskop|imax)\b/i,
    'Hiburan',
  ],

  // Health.
  [
    /\b(apotek|apotik|farmasi|kimia farma|guardian|watson|century|viva|rs |rumah sakit|hospital|klinik|halodoc|alodokter)\b/i,
    'Kesehatan',
  ],

  // Shopping (e-commerce + retail; non-grocery).
  [
    /\b(tokopedia|shopee|blibli|bukalapak|lazada|tiktok shop|zalora|matahari|uniqlo|h&m|zara|miniso|ace hardware|ikea)\b/i,
    'Belanja',
  ],

  // Education.
  [/\b(udemy|coursera|skillshare|kursus|tuition|sekolah|kuliah|spp|buku)\b/i, 'Pendidikan'],
]

// Amount-based hints run before the regex rules. Indonesian bank fees have
// fixed values that, combined with a transfer keyword, identify a category
// more reliably than the description alone (e.g. BSI's BIFAST fee rows omit
// the literal word "Fee").
function guessFromAmount(text: string, amount: number): string | null {
  // BI-FAST inter-bank transfer fee — Rp 2,500 on every Indonesian bank.
  if (amount === 2500 && /\b(bi[-\s]?fast|trf|transfer)\b/i.test(text)) {
    return 'Bank Admin'
  }
  return null
}

const INCOME_RULES: Array<[RegExp, string]> = [
  [/\b(salary|gaji|payroll)\b/i, 'Gaji'],
  [/\b(bonus|thr|insentif)\b/i, 'Bonus'],
  [/\b(dividen|dividend|interest|bunga|investment|investasi|return)\b/i, 'Investasi'],
]

// Indonesian bank descriptions frequently smush amounts together with merchant
// names (e.g. "TGL: 26/04 — QR 014 — 00000.00PIPILTIN P"). \b word boundaries
// don't match between digits and letters, so keyword rules silently miss those
// rows. Splitting at digit↔letter transitions restores the boundaries without
// having to weaken every individual regex.
function normalizeForMatching(text: string): string {
  return text
    .replace(/(\d)([A-Za-z])/g, '$1 $2')
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
}

export function guessCategory(
  text: string,
  type: EntryType,
  amount?: number,
): string | null {
  const allowed = DEFAULT_CATEGORIES[type]
  const normalized = normalizeForMatching(text)

  if (type === 'expense' && amount !== undefined) {
    const fromAmount = guessFromAmount(normalized, amount)
    if (fromAmount && allowed.includes(fromAmount)) return fromAmount
  }

  const rules =
    type === 'expense' ? EXPENSE_RULES : type === 'income' ? INCOME_RULES : null
  if (!rules) return null
  for (const [re, cat] of rules) {
    if (re.test(normalized) && allowed.includes(cat)) return cat
  }
  return null
}
