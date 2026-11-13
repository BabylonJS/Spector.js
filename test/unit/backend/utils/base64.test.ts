import { Base64 } from "../../../../src/backend/utils/base64";

/** Decode a base64 string back into a byte array for assertions. */
function decode(base64: string): number[] {
    const binary = atob(base64);
    const out: number[] = [];
    for (let i = 0; i < binary.length; i++) {
        out.push(binary.charCodeAt(i));
    }
    return out;
}

describe("Base64.encode", () => {
    it("round-trips a small byte buffer", () => {
        const bytes = new Uint8Array([0, 1, 2, 254, 255, 128]);
        expect(decode(Base64.encode(bytes))).toEqual(Array.from(bytes));
    });

    it("returns an empty string for an empty buffer", () => {
        expect(Base64.encode(new Uint8Array(0))).toBe("");
    });

    it("encodes across the 0x8000 chunk boundary without truncation", () => {
        // Larger than one chunk so the stack-safe chunking path is exercised.
        const bytes = new Uint8Array(0x8000 * 2 + 123);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = i & 0xff;
        }
        const decoded = decode(Base64.encode(bytes));
        expect(decoded.length).toBe(bytes.length);
        expect(decoded[0]).toBe(0);
        expect(decoded[bytes.length - 1]).toBe((bytes.length - 1) & 0xff);
    });
});
