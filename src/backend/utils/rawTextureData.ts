/**
 * Non-premultiplied raw texel data preserved alongside a texture/visual-state
 * thumbnail so the front-end texture viewer (#183) can reveal channels that the
 * premultiplied 2D-canvas thumbnail destroys.
 *
 * A canvas 2D context stores its backing buffer with premultiplied alpha, so
 * `putImageData` of a pixel whose alpha is 0 zeroes its RGB. The visual PNGs are
 * produced through that canvas and therefore lose the colour of fully
 * transparent texels. Encoding the raw `readPixels` bytes here — before any
 * canvas round-trip — keeps that colour available to the viewer.
 */
export interface IRawTextureData {
    /** Base64 of the RGBA bytes, top-down, row-major (`width * height * 4` long). */
    data: string;
    /** Width, in texels, of the stored (possibly down-scaled) buffer. */
    width: number;
    /** Height, in texels, of the stored (possibly down-scaled) buffer. */
    height: number;
}

export class RawTextureData {
    /**
     * Largest dimension stored. Larger textures are nearest-neighbour
     * down-scaled so the extra capture payload stays bounded.
     */
    public static cap: number = 256;

    /**
     * Produce non-premultiplied raw RGBA (top-down) from bottom-up `readPixels`
     * output, but only when the texture actually has transparency — otherwise
     * the existing thumbnail already conveys everything and we avoid bloating
     * the capture. Returns `null` when not needed or not possible.
     */
    public static encode(pixels: Uint8Array | Uint8ClampedArray, width: number, height: number): IRawTextureData | null {
        width = Math.floor(width);
        height = Math.floor(height);
        if (width <= 0 || height <= 0) {
            return null;
        }

        const expected = width * height * 4;
        if (!pixels || pixels.length < expected) {
            return null;
        }

        // Preserve raw only when it can reveal something the premultiplied
        // thumbnail cannot: a partially transparent texel, or a fully
        // transparent texel that still carries colour (#183). Skip
        // transparent-black (e.g. cleared framebuffer regions) so captures are
        // not bloated with data that reveals nothing.
        let hasHiddenInfo = false;
        for (let i = 0; i < expected; i += 4) {
            const alpha = pixels[i + 3];
            if (alpha < 255 && (alpha !== 0 || pixels[i] !== 0 || pixels[i + 1] !== 0 || pixels[i + 2] !== 0)) {
                hasHiddenInfo = true;
                break;
            }
        }
        if (!hasHiddenInfo) {
            return null;
        }

        // Bound the stored size (nearest-neighbour) and flip Y — `readPixels`
        // is bottom-up whereas the displayed thumbnail is top-down.
        const scale = Math.min(1, RawTextureData.cap / Math.max(width, height));
        const targetWidth = Math.max(1, Math.round(width * scale));
        const targetHeight = Math.max(1, Math.round(height * scale));
        const out = new Uint8Array(targetWidth * targetHeight * 4);

        for (let ty = 0; ty < targetHeight; ty++) {
            const sourceY = Math.min(height - 1, Math.floor((ty * height) / targetHeight));
            const sourceRow = (height - 1 - sourceY) * width * 4;
            const destinationRow = ty * targetWidth * 4;
            for (let tx = 0; tx < targetWidth; tx++) {
                const sourceX = Math.min(width - 1, Math.floor((tx * width) / targetWidth));
                const source = sourceRow + sourceX * 4;
                const destination = destinationRow + tx * 4;
                out[destination] = pixels[source];
                out[destination + 1] = pixels[source + 1];
                out[destination + 2] = pixels[source + 2];
                out[destination + 3] = pixels[source + 3];
            }
        }

        return { data: RawTextureData.toBase64(out), width: targetWidth, height: targetHeight };
    }

    /** Base64-encode a byte buffer in stack-safe chunks (works in Workers via `btoa`). */
    private static toBase64(bytes: Uint8Array): string {
        let binary = "";
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.length; i += chunkSize) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize) as any);
        }
        return btoa(binary);
    }
}
