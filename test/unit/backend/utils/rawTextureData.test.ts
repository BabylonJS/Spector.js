import { RawTextureData } from "../../../../src/backend/utils/rawTextureData";

/** Decode the base64 payload back into an RGBA byte array for assertions. */
function decode(base64: string): number[] {
    const binary = atob(base64);
    const out: number[] = [];
    for (let i = 0; i < binary.length; i++) {
        out.push(binary.charCodeAt(i));
    }
    return out;
}

/** Build a solid opaque texture of `w`x`h`. */
function opaque(w: number, h: number): Uint8Array {
    const px = new Uint8Array(w * h * 4);
    for (let i = 0; i < px.length; i += 4) {
        px[i] = 10; px[i + 1] = 20; px[i + 2] = 30; px[i + 3] = 255;
    }
    return px;
}

describe("RawTextureData.encode gating", () => {
    it("returns null for a fully opaque texture (nothing to preserve)", () => {
        expect(RawTextureData.encode(opaque(4, 4), 4, 4)).toBeNull();
    });

    it("returns null for a transparent-black texture (nothing to reveal)", () => {
        // All zeros: alpha 0 but RGB 0 too — the premultiplied thumbnail loses nothing.
        expect(RawTextureData.encode(new Uint8Array(2 * 2 * 4), 2, 2)).toBeNull();
    });

    it("returns null for degenerate dimensions", () => {
        expect(RawTextureData.encode(new Uint8Array(0), 0, 0)).toBeNull();
        expect(RawTextureData.encode(opaque(2, 2), -1, 2)).toBeNull();
    });

    it("returns null when the pixel buffer is too small", () => {
        expect(RawTextureData.encode(new Uint8Array(4), 4, 4)).toBeNull();
    });

    it("encodes a texture that has any transparent texel", () => {
        const px = opaque(2, 2);
        px[3] = 0; // make the first texel transparent
        const result = RawTextureData.encode(px, 2, 2);
        expect(result).not.toBeNull();
        expect(result!.width).toBe(2);
        expect(result!.height).toBe(2);
    });
});

describe("RawTextureData.encode content", () => {
    it("flips Y (readPixels is bottom-up) and preserves hidden RGB", () => {
        // 1x2 texture, bottom-up input rows: row0 = bottom, row1 = top.
        // Bottom texel hides colour behind alpha 0.
        const px = new Uint8Array([
            200, 100, 50, 0,    // bottom row
            20, 0, 0, 255,      // top row
        ]);
        const result = RawTextureData.encode(px, 1, 2);
        expect(result).not.toBeNull();
        // Output is top-down: top row first, then the (colour-preserving) bottom row.
        expect(decode(result!.data)).toEqual([20, 0, 0, 255, 200, 100, 50, 0]);
    });

    it("down-scales textures larger than the cap while staying within bounds", () => {
        const w = 300;
        const h = 100;
        const px = opaque(w, h);
        px[3] = 0; // ensure it is considered transparent
        const result = RawTextureData.encode(px, w, h);
        expect(result).not.toBeNull();
        expect(result!.width).toBe(RawTextureData.cap);
        expect(result!.height).toBeLessThanOrEqual(RawTextureData.cap);
        expect(result!.width).toBeGreaterThan(0);
        // Payload length matches the reported dimensions.
        expect(decode(result!.data).length).toBe(result!.width * result!.height * 4);
    });
});
