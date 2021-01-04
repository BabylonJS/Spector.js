import { WebGlConstants, WebGlConstant, WebGlConstantsByValue } from "../../types/webglConstants";
import { ReadPixelsHelper } from "../../utils/readPixelsHelper";
import { VisualState } from "../context/visualState";
import { IContextInformation } from "../../types/contextInformation";
import { ITextureRecorderData } from "../../recorders/texture2DRecorder";

export class DrawCallTextureInputState {
    public static captureBaseSize = 64;

    protected static cubeMapFaces = [
        WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_X,
        WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_Y,
        WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_Z,
        WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_X,
        WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_Z,
    ];

    private readonly context: WebGLRenderingContext;
    private readonly captureFrameBuffer: WebGLFramebuffer;
    private readonly workingCanvas: HTMLCanvasElement;
    private readonly captureCanvas: HTMLCanvasElement;
    private readonly workingContext2D: CanvasRenderingContext2D;
    private readonly captureContext2D: CanvasRenderingContext2D;

    private fullCapture: boolean;

    constructor(options: IContextInformation) {
        this.context = options.context;
        this.captureFrameBuffer = options.context.createFramebuffer();
        this.workingCanvas = document.createElement("canvas");
        this.workingContext2D = this.workingCanvas.getContext("2d");
        this.captureCanvas = document.createElement("canvas");
        this.captureContext2D = this.captureCanvas.getContext("2d");
        this.captureContext2D.imageSmoothingEnabled = true;
        (this.captureContext2D as any).mozImageSmoothingEnabled = true;
        (this.captureContext2D as any).oImageSmoothingEnabled = true;
        (this.captureContext2D as any).webkitImageSmoothingEnabled = true;
        (this.captureContext2D as any).msImageSmoothingEnabled = true;
    }

    public appendTextureState(state: any, storage: WebGLTexture, target: WebGlConstant = null, fullCapture: boolean): void {
        if (!storage) {
            return;
        }

        // Check for custom data.
        const customData: ITextureRecorderData = (storage as any).__SPECTOR_Object_CustomData;
        if (!customData) {
            return;
        }

        this.fullCapture = fullCapture;

        if (customData.type) {
            state.textureType = this.getWebGlConstant(customData.type);
        }
        if (customData.format) {
            state.format = this.getWebGlConstant(customData.format);
        }
        if (customData.internalFormat) {
            state.internalFormat = this.getWebGlConstant(customData.internalFormat);
        }
        state.width = customData.width;
        state.height = customData.height;
        if (customData.depth) {
            state.depth = customData.depth;
        }

        if (target) {
            state.visual = this.getTextureVisualState(target,
                storage,
                customData);
        }
    }

    protected getTextureVisualState(target: WebGlConstant, storage: WebGLTexture, info: ITextureRecorderData): any {
        try {
            const gl = this.context;
            const visual: any = {};

            if (!ReadPixelsHelper.isSupportedCombination(info.type, info.format, info.internalFormat)) {
                return visual;
            }

            // Check the framebuffer status.
            const currentFrameBuffer = this.context.getParameter(WebGlConstants.FRAMEBUFFER_BINDING.value);
            gl.bindFramebuffer(WebGlConstants.FRAMEBUFFER.value, this.captureFrameBuffer);

            try {
                const textureLevel = 0;
                const width = info.width;
                const height = info.height;

                if (target === WebGlConstants.TEXTURE_3D && info.depth) {
                    const gl2 = gl as WebGL2RenderingContext;
                    for (let i = 0; i < info.depth; i++) {
                        // Limit to 6 the visible texture...
                        if (i > 2 && i < (info.depth - 3)) {
                            continue;
                        }
                        gl2.framebufferTextureLayer(WebGlConstants.FRAMEBUFFER.value, WebGlConstants.COLOR_ATTACHMENT0.value,
                            storage, textureLevel, i);
                        visual["3D Layer " + i] = this.getCapture(gl, 0, 0, width, height, info.type);
                    }
                }
                else if (target === WebGlConstants.TEXTURE_2D_ARRAY && info.depth) {
                    const gl2 = gl as WebGL2RenderingContext;
                    // Limit to 6 the visible texture...
                    for (let i = 0; i < info.depth; i++) {
                        if (i > 2 && i < (info.depth - 3)) {
                            continue;
                        }
                        gl2.framebufferTextureLayer(WebGlConstants.FRAMEBUFFER.value, WebGlConstants.COLOR_ATTACHMENT0.value,
                            storage, textureLevel, i);
                        visual["Layer " + i] = this.getCapture(gl, 0, 0, width, height, info.type);
                    }
                }
                else if (target === WebGlConstants.TEXTURE_CUBE_MAP) {
                    for (const face of DrawCallTextureInputState.cubeMapFaces) {
                        gl.framebufferTexture2D(WebGlConstants.FRAMEBUFFER.value, WebGlConstants.COLOR_ATTACHMENT0.value,
                            face.value, storage, textureLevel);
                        visual[face.name] = this.getCapture(gl, 0, 0, width, height, info.type);
                    }
                }
                else {
                    gl.framebufferTexture2D(WebGlConstants.FRAMEBUFFER.value, WebGlConstants.COLOR_ATTACHMENT0.value,
                        WebGlConstants.TEXTURE_2D.value, storage, textureLevel);
                    visual[WebGlConstants.TEXTURE_2D.name] = this.getCapture(gl, 0, 0, width, height, info.type);
                }
            }
            catch (e) {
                // Something went wrong during the capture.
            }

            gl.bindFramebuffer(WebGlConstants.FRAMEBUFFER.value, currentFrameBuffer);
            return visual;
        }
        catch (e) {
            // Do nothing, probably an incompatible format, should add more combinaison check upfront.
        }

        return undefined;
    }

    protected getCapture(gl: WebGLRenderingContext, x: number, y: number, width: number, height: number, type: number): string {
        try {
            // Check FBO status.
            const status = this.context.checkFramebufferStatus(WebGlConstants.FRAMEBUFFER.value);
            if (status !== WebGlConstants.FRAMEBUFFER_COMPLETE.value) {
                return undefined;
            }

            // In case of texStorage.
            type = type || WebGlConstants.UNSIGNED_BYTE.value;
            // Read the pixels from the context.
            const pixels = ReadPixelsHelper.readPixels(gl, x, y, width, height, type);
            if (!pixels) {
                return undefined;
            }

            // Copy the pixels to a working 2D canvas same size.
            this.workingCanvas.width = width;
            this.workingCanvas.height = height;
            const imageData = this.workingContext2D.createImageData(width, height);
            imageData.data.set(pixels);
            this.workingContext2D.putImageData(imageData, 0, 0);

            if (!this.fullCapture) {
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
            }
            else {
                this.captureCanvas.width = this.workingCanvas.width;
                this.captureCanvas.height = this.workingCanvas.height;
            }

            this.captureCanvas.width = Math.max(this.captureCanvas.width, 1);
            this.captureCanvas.height = Math.max(this.captureCanvas.height, 1);

            // Scale and draw to flip Y to reorient readPixels.
            this.captureContext2D.globalCompositeOperation = "copy";
            this.captureContext2D.scale(1, -1); // Y flip
            this.captureContext2D.translate(0, -this.captureCanvas.height); // so we can draw at 0,0
            this.captureContext2D.drawImage(this.workingCanvas, 0, 0, width, height, 0, 0, this.captureCanvas.width, this.captureCanvas.height);
            this.captureContext2D.setTransform(1, 0, 0, 1, 0, 0);
            this.captureContext2D.globalCompositeOperation = "source-over";

            // get the screen capture
            const src = this.captureCanvas.toDataURL();
            return src;
        }
        catch (e) {
            // TODO. Nothing to do here... so far.
        }
        return undefined;
    }

    protected getWebGlConstant(value: number): string {
        const constant = WebGlConstantsByValue[value];
        return constant ? constant.name : value + "";
    }
}
