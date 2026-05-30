// Persisted PDF passwords. They live in plaintext in localStorage on the
// user's own device — acceptable for a single-user personal tool, but worth
// keeping in mind if this app ever ships to other users.

export interface SavedPassword {
  id: string
  password: string
  label?: string
  createdAt: string
  lastUsedAt: string
}

export type NewSavedPassword = Pick<SavedPassword, 'password' | 'label'>

export interface PasswordRepository {
  list(): Promise<SavedPassword[]>
  // Add (or update lastUsedAt if the same password already exists).
  upsert(input: NewSavedPassword): Promise<SavedPassword>
  touch(id: string): Promise<void>
  remove(id: string): Promise<void>
  clear(): Promise<void>
}
