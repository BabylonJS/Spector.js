namespace SPECTOR.States {

    @Decorators.state("VisualState")
    export class VisualState extends BaseState {
        public static captureBaseSize = 512;

        private readonly captureFrameBuffer: WebGLFramebuffer;
        private readonly workingCanvas: HTMLCanvasElement;
        private readonly captureCanvas: HTMLCanvasElement;
        private readonly workingContext2D: CanvasRenderingContext2D;
        private readonly captureContext2D: CanvasRenderingContext2D;

        constructor(options: IStateOptions, logger: ILogger) {
            super(options, logger);
            this.captureFrameBuffer = options.context.createFramebuffer();
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

        protected getConsumeCommands(): string[] {
            return ["clear", "clearBufferfv", "clearBufferiv", "clearBufferuiv", "clearBufferfi", ...drawCommands];
        }

        protected readFromContext(): void {
            const gl = this.context;
            this.currentState["Attachments"] = [];

            // Get FrameBuffer Viewport size to adapt the created screenshot.
            const viewport = gl.getParameter(gl.VIEWPORT);
            const x = viewport[0];
            const y = viewport[1];
            const width = viewport[2];
            const height = viewport[3];

            // Check the framebuffer status.
            const frameBuffer = this.context.getParameter(WebGlConstants.FRAMEBUFFER_BINDING.value);
            if (!frameBuffer) {
                this.currentState["FrameBuffer"] = null;
                this.getCapture(gl, "Canvas COLOR_ATTACHMENT", x, y, width, height);
                return;
            }

            this.getTag(frameBuffer);
            this.currentState["FrameBuffer"] = frameBuffer;

            // Check FBO status.
            const status = this.context.checkFramebufferStatus(WebGlConstants.FRAMEBUFFER.value);
            this.currentState["FrameBufferStatus"] = WebGlConstantsByValue[status].name;
            if (status !== WebGlConstants.FRAMEBUFFER_COMPLETE.value) {
                return;
            }

            // Capture all the attachments.
            const drawBuffersExtension = this.extensions[WebGlConstants.MAX_DRAW_BUFFERS_WEBGL.extensionName];
            if (drawBuffersExtension) {
                const maxDrawBuffers = this.context.getParameter(WebGlConstants.MAX_DRAW_BUFFERS_WEBGL.value);
                for (let i = 0; i < maxDrawBuffers; i++) {
                    this.readFrameBufferAttachmentFromContext(this.context, frameBuffer,
                        WebGlConstantsByName["COLOR_ATTACHMENT" + i + "_WEBGL"], x, y, width, height);
                }
            }
            else if (this.contextVersion > 1) {
                const context2 = this.context as WebGL2RenderingContext;
                const maxDrawBuffers = context2.getParameter(WebGlConstants.MAX_DRAW_BUFFERS.value);
                for (let i = 0; i < maxDrawBuffers; i++) {
                    this.readFrameBufferAttachmentFromContext(this.context, frameBuffer,
                        WebGlConstantsByName["COLOR_ATTACHMENT" + i], x, y, width, height);
                }
            }
            else {
                this.readFrameBufferAttachmentFromContext(this.context, frameBuffer, WebGlConstantsByName["COLOR_ATTACHMENT0"], x, y, width, height);
            }
        }

        protected readFrameBufferAttachmentFromContext(gl: WebGLRenderingContext | WebGL2RenderingContext, frameBuffer: WebGLFramebuffer, webglConstant: WebGlConstant, x: number, y: number, width: number, height: number): void {
            const target = WebGlConstants.FRAMEBUFFER.value;
            const type = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE.value);
            if (type === WebGlConstants.NONE.value) {
                return;
            }

            const storage = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME.value);
            if (type === WebGlConstants.RENDERBUFFER.value) {
                gl.bindFramebuffer(WebGlConstants.FRAMEBUFFER.value, this.captureFrameBuffer);
                gl.framebufferRenderbuffer(WebGlConstants.FRAMEBUFFER.value, WebGlConstants.COLOR_ATTACHMENT0.value, WebGlConstants.RENDERBUFFER.value, storage);
                this.getCapture(gl, webglConstant.name, x, y, width, height);
                gl.bindFramebuffer(WebGlConstants.FRAMEBUFFER.value, frameBuffer);
            }
            else if (type === WebGlConstants.TEXTURE.value) {
                let textureLayer = 0;
                if (this.contextVersion > 1) {
                    textureLayer = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER.value);
                }

                const textureLevel = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL.value);
                const textureCubeMapFace = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE.value);

                gl.bindFramebuffer(WebGlConstants.FRAMEBUFFER.value, this.captureFrameBuffer);
                if (textureLayer === 0) {
                    gl.framebufferTexture2D(WebGlConstants.FRAMEBUFFER.value, WebGlConstants.COLOR_ATTACHMENT0.value,
                        textureCubeMapFace ? textureCubeMapFace : WebGlConstants.TEXTURE_2D.value, storage, textureLevel);
                }
                else {
                    (gl as WebGL2RenderingContext).framebufferTextureLayer(WebGlConstants.FRAMEBUFFER.value, WebGlConstants.COLOR_ATTACHMENT0.value,
                        storage, textureLevel, textureLayer);
                }

                const status = this.context.checkFramebufferStatus(WebGlConstants.FRAMEBUFFER.value);
                if (status === WebGlConstants.FRAMEBUFFER_COMPLETE.value) {
                    this.getCapture(gl, webglConstant.name, x, y, width, height);
                }

                gl.bindFramebuffer(WebGlConstants.FRAMEBUFFER.value, frameBuffer);
            }
        }

        protected getCapture(gl: WebGLRenderingContext, name: string, x: number, y: number, width: number, height: number) {
            // Read the pixels from the frame buffer.
            const size = width * height * 4;
            const pixels = new Uint8Array(size);
            gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

            // Copy the pixels to a working 2D canvas same size.
            this.workingCanvas.width = width;
            this.workingCanvas.height = height;
            const imageData = this.workingContext2D.createImageData(width, height);
            imageData.data.set(pixels);
            this.workingContext2D.putImageData(imageData, 0, 0);

            // Copy the pixels to a resized capture 2D canvas.
            const imageAspectRatio = width / height;
            if (imageAspectRatio < 1) {
                this.captureCanvas.width = VisualState.captureBaseSize * imageAspectRatio;
                this.captureCanvas.height = VisualState.captureBaseSize;
            }
            else if (imageAspectRatio > 1) {
                this.captureCanvas.width = VisualState.captureBaseSize;
                this.captureCanvas.height = VisualState.captureBaseSize / imageAspectRatio;
            }
            else {
                this.captureCanvas.width = VisualState.captureBaseSize;
                this.captureCanvas.height = VisualState.captureBaseSize;
            }

            // Scale and draw to flip Y to reorient readPixels.
            this.captureContext2D.globalCompositeOperation = "copy";
            this.captureContext2D.scale(1, -1); // Y flip
            this.captureContext2D.translate(0, -this.captureCanvas.height); // so we can draw at 0,0
            this.captureContext2D.drawImage(this.workingCanvas, 0, 0, width, height, 0, 0, this.captureCanvas.width, this.captureCanvas.height);
            this.captureContext2D.setTransform(1, 0, 0, 1, 0, 0);
            this.captureContext2D.globalCompositeOperation = "source-over";

            // get the screen capture
            this.currentState["Attachments"].push({
                attachmentName: name,
                src: this.captureCanvas.toDataURL(),
            });
        }

        protected analyse(consumeCommand: ICommandCapture): void {
            // Nothing to analyse on visual state.
        }

        private getTag(object: any): any {
            if (!object) {
                return undefined;
            }

            const tag = WebGlObjects.getWebGlObjectTag(object);
            if (!tag) {
                this.options.tagWebGlObject(object);
            }

            return object;
        }
    }
}
