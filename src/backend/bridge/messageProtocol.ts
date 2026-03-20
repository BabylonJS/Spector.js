import { ICapture } from "../../shared/capture/capture";

/** Prefix for all Spector messages to avoid collisions with app messages. */
export const SPECTOR_MESSAGE_PREFIX = "spector:";

/** Protocol version for forward compatibility. */
export const PROTOCOL_VERSION = 1;

/** All Spector message types. */
export const enum SpectorMessageType {
    /** Worker → Main: Worker Spector initialized and ready. */
    ContextReady = "spector:context-ready",
    /** Main → Worker: Request a frame capture. */
    TriggerCapture = "spector:trigger-capture",
    /** Worker → Main: Capture has started. */
    CaptureStarted = "spector:capture-started",
    /** Worker → Main: Capture complete with data. */
    CaptureComplete = "spector:capture-complete",
    /** Worker → Main: Error during capture. */
    Error = "spector:error",
    /** Worker → Main: FPS update. */
    Fps = "spector:fps",
}

/** Base shape for all Spector messages. */
export interface ISpectorMessage {
    type: SpectorMessageType;
    version: number;
}

export interface IContextReadyMessage extends ISpectorMessage {
    type: SpectorMessageType.ContextReady;
    canvasCount: number;
}

export interface ITriggerCaptureMessage extends ISpectorMessage {
    type: SpectorMessageType.TriggerCapture;
    canvasIndex: number;
    commandCount: number;
    quickCapture: boolean;
    fullCapture: boolean;
}

export interface ICaptureStartedMessage extends ISpectorMessage {
    type: SpectorMessageType.CaptureStarted;
}

export interface ICaptureCompleteMessage extends ISpectorMessage {
    type: SpectorMessageType.CaptureComplete;
    capture: ICapture;
}

export interface IErrorMessage extends ISpectorMessage {
    type: SpectorMessageType.Error;
    error: string;
}

export interface IFpsMessage extends ISpectorMessage {
    type: SpectorMessageType.Fps;
    fps: number;
}

export type SpectorWorkerMessage = IContextReadyMessage | ICaptureStartedMessage | ICaptureCompleteMessage | IErrorMessage | IFpsMessage;
export type SpectorMainMessage = ITriggerCaptureMessage;

/** Type guard: is this MessageEvent data a Spector message? */
export function isSpectorMessage(data: any): data is ISpectorMessage {
    return data != null && typeof data === "object" && typeof data.type === "string" && data.type.indexOf(SPECTOR_MESSAGE_PREFIX) === 0;
}
