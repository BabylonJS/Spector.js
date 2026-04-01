import { CanvasFactory } from "../../../src/backend/utils/canvasFactory";

/**
 * Helper: decode base64 data URI to Uint8Array.
 */
function decodeDataURI(dataURI: string): Uint8Array {
    const base64 = dataURI.split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Helper: parse BMP header fields from raw bytes.
 */
function parseBMPHeader(bytes: Uint8Array) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return {
        magic: String.fromCharCode(view.getUint8(0)) + String.fromCharCode(view.getUint8(1)),
        fileSize: view.getUint32(2, true),
        pixelDataOffset: view.getUint32(10, true),
        dibHeaderSize: view.getUint32(14, true),
        width: view.getInt32(18, true),
        height: view.getInt32(22, true),
        bitsPerPixel: view.getUint16(28, true),
        compression: view.getUint32(30, true),
    };
}

/**
 * Helper: read a BGRA pixel at (x, y) from BMP pixel data.
 * BMP is bottom-up, so row 0 in the file is the last row of the image.
 */
function readBMPPixel(bytes: Uint8Array, header: ReturnType<typeof parseBMPHeader>, x: number, y: number) {
    const rowSize = header.width * 4;
    // y is in BMP bottom-up order: BMP row 0 = image bottom row
    const offset = header.pixelDataOffset + y * rowSize + x * 4;
    return {
        b: bytes[offset],
        g: bytes[offset + 1],
        r: bytes[offset + 2],
        a: bytes[offset + 3],
    };
}

describe("CanvasFactory", () => {
    describe("encodeBMP", () => {
        it("1×1 red pixel produces valid BMP data URI", () => {
            // RGBA: red=255, green=0, blue=0, alpha=255
            const pixels = new Uint8ClampedArray([255, 0, 0, 255]);
            const result = CanvasFactory.encodeBMP(pixels, 1, 1);

            expect(result.startsWith("data:image/bmp;base64,")).toBe(true);

            const bytes = decodeDataURI(result);
            const header = parseBMPHeader(bytes);

            // File header checks
            expect(header.magic).toBe("BM");
            expect(header.width).toBe(1);
            expect(header.height).toBe(1);
            expect(header.bitsPerPixel).toBe(32);

            // Expected file size: 14 (file header) + 108 (V4 DIB header) + 4 (1 pixel * 4 bytes)
            expect(header.fileSize).toBe(14 + 108 + 4);
            expect(bytes.length).toBe(header.fileSize);

            // Pixel data: BGRA order, single pixel so no Y-flip ambiguity
            const pixel = readBMPPixel(bytes, header, 0, 0);
            expect(pixel.r).toBe(255);
            expect(pixel.g).toBe(0);
            expect(pixel.b).toBe(0);
            expect(pixel.a).toBe(255);
        });

        it("2×2 known pattern verifies RGBA→BGRA conversion and Y-flip", () => {
            // Source pixels (top-down RGBA):
            // Row 0 (top):    [Red,    Green]
            // Row 1 (bottom): [Blue,   White]
            const pixels = new Uint8ClampedArray([
                255, 0, 0, 255,     // (0,0) Red
                0, 255, 0, 255,     // (1,0) Green
                0, 0, 255, 255,     // (0,1) Blue
                255, 255, 255, 255, // (1,1) White
            ]);
            const result = CanvasFactory.encodeBMP(pixels, 2, 2);
            const bytes = decodeDataURI(result);
            const header = parseBMPHeader(bytes);

            expect(header.width).toBe(2);
            expect(header.height).toBe(2);
            expect(header.fileSize).toBe(14 + 108 + 2 * 2 * 4);

            // BMP is bottom-up: BMP row 0 = source row 1 (bottom of image)
            // BMP row 0, pixel 0 = source (0,1) = Blue
            const bmpR0P0 = readBMPPixel(bytes, header, 0, 0);
            expect(bmpR0P0.r).toBe(0);
            expect(bmpR0P0.g).toBe(0);
            expect(bmpR0P0.b).toBe(255);
            expect(bmpR0P0.a).toBe(255);

            // BMP row 0, pixel 1 = source (1,1) = White
            const bmpR0P1 = readBMPPixel(bytes, header, 1, 0);
            expect(bmpR0P1.r).toBe(255);
            expect(bmpR0P1.g).toBe(255);
            expect(bmpR0P1.b).toBe(255);
            expect(bmpR0P1.a).toBe(255);

            // BMP row 1, pixel 0 = source (0,0) = Red
            const bmpR1P0 = readBMPPixel(bytes, header, 0, 1);
            expect(bmpR1P0.r).toBe(255);
            expect(bmpR1P0.g).toBe(0);
            expect(bmpR1P0.b).toBe(0);
            expect(bmpR1P0.a).toBe(255);

            // BMP row 1, pixel 1 = source (1,0) = Green
            const bmpR1P1 = readBMPPixel(bytes, header, 1, 1);
            expect(bmpR1P1.r).toBe(0);
            expect(bmpR1P1.g).toBe(255);
            expect(bmpR1P1.b).toBe(0);
            expect(bmpR1P1.a).toBe(255);
        });

        it("0×0 returns empty BMP data URI", () => {
            const pixels = new Uint8ClampedArray([]);
            expect(CanvasFactory.encodeBMP(pixels, 0, 0)).toBe("data:image/bmp;base64,");
        });

        it("negative dimensions return empty BMP data URI", () => {
            const pixels = new Uint8ClampedArray([]);
            expect(CanvasFactory.encodeBMP(pixels, -1, 5)).toBe("data:image/bmp;base64,");
            expect(CanvasFactory.encodeBMP(pixels, 3, -2)).toBe("data:image/bmp;base64,");
        });

        it("odd dimensions (3×5) produce valid BMP", () => {
            const w = 3;
            const h = 5;
            const pixels = new Uint8ClampedArray(w * h * 4);
            // Fill with a gradient pattern
            for (let i = 0; i < w * h; i++) {
                pixels[i * 4 + 0] = (i * 17) & 0xFF;
                pixels[i * 4 + 1] = (i * 31) & 0xFF;
                pixels[i * 4 + 2] = (i * 53) & 0xFF;
                pixels[i * 4 + 3] = 255;
            }
            const result = CanvasFactory.encodeBMP(pixels, w, h);

            expect(result.startsWith("data:image/bmp;base64,")).toBe(true);

            const bytes = decodeDataURI(result);
            const header = parseBMPHeader(bytes);

            expect(header.width).toBe(w);
            expect(header.height).toBe(h);
            expect(header.fileSize).toBe(14 + 108 + w * h * 4);
            expect(bytes.length).toBe(header.fileSize);
        });

        it("all white pixels have no byte corruption", () => {
            const w = 4;
            const h = 4;
            const pixels = new Uint8ClampedArray(w * h * 4).fill(255);
            const result = CanvasFactory.encodeBMP(pixels, w, h);

            const bytes = decodeDataURI(result);
            const header = parseBMPHeader(bytes);

            // Every pixel should be white (BGRA = 255,255,255,255)
            for (let py = 0; py < h; py++) {
                for (let px = 0; px < w; px++) {
                    const pixel = readBMPPixel(bytes, header, px, py);
                    expect(pixel.r).toBe(255);
                    expect(pixel.g).toBe(255);
                    expect(pixel.b).toBe(255);
                    expect(pixel.a).toBe(255);
                }
            }
        });

        it("all transparent pixels preserve alpha channel", () => {
            const w = 2;
            const h = 3;
            // RGBA: all zeros = fully transparent black
            const pixels = new Uint8ClampedArray(w * h * 4).fill(0);
            const result = CanvasFactory.encodeBMP(pixels, w, h);

            const bytes = decodeDataURI(result);
            const header = parseBMPHeader(bytes);

            for (let py = 0; py < h; py++) {
                for (let px = 0; px < w; px++) {
                    const pixel = readBMPPixel(bytes, header, px, py);
                    expect(pixel.r).toBe(0);
                    expect(pixel.g).toBe(0);
                    expect(pixel.b).toBe(0);
                    expect(pixel.a).toBe(0);
                }
            }
        });

        it("accepts Uint8Array as well as Uint8ClampedArray", () => {
            const pixels = new Uint8Array([128, 64, 32, 200]);
            const result = CanvasFactory.encodeBMP(pixels, 1, 1);

            const bytes = decodeDataURI(result);
            const header = parseBMPHeader(bytes);
            const pixel = readBMPPixel(bytes, header, 0, 0);

            expect(pixel.r).toBe(128);
            expect(pixel.g).toBe(64);
            expect(pixel.b).toBe(32);
            expect(pixel.a).toBe(200);
        });
    });

    describe("createCanvas", () => {
        it("returns a canvas with correct dimensions", () => {
            const canvas = CanvasFactory.createCanvas(320, 240);
            expect(canvas.width).toBe(320);
            expect(canvas.height).toBe(240);
        });

        it("returns HTMLCanvasElement on main thread (jsdom)", () => {
            // In jsdom environment, document is defined
            const canvas = CanvasFactory.createCanvas(10, 10);
            expect(canvas).toBeInstanceOf(HTMLCanvasElement);
        });
    });

    describe("canvasToDataURL", () => {
        it("returns PNG data URI on main thread (jsdom)", () => {
            const canvas = CanvasFactory.createCanvas(2, 2) as HTMLCanvasElement;

            // jsdom doesn't implement toDataURL natively; mock it
            canvas.toDataURL = jest.fn(() => "data:image/png;base64,fakedata");

            const result = CanvasFactory.canvasToDataURL(canvas);
            expect(result.startsWith("data:image/png")).toBe(true);
            expect(canvas.toDataURL).toHaveBeenCalled();
        });
    });

    describe("isMainThread", () => {
        it("returns true in jsdom environment", () => {
            expect(CanvasFactory.isMainThread).toBe(true);
        });
    });

    describe("setImageSmoothing", () => {
        it("sets imageSmoothingEnabled on a 2D context", () => {
            // jsdom doesn't implement getContext("2d"), so use a mock context
            const mockCtx = { imageSmoothingEnabled: true } as any;

            CanvasFactory.setImageSmoothing(mockCtx, false);
            expect(mockCtx.imageSmoothingEnabled).toBe(false);
            // On main thread, vendor prefixes should also be set
            expect(mockCtx.mozImageSmoothingEnabled).toBe(false);
            expect(mockCtx.webkitImageSmoothingEnabled).toBe(false);

            CanvasFactory.setImageSmoothing(mockCtx, true);
            expect(mockCtx.imageSmoothingEnabled).toBe(true);
        });
    });

    describe("get2DContext", () => {
        it("returns a valid 2D rendering context", () => {
            const canvas = CanvasFactory.createCanvas(5, 5) as HTMLCanvasElement;

            // jsdom doesn't implement getContext; mock it
            const mockCtx = {
                getImageData: jest.fn(),
                putImageData: jest.fn(),
            };
            canvas.getContext = jest.fn(() => mockCtx) as any;

            const ctx = CanvasFactory.get2DContext(canvas);
            expect(ctx).toBeTruthy();
            expect(typeof ctx.getImageData).toBe("function");
            expect(typeof ctx.putImageData).toBe("function");
        });
    });
});
