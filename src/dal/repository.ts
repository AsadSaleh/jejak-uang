import type { Entry, EntryPatch, NewEntry } from './types'

export interface EntryRepository {
  list(): Promise<Entry[]>
  get(id: string): Promise<Entry | null>
  create(input: NewEntry): Promise<Entry>
  createMany(inputs: NewEntry[]): Promise<Entry[]>
  update(id: string, patch: EntryPatch): Promise<Entry>
  remove(id: string): Promise<void>
  removeMany(ids: string[]): Promise<void>
  // Re-insert previously removed entries as-is (preserving id/timestamps).
  restore(entries: Entry[]): Promise<void>
  clear(): Promise<void>
}
