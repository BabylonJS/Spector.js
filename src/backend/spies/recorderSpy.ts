import { IContextInformation } from "../types/contextInformation";
import { FunctionCallbacks, IFunctionInformation } from "../types/functionInformation";
import { ICapture } from "../../shared/capture/capture";
import { BufferRecorder } from "../recorders/bufferRecorder";
import { RenderBufferRecorder } from "../recorders/renderBufferRecorder";
import { Texture2DRecorder } from "../recorders/texture2DRecorder";
import { Texture3DRecorder } from "../recorders/texture3DRecorder";
import { ProgramRecorder } from "../recorders/programRecorder";
import { IRecorder } from "../recorders/baseRecorder";

export class RecorderSpy {
    private readonly recorders: IRecorder[];
    private readonly onCommandCallbacks: FunctionCallbacks;

    constructor(public readonly contextInformation: IContextInformation) {
        this.onCommandCallbacks = {};
        this.recorders = [];
        this.initRecorders();
    }

    public recordCommand(functionInformation: IFunctionInformation): void {
        const callbacks = this.onCommandCallbacks[functionInformation.name];
        if (callbacks) {
            for (const callback of callbacks) {
                callback(functionInformation);
            }
        }
    }

    public startCapture(): void {
        for (const recorder of this.recorders) {
            recorder.startCapture();
        }
    }

    public stopCapture(): void {
        for (const recorder of this.recorders) {
            recorder.stopCapture();
        }
    }

    public appendRecordedInformation(capture: ICapture): void {
        for (const recorder of this.recorders) {
            recorder.appendRecordedInformation(capture);
        }
    }

    private initRecorders(): void {
        this.recorders.push(
            new BufferRecorder(this.contextInformation),
            new RenderBufferRecorder(this.contextInformation),
            new Texture2DRecorder(this.contextInformation),
            new Texture3DRecorder(this.contextInformation),
            new ProgramRecorder(this.contextInformation),
        );

        for (const recorder of this.recorders) {
            recorder.registerCallbacks(this.onCommandCallbacks);
        }
    }
}
