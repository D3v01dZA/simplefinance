import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { RootState } from "./store";

export enum SettingKey {
    DEFAULT_TRANSACTION_FROM_ACCOUNT_ID = "DEFAULT_TRANSACTION_FROM_ACCOUNT_ID",
    TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS = "TRANSFER_WITHOUT_BALANCE_IGNORED_ACCOUNTS",
    NO_REGULAR_BALANCE_ACCOUNTS = "NO_REGULAR_BALANCE_ACCOUNTS",
    REPEATING_TRANSFERS = "REPEATING_TRANSFERS",
}

export interface SettingState {
    settings: IndexedSettings,
}

export type IndexedSettings = {
    [key in keyof typeof SettingKey]?: JSetting
}

export interface JSetting {
    id: string,
    key: SettingKey,
    value: string,
}

const initialState: SettingState = {
    settings: {},
}

export const accountSlice = createSlice({
    name: "accounts",
    initialState: initialState,
    reducers: {
        setSettings(state, action: PayloadAction<JSetting[]>) {
            state.settings = action.payload.reduce<{[key: string] : JSetting}>((prev, cur) => {
                prev[cur.key] = cur;
                return prev;
            }, {}) as IndexedSettings;
        }
    }
});

export const { setSettings } = accountSlice.actions;

export const selectSettings = (state: RootState) => state.settings.settings;

export default accountSlice.reducer;