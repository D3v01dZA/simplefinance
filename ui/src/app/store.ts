import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit"
import serverReducer from "./serverSlice"
import accountReducer from "./accountSlice"
import settingReducer from "./settingSlice"

export const store = configureStore({
  reducer: {
    server: serverReducer,
    accounts: accountReducer,
    settings: settingReducer,
  },
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>
