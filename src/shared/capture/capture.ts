namespace SPECTOR {
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
    }
}
