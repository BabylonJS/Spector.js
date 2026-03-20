import { ICapture } from "../../shared/capture/capture";
import { Observable } from "../../shared/utils/observable";
import {
    SpectorMessageType,
    PROTOCOL_VERSION,
    ITriggerCaptureMessage,
    isSpectorMessage,
    SpectorWorkerMessage,
} from "./messageProtocol";

export interface IWorkerBridgeOptions {
    /** Timeout in milliseconds for capture responses. Default: 10000 (10s). */
    captureTimeout?: number;
}

/**
 * Main-thread bridge that communicates with a WorkerSpector running inside a Worker.
 * Uses addEventListener (not onmessage) to avoid overwriting app communication.
 */
export class WorkerBridge {
    public readonly onCapture: Observable<ICapture>;
    public readonly onCaptureStarted: Observable<void>;
    public readonly onError: Observable<string>;
    public readonly onFps: Observable<number>;
    public readonly onContextReady: Observable<number>;

    private readonly worker: Worker;
    private readonly captureTimeout: number;
    private readonly messageHandler: (event: MessageEvent) => void;
    private captureTimer: any;
    private disposed: boolean;

    constructor(worker: Worker, options: IWorkerBridgeOptions = {}) {
        this.worker = worker;
        this.captureTimeout = options.captureTimeout || 10000;
        this.disposed = false;
        this.captureTimer = null;

        this.onCapture = new Observable<ICapture>();
        this.onCaptureStarted = new Observable<void>();
        this.onError = new Observable<string>();
        this.onFps = new Observable<number>();
        this.onContextReady = new Observable<number>();

        this.messageHandler = this.handleMessage.bind(this);
        this.worker.addEventListener("message", this.messageHandler);
    }

    /** Request a capture from the Worker. */
    public triggerCapture(
        canvasIndex: number = 0,
        commandCount: number = 0,
        quickCapture: boolean = false,
        fullCapture: boolean = false,
    ): void {
        if (this.disposed) {
            return;
        }

        this.clearCaptureTimer();

        const msg: ITriggerCaptureMessage = {
            type: SpectorMessageType.TriggerCapture,
            version: PROTOCOL_VERSION,
            canvasIndex,
            commandCount,
            quickCapture,
            fullCapture,
        };
        this.worker.postMessage(msg);

        // Start timeout
        this.captureTimer = setTimeout(() => {
            this.onError.trigger("Capture timed out after " + this.captureTimeout + "ms");
            this.captureTimer = null;
        }, this.captureTimeout);
    }

    /** Clean up all resources. */
    public dispose(): void {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        this.clearCaptureTimer();
        this.worker.removeEventListener("message", this.messageHandler);
        this.onCapture.clear();
        this.onCaptureStarted.clear();
        this.onError.clear();
        this.onFps.clear();
        this.onContextReady.clear();
    }

    private handleMessage(event: MessageEvent): void {
        const data = event.data;
        if (!isSpectorMessage(data)) {
            return; // Not a Spector message — ignore (app message)
        }

        const msg = data as SpectorWorkerMessage;
        switch (msg.type) {
            case SpectorMessageType.ContextReady:
                this.onContextReady.trigger(msg.canvasCount);
                break;
            case SpectorMessageType.CaptureStarted:
                this.onCaptureStarted.trigger(undefined);
                break;
            case SpectorMessageType.CaptureComplete:
                this.clearCaptureTimer();
                this.onCapture.trigger(msg.capture);
                break;
            case SpectorMessageType.Error:
                this.clearCaptureTimer();
                this.onError.trigger(msg.error);
                break;
            case SpectorMessageType.Fps:
                this.onFps.trigger(msg.fps);
                break;
        }
    }

    private clearCaptureTimer(): void {
        if (this.captureTimer != null) {
            clearTimeout(this.captureTimer);
            this.captureTimer = null;
        }
    }
}
