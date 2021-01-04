import { BaseState } from "../baseState";
import { WebGlConstants, WebGlConstantsByValue, WebGlConstantsByName, WebGlConstant } from "../../types/webglConstants";
import { ReadPixelsHelper } from "../../utils/readPixelsHelper";
import { ICommandCapture } from "../../../shared/capture/commandCapture";
import { drawCommands } from "../../utils/drawCommands";
import { IContextInformation } from "../../types/contextInformation";
import { IRenderBufferRecorderData } from "../../recorders/renderBufferRecorder";
import { ITextureRecorderData } from "../../recorders/texture2DRecorder";
import { Logger } from "../../../shared/utils/logger";

export class VisualState extends BaseState {
    public static readonly stateName = "VisualState";

    public get stateName(): string {
        return VisualState.stateName;
    }

    public static captureBaseSize = 256;

    private readonly captureFrameBuffer: WebGLFramebuffer;
    private readonly workingCanvas: HTMLCanvasElement;
    private readonly captureCanvas: HTMLCanvasElement;
    private readonly workingContext2D: CanvasRenderingContext2D;
    private readonly captureContext2D: CanvasRenderingContext2D;

    constructor(options: IContextInformation) {
        super(options);
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

    protected getConsumeCommands(): string[] {
        return ["clear", "clearBufferfv", "clearBufferiv", "clearBufferuiv", "clearBufferfi", ...drawCommands];
    }

    protected readFromContext(): void {
        const gl = this.context;
        this.currentState["Attachments"] = [];

        // Check the framebuffer status.
        const frameBuffer = this.context.getParameter(WebGlConstants.FRAMEBUFFER_BINDING.value);
        if (!frameBuffer) {
            this.currentState["FrameBuffer"] = null;
            // In case of the main canvas, we draw the entire screen instead of the viewport only.
            // This will help for instance in VR use cases.
            this.getCapture(gl, "Canvas COLOR_ATTACHMENT", 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, 0, WebGlConstants.UNSIGNED_BYTE.value);
            return;
        }

        // Get FrameBuffer Viewport size to adapt the created screenshot.
        const viewport = gl.getParameter(gl.VIEWPORT);
        const x = viewport[0];
        const y = viewport[1];
        const width = viewport[2];
        const height = viewport[3];

        this.currentState["FrameBuffer"] = this.getSpectorData(frameBuffer);

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

    protected readFrameBufferAttachmentFromContext(gl: WebGLRenderingContext | WebGL2RenderingContext,
        frameBuffer: WebGLFramebuffer, webglConstant: WebGlConstant,
        x: number, y: number, width: number, height: number): void {
        const target = WebGlConstants.FRAMEBUFFER.value;
        const type = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE.value);
        if (type === WebGlConstants.NONE.value) {
            return;
        }

        const storage = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME.value);
        if (!storage) {
            return;
        }

        const componentType = this.contextVersion > 1 ?
            this.context.getFramebufferAttachmentParameter(target, webglConstant.value, WebGlConstants.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE.value) :
            WebGlConstants.UNSIGNED_BYTE.value;

        if (type === WebGlConstants.RENDERBUFFER.value) {
            this.readFrameBufferAttachmentFromRenderBuffer(gl, frameBuffer, webglConstant,
                x, y, width, height,
                target, componentType, storage);
        }
        else if (type === WebGlConstants.TEXTURE.value) {
            this.readFrameBufferAttachmentFromTexture(gl, frameBuffer, webglConstant,
                x, y, width, height,
                target, componentType, storage);
        }
    }

    protected readFrameBufferAttachmentFromRenderBuffer(gl: WebGLRenderingContext | WebGL2RenderingContext,
        frameBuffer: WebGLFramebuffer, webglConstant: WebGlConstant,
        x: number, y: number, width: number, height: number,
        target: number, componentType: number, storage: any): void {

        let samples = 0;
        let internalFormat = 0;
        if (storage.__SPECTOR_Object_CustomData) {
            const info = storage.__SPECTOR_Object_CustomData as IRenderBufferRecorderData;
            width = info.width;
            height = info.height;
            samples = info.samples;
            internalFormat = info.internalFormat;
            if (!samples && !ReadPixelsHelper.isSupportedCombination(componentType, WebGlConstants.RGBA.value, internalFormat)) {
                return;
            }
        }
        else {
            width += x;
            height += y;
        }
        x = y = 0;

        if (samples) {
            const gl2 = gl as WebGL2RenderingContext; // Samples only available in WebGL 2.
            const renderBuffer = gl.createRenderbuffer();
            const boundRenderBuffer = gl.getParameter(gl.RENDERBUFFER_BINDING);
            gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
            gl.renderbufferStorage(gl.RENDERBUFFER, internalFormat, width, height);
            gl.bindRenderbuffer(gl.RENDERBUFFER, boundRenderBuffer);

            gl.bindFramebuffer(WebGlConstants.FRAMEBUFFER.value, this.captureFrameBuffer);
            gl.framebufferRenderbuffer(WebGlConstants.FRAMEBUFFER.value, WebGlConstants.COLOR_ATTACHMENT0.value, WebGlConstants.RENDERBUFFER.value, renderBuffer);

            const readFrameBuffer = gl2.getParameter(gl2.READ_FRAMEBUFFER_BINDING);
            const drawFrameBuffer = gl2.getParameter(gl2.DRAW_FRAMEBUFFER_BINDING);
            gl2.bindFramebuffer(gl2.READ_FRAMEBUFFER, frameBuffer);
            gl2.bindFramebuffer(gl2.DRAW_FRAMEBUFFER, this.captureFrameBuffer);

            gl2.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);

            gl2.bindFramebuffer(WebGlConstants.FRAMEBUFFER.value, this.captureFrameBuffer);
            gl2.bindFramebuffer(gl2.READ_FRAMEBUFFER, readFrameBuffer);
            gl2.bindFramebuffer(gl2.DRAW_FRAMEBUFFER, drawFrameBuffer);

            const status = this.context.checkFramebufferStatus(WebGlConstants.FRAMEBUFFER.value);
            if (status === WebGlConstants.FRAMEBUFFER_COMPLETE.value) {
                this.getCapture(gl, webglConstant.name, x, y, width, height, 0, 0, WebGlConstants.UNSIGNED_BYTE.value);
            }

            gl.bindFramebuffer(WebGlConstants.FRAMEBUFFER.value, frameBuffer);
            gl.deleteRenderbuffer(renderBuffer);
        }
        else {
            gl.bindFramebuffer(WebGlConstants.FRAMEBUFFER.value, this.captureFrameBuffer);
            gl.framebufferRenderbuffer(WebGlConstants.FRAMEBUFFER.value, WebGlConstants.COLOR_ATTACHMENT0.value, WebGlConstants.RENDERBUFFER.value, storage);
            const status = this.context.checkFramebufferStatus(WebGlConstants.FRAMEBUFFER.value);
            if (status === WebGlConstants.FRAMEBUFFER_COMPLETE.value) {
                this.getCapture(gl, webglConstant.name, x, y, width, height, 0, 0, componentType);
            }
            gl.bindFramebuffer(WebGlConstants.FRAMEBUFFER.value, frameBuffer);
        }
    }

    protected readFrameBufferAttachmentFromTexture(gl: WebGLRenderingContext | WebGL2RenderingContext,
        frameBuffer: WebGLFramebuffer, webglConstant: WebGlConstant,
        x: number, y: number, width: number, height: number,
        target: number, componentType: number, storage: any): void {
        let textureLayer = 0;
        if (this.contextVersion > 1) {
            textureLayer = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER.value);
        }

        const textureLevel = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL.value);
        const textureCubeMapFace = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE.value);
        const textureCubeMapFaceName = textureCubeMapFace > 0 ? WebGlConstantsByValue[textureCubeMapFace].name : WebGlConstants.TEXTURE_2D.name;

        // Adapt to constraints defines in the custom data if any.
        let knownAsTextureArray = false;
        let textureType = componentType;
        if (storage.__SPECTOR_Object_CustomData) {
            const info = storage.__SPECTOR_Object_CustomData as ITextureRecorderData;
            width = info.width;
            height = info.height;
            textureType = info.type;
            knownAsTextureArray = info.target === WebGlConstants.TEXTURE_2D_ARRAY.name;
            if (!ReadPixelsHelper.isSupportedCombination(info.type, info.format, info.internalFormat)) {
                return;
            }
        }
        else {
            width += x;
            height += y;
        }
        x = y = 0;

        gl.bindFramebuffer(WebGlConstants.FRAMEBUFFER.value, this.captureFrameBuffer);
        if (textureLayer > 0 || knownAsTextureArray) {
            (gl as WebGL2RenderingContext).framebufferTextureLayer(WebGlConstants.FRAMEBUFFER.value, WebGlConstants.COLOR_ATTACHMENT0.value,
                storage, textureLevel, textureLayer);
        }
        else {
            gl.framebufferTexture2D(WebGlConstants.FRAMEBUFFER.value, WebGlConstants.COLOR_ATTACHMENT0.value,
                textureCubeMapFace ? textureCubeMapFace : WebGlConstants.TEXTURE_2D.value, storage, textureLevel);
        }

        const status = this.context.checkFramebufferStatus(WebGlConstants.FRAMEBUFFER.value);
        if (status === WebGlConstants.FRAMEBUFFER_COMPLETE.value) {
            this.getCapture(gl, webglConstant.name, x, y, width, height, textureCubeMapFace, textureLayer, textureType);
        }

        gl.bindFramebuffer(WebGlConstants.FRAMEBUFFER.value, frameBuffer);
    }

    protected getCapture(gl: WebGLRenderingContext, name: string, x: number, y: number, width: number, height: number,
        textureCubeMapFace: number, textureLayer: number, type: number) {
        const attachmentVisualState = {
            attachmentName: name,
            src: null as string,
            textureCubeMapFace: textureCubeMapFace ? WebGlConstantsByValue[textureCubeMapFace].name : null,
            textureLayer,
        };

        if (!this.quickCapture) {
            try {
                // Read the pixels from the context.
                const pixels = ReadPixelsHelper.readPixels(gl, x, y, width, height, type);
                if (pixels) {
                    // Copy the pixels to a working 2D canvas same size.
                    this.workingCanvas.width = width;
                    this.workingCanvas.height = height;
                    const imageData = this.workingContext2D.createImageData(Math.ceil(width), Math.ceil(height));
                    imageData.data.set(pixels);
                    this.workingContext2D.putImageData(imageData, 0, 0);

                    // Copy the pixels to a resized capture 2D canvas.
                    if (!this.fullCapture) {
                        const imageAspectRatio = width / height;
                        if (imageAspectRatio < 1) {
                            this.captureCanvas.width =
                                VisualState.captureBaseSize * imageAspectRatio;
                            this.captureCanvas.height =
                                VisualState.captureBaseSize;
                        } else if (imageAspectRatio > 1) {
                            this.captureCanvas.width =
                                VisualState.captureBaseSize;
                            this.captureCanvas.height =
                                VisualState.captureBaseSize / imageAspectRatio;
                        } else {
                            this.captureCanvas.width =
                                VisualState.captureBaseSize;
                            this.captureCanvas.height =
                                VisualState.captureBaseSize;
                        }
                    } else {
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
                    attachmentVisualState.src = this.captureCanvas.toDataURL();
                }
            }
            catch (e) {
                // Do nothing in case of error at this level.
                Logger.warn("Spector can not capture the visual state: " + e);
            }
        }

        this.currentState["Attachments"].push(attachmentVisualState);
    }

    protected analyse(consumeCommand: ICommandCapture): void {
        // Nothing to analyse on visual state.
    }
}
