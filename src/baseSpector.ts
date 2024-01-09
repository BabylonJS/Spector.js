import { WebGLRenderingContexts, IContextInformation } from "./backend/types/contextInformation";
import * as Comlink from "comlink";

import { ICapture } from "./shared/capture/capture";

import { ProgramRecompilerHelper } from "./backend/utils/programRecompilerHelper";
import { Logger } from "./shared/utils/logger";
import { Observable } from "./shared/utils/observable";
import { ContextSpy } from "./backend/spies/contextSpy";
import { TimeSpy } from "./backend/spies/timeSpy";
import { CanvasSpy } from "./backend/spies/canvasSpy";
import { Program } from "./backend/webGlObjects/webGlObjects";

import { XRSpy } from "./backend/spies/xrSpy";

const MAIN_THREAD = typeof window === "object";

const CAPTURE_LIMIT = 10000; // Limit command count to 10000 record (to be kept in sync with the documentation)

export interface IAvailableContext {
    readonly canvas: HTMLCanvasElement | OffscreenCanvas;
    readonly contextSpy: ContextSpy;
}

interface IAnnotatedOffscreenCanvas extends OffscreenCanvas {
    __spector_context_type?: string;
}

export type SpectorInitOptions = {
    enableXRCapture?: boolean;
};

export class BaseSpector {
    public static getFirstAvailable3dContext(canvas: HTMLCanvasElement | OffscreenCanvas): WebGLRenderingContexts {
        // Custom detection to run in the extension.
        return this.tryGetContextFromHelperField(canvas) ||
            this.tryGetContextFromCanvas(canvas, "webgl") ||
            this.tryGetContextFromCanvas(canvas, "experimental-webgl") ||
            this.tryGetContextFromCanvas(canvas, "webgl2") ||
            this.tryGetContextFromCanvas(canvas, "experimental-webgl2");
    }

    private static tryGetContextFromHelperField(canvas: HTMLCanvasElement | OffscreenCanvas): WebGLRenderingContexts {
        const type: string | void = (MAIN_THREAD && canvas instanceof HTMLCanvasElement) ?
            canvas.getAttribute("__spector_context_type") :
            (canvas as IAnnotatedOffscreenCanvas).__spector_context_type;

        if (type) {
            return this.tryGetContextFromCanvas(canvas, type);
        }

        return undefined;
    }

    private static tryGetContextFromCanvas(canvas: HTMLCanvasElement | OffscreenCanvas, type: string): WebGLRenderingContexts {
        let context: WebGLRenderingContexts;
        try {
            // Cast canvas to any because lib.dom.d.ts types are not suitably
            // general to allow for custom canvas context types that are
            // potentially specified by __spector_context_type:
            context = (canvas as any).getContext(type) as WebGLRenderingContexts;
        }
        catch (e) {
            // Nothing to do here, canvas has not been found.;
        }
        return context;
    }

    public readonly onCaptureStarted: Observable<any>;
    public readonly onCapture: Observable<ICapture>;
    public readonly onError: Observable<string>;

    private readonly timeSpy: TimeSpy;
    private readonly xrSpy: XRSpy | undefined;
    private readonly contexts: IAvailableContext[];

    private canvasSpy: CanvasSpy;
    private captureNextFrames: number;
    private captureNextCommands: number;
    private quickCapture: boolean;
    private fullCapture: boolean;
    protected capturingContext: ContextSpy;
    private retry: number;
    private noFrameTimeout = -1;
    private marker: string;

    private options: SpectorInitOptions;

    constructor(options: SpectorInitOptions = {}) {
        this.options = {
            enableXRCapture: false,
            ...options,
        };

        this.captureNextFrames = 0;
        this.captureNextCommands = 0;
        this.quickCapture = false;
        this.fullCapture = false;
        this.retry = 0;
        this.contexts = [];

        this.timeSpy = new TimeSpy();
        this.onCaptureStarted = new Observable<ICapture>();
        this.onCapture = new Observable<ICapture>();
        this.onError = new Observable<string>();

        this.timeSpy.onFrameStart.add(this.onFrameStart, this);
        this.timeSpy.onFrameEnd.add(this.onFrameEnd, this);
        this.timeSpy.onError.add(this.onErrorInternal, this);

        // if we want to capture WebXR sessions, we have to polyfill a bunch of stuff to ensure Spector.JS has access to the session
        // and the GL context. So we do that here.
        if (this.options.enableXRCapture) {
            this.xrSpy = new XRSpy(this.timeSpy);
        }

        if (!MAIN_THREAD) {
            Comlink.expose(this);
        }
    }

    public rebuildProgramFromProgramId(programId: number,
        vertexSourceCode: string,
        fragmentSourceCode: string,
        onCompiled: (program: WebGLProgram) => void,
        onError: (message: string) => void) {

        const program = Program.getFromGlobalStore(programId);

        this.rebuildProgram(program,
            vertexSourceCode,
            fragmentSourceCode,
            onCompiled,
            onError,
        );
    }

    public rebuildProgram(program: WebGLProgram,
        vertexSourceCode: string,
        fragmentSourceCode: string,
        onCompiled: (program: WebGLProgram) => void,
        onError: (message: string) => void) {
        ProgramRecompilerHelper.rebuildProgram(program,
            vertexSourceCode,
            fragmentSourceCode,
            onCompiled,
            onError,
        );
    }

    public referenceNewProgram(programId: number, program: WebGLProgram): void {
        Program.updateInGlobalStore(programId, program);
    }

    public pause(): void {
        this.timeSpy.changeSpeedRatio(0);
    }

    public play(): void {
        this.timeSpy.changeSpeedRatio(1);
    }

    public playNextFrame(): void {
        this.timeSpy.playNextFrame();
    }

    public drawOnlyEveryXFrame(x: number): void {
        this.timeSpy.changeSpeedRatio(x);
    }

    public getFps(): number {
        return this.timeSpy.getFps();
    }

    public spyCanvases(): void {
        if (this.canvasSpy) {
            this.onErrorInternal("Already spying canvas.");
            return;
        }

        this.canvasSpy = new CanvasSpy();
        this.canvasSpy.onContextRequested.add(this.spyContext, this);
    }

    public spyCanvas(canvas: HTMLCanvasElement | OffscreenCanvas): void {
        if (this.canvasSpy) {
            this.onErrorInternal("Already spying canvas.");
            return;
        }

        this.canvasSpy = new CanvasSpy(canvas);
        this.canvasSpy.onContextRequested.add(this.spyContext, this);
    }

    public getAvailableContexts(): IAvailableContext[] {
        return this.contexts;
    }

    public captureCanvas(canvas: HTMLCanvasElement | OffscreenCanvas | string,
        commandCount = 0,
        quickCapture: boolean = false,
        fullCapture: boolean = false): void {
        const contextSpy = this.getAvailableContextSpyByCanvas(canvas);
        if (!contextSpy && typeof canvas !== "string") {
            const context = BaseSpector.getFirstAvailable3dContext(canvas);
            if (context) {
                this.captureContext(context, commandCount, quickCapture, fullCapture);
            }
            else {
                Logger.error("No webgl context available on the chosen canvas.");
            }
        }
        else {
            this.captureContextSpy(contextSpy, commandCount, quickCapture, fullCapture);
        }
    }

    public captureContext(context: WebGLRenderingContexts,
        commandCount = 0,
        quickCapture: boolean = false,
        fullCapture: boolean = false): void {
        let contextSpy = this.getAvailableContextSpyByCanvas(context.canvas as HTMLCanvasElement | OffscreenCanvas);

        if (!contextSpy) {
            if ((context as WebGL2RenderingContext).getIndexedParameter) {
                contextSpy = new ContextSpy({
                    context,
                    version: 2,
                    recordAlways: false,
                });
            }
            else {
                contextSpy = new ContextSpy({
                    context,
                    version: 1,
                    recordAlways: false,
                });
            }

            contextSpy.onMaxCommand.add(this.stopCapture, this);

            this.contexts.push({
                canvas: contextSpy.context.canvas as HTMLCanvasElement | OffscreenCanvas,
                contextSpy,
            });
        }

        if (contextSpy) {
            this.captureContextSpy(contextSpy, commandCount, quickCapture, fullCapture);
        }
    }

    public captureXRContext(commandCount = 0,
        quickCapture: boolean = false,
        fullCapture: boolean = false): void {
        this.captureContext(this.getXRContext(), commandCount, quickCapture, fullCapture);
    }

    public captureContextSpy(contextSpy: ContextSpy,
        commandCount = 0,
        quickCapture: boolean = false,
        fullCapture: boolean = false): void {
        this.quickCapture = quickCapture;
        this.fullCapture = fullCapture;

        if (this.capturingContext) {
            this.onErrorInternal("Already capturing a context.");
        }
        else {
            this.retry = 0;
            this.capturingContext = contextSpy;
            this.capturingContext.setMarker(this.marker);

            // Limit the shown command count
            commandCount = Math.min(commandCount, CAPTURE_LIMIT);
            if (commandCount > 0) {
                this.captureCommands(commandCount);
            }
            else {
                // Capture only one frame.
                this.captureFrames(1);
            }

            this.noFrameTimeout = setTimeout(() => {
                if (commandCount > 0) {
                    this.stopCapture();
                }
                else if (this.capturingContext && this.retry > 1) {
                    this.onErrorInternal("No frames with gl commands detected. Try moving the camera.");
                }
                else {
                    this.onErrorInternal("No frames detected. Try moving the camera or implementing requestAnimationFrame.");
                }
            }, 10 * 1000);
        }
    }

    public captureNextFrame(obj: HTMLCanvasElement | OffscreenCanvas | WebGLRenderingContexts,
        quickCapture: boolean = false,
        fullCapture: boolean = false): void {
        if (obj instanceof HTMLCanvasElement || (self.OffscreenCanvas && obj instanceof OffscreenCanvas)) {
            this.captureCanvas(obj, 0, quickCapture, fullCapture);
        } else {
            this.captureContext(obj as WebGLRenderingContexts, 0, quickCapture, fullCapture);
        }
    }

    public startCapture(obj: HTMLCanvasElement | OffscreenCanvas | WebGLRenderingContexts,
        commandCount: number,
        quickCapture: boolean = false,
        fullCapture: boolean = false): void {
        if (obj instanceof HTMLCanvasElement || (self.OffscreenCanvas && obj instanceof OffscreenCanvas)) {
            this.captureCanvas(obj, commandCount, quickCapture, fullCapture);
        } else {
            this.captureContext(obj as WebGLRenderingContexts, commandCount, quickCapture, fullCapture);
        }
    }

    public stopCapture(): ICapture {
        if (this.capturingContext) {
            const capture = this.capturingContext.stopCapture();
            if (capture.commands.length > 0) {
                if (this.noFrameTimeout > -1) {
                    clearTimeout(this.noFrameTimeout);
                }
                this.triggerCapture(capture);

                this.capturingContext = undefined;
                this.captureNextFrames = 0;
                this.captureNextCommands = 0;
                return capture;
            }
            else if (this.captureNextCommands === 0) {
                this.retry++;
                this.captureFrames(1);
            }
        }
        return undefined;
    }

    public setMarker(marker: string): void {
        this.marker = marker;
        if (this.capturingContext) {
            this.capturingContext.setMarker(marker);
        }
    }

    public clearMarker(): void {
        this.marker = null;
        if (this.capturingContext) {
            this.capturingContext.clearMarker();
        }
    }

    public addRequestAnimationFrameFunctionName(functionName: string): void {
        this.timeSpy.addRequestAnimationFrameFunctionName(functionName);
    }

    public setSpiedScope(spiedScope: { [name: string]: any }): void {
        this.timeSpy.setSpiedScope(spiedScope);
    }

    public log(value: string): void {
        if (this.capturingContext) {
            this.capturingContext.log(value);
        }
    }

    private captureFrames(frameCount: number): void {
        this.captureNextFrames = frameCount;
        this.captureNextCommands = 0;

        this.playNextFrame();
    }

    private captureCommands(commandCount: number): void {
        this.captureNextFrames = 0;
        this.captureNextCommands = commandCount;

        this.play();

        if (this.capturingContext) {
            this.onCaptureStarted.trigger(undefined);
            this.capturingContext.startCapture(commandCount, this.quickCapture, this.fullCapture);
        }
        else {
            this.onErrorInternal("No context to capture from.");
            this.captureNextCommands = 0;
        }
    }

    private spyContext(contextInformation: IContextInformation) {
        let contextSpy = this.getAvailableContextSpyByCanvas(contextInformation.context.canvas as HTMLCanvasElement | OffscreenCanvas);
        if (!contextSpy) {
            contextSpy = new ContextSpy({
                context: contextInformation.context,
                version: contextInformation.contextVersion,
                recordAlways: true,
            });

            contextSpy.onMaxCommand.add(this.stopCapture, this);

            this.contexts.push({
                canvas: contextSpy.context.canvas as HTMLCanvasElement | OffscreenCanvas,
                contextSpy,
            });
        }

        contextSpy.spy();
    }

    private getAvailableContextSpyByCanvas(canvas: HTMLCanvasElement | OffscreenCanvas | string): ContextSpy {
        for (const availableContext of this.contexts) {
            if (typeof canvas === "string" && canvas === (availableContext.canvas as any).__SPECTOR_id) {
                return availableContext.contextSpy;
            } if (availableContext.canvas === canvas) {
                return availableContext.contextSpy;
            }
        }
        return undefined;
    }

    private getXRContext(): WebGLRenderingContexts {
        if (!this.options.enableXRCapture) {
            Logger.error("Cannot retrieve WebXR context if capturing WebXR is disabled.");
        }
        if (!this.xrSpy.currentXRSession) {
            Logger.error("No currently active WebXR session.");
        }
        return this.xrSpy.currentXRSession.glContext;
    }

    private onFrameStart(): void {
        if (this.captureNextCommands > 0) {
            // Nothing to do here but preventing to drop the capturing context.
        }
        else if (this.captureNextFrames > 0) {
            if (this.capturingContext) {
                this.onCaptureStarted.trigger(undefined);
                this.capturingContext.startCapture(0, this.quickCapture, this.fullCapture);
            }
            this.captureNextFrames--;
        }
        else {
            this.capturingContext = undefined;
        }
    }

    private onFrameEnd(): void {
        if (this.captureNextCommands > 0) {
            // Nothing to do here but preventing to drop the capturing context.
        }
        else if (this.captureNextFrames === 0) {
            this.stopCapture();
        }
    }

    protected triggerCapture(capture: ICapture) {
        this.onCapture.trigger(capture);
    }

    protected onErrorInternal(error: string) {
        Logger.error(error);
        if (this.noFrameTimeout > -1) {
            clearTimeout(this.noFrameTimeout);
        }

        if (this.capturingContext) {
            this.capturingContext = undefined;
            this.captureNextFrames = 0;
            this.captureNextCommands = 0;
            this.retry = 0;

            this.onError.trigger(error);
        }
        else {
            throw error;
        }
    }
}
