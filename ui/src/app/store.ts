import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit"
import serverReducer from "./serverSlice"

export const store = configureStore({
  reducer: {
    server: serverReducer,
  },
})

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>
