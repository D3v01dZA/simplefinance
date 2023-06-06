import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit"
import serverReducer from "./serverSlice"
import accountReducer from "./accountSlice"

export const store = configureStore({
  reducer: {
    server: serverReducer,
    accounts: accountReducer,
  },
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>
