import { LocalStorageEntryRepository } from './local-storage-repository'
import type { EntryRepository } from './repository'

export * from './types'
export * from './repository'

export const entryRepository: EntryRepository = new LocalStorageEntryRepository()
