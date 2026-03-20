import { ICapture } from "../../shared/capture/capture";
import { ContextSpy } from "../spies/contextSpy";
import { CanvasSpy } from "../spies/canvasSpy";
import { TimeSpy } from "../spies/timeSpy";
import { IContextInformation } from "../types/contextInformation";
import { WorkerMessageSender } from "./workerMessageSender";
import {
    isSpectorMessage,
    SpectorMessageType,
    ITriggerCaptureMessage,
} from "./messageProtocol";

interface IWorkerContext {
    canvas: OffscreenCanvas;
    contextSpy: ContextSpy;
}

/**
 * Headless Spector instance that runs inside a Web Worker.
 * No UI, no DOM — only capture engine + message-based communication.
 */
export class WorkerSpector {
    private readonly sender: WorkerMessageSender;
    private readonly timeSpy: TimeSpy;
    private readonly contexts: IWorkerContext[];
    private canvasSpy: CanvasSpy;
    private capturingContext: ContextSpy;
    private captureNextFrames: number;
    private captureNextCommands: number;
    private quickCapture: boolean;
    private fullCapture: boolean;
    private noFrameTimeout: any;
    private retry: number;

    constructor() {
        this.contexts = [];
        this.captureNextFrames = 0;
        this.captureNextCommands = 0;
        this.quickCapture = false;
        this.fullCapture = false;
        this.retry = 0;
        this.noFrameTimeout = -1;

        this.sender = new WorkerMessageSender();
        this.timeSpy = new TimeSpy();

        this.timeSpy.onFrameStart.add(this.onFrameStart, this);
        this.timeSpy.onFrameEnd.add(this.onFrameEnd, this);

        // Listen for commands from main thread
        self.addEventListener("message", (event: MessageEvent) => {
            const data = event.data;
            if (!isSpectorMessage(data)) {
                return;
            }
            if (data.type === SpectorMessageType.TriggerCapture) {
                this.handleTriggerCapture(data as ITriggerCaptureMessage);
            }
        });

        // Start spying canvases
        this.spyCanvases();
    }

    public spyCanvases(): void {
        if (this.canvasSpy) {
            return;
        }
        this.canvasSpy = new CanvasSpy();
        this.canvasSpy.onContextRequested.add(this.onContextRequested, this);
    }

    private onContextRequested(contextInfo: IContextInformation): void {
        let existing = this.contexts.find(
            (c) => c.canvas === (contextInfo.context.canvas as OffscreenCanvas),
        );
        if (!existing) {
            const contextSpy = new ContextSpy({
                context: contextInfo.context,
                version: contextInfo.contextVersion,
                recordAlways: true,
            });
            contextSpy.onMaxCommand.add(this.stopCapture, this);
            existing = {
                canvas: contextInfo.context.canvas as OffscreenCanvas,
                contextSpy,
            };
            this.contexts.push(existing);
        }
        existing.contextSpy.spy();

        // Notify main thread
        this.sender.sendContextReady(this.contexts.length);
    }

    private handleTriggerCapture(msg: ITriggerCaptureMessage): void {
        const canvasIndex = msg.canvasIndex || 0;
        if (canvasIndex >= this.contexts.length) {
            this.sender.sendError("Canvas index " + canvasIndex + " out of range (have " + this.contexts.length + ")");
            return;
        }

        const contextSpy = this.contexts[canvasIndex].contextSpy;
        this.quickCapture = msg.quickCapture;
        this.fullCapture = msg.fullCapture;
        this.capturingContext = contextSpy;

        const commandCount = msg.commandCount || 0;
        if (commandCount > 0) {
            this.captureCommands(commandCount);
        } else {
            this.retry = 0;
            this.captureFrames(1);
        }

        this.noFrameTimeout = setTimeout(() => {
            if (commandCount > 0) {
                this.stopCapture();
            } else if (this.capturingContext && this.retry > 1) {
                this.sender.sendError("No frames with gl commands detected.");
            } else {
                this.sender.sendError("No frames detected. Try triggering a render.");
            }
        }, 10000);
    }

    private captureFrames(frameCount: number): void {
        this.captureNextFrames = frameCount;
        this.captureNextCommands = 0;
        this.timeSpy.playNextFrame();
    }

    private captureCommands(commandCount: number): void {
        this.captureNextFrames = 0;
        this.captureNextCommands = commandCount;
        this.timeSpy.changeSpeedRatio(1);
        if (this.capturingContext) {
            this.sender.sendCaptureStarted();
            this.capturingContext.startCapture(commandCount, this.quickCapture, this.fullCapture);
        }
    }

    private stopCapture(): ICapture {
        if (this.capturingContext) {
            const capture = this.capturingContext.stopCapture();
            if (capture.commands.length > 0) {
                if (this.noFrameTimeout !== -1) {
                    clearTimeout(this.noFrameTimeout);
                }
                this.sender.sendCaptureComplete(capture);
                this.capturingContext = undefined;
                this.captureNextFrames = 0;
                this.captureNextCommands = 0;
                return capture;
            } else if (this.captureNextCommands === 0) {
                this.retry++;
                this.captureFrames(1);
            }
        }
        return undefined;
    }

    private onFrameStart(): void {
        if (this.captureNextCommands > 0) {
            // command-based capture in progress
        } else if (this.captureNextFrames > 0) {
            if (this.capturingContext) {
                this.sender.sendCaptureStarted();
                this.capturingContext.startCapture(0, this.quickCapture, this.fullCapture);
            }
            this.captureNextFrames--;
        } else {
            this.capturingContext = undefined;
        }
    }

    private onFrameEnd(): void {
        if (this.captureNextCommands > 0) {
            // command-based capture in progress
        } else if (this.captureNextFrames === 0) {
            this.stopCapture();
        }
    }
}
