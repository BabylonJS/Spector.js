namespace SPECTOR {

    export interface ISpectorOptions {
        readonly injection?: InjectionType;
    }

    export interface IAvailableContext {
        readonly canvas: HTMLCanvasElement;
        readonly contextSpy: IContextSpy;
    }

    export class Spector {
        public readonly onCaptureStarted: IEvent<any>;
        public readonly onCapture: IEvent<ICapture>;
        public readonly onError: IEvent<string>;

        private readonly logger: ILogger;
        private readonly timeSpy: ITimeSpy;
        private readonly contexts: IAvailableContext[];
        private readonly injection: InjectionType;
        private readonly time: ITime;

        private canvasSpy: ICanvasSpy;
        private captureNextFrames: number;
        private capturingContext: IContextSpy;
        private captureMenu: ICaptureMenu;
        private resultView: IResultView;
        private retry: number;
        private noFrameTimeout = -1;

        constructor(private options: ISpectorOptions = {}) {
            this.injection = options.injection || ProvidedInjection.DefaultInjection;
            this.captureNextFrames = 0;
            this.retry = 0;
            this.contexts = [];

            this.logger = new this.injection.LoggerCtor();
            this.time = new this.injection.TimeCtor();
            this.timeSpy = new this.injection.TimeSpyCtor({
                eventConstructor: this.injection.EventCtor,
                timeConstructor: this.injection.TimeCtor,
            }, this.logger);
            this.onCaptureStarted = new this.injection.EventCtor<ICapture>();
            this.onCapture = new this.injection.EventCtor<ICapture>();
            this.onError = new this.injection.EventCtor<string>();

            this.timeSpy.onFrameStart.add(this.onFrameStart, this);
            this.timeSpy.onFrameEnd.add(this.onFrameEnd, this);
            this.timeSpy.onError.add(this.onErrorInternal, this);
        }

        public displayUI() {
            if (!this.captureMenu) {
                this.getCaptureUI();

                this.captureMenu.onPauseRequested.add(this.pause, this);
                this.captureMenu.onPlayRequested.add(this.play, this);
                this.captureMenu.onPlayNextFrameRequested.add(this.playNextFrame, this);
                this.captureMenu.onCaptureRequested.add((info) => {
                    if (info) {
                        this.captureCanvas(info.ref);
                    }
                }, this);

                setInterval(() => { this.captureMenu.setFPS(this.getFps()); }, 1000);
                this.captureMenu.trackPageCanvases();

                this.captureMenu.display();
            }

            if (!this.resultView) {
                this.getResultUI();

                this.onCapture.add((capture) => {
                    this.resultView.display();
                    this.resultView.addCapture(capture);
                });
            }
        }

        public getResultUI(): IResultView {
            if (!this.resultView) {
                this.resultView = new this.injection.ResultViewConstructor({
                    eventConstructor: this.injection.EventCtor,
                }, this.logger);
            }
            return this.resultView;
        }

        public getCaptureUI(): ICaptureMenu {
            if (!this.captureMenu) {
                this.captureMenu = new this.injection.CaptureMenuConstructor({
                    eventConstructor: this.injection.EventCtor,
                }, this.logger);
            }
            return this.captureMenu;
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

            this.canvasSpy = new this.injection.CanvasSpyCtor({ eventConstructor: this.injection.EventCtor }, this.logger);
            this.canvasSpy.onContextRequested.add(this.spyContext, this);
        }

        public spyCanvas(canvas: HTMLCanvasElement): void {
            if (this.canvasSpy) {
                this.onErrorInternal("Already spying canvas.");
                return;
            }

            this.canvasSpy = new this.injection.CanvasSpyCtor({
                eventConstructor: this.injection.EventCtor,
                canvas,
            }, this.logger);
            this.canvasSpy.onContextRequested.add(this.spyContext, this);
        }

        public getAvailableContexts(): IAvailableContext[] {
            return this.getAvailableContexts();
        }

        public captureCanvas(canvas: HTMLCanvasElement) {
            const contextSpy = this.getAvailableContextSpyByCanvas(canvas);
            if (!contextSpy) {
                // Custom detection to run in the extension.
                let context: WebGLRenderingContexts;
                try {
                    const contextType = canvas.getAttribute("__spector_context_type");
                    if (contextType) {
                        context = canvas.getContext(contextType) as any;
                    }
                }
                catch (e) {
                    // Do Nothing.
                }

                if (!context) {
                    try {
                        context = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
                    }
                    catch (e) {
                        this.logger.error(e);
                    }
                }

                if (!context) {
                    try {
                        context = canvas.getContext("webgl2") || canvas.getContext("experimental-webgl2");
                    }
                    catch (e) {
                        this.logger.error(e);
                    }
                }

                if (context) {
                    this.captureContext(context);
                }
                else {
                    this.logger.error("No webgl context available on the chosen canvas.");
                }
            }
            else {
                this.captureContextSpy(contextSpy);
            }
        }

        public captureContext(context: WebGLRenderingContexts) {
            let contextSpy = this.getAvailableContextSpyByCanvas(context.canvas);

            if (!contextSpy) {
                if ((context as WebGL2RenderingContext).getIndexedParameter) {
                    contextSpy = new this.injection.ContextSpyCtor({
                        context,
                        version: 2,
                        recordAlways: false,
                        injection: this.injection,
                    }, this.time, this.logger);
                }
                else {
                    contextSpy = new this.injection.ContextSpyCtor({
                        context,
                        version: 1,
                        recordAlways: false,
                        injection: this.injection,
                    }, this.time, this.logger);
                }

                this.contexts.push({
                    canvas: contextSpy.context.canvas,
                    contextSpy,
                });
            }

            if (contextSpy) {
                this.captureContextSpy(contextSpy);
            }
        }

        public captureContextSpy(contextSpy: IContextSpy) {
            if (this.capturingContext) {
                this.onErrorInternal("Already capturing a context.");
            }
            else {
                this.retry = 0;
                this.capturingContext = contextSpy;
                this.capture();

                this.noFrameTimeout = setTimeout(() => {
                    if (this.capturingContext && this.retry > 1) {
                        this.onErrorInternal("No frames with gl commands detected. Try moving the camera.");
                    }
                    else {
                        this.onErrorInternal("No frames detected. Try moving the camera or implementing animationRequestFrame.");
                    }
                }, 10 * 1000);
            }
        }

        private capture(frameCount = 1): void {
            this.captureNextFrames = frameCount;
            this.playNextFrame();
        }

        private spyContext(contextInformation: IContextInformation) {
            let contextSpy = this.getAvailableContextSpyByCanvas(contextInformation.context.canvas);
            if (!contextSpy) {
                contextSpy = new this.injection.ContextSpyCtor({
                    context: contextInformation.context,
                    version: contextInformation.contextVersion,
                    recordAlways: true,
                    injection: this.injection,
                }, this.time, this.logger);
                this.contexts.push({
                    canvas: contextSpy.context.canvas,
                    contextSpy,
                });
            }

            contextSpy.spy();
        }

        private getAvailableContextSpyByCanvas(canvas: HTMLCanvasElement): IContextSpy {
            for (const availableContext of this.contexts) {
                if (availableContext.canvas === canvas) {
                    return availableContext.contextSpy;
                }
            }
            return undefined;
        }

        private onFrameStart(): void {
            if (this.captureNextFrames > 0) {
                if (this.capturingContext) {
                    this.onCaptureStarted.trigger(undefined);
                    this.capturingContext.startCapture();
                }
                this.captureNextFrames--;
            }
            else {
                this.capturingContext = undefined;
            }
        }

        private onFrameEnd(): void {
            if (this.capturingContext && this.captureNextFrames === 0) {
                const capture = this.capturingContext.stopCapture();
                if (capture.commands.length > 0) {
                    if (this.noFrameTimeout > -1) {
                        clearTimeout(this.noFrameTimeout);
                    }
                    this.triggerCapture(capture);
                }
                else {
                    this.retry++;
                    this.capture(1);
                }
            }
        }

        private triggerCapture(capture: ICapture) {
            if (this.captureMenu) {
                this.captureMenu.captureComplete(null);
            }
            this.onCapture.trigger(capture);
        }

        private onErrorInternal(error: string) {
            this.logger.error(error);
            if (this.noFrameTimeout > -1) {
                clearTimeout(this.noFrameTimeout);
            }

            if (this.capturingContext) {
                this.capturingContext = undefined;
                this.captureNextFrames = 0;
                this.retry = 0;

                if (this.captureMenu) {
                    this.captureMenu.captureComplete(error);
                }
                this.onError.trigger(error);
            }
            else {
                throw error;
            }
        }
    }
}
