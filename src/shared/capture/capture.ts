import { IAnalysis } from "./analysis";
import { ICanvasCapture } from "./canvasCapture";
import { IContextCapture } from "./contextCapture";
import { State, ICommandCapture } from "./commandCapture";

export interface ICapture {
    canvas: ICanvasCapture;
    context: IContextCapture;
    initState: State;
    commands: ICommandCapture[];
    endState: State;
    startTime: number;
    listenCommandsStartTime: number;
    listenCommandsEndTime: number;
    endTime: number;
    analyses: IAnalysis[];
    frameMemory: { [objectName: string]: number };
    memory: { [objectName: string]: { [second: number]: number } };
}
