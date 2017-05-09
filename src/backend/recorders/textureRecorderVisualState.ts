namespace SPECTOR.Recorders {
    export class TextureRecorderVisualState {

        public static captureBaseSize = 128;

        private readonly context: WebGLRenderingContext;
        private readonly workingCanvas: HTMLCanvasElement;
        private readonly captureCanvas: HTMLCanvasElement;
        private readonly workingContext2D: CanvasRenderingContext2D;
        private readonly captureContext2D: CanvasRenderingContext2D;

        constructor(options: IRecorderOptions, protected readonly logger: ILogger) {
            this.context = options.context;
            this.workingCanvas = document.createElement("canvas");
            this.workingContext2D = this.workingCanvas.getContext("2d");
            this.captureCanvas = document.createElement("canvas");
            this.captureContext2D = this.captureCanvas.getContext("2d");
            this.captureContext2D.imageSmoothingEnabled = true;
            this.captureContext2D.mozImageSmoothingEnabled = true;
            this.captureContext2D.oImageSmoothingEnabled = true;
            this.captureContext2D.webkitImageSmoothingEnabled = true;
            (this.captureContext2D as any).msImageSmoothingEnabled = true;
        }

        public getBase64Visual(info: ITextureRecorderData): string {
            try {
                const textureData = info.visual;
                if (!textureData) {
                    return undefined;
                }

                // Deals with ImageData.
                if (textureData.data) {
                    return this.getBase64VisualFromImageData(info);
                }
                // Deals with ABV.
                if (this.isArrayBufferView(textureData)) {
                    return this.getBase64VisualFromArrayBufferView(info);
                }
                // Deals with HtmlCanvasSource.
                if (textureData.width && textureData.height) {
                    return this.getBase64VisualFromCanvasImageSource(info);
                }
            }
            catch (e) {
                // Do nothing, probably an incompatible format, should add combinaison check upfront.
            }

            return undefined;
        }

        protected getBase64VisualFromImageData(info: ITextureRecorderData): string {
            this.workingCanvas.width = info.width;
            this.workingCanvas.height = info.height;
            this.workingContext2D.putImageData(info.visual, 0, 0);
            return this.getBase64RescaledImage(info);
        }

        protected getBase64VisualFromArrayBufferView(info: ITextureRecorderData): string {
            this.workingCanvas.width = info.width;
            this.workingCanvas.height = info.height;
            const imageData = this.workingContext2D.createImageData(info.width, info.width);
            imageData.data.set(info.visual);
            this.workingContext2D.putImageData(imageData, 0, 0);
            return this.getBase64RescaledImage(info);
        }

        protected getBase64VisualFromCanvasImageSource(info: ITextureRecorderData): string {
            this.workingCanvas.width = info.width;
            this.workingCanvas.height = info.height;
            this.workingContext2D.drawImage(info.visual, 0, 0, info.width, info.height, 0, 0, info.width, info.height);
            return this.getBase64RescaledImage(info);
        }

        protected getBase64RescaledImage(info: ITextureRecorderData): string {
            const x = 0;
            const y = 0;
            const width = info.width;
            const height = info.height;

            // Copy the pixels to a resized capture 2D canvas.
            const imageAspectRatio = width / height;
            if (imageAspectRatio < 1) {
                this.captureCanvas.width = TextureRecorderVisualState.captureBaseSize * imageAspectRatio;
                this.captureCanvas.height = TextureRecorderVisualState.captureBaseSize;
            }
            else if (imageAspectRatio > 1) {
                this.captureCanvas.width = TextureRecorderVisualState.captureBaseSize;
                this.captureCanvas.height = TextureRecorderVisualState.captureBaseSize / imageAspectRatio;
            }
            else {
                this.captureCanvas.width = TextureRecorderVisualState.captureBaseSize;
                this.captureCanvas.height = TextureRecorderVisualState.captureBaseSize;
            }

            // Scale and draw to flip Y to reorient readPixels.
            this.captureContext2D.globalCompositeOperation = "copy";
            // Do not flip for textures.
            // this.captureContext2D.scale(1, -1); // Y flip
            // this.captureContext2D.translate(0, -this.captureCanvas.height); // so we can draw at 0,0
            this.captureContext2D.drawImage(this.workingCanvas, 0, 0, width, height, 0, 0, this.captureCanvas.width, this.captureCanvas.height);
            this.captureContext2D.setTransform(1, 0, 0, 1, 0, 0);
            this.captureContext2D.globalCompositeOperation = "source-over";

            // get the screen capture
            return this.captureCanvas.toDataURL();
        }

        private isArrayBufferView(value: any): boolean {
            return value && value.buffer instanceof ArrayBuffer && value.byteLength !== undefined;
        }
    }
}
