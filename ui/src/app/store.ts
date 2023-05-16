import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit"
import accountReducer from "../component/accountSlice"

export const store = configureStore({
  reducer: {
    accounts: accountReducer,
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
