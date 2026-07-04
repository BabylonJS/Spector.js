/**
 * Pure helpers for the texture viewer (#183): decoding the preserved
 * non-premultiplied pixels and applying the channel/alpha transforms. Kept free
 * of DOM/React so they can be unit-tested directly.
 */

/** Which colour channels are currently visible in the viewer. */
export interface IChannelMask {
    r: boolean;
    g: boolean;
    b: boolean;
    a: boolean;
}

/** Decode base64 RGBA bytes (as stored in the capture) into a pixel buffer. */
export function decodeBase64Pixels(base64: string): Uint8ClampedArray {
    const binary = atob(base64);
    const out = new Uint8ClampedArray(binary.length);
    for (let i = 0; i < binary.length; i++) {
        out[i] = binary.charCodeAt(i);
    }
    return out;
}

/**
 * Apply the channel mask to a source RGBA buffer, returning a new display
 * buffer:
 *  - isolating a single alpha channel renders it as opaque grayscale;
 *  - hidden colour channels are zeroed;
 *  - hiding alpha forces the pixel opaque (this is what reveals RGB that a
 *    premultiplied thumbnail would have shown as transparent — issue #183).
 */
export function applyChannelMask(source: Uint8ClampedArray, mask: IChannelMask): Uint8ClampedArray {
    const out = new Uint8ClampedArray(source.length);
    const onlyAlpha = mask.a && !mask.r && !mask.g && !mask.b;
    for (let i = 0; i < source.length; i += 4) {
        if (onlyAlpha) {
            const alpha = source[i + 3];
            out[i] = alpha;
            out[i + 1] = alpha;
            out[i + 2] = alpha;
            out[i + 3] = 255;
        } else {
            out[i] = mask.r ? source[i] : 0;
            out[i + 1] = mask.g ? source[i + 1] : 0;
            out[i + 2] = mask.b ? source[i + 2] : 0;
            out[i + 3] = mask.a ? source[i + 3] : 255;
        }
    }
    return out;
}

/** Two-digit lowercase hex for a 0-255 byte. */
function toHexByte(value: number): string {
    const hex = (value & 0xff).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

/** Format an RGBA pixel as `#rrggbbaa`. */
export function formatHexColor(r: number, g: number, b: number, a: number): string {
    return "#" + toHexByte(r) + toHexByte(g) + toHexByte(b) + toHexByte(a);
}

/** Format an RGBA pixel as normalized (0..1, two decimals) components. */
export function formatNormalized(r: number, g: number, b: number, a: number): string {
    const n = (value: number): string => (value / 255).toFixed(2);
    return n(r) + ", " + n(g) + ", " + n(b) + ", " + n(a);
}
