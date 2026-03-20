import { ICapture } from "../../shared/capture/capture";
import {
    SpectorMessageType,
    PROTOCOL_VERSION,
    IContextReadyMessage,
    ICaptureStartedMessage,
    ICaptureCompleteMessage,
    IErrorMessage,
    IFpsMessage,
} from "./messageProtocol";

/** Minimal interface for the Worker global scope — only what we actually use. */
interface IWorkerScope {
    postMessage(message: any, transfer?: Transferable[]): void;
}

/**
 * Sends Spector messages from inside a Worker to the main thread.
 * Uses self.postMessage() with the Spector message protocol.
 */
export class WorkerMessageSender {
    private readonly scope: IWorkerScope;

    constructor(scope?: IWorkerScope) {
        this.scope = scope || (self as any as IWorkerScope);
    }

    public sendContextReady(canvasCount: number): void {
        const msg: IContextReadyMessage = {
            type: SpectorMessageType.ContextReady,
            version: PROTOCOL_VERSION,
            canvasCount,
        };
        this.scope.postMessage(msg);
    }

    public sendCaptureStarted(): void {
        const msg: ICaptureStartedMessage = {
            type: SpectorMessageType.CaptureStarted,
            version: PROTOCOL_VERSION,
        };
        this.scope.postMessage(msg);
    }

    public sendCaptureComplete(capture: ICapture): void {
        const msg: ICaptureCompleteMessage = {
            type: SpectorMessageType.CaptureComplete,
            version: PROTOCOL_VERSION,
            capture,
        };
        this.scope.postMessage(msg);
    }

    public sendError(error: string): void {
        const msg: IErrorMessage = {
            type: SpectorMessageType.Error,
            version: PROTOCOL_VERSION,
            error,
        };
        this.scope.postMessage(msg);
    }

    public sendFps(fps: number): void {
        const msg: IFpsMessage = {
            type: SpectorMessageType.Fps,
            version: PROTOCOL_VERSION,
            fps,
        };
        this.scope.postMessage(msg);
    }
}
