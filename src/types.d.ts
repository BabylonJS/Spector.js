declare type OffscreenCanvas = HTMLCanvasElement;
declare var OffscreenCanvas: {
    prototype: OffscreenCanvas;
    new(width: number, height: number): OffscreenCanvas;
};

declare type OffscreenCanvasRenderingContext2D = CanvasRenderingContext2D;

declare type WebGLObject = {};

interface Window {
	OffscreenCanvas: OffscreenCanvas;
}

interface Navigator {
	msSaveBlob?: (blob: Blob, fileName: string) => boolean;
}
