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