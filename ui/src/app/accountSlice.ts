import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "./store"

export type IndexedAccounts = { [id: string]: JAccount }

export interface AccountState {
  accounts: IndexedAccounts
}

export interface JAccount {
  id: string
  name: string
  type: AccountType
}

export enum AccountType {
  SAVINGS = "SAVINGS",
  CHECKING = "CHECKING",
  LOAN = "LOAN",
  CREDIT_CARD = "CREDIT_CARD",
  INVESTMENT = "INVESTMENT",
  RETIREMENT = "RETIREMENT",
  ASSET = "ASSET",
  EXTERNAL = "EXTERNAL",
}

const initialState: AccountState = {
  accounts: {},
}

export const accountSlice = createSlice({
  name: "accounts",
  initialState: initialState,
  reducers: {
    setAccounts(state, action: PayloadAction<JAccount[]>) {
      state.accounts = action.payload.reduce<IndexedAccounts>((prev, cur) => {
        prev[cur.id] = cur
        return prev
      }, {})
    },
  },
})

export const { setAccounts } = accountSlice.actions

export const selectAccounts = (state: RootState) => state.accounts.accounts

export default accountSlice.reducer
