import {
    IChannelMask,
    decodeBase64Pixels,
    applyChannelMask,
    formatHexColor,
    formatNormalized,
} from "../../../src/embeddedFrontend/react/shared/textureViewer";

const ALL: IChannelMask = { r: true, g: true, b: true, a: true };

describe("textureViewer.decodeBase64Pixels", () => {
    it("round-trips bytes through base64", () => {
        const bytes = new Uint8Array([200, 100, 50, 0, 10, 220, 30, 255]);
        const base64 = btoa(String.fromCharCode.apply(null, Array.from(bytes) as any));
        const decoded = decodeBase64Pixels(base64);
        expect(Array.from(decoded)).toEqual(Array.from(bytes));
    });
});

describe("textureViewer.applyChannelMask", () => {
    it("returns the source unchanged when every channel is visible", () => {
        const src = new Uint8ClampedArray([12, 34, 56, 78]);
        expect(Array.from(applyChannelMask(src, ALL))).toEqual([12, 34, 56, 78]);
    });

    it("forces alpha to 255 while preserving RGB when alpha is hidden (#183)", () => {
        // A pixel whose colour is hidden behind a=0 must resurface opaque.
        const src = new Uint8ClampedArray([200, 100, 50, 0]);
        const out = applyChannelMask(src, { r: true, g: true, b: true, a: false });
        expect(Array.from(out)).toEqual([200, 100, 50, 255]);
    });

    it("zeroes hidden colour channels", () => {
        const src = new Uint8ClampedArray([200, 100, 50, 255]);
        const out = applyChannelMask(src, { r: true, g: false, b: false, a: true });
        expect(Array.from(out)).toEqual([200, 0, 0, 255]);
    });

    it("renders the isolated alpha channel as opaque grayscale", () => {
        const src = new Uint8ClampedArray([200, 100, 50, 128]);
        const out = applyChannelMask(src, { r: false, g: false, b: false, a: true });
        expect(Array.from(out)).toEqual([128, 128, 128, 255]);
    });

    it("processes every pixel independently", () => {
        const src = new Uint8ClampedArray([10, 20, 30, 0, 40, 50, 60, 255]);
        const out = applyChannelMask(src, { r: true, g: true, b: true, a: false });
        expect(Array.from(out)).toEqual([10, 20, 30, 255, 40, 50, 60, 255]);
    });
});

describe("textureViewer formatting", () => {
    it("formats an RGBA pixel as #rrggbbaa", () => {
        expect(formatHexColor(255, 0, 16, 255)).toBe("#ff0010ff");
        expect(formatHexColor(0, 0, 0, 0)).toBe("#00000000");
    });

    it("formats normalized components to two decimals", () => {
        expect(formatNormalized(255, 0, 128, 0)).toBe("1.00, 0.00, 0.50, 0.00");
    });
});
