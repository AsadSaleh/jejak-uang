import type { Locale } from './locale'
import type { EntryType } from '../dal/types'

// English is the source of truth for the set of keys. `id` must provide every
// one of them (enforced by the `Record<TranslationKey, string>` type below).
export const en = {
  // common
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.saving': 'Saving…',
  'common.loading': 'Loading…',
  'common.clear': 'Clear',
  'common.remove': 'Remove',
  'common.close': 'Close',
  'common.dismiss': 'Dismiss',
  'common.undo': 'Undo',
  'common.entry': 'entry',
  'common.entries': 'entries',

  // nav
  'nav.dashboard': 'Dashboard',
  'nav.entries': 'Entries',
  'nav.import': 'Import',
  'nav.accounts': 'Accounts',
  'nav.settings': 'Settings',
  'nav.navigate': 'Navigate',
  'nav.open': 'Open navigation',

  // entry types
  'type.income': 'Income',
  'type.expense': 'Expense',
  'type.transfer_internal': 'Internal transfer',
  'type.transfer_external': 'Inter-bank transfer',

  // dashboard
  'dashboard.title': 'Dashboard',
  'dashboard.subtitle': 'Overview of your income and expenses.',
  'dashboard.income': 'Income',
  'dashboard.expense': 'Expense',
  'dashboard.net': 'Net',
  'dashboard.cumulativeTitle': 'Cumulative income vs expense',
  'dashboard.balanceTitle': 'Balance over time',
  'dashboard.balanceSubtitle':
    'Running balance — rises with income, falls with expense.',
  'dashboard.monthlyTitle': 'Monthly income vs expense',
  'dashboard.monthlySubtitle':
    'All months in your data — not affected by the period filter.',
  'dashboard.expenseByCategory': 'Expense by category',
  'dashboard.noExpenses': 'No expenses in this period.',
  'dashboard.topCategories': 'Top categories',
  'dashboard.weekdayTitle': 'Average daily expense by weekday',
  'dashboard.weekdaySubtitle':
    'Total expense for each weekday in this period, divided by the number of times that weekday occurred.',
  'dashboard.legendAverage': 'Average',
  'dashboard.emptyTitle': 'No data to display yet',
  'dashboard.emptyBody':
    'Add a few entries to start seeing your dashboard come to life.',
  'dashboard.emptyCta': 'Add your first entry',
  'dashboard.showCategory': 'Show {count} {category} entries',

  // period presets
  'period.7d': 'Last 7 days',
  'period.30d': 'Last 30 days',
  'period.90d': 'Last 90 days',
  'period.ytd': 'Year to date',
  'period.all': 'All time',
  'period.rangeGroup': 'Range',
  'period.monthGroup': 'Month',

  // accounts page
  'accounts.title': 'Accounts',
  'accounts.subtitle':
    'Register your own bank accounts and pockets. These let the importer tell an internal/external transfer apart from a regular expense.',
  'accounts.colBank': 'Bank',
  'accounts.colLabel': 'Label',
  'accounts.colNumbers': 'Account numbers',
  'accounts.colActions': 'Actions',
  'accounts.add': 'Add account',
  'accounts.update': 'Update account',
  'accounts.edit': 'Edit',
  'accounts.editTitle': 'Edit account',
  'accounts.delete': 'Delete',
  'accounts.empty': 'No accounts yet. Add your Jago pockets and other banks above.',
  'accounts.pocketBadge': 'pocket',
  'accounts.confirmDelete': 'Delete this account?',

  // account form
  'accountForm.bank': 'Bank',
  'accountForm.label': 'Label',
  'accountForm.labelPlaceholder': 'e.g. Jago - Main Pocket',
  'accountForm.numbers': 'Account numbers / aliases',
  'accountForm.numbersPlaceholder': 'Comma-separated, e.g. 508678037289, 7178129206',
  'accountForm.pocket': 'Pocket',
  'accountForm.isPocket': 'Is a pocket',
  'accountForm.pocketAria': 'What is a pocket?',
  'accountForm.pocketHelp':
    'A pocket is a sub-balance inside one bank (e.g. a Jago "Kantong" or a savings goal). Marking an account as a pocket lets the importer recognise pocket-to-pocket moves as internal transfers instead of counting them as spending.',

  // entry form
  'entryForm.type': 'Type',
  'entryForm.date': 'Date',
  'entryForm.amount': 'Amount',
  'entryForm.category': 'Category',
  'entryForm.searchCategory': 'Search category…',
  'entryForm.noCategory': 'No category found.',
  'entryForm.fromAccount': 'From account',
  'entryForm.toAccount': 'To account',
  'entryForm.account': 'Account (optional)',
  'entryForm.selectAccount': 'Select account…',
  'entryForm.none': '— None —',
  'entryForm.note': 'Note',
  'entryForm.notePlaceholder': 'Optional',
  'entryForm.needsReview': 'Needs review',
  'entryForm.needsReviewAria': 'What does “Needs review” mean?',
  'entryForm.needsReviewHelp':
    'Flags this entry as uncertain — something to double-check later (an unclear category, a guessed amount, an unmatched account). You can filter by "Needs review" on the Entries page to find and clean these up.',
  'entryForm.noAccounts': 'No accounts registered yet.',
  'entryForm.addAccounts': 'Add your accounts',
  'entryForm.toLabelTransfers': 'to label transfers.',

  // entries page
  'entries.title': 'Entries',
  'entries.countTotal': '{count} total',
  'entries.countOf': '{shown} of {total}',
  'entries.subtitle': 'Add, edit, and delete income, expense, and transfer entries.',
  'entries.columns': 'Columns',
  'entries.add': 'Add entry',
  'entries.import': 'Import transactions',
  'entries.importTooltip':
    'Automatically import transactions from a bank statement PDF',
  'entries.update': 'Update entry',
  'entries.edit': 'Edit entry',
  'entries.colDate': 'Date',
  'entries.colType': 'Type',
  'entries.colCategory': 'Category',
  'entries.colAccount': 'Account',
  'entries.colNote': 'Note',
  'entries.colAmount': 'Amount',
  'entries.colAdded': 'Added',
  'entries.colActions': 'Actions',
  'entries.emptyNone': 'No entries yet. Add your first one above.',
  'entries.emptyFiltered': 'No entries match the current filters.',
  'entries.selectAll': 'Select all',
  'entries.selectEntry': 'Select entry',
  'entries.unknownAccount': 'Unknown account',
  'entries.reviewBadge': 'review',
  'entries.imported': 'imported',
  'entries.batchImported': 'Imported {when}',
  'entries.batchIncome': 'income',
  'entries.batchExpense': 'expense',
  'entries.deleteBatch': 'Delete batch',
  'entries.selected': '{count} selected',
  'entries.deleteSelected': 'Delete selected',
  'entries.editAria': 'Edit entry',
  'entries.deleteAria': 'Delete entry',
  'entries.deletedToast': 'Deleted {count}',
  'entries.updatedToast': 'Entry updated',
  'entries.createdToast': 'Entry created',

  // entries filters
  'filters.allTypes': 'All types',
  'filters.anySource': 'Any source',
  'filters.manual': 'Manual',
  'filters.imported': 'Imported',
  'filters.anyAccount': 'Any account',
  'filters.account': 'Account',
  'filters.anyCategory': 'Any category',
  'filters.anyStatus': 'Any status',
  'filters.needsReview': 'Needs review',
  'filters.reviewed': 'Reviewed',
  'filters.anyBatch': 'Any import batch',
  'filters.batch': 'Batch',
  'filters.search': 'Search note, raw text, category…',

  // import page
  'import.title': 'Import statement',
  'import.subtitle':
    'Drop a bank statement PDF to extract transactions. Review the proposed entries, fix anything flagged, then import.',
  'import.tip1': 'Tip: register your accounts on',
  'import.tip2': 'first so transfers between your own banks are detected automatically.',
  'import.noTransactions':
    'No transactions could be extracted from this PDF. It may use an unsupported layout.',
  'import.unlockedSaved': 'Unlocked with a saved password',
  'import.passwordSaved': 'Password saved for future imports',
  'import.incorrectPassword': 'Incorrect password. Please try again.',
  'import.passwordProtected':
    'This PDF is password protected. Enter the password to continue.',
  'import.parseError': 'Could not parse the PDF: {message}',
  'import.detectedMatched': 'Statement account detected:',
  'import.detectedMatchedTail': 'It has been pre-filled on each row.',
  'import.detectedUnmatched': 'Detected account',
  'import.detectedUnmatchedMid': 'is not in your registry.',
  'import.addIt': 'Add it',
  'import.detectedUnmatchedTail':
    'Adding it lets transfers from this statement be detected automatically next time.',
  'import.adapter': '{bank} adapter',
  'import.selectedOf': '{selected} of {total} selected',
  'import.needReview': '{count} need review',
  'import.importBtn': 'Import {count}',
  'import.importing': 'Importing…',
  'import.importedToast': 'Imported {count}',
  'import.viewEntries': 'View entries',
  'import.registered': 'Registered {label}',
  'import.registeredReclass': 'Registered {label}, reclassified {count} {rows}',
  'import.statementAdded': 'Added {label}',
  'import.statementAddedFilled': 'Added {label}, pre-filled {count} {rows}',
  'import.row': 'row',
  'import.rows': 'rows',

  // review table
  'review.includeAria': 'Include this row in the import',
  'review.needsReview': 'Needs review',
  'review.colDate': 'Date',
  'review.colType': 'Type',
  'review.colCategory': 'Category',
  'review.colNote': 'Note / accounts',
  'review.colAmount': 'Amount',
  'review.from': 'From…',
  'review.to': 'To…',
  'review.accountOptional': 'Account (optional)…',

  // detected counterparties
  'detected.title': 'Detected counterparties ({count})',
  'detected.subtitle': 'Register one as your own account to flip matching rows to',
  'detected.externalTransfer': 'External transfer',
  'detected.unnamed': '(unnamed)',
  'detected.noAccountNumber': 'no account number',
  'detected.transactionsOne': '{count} transaction',
  'detected.transactionsMany': '{count} transactions',
  'detected.registerAsOwn': 'Register as own',
  'detected.registerTitle': 'Register as your own account',
  'detected.registerTitleDisabled':
    'No account number detected — register manually if needed',

  // import dropzone
  'dropzone.prompt': 'Drop a bank statement PDF here, or click to browse',
  'dropzone.privacy': 'Parsed entirely in your browser — nothing is uploaded.',
  'dropzone.supported':
    'Currently supported PDFs: BCA, BCA Syariah, Mandiri, BRI, BSI, and Jago. Support for other banks is coming soon.',
  'dropzone.passwordRequired': '🔒 Password required',
  'dropzone.ready': 'Ready to parse',
  'dropzone.remove': 'Remove',
  'dropzone.pdfPassword': 'PDF password',
  'dropzone.passwordPlaceholder': 'Enter password to unlock',
  'dropzone.remember': 'Remember this password for future imports',
  'dropzone.storedLocally': '(stored locally on this device)',
  'dropzone.parsing': 'Parsing…',
  'dropzone.parse': 'Parse statement',

  // columns
  'columns.button': 'Columns',

  // settings
  'settings.title': 'Settings',
  'settings.subtitle':
    'Customise the app, replay the tutorial, and manage the data this app keeps on your device.',
  'settings.appearanceTitle': 'Appearance',
  'settings.appearanceDesc': 'Choose how the app looks on this device.',
  'settings.themeLabel': 'Theme',
  'settings.languageTitle': 'Language',
  'settings.languageDesc':
    'Choose the language used across the app. Auto-detected from your browser by default.',
  'settings.languageLabel': 'Language',
  'settings.tutorialTitle': 'Tutorial',
  'settings.tutorialDesc':
    'Walk through adding an account and a transaction again. Your existing data is left untouched.',
  'settings.playTutorial': 'Play tutorial again',
  'settings.passwordsTitle': 'Saved document passwords',
  'settings.passwordsDescNone':
    'Passwords used to unlock encrypted bank statements during import.',
  'settings.passwordsDescCount':
    '{count} password(s) saved for unlocking encrypted statements during import.',
  'settings.deletePasswords': "Delete saved document's password",
  'settings.noPasswords': 'No saved passwords to delete.',
  'settings.confirmDeletePasswords':
    'Delete all saved document passwords? Encrypted statements will ask for the password again on the next import.',
  'settings.passwordsDeleted': 'Saved passwords deleted',
  'settings.dangerTitle': 'Danger zone',
  'settings.dangerDesc':
    'Wipe everything — transactions, accounts, import history, saved passwords and preferences — and start completely fresh. This cannot be undone.',
  'settings.clearAll': 'Clear all app data and start fresh',
  'settings.confirmClear':
    'This permanently deletes ALL app data — transactions, accounts, import history, saved passwords and preferences. This cannot be undone.\n\nContinue?',
  'settings.confirmClearType': 'Type DELETE to confirm clearing all app data.',
  'settings.clearCancelled': 'Cancelled — nothing was deleted.',
  'settings.clearedToast': 'Cleared {count} stored item(s).',

  // onboarding
  'onboarding.welcomeTitle': 'Welcome to Jejak Uang 👋',
  'onboarding.welcomeSubtitle':
    "Two quick steps and you'll have your first numbers on the dashboard.",
  'onboarding.skip': 'Skip',
  'onboarding.stepLabel': 'Step {n}',
  'onboarding.step1Title': 'Add an account',
  'onboarding.step1Blurb': 'Register a bank or pocket.',
  'onboarding.step2Title': 'Add a transaction',
  'onboarding.step2Blurb': 'Record one entry by hand.',
  'onboarding.step3Title': 'See your dashboard',
  'onboarding.step3Blurb': 'You are all set.',
  'onboarding.step1Heading': 'Step 1: Add an account',
  'onboarding.step1Desc':
    'Pick your bank and give it a label. You can add the rest later from the Accounts page.',
  'onboarding.step1Submit': 'Add account & continue',
  'onboarding.accountAdded': 'Account added',
  'onboarding.step2Heading': 'Step 2: Add a transaction',
  'onboarding.step2Desc':
    'Log one income or expense by hand so the dashboard has something to show.',
  'onboarding.step2Submit': 'Add transaction & finish',
  'onboarding.transactionAdded': 'Transaction added',
  'onboarding.cancelHint': '(Cancel takes you back to the account step.)',

  // theme
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.system': 'System',
  'theme.change': 'Change theme',

  // language
  'language.change': 'Change language',

  // feature highlights
  'features.title': 'Why Jejak Uang',
  'features.privateTitle': 'Private by design',
  'features.privateDesc':
    'Everything runs in your browser. No servers, no tracking — your data never leaves your device.',
  'features.importTitle': 'Auto-import',
  'features.importDesc':
    'Drop a bank statement PDF and your transactions are extracted for you automatically.',
  'features.dashboardTitle': 'Insightful dashboard',
  'features.dashboardDesc':
    'Clear charts turn your income and spending into trends you can read at a glance.',
  'features.everywhereTitle': 'Works everywhere',
  'features.everywhereDesc':
    'Fully responsive on your phone, with light and dark themes.',

  // categories (display labels; stored values stay Indonesian)
  'category.Makan': 'Food',
  'category.Kopi & Teh': 'Coffee & Tea',
  'category.Belanja Harian': 'Daily Groceries',
  'category.Transportasi': 'Transport',
  'category.Tempat Tinggal': 'Housing',
  'category.Listrik': 'Electricity',
  'category.Pulsa': 'Phone Credit',
  'category.Internet': 'Internet',
  'category.Air': 'Water',
  'category.Hiburan': 'Entertainment',
  'category.Kesehatan': 'Health',
  'category.Kecantikan': 'Beauty',
  'category.Belanja': 'Shopping',
  'category.Pendidikan': 'Education',
  'category.Top-up': 'Top-up',
  'category.Bank Admin': 'Bank Fees',
  'category.Lainnya': 'Other',
  'category.Gaji': 'Salary',
  'category.Bonus': 'Bonus',
  'category.Investasi': 'Investment',
  'category.Hadiah': 'Gift',
  'category.Antar Kantong': 'Pocket Transfer',
  'category.Tabungan': 'Savings',
  'category.Rekening Sendiri': 'Own Account',
} as const

export type TranslationKey = keyof typeof en

export const id: Record<TranslationKey, string> = {
  // common
  'common.save': 'Simpan',
  'common.cancel': 'Batal',
  'common.saving': 'Menyimpan…',
  'common.loading': 'Memuat…',
  'common.clear': 'Bersihkan',
  'common.remove': 'Hapus',
  'common.close': 'Tutup',
  'common.dismiss': 'Tutup',
  'common.undo': 'Urungkan',
  'common.entry': 'transaksi',
  'common.entries': 'transaksi',

  // nav
  'nav.dashboard': 'Dasbor',
  'nav.entries': 'Transaksi',
  'nav.import': 'Impor',
  'nav.accounts': 'Akun',
  'nav.settings': 'Pengaturan',
  'nav.navigate': 'Navigasi',
  'nav.open': 'Buka navigasi',

  // entry types
  'type.income': 'Pemasukan',
  'type.expense': 'Pengeluaran',
  'type.transfer_internal': 'Transfer internal',
  'type.transfer_external': 'Transfer antar bank',

  // dashboard
  'dashboard.title': 'Dasbor',
  'dashboard.subtitle': 'Ringkasan pemasukan dan pengeluaran Anda.',
  'dashboard.income': 'Pemasukan',
  'dashboard.expense': 'Pengeluaran',
  'dashboard.net': 'Bersih',
  'dashboard.cumulativeTitle': 'Akumulasi pemasukan vs pengeluaran',
  'dashboard.balanceTitle': 'Saldo dari waktu ke waktu',
  'dashboard.balanceSubtitle':
    'Saldo berjalan — naik saat pemasukan, turun saat pengeluaran.',
  'dashboard.monthlyTitle': 'Pemasukan vs pengeluaran bulanan',
  'dashboard.monthlySubtitle':
    'Semua bulan dalam data Anda — tidak terpengaruh filter periode.',
  'dashboard.expenseByCategory': 'Pengeluaran per kategori',
  'dashboard.noExpenses': 'Tidak ada pengeluaran pada periode ini.',
  'dashboard.topCategories': 'Kategori teratas',
  'dashboard.weekdayTitle': 'Rata-rata pengeluaran harian per hari',
  'dashboard.weekdaySubtitle':
    'Total pengeluaran tiap hari pada periode ini, dibagi jumlah kemunculan hari tersebut.',
  'dashboard.legendAverage': 'Rata-rata',
  'dashboard.emptyTitle': 'Belum ada data untuk ditampilkan',
  'dashboard.emptyBody':
    'Tambahkan beberapa transaksi untuk menghidupkan dasbor Anda.',
  'dashboard.emptyCta': 'Tambah transaksi pertama',
  'dashboard.showCategory': 'Tampilkan {count} transaksi {category}',

  // period presets
  'period.7d': '7 hari terakhir',
  'period.30d': '30 hari terakhir',
  'period.90d': '90 hari terakhir',
  'period.ytd': 'Tahun berjalan',
  'period.all': 'Sepanjang waktu',
  'period.rangeGroup': 'Rentang',
  'period.monthGroup': 'Bulan',

  // accounts page
  'accounts.title': 'Akun',
  'accounts.subtitle':
    'Daftarkan rekening bank dan kantong Anda. Ini membantu pengimpor membedakan transfer internal/eksternal dari pengeluaran biasa.',
  'accounts.colBank': 'Bank',
  'accounts.colLabel': 'Label',
  'accounts.colNumbers': 'Nomor rekening',
  'accounts.colActions': 'Aksi',
  'accounts.add': 'Tambah akun',
  'accounts.update': 'Perbarui akun',
  'accounts.edit': 'Ubah',
  'accounts.editTitle': 'Ubah akun',
  'accounts.delete': 'Hapus',
  'accounts.empty': 'Belum ada akun. Tambahkan kantong Jago dan bank lain di atas.',
  'accounts.pocketBadge': 'kantong',
  'accounts.confirmDelete': 'Hapus akun ini?',

  // account form
  'accountForm.bank': 'Bank',
  'accountForm.label': 'Label',
  'accountForm.labelPlaceholder': 'mis. Jago - Kantong Utama',
  'accountForm.numbers': 'Nomor rekening / alias',
  'accountForm.numbersPlaceholder': 'Pisahkan dengan koma, mis. 508678037289, 7178129206',
  'accountForm.pocket': 'Kantong',
  'accountForm.isPocket': 'Berupa kantong',
  'accountForm.pocketAria': 'Apa itu kantong?',
  'accountForm.pocketHelp':
    'Kantong adalah sub-saldo dalam satu bank (mis. "Kantong" Jago atau target tabungan). Menandai akun sebagai kantong membuat pengimpor mengenali perpindahan antar kantong sebagai transfer internal, bukan pengeluaran.',

  // entry form
  'entryForm.type': 'Tipe',
  'entryForm.date': 'Tanggal',
  'entryForm.amount': 'Jumlah',
  'entryForm.category': 'Kategori',
  'entryForm.searchCategory': 'Cari kategori…',
  'entryForm.noCategory': 'Kategori tidak ditemukan.',
  'entryForm.fromAccount': 'Dari akun',
  'entryForm.toAccount': 'Ke akun',
  'entryForm.account': 'Akun (opsional)',
  'entryForm.selectAccount': 'Pilih akun…',
  'entryForm.none': '— Tidak ada —',
  'entryForm.note': 'Catatan',
  'entryForm.notePlaceholder': 'Opsional',
  'entryForm.needsReview': 'Perlu ditinjau',
  'entryForm.needsReviewAria': 'Apa arti “Perlu ditinjau”?',
  'entryForm.needsReviewHelp':
    'Menandai transaksi ini sebagai belum pasti — perlu dicek ulang nanti (kategori tidak jelas, jumlah tebakan, akun tak cocok). Anda bisa memfilter "Perlu ditinjau" di halaman Transaksi untuk merapikannya.',
  'entryForm.noAccounts': 'Belum ada akun terdaftar.',
  'entryForm.addAccounts': 'Tambahkan akun Anda',
  'entryForm.toLabelTransfers': 'untuk melabeli transfer.',

  // entries page
  'entries.title': 'Transaksi',
  'entries.countTotal': '{count} total',
  'entries.countOf': '{shown} dari {total}',
  'entries.subtitle':
    'Tambah, ubah, dan hapus transaksi pemasukan, pengeluaran, dan transfer.',
  'entries.columns': 'Kolom',
  'entries.add': 'Tambah transaksi',
  'entries.import': 'Import Transaksi',
  'entries.importTooltip':
    'Import transaksi secara otomatis dari file PDF mutasi bank',
  'entries.update': 'Perbarui transaksi',
  'entries.edit': 'Ubah transaksi',
  'entries.colDate': 'Tanggal',
  'entries.colType': 'Tipe',
  'entries.colCategory': 'Kategori',
  'entries.colAccount': 'Akun',
  'entries.colNote': 'Catatan',
  'entries.colAmount': 'Jumlah',
  'entries.colAdded': 'Ditambahkan',
  'entries.colActions': 'Aksi',
  'entries.emptyNone': 'Belum ada transaksi. Tambahkan yang pertama di atas.',
  'entries.emptyFiltered': 'Tidak ada transaksi yang cocok dengan filter saat ini.',
  'entries.selectAll': 'Pilih semua',
  'entries.selectEntry': 'Pilih transaksi',
  'entries.unknownAccount': 'Akun tidak dikenal',
  'entries.reviewBadge': 'tinjau',
  'entries.imported': 'terimpor',
  'entries.batchImported': 'Diimpor {when}',
  'entries.batchIncome': 'pemasukan',
  'entries.batchExpense': 'pengeluaran',
  'entries.deleteBatch': 'Hapus batch',
  'entries.selected': '{count} dipilih',
  'entries.deleteSelected': 'Hapus yang dipilih',
  'entries.editAria': 'Ubah transaksi',
  'entries.deleteAria': 'Hapus transaksi',
  'entries.deletedToast': 'Menghapus {count}',
  'entries.updatedToast': 'Transaksi diperbarui',
  'entries.createdToast': 'Transaksi dibuat',

  // entries filters
  'filters.allTypes': 'Semua tipe',
  'filters.anySource': 'Semua sumber',
  'filters.manual': 'Manual',
  'filters.imported': 'Terimpor',
  'filters.anyAccount': 'Semua akun',
  'filters.account': 'Akun',
  'filters.anyCategory': 'Semua kategori',
  'filters.anyStatus': 'Semua status',
  'filters.needsReview': 'Perlu ditinjau',
  'filters.reviewed': 'Sudah ditinjau',
  'filters.anyBatch': 'Semua batch impor',
  'filters.batch': 'Batch',
  'filters.search': 'Cari catatan, teks asli, kategori…',

  // import page
  'import.title': 'Impor mutasi',
  'import.subtitle':
    'Letakkan PDF mutasi bank untuk mengekstrak transaksi. Tinjau usulan transaksi, perbaiki yang ditandai, lalu impor.',
  'import.tip1': 'Tips: daftarkan akun Anda di',
  'import.tip2':
    'lebih dulu agar transfer antar bank Anda terdeteksi otomatis.',
  'import.noTransactions':
    'Tidak ada transaksi yang dapat diekstrak dari PDF ini. Tata letaknya mungkin tidak didukung.',
  'import.unlockedSaved': 'Terbuka dengan kata sandi tersimpan',
  'import.passwordSaved': 'Kata sandi disimpan untuk impor berikutnya',
  'import.incorrectPassword': 'Kata sandi salah. Silakan coba lagi.',
  'import.passwordProtected':
    'PDF ini dilindungi kata sandi. Masukkan kata sandi untuk melanjutkan.',
  'import.parseError': 'Gagal membaca PDF: {message}',
  'import.detectedMatched': 'Rekening mutasi terdeteksi:',
  'import.detectedMatchedTail': 'Telah diisikan otomatis di tiap baris.',
  'import.detectedUnmatched': 'Rekening terdeteksi',
  'import.detectedUnmatchedMid': 'belum terdaftar.',
  'import.addIt': 'Tambahkan',
  'import.detectedUnmatchedTail':
    'Menambahkannya membuat transfer dari mutasi ini terdeteksi otomatis lain kali.',
  'import.adapter': 'adaptor {bank}',
  'import.selectedOf': '{selected} dari {total} dipilih',
  'import.needReview': '{count} perlu ditinjau',
  'import.importBtn': 'Impor {count}',
  'import.importing': 'Mengimpor…',
  'import.importedToast': 'Mengimpor {count}',
  'import.viewEntries': 'Lihat transaksi',
  'import.registered': 'Mendaftarkan {label}',
  'import.registeredReclass': 'Mendaftarkan {label}, mengklasifikasi ulang {count} {rows}',
  'import.statementAdded': 'Menambahkan {label}',
  'import.statementAddedFilled': 'Menambahkan {label}, mengisi otomatis {count} {rows}',
  'import.row': 'baris',
  'import.rows': 'baris',

  // review table
  'review.includeAria': 'Sertakan baris ini dalam impor',
  'review.needsReview': 'Perlu ditinjau',
  'review.colDate': 'Tanggal',
  'review.colType': 'Tipe',
  'review.colCategory': 'Kategori',
  'review.colNote': 'Catatan / akun',
  'review.colAmount': 'Jumlah',
  'review.from': 'Dari…',
  'review.to': 'Ke…',
  'review.accountOptional': 'Akun (opsional)…',

  // detected counterparties
  'detected.title': 'Pihak terdeteksi ({count})',
  'detected.subtitle':
    'Daftarkan salah satu sebagai akun Anda untuk mengubah baris yang cocok menjadi',
  'detected.externalTransfer': 'Transfer eksternal',
  'detected.unnamed': '(tanpa nama)',
  'detected.noAccountNumber': 'tanpa nomor rekening',
  'detected.transactionsOne': '{count} transaksi',
  'detected.transactionsMany': '{count} transaksi',
  'detected.registerAsOwn': 'Daftarkan sebagai milik',
  'detected.registerTitle': 'Daftarkan sebagai akun Anda',
  'detected.registerTitleDisabled':
    'Nomor rekening tidak terdeteksi — daftarkan manual bila perlu',

  // import dropzone
  'dropzone.prompt': 'Letakkan PDF mutasi bank di sini, atau klik untuk memilih',
  'dropzone.privacy': 'Diproses sepenuhnya di browser Anda — tidak ada yang diunggah.',
  'dropzone.supported':
    'PDF yang didukung saat ini: BCA, BCA Syariah, Mandiri, BRI, BSI, dan Jago. Untuk bank lain fiturnya akan menyusul.',
  'dropzone.passwordRequired': '🔒 Perlu kata sandi',
  'dropzone.ready': 'Siap diproses',
  'dropzone.remove': 'Hapus',
  'dropzone.pdfPassword': 'Kata sandi PDF',
  'dropzone.passwordPlaceholder': 'Masukkan kata sandi untuk membuka',
  'dropzone.remember': 'Ingat kata sandi ini untuk impor berikutnya',
  'dropzone.storedLocally': '(disimpan lokal di perangkat ini)',
  'dropzone.parsing': 'Memproses…',
  'dropzone.parse': 'Proses mutasi',

  // columns
  'columns.button': 'Kolom',

  // settings
  'settings.title': 'Pengaturan',
  'settings.subtitle':
    'Sesuaikan aplikasi, putar ulang tutorial, dan kelola data yang disimpan aplikasi ini di perangkat Anda.',
  'settings.appearanceTitle': 'Tampilan',
  'settings.appearanceDesc': 'Pilih tampilan aplikasi di perangkat ini.',
  'settings.themeLabel': 'Tema',
  'settings.languageTitle': 'Bahasa',
  'settings.languageDesc':
    'Pilih bahasa yang digunakan di seluruh aplikasi. Terdeteksi otomatis dari browser Anda secara bawaan.',
  'settings.languageLabel': 'Bahasa',
  'settings.tutorialTitle': 'Tutorial',
  'settings.tutorialDesc':
    'Pelajari kembali cara menambah akun dan transaksi. Data Anda yang ada tidak akan diubah.',
  'settings.playTutorial': 'Putar tutorial lagi',
  'settings.passwordsTitle': 'Kata sandi dokumen tersimpan',
  'settings.passwordsDescNone':
    'Kata sandi untuk membuka mutasi bank terenkripsi saat impor.',
  'settings.passwordsDescCount':
    '{count} kata sandi tersimpan untuk membuka mutasi terenkripsi saat impor.',
  'settings.deletePasswords': 'Hapus kata sandi dokumen tersimpan',
  'settings.noPasswords': 'Tidak ada kata sandi tersimpan untuk dihapus.',
  'settings.confirmDeletePasswords':
    'Hapus semua kata sandi dokumen tersimpan? Mutasi terenkripsi akan meminta kata sandi lagi pada impor berikutnya.',
  'settings.passwordsDeleted': 'Kata sandi tersimpan dihapus',
  'settings.dangerTitle': 'Zona berbahaya',
  'settings.dangerDesc':
    'Hapus semuanya — transaksi, akun, riwayat impor, kata sandi tersimpan, dan preferensi — lalu mulai dari awal. Tindakan ini tidak dapat dibatalkan.',
  'settings.clearAll': 'Hapus semua data aplikasi dan mulai dari awal',
  'settings.confirmClear':
    'Ini menghapus permanen SEMUA data aplikasi — transaksi, akun, riwayat impor, kata sandi tersimpan, dan preferensi. Tidak dapat dibatalkan.\n\nLanjutkan?',
  'settings.confirmClearType': 'Ketik DELETE untuk mengonfirmasi penghapusan semua data aplikasi.',
  'settings.clearCancelled': 'Dibatalkan — tidak ada yang dihapus.',
  'settings.clearedToast': 'Menghapus {count} item tersimpan.',

  // onboarding
  'onboarding.welcomeTitle': 'Selamat datang di Jejak Uang 👋',
  'onboarding.welcomeSubtitle':
    'Dua langkah singkat dan angka pertama Anda akan tampil di dasbor.',
  'onboarding.skip': 'Lewati',
  'onboarding.stepLabel': 'Langkah {n}',
  'onboarding.step1Title': 'Tambah akun',
  'onboarding.step1Blurb': 'Daftarkan bank atau kantong.',
  'onboarding.step2Title': 'Tambah transaksi',
  'onboarding.step2Blurb': 'Catat satu transaksi secara manual.',
  'onboarding.step3Title': 'Lihat dasbor Anda',
  'onboarding.step3Blurb': 'Semua siap.',
  'onboarding.step1Heading': 'Langkah 1: Tambah akun',
  'onboarding.step1Desc':
    'Pilih bank Anda dan beri label. Sisanya bisa ditambahkan nanti dari halaman Akun.',
  'onboarding.step1Submit': 'Tambah akun & lanjut',
  'onboarding.accountAdded': 'Akun ditambahkan',
  'onboarding.step2Heading': 'Langkah 2: Tambah transaksi',
  'onboarding.step2Desc':
    'Catat satu pemasukan atau pengeluaran secara manual agar dasbor punya data.',
  'onboarding.step2Submit': 'Tambah transaksi & selesai',
  'onboarding.transactionAdded': 'Transaksi ditambahkan',
  'onboarding.cancelHint': '(Batal akan kembali ke langkah akun.)',

  // theme
  'theme.light': 'Terang',
  'theme.dark': 'Gelap',
  'theme.system': 'Sistem',
  'theme.change': 'Ubah tema',

  // language
  'language.change': 'Ubah bahasa',

  // feature highlights
  'features.title': 'Kenapa Jejak Uang',
  'features.privateTitle': 'Privasi sejak awal',
  'features.privateDesc':
    'Semuanya berjalan di browser Anda. Tanpa server, tanpa pelacakan — data Anda tidak pernah keluar dari perangkat.',
  'features.importTitle': 'Impor otomatis',
  'features.importDesc':
    'Unggah PDF mutasi bank dan transaksi Anda diekstrak secara otomatis.',
  'features.dashboardTitle': 'Dasbor informatif',
  'features.dashboardDesc':
    'Grafik yang jelas mengubah pemasukan dan pengeluaran menjadi tren yang mudah dibaca.',
  'features.everywhereTitle': 'Bisa di mana saja',
  'features.everywhereDesc':
    'Responsif penuh di ponsel, dengan tema terang dan gelap.',

  // categories — Indonesian locale shows the stored value as-is
  'category.Makan': 'Makan',
  'category.Kopi & Teh': 'Kopi & Teh',
  'category.Belanja Harian': 'Belanja Harian',
  'category.Transportasi': 'Transportasi',
  'category.Tempat Tinggal': 'Tempat Tinggal',
  'category.Listrik': 'Listrik',
  'category.Pulsa': 'Pulsa',
  'category.Internet': 'Internet',
  'category.Air': 'Air',
  'category.Hiburan': 'Hiburan',
  'category.Kesehatan': 'Kesehatan',
  'category.Kecantikan': 'Kecantikan',
  'category.Belanja': 'Belanja',
  'category.Pendidikan': 'Pendidikan',
  'category.Top-up': 'Top-up',
  'category.Bank Admin': 'Bank Admin',
  'category.Lainnya': 'Lainnya',
  'category.Gaji': 'Gaji',
  'category.Bonus': 'Bonus',
  'category.Investasi': 'Investasi',
  'category.Hadiah': 'Hadiah',
  'category.Antar Kantong': 'Antar Kantong',
  'category.Tabungan': 'Tabungan',
  'category.Rekening Sendiri': 'Rekening Sendiri',
}

export const DICTS: Record<Locale, Record<TranslationKey, string>> = { en, id }

export type TFunc = (key: TranslationKey, vars?: Record<string, string | number>) => string

// Replace {token} placeholders with provided values.
export function interpolate(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (m, k) =>
    k in vars ? String(vars[k]) : m,
  )
}

// Localised label for an entry type. Falls back to the type id if unknown.
export function entryTypeLabel(type: EntryType, t: TFunc): string {
  switch (type) {
    case 'income':
      return t('type.income')
    case 'expense':
      return t('type.expense')
    case 'transfer_internal':
      return t('type.transfer_internal')
    case 'transfer_external':
      return t('type.transfer_external')
    default:
      return type
  }
}

// Localised display label for a stored (Indonesian) category value. Unknown /
// custom categories pass through unchanged.
export function categoryLabel(category: string, locale: Locale): string {
  const key = `category.${category}` as TranslationKey
  const dict = DICTS[locale]
  return dict[key] ?? category
}
