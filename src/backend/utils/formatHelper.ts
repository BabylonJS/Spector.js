export function formatBinary(value: number): string {
    return `${value.toFixed(0)} (0b${(value >>> 0).toString(2)})`;
}
