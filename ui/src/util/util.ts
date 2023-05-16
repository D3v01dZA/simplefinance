import { ServerState } from "../app/serverSlice";

export function get<T>(server: ServerState, url: String) {
    return fetch(`${server.url}${url}`)
        .then<T>(response => response.json());
}

export function err(message: String | any) {
    if (typeof message === "string") {
        alert(message);
    } else {
        alert(JSON.stringify(message));
    }
}