import { ServerState } from "../app/serverSlice";

export function titleCase(value: string) {
    return value.charAt(0).toUpperCase() + value.substr(1).toLowerCase();
}

export function get<T>(server: ServerState, url: String) {
    return fetch(`${server.url}${url}`)
        .then(response => {
            if (response.status >= 400) {
                throw Error(`Error response ${response.status}`);
            }
            return response;
        })
        .then<T>(response => response.json());
}

export function post<T>(server: ServerState, url: String, data: any) {
    return fetch(`${server.url}${url}`, { method: "POST", body: JSON.stringify(data), headers: { "Content-Type": "application/json" } })
        .then(response => {
            if (response.status >= 400) {
                throw Error(`Error response ${response.status}`);
            }
            return response;
        })
        .then<T>(response => response.json());
}

export function del<T>(server: ServerState, url: String) {
    return fetch(`${server.url}${url}`, { method: "DELETE"})
        .then(response => {
            if (response.status >= 400) {
                throw Error(`Error response ${response.status}`);
            }
            return response;
        })
        .then<T>(response => response.json());
}

export function err(message: String | any) {
    console.log(message);
    if (typeof message === "string") {
        alert(message);
    } else if (message.message !== undefined) {
        alert(message.message);
    } else {
        alert(JSON.stringify(message));
    }
}