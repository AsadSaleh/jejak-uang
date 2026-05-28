import { LocalStorageEntryRepository } from './local-storage-repository'
import { LocalStorageAccountRepository } from './local-storage-account-repository'
import type { EntryRepository } from './repository'
import type { AccountRepository } from './account-repository'

export * from './types'
export * from './repository'
export * from './account-repository'

export const entryRepository: EntryRepository = new LocalStorageEntryRepository()
export const accountRepository: AccountRepository =
  new LocalStorageAccountRepository()
