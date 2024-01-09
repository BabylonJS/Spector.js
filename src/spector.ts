import {BaseSpector, SpectorInitOptions} from "./baseSpector";
import * as Comlink from "comlink";


import { ICapture } from "./shared/capture/capture";
import { CaptureMenu } from "./embeddedFrontend/captureMenu/captureMenu";
import { ResultView } from "./embeddedFrontend/resultView/resultView";


export const EmbeddedFrontend = {
    CaptureMenu,
    ResultView,
};

export class Spector extends BaseSpector {

    private captureMenu: CaptureMenu;
    private resultView: ResultView;

    constructor(options: SpectorInitOptions = {}) {
        super(options);
    }

    public displayUI(disableTracking: boolean = false) {
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

            if (!disableTracking) {
                this.captureMenu.trackPageCanvases();
            }

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

    public getResultUI(): ResultView {
        if (!this.resultView) {
            this.resultView = new ResultView();
            this.resultView.onSourceCodeChanged.add((sourceCodeEvent) => {
                this.rebuildProgramFromProgramId(sourceCodeEvent.programId,
                    sourceCodeEvent.sourceVertex,
                    sourceCodeEvent.sourceFragment,
                    (program) => {
                        this.referenceNewProgram(sourceCodeEvent.programId, program);
                        this.resultView.showSourceCodeError(null);
                    },
                    (error) => {
                        this.resultView.showSourceCodeError(error);
                    });
            });
        }
        return this.resultView;
    }

    public getCaptureUI(): CaptureMenu {
        if (!this.captureMenu) {
            this.captureMenu = new CaptureMenu();
        }
        return this.captureMenu;
    }

    protected triggerCapture(capture: ICapture) {
        if (this.captureMenu) {
            this.captureMenu.captureComplete(null);
        }
        super.triggerCapture(capture);
    }

    protected onErrorInternal(error: string) {
        super.onErrorInternal(error);
        if (this.capturingContext) {
            if (this.captureMenu) {
                this.captureMenu.captureComplete(error);
            }
        }
    }

}



export class RemoteSpector extends BaseSpector {

    private captureMenu: CaptureMenu;
    private resultView: ResultView;
    private worker: any;

    constructor(options: SpectorInitOptions = {}, worker: Worker) {
        super(options);
        this.worker = Comlink.wrap(worker);
    }

    public async pause(): Promise<void> {
        await this.worker.pause();
    }

    public async play(): Promise<void> {
        await this.worker.play();
    }

    public async playNextFrame(): Promise<void> {
        await this.worker.playNextFrame();
    }

    // @ts-ignore
    public async getFps(): any {
        return this.worker.getFps();
    }

    public async captureCanvas(canvas: HTMLCanvasElement | OffscreenCanvas | string,
                               commandCount = 0,
                               quickCapture: boolean = false,
                               fullCapture: boolean = false) {
        if (typeof canvas === "string") {
            return this.worker.captureCanvas(canvas, commandCount, quickCapture, fullCapture);
        } else {
            const _canvas = canvas as any;
            const id = _canvas.__SPECTOR_id ? _canvas.__SPECTOR_id : _canvas.id;
            return this.worker.captureCanvas(id, commandCount, quickCapture, fullCapture);
        }
    }

    public displayUI(disableTracking: boolean = false) {
        if (!this.captureMenu) {
            this.getCaptureUI();

            this.captureMenu.onPauseRequested.add(this.pause, this);
            this.captureMenu.onPlayRequested.add(this.play, this);
            this.captureMenu.onPlayNextFrameRequested.add(this.playNextFrame, this);
            this.captureMenu.onCaptureRequested.add(async (info) => {
                if (info) {
                    await this.worker.captureCanvas(info.id);
                }
            }, this);

            setInterval(async () => { this.captureMenu.setFPS(await this.getFps()); }, 1000);

            if (!disableTracking) {
                this.captureMenu.trackPageCanvases();
            }

            this.captureMenu.display();
        }

        if (!this.resultView) {
            this.getResultUI();

            const onCapture = this.worker.onCapture;
            onCapture.add(Comlink.proxy((capture: ICapture) => {
                this.resultView.display();
                this.resultView.addCapture(capture);
            }));
        }
    }

    public getResultUI(): ResultView {
        if (!this.resultView) {
            this.resultView = new ResultView();
            this.resultView.onSourceCodeChanged.add((sourceCodeEvent) => {
                this.rebuildProgramFromProgramId(sourceCodeEvent.programId,
                    sourceCodeEvent.sourceVertex,
                    sourceCodeEvent.sourceFragment,
                    (program) => {
                        this.referenceNewProgram(sourceCodeEvent.programId, program);
                        this.resultView.showSourceCodeError(null);
                    },
                    (error) => {
                        this.resultView.showSourceCodeError(error);
                    });
            });
        }
        return this.resultView;
    }

    public getCaptureUI(): CaptureMenu {
        if (!this.captureMenu) {
            this.captureMenu = new CaptureMenu();
        }
        return this.captureMenu;
    }


}
