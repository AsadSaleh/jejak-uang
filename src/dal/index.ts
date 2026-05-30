import { LocalStorageEntryRepository } from './local-storage-repository'
import { LocalStorageAccountRepository } from './local-storage-account-repository'
import { LocalStorageBatchRepository } from './local-storage-batch-repository'
import { LocalStoragePasswordRepository } from './local-storage-password-repository'
import type { EntryRepository } from './repository'
import type { AccountRepository } from './account-repository'
import type { BatchRepository } from './batch-repository'
import type { PasswordRepository } from './password-repository'

export * from './types'
export * from './repository'
export * from './account-repository'
export * from './batch-repository'
export * from './password-repository'

export const entryRepository: EntryRepository = new LocalStorageEntryRepository()
export const accountRepository: AccountRepository =
  new LocalStorageAccountRepository()
export const batchRepository: BatchRepository =
  new LocalStorageBatchRepository()
export const passwordRepository: PasswordRepository =
  new LocalStoragePasswordRepository()
