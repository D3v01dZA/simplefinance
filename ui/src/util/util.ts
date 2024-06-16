import { IndexedAccounts } from "../app/accountSlice";
import { ServerState } from "../app/serverSlice";
import { IndexedSettings, SettingKey } from "../app/settingSlice";

export function titleCase(value: string) {
    const values = value.split("_");
    return values.map(value => value.charAt(0).toUpperCase() + value.substr(1).toLowerCase()).join(" ");
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
    return fetch(`${server.url}${url}`, { method: "DELETE" })
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

export function constrainedPage(size: number, pageSize: number, page: number) {
    return Math.max(0, Math.min(page, maxPage(size, pageSize)))
}

export function maxPage(size: number, pageSize: number) {
    if (pageSize === 0) {
        return 0;
    }
    return Math.floor((size - 1) / pageSize);
}

export function today() {
    const date = new Date();

    function month() {
        const month = (date.getMonth() + 1) + "";
        if (month.length === 1) {
            return "0" + month;
        }
        return month;
    }

    function day() {
        const day = date.getDate() + "";
        if (day.length === 1) {
            return "0" + day;
        }
        return day;
    }

    return `${date.getFullYear()}-${month()}-${day()}`
}

export function defaultAccountId(settings: IndexedSettings, accounts: IndexedAccounts) {
    const found = settings[SettingKey.DEFAULT_TRANSACTION_FROM_ACCOUNT_ID];
    if (found) {
        const foundAccount = accounts[found.value];
        if (foundAccount) {
            return foundAccount.id;
        }
    }
    return Object.values(accounts)[0]?.id ?? "";
}

export function accountTitle(accountId: string, accounts: IndexedAccounts) {
    if (accountId === undefined || accountId === null) {
        return "";
    }
    const account = accounts[accountId];
    if (account == undefined || account === null) {
        return "ERROR";
    }
    return account.name + " (" + titleCase(account.type) + ")";
}

export function formattedUnknownAmount(amount: any) {
    if (typeof amount === "number") {
        return formattedAmount(amount);
    }
    return amount;
}

export function isValueValid(value: string | undefined) {
    if (value === undefined || value === "") {
        return false;
    }
    const float = parseFloat(value);
    if (Number.isNaN(float)) {
        return false;
    }
    return true;
}

export function formattedAmount(amount: number) {
    return amount.toFixed(2).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function generateColorPalette(numColors: number): string[] {
    
    // Helper function to convert HSL color to hex color code
    function hslToHex(h: number, s: number, l: number): string {
        h /= 360;
        s /= 100;
        l /= 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p: number, q: number, t: number): number => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1 / 6) return p + (q - p) * 6 * t;
                if (t < 1 / 2) return q;
                if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = Math.round(hue2rgb(p, q, h + 1 / 3) * 255);
            g = Math.round(hue2rgb(p, q, h) * 255);
            b = Math.round(hue2rgb(p, q, h - 1 / 3) * 255);
        }

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
    const palette: string[] = [];

    for (let i = 0; i < numColors; i++) {
        const hue = (i * 360) / numColors; // Distribute hues evenly across the color wheel
        const saturation = 70; // Adjust saturation as needed (0-100)
        const lightness = 50; // Adjust lightness as needed (0-100)

        // Convert HSL color to hex color code
        const hexColor = hslToHex(hue, saturation, lightness);

        palette.push(hexColor);
    }

    return palette;
}