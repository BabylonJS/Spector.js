export class Base64 {
    /** Base64-encode a byte buffer in stack-safe chunks (works in Workers via `btoa`). */
    public static encode(bytes: Uint8Array): string {
        let binary = "";
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as any);
        }
        return btoa(binary);
    }
}
