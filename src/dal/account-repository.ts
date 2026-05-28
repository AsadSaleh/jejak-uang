import type { Account, AccountPatch, NewAccount } from './types'

export interface AccountRepository {
  list(): Promise<Account[]>
  get(id: string): Promise<Account | null>
  create(input: NewAccount): Promise<Account>
  update(id: string, patch: AccountPatch): Promise<Account>
  remove(id: string): Promise<void>
}
