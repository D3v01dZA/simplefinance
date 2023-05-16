import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "../app/store";

export interface Account {
    id: string,
    name: string,
}

export interface AccountsState {
    accounts: Account[]
}

const initialState: AccountsState = {
    accounts: []
}

export const accountSlice = createSlice({
    name: "accounts",
    initialState: initialState,
    reducers: {
        addAccount: (state, action: PayloadAction<Account>) => {
            state.accounts.push(action.payload);
        }
    }
})

export const {addAccount} = accountSlice.actions;

export const selectAccounts = (state: RootState) => state.accounts.accounts;

export default accountSlice.reducer;