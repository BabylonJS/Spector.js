declare type OffscreenCanvas = HTMLCanvasElement;
declare var OffscreenCanvas: {
    prototype: OffscreenCanvas;
    new(): OffscreenCanvas;
};

declare type WebGLObject = {};

interface Window {
	OffscreenCanvas: OffscreenCanvas;
}

interface Navigator {
	msSaveBlob?: (blob: Blob, fileName: string) => boolean;
}
