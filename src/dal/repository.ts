import type { Entry, EntryPatch, NewEntry } from './types'

export interface EntryRepository {
  list(): Promise<Entry[]>
  get(id: string): Promise<Entry | null>
  create(input: NewEntry): Promise<Entry>
  update(id: string, patch: EntryPatch): Promise<Entry>
  remove(id: string): Promise<void>
  clear(): Promise<void>
}
