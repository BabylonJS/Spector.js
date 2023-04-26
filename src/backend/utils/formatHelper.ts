export function formatBinary(value: number): string {
    if (value === undefined || value === null) {
        return "";
    }

    return `${value.toFixed(0)} (0b${(value >>> 0).toString(2)})`;
}
