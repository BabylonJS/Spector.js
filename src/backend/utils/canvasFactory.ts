type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
type Any2DContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/**
 * Abstracts canvas creation and image encoding for main-thread and Worker environments.
 */
export class CanvasFactory {
    /** True when running on main thread with DOM access. */
    public static get isMainThread(): boolean {
        return typeof document !== "undefined";
    }

    /** Creates a canvas appropriate for the current environment. */
    public static createCanvas(width: number, height: number): AnyCanvas {
        if (CanvasFactory.isMainThread) {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            return canvas;
        }
        return new OffscreenCanvas(width, height);
    }

    /** Gets a 2D rendering context from any canvas type. */
    public static get2DContext(canvas: AnyCanvas): Any2DContext {
        return canvas.getContext("2d") as Any2DContext;
    }

    /**
     * Converts a canvas to a data URL string.
     * Main thread: uses native toDataURL().
     * Worker: uses synchronous BMP encoding from pixel data.
     */
    public static canvasToDataURL(canvas: AnyCanvas, context2D?: Any2DContext): string {
        if (CanvasFactory.isMainThread && canvas instanceof HTMLCanvasElement) {
            return canvas.toDataURL();
        }
        // Worker path: read pixels and encode as BMP
        const ctx = context2D || CanvasFactory.get2DContext(canvas);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        return CanvasFactory.encodeBMP(imageData.data, canvas.width, canvas.height);
    }

    /**
     * Sets image smoothing on a 2D context, handling vendor prefixes.
     * In Worker OffscreenCanvas contexts, vendor prefixes are not supported.
     */
    public static setImageSmoothing(context2D: Any2DContext, enabled: boolean): void {
        context2D.imageSmoothingEnabled = enabled;
        if (CanvasFactory.isMainThread) {
            (context2D as any).mozImageSmoothingEnabled = enabled;
            (context2D as any).oImageSmoothingEnabled = enabled;
            (context2D as any).webkitImageSmoothingEnabled = enabled;
            (context2D as any).msImageSmoothingEnabled = enabled;
        }
    }

    /**
     * Synchronously encodes RGBA pixel data as a BMP data URI.
     * BMP32 format: BGRA byte order, bottom-up row order, no compression.
     */
    public static encodeBMP(pixels: Uint8ClampedArray | Uint8Array, width: number, height: number): string {
        if (width <= 0 || height <= 0) {
            return "data:image/bmp;base64,";
        }

        const rowSize = width * 4; // 4 bytes per pixel (BGRA), already 4-byte aligned
        const pixelDataSize = rowSize * height;
        const headerSize = 14;  // BMP file header
        const dibHeaderSize = 108; // BITMAPV4HEADER for alpha support
        const fileSize = headerSize + dibHeaderSize + pixelDataSize;

        const buffer = new ArrayBuffer(fileSize);
        const view = new DataView(buffer);

        // BMP File Header (14 bytes)
        view.setUint8(0, 0x42); // 'B'
        view.setUint8(1, 0x4D); // 'M'
        view.setUint32(2, fileSize, true);
        view.setUint32(6, 0, true); // reserved
        view.setUint32(10, headerSize + dibHeaderSize, true); // pixel data offset

        // BITMAPV4HEADER (108 bytes)
        view.setUint32(14, dibHeaderSize, true); // header size
        view.setInt32(18, width, true);
        view.setInt32(22, height, true); // positive = bottom-up
        view.setUint16(26, 1, true); // color planes
        view.setUint16(28, 32, true); // bits per pixel
        view.setUint32(30, 3, true); // compression: BI_BITFIELDS
        view.setUint32(34, pixelDataSize, true);
        view.setInt32(38, 2835, true); // horizontal resolution (72 DPI)
        view.setInt32(42, 2835, true); // vertical resolution (72 DPI)
        view.setUint32(46, 0, true); // colors in palette
        view.setUint32(50, 0, true); // important colors

        // Channel masks (RGBA)
        view.setUint32(54, 0x00FF0000, true); // Red mask
        view.setUint32(58, 0x0000FF00, true); // Green mask
        view.setUint32(62, 0x000000FF, true); // Blue mask
        view.setUint32(66, 0xFF000000, true); // Alpha mask

        // Color space: LCS_sRGB
        view.setUint32(70, 0x73524742, true); // 'sRGB'

        // Remaining V4 header fields (endpoints + gamma) — zero-filled
        // bytes 74-121 are already zero from ArrayBuffer initialization

        // Pixel data — BMP is bottom-up, source is top-down
        // BMP with BI_BITFIELDS uses the masks above, so we write RGBA directly
        const pixelOffset = headerSize + dibHeaderSize;
        const src = pixels;
        for (let y = 0; y < height; y++) {
            const srcRow = (height - 1 - y) * width * 4; // flip Y
            const dstRow = pixelOffset + y * rowSize;
            for (let x = 0; x < width; x++) {
                const srcIdx = srcRow + x * 4;
                const dstIdx = dstRow + x * 4;
                // Write as BGRA for BMP
                view.setUint8(dstIdx, src[srcIdx + 2]);     // B
                view.setUint8(dstIdx + 1, src[srcIdx + 1]); // G
                view.setUint8(dstIdx + 2, src[srcIdx]);      // R
                view.setUint8(dstIdx + 3, src[srcIdx + 3]); // A
            }
        }

        // Base64 encode
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return "data:image/bmp;base64," + btoa(binary);
    }
}
