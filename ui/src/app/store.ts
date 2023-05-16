import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit"
import accountReducer from "../component/accountSlice"
import serverReducer from "./serverSlice"

export const store = configureStore({
  reducer: {
    server: serverReducer,
    accounts: accountReducer,
  },
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>
