import { createSlice } from "@reduxjs/toolkit"
import { RootState } from "./store";

export interface ServerState {
    url: String,
}

const initialState: ServerState = {
    url: ".",
}

export const serverSlice = createSlice({
    name: "server",
    initialState: initialState,
    reducers: {}
});

export const selectServer = (state: RootState) => state.server;

export default serverSlice.reducer;