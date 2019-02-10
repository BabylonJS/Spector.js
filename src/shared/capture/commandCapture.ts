export type State = { [stateName: string]: any };

export type CommandCapturedCallback = (command: ICommandCapture) => void;

export type CommandCapturedCallbacks = { [name: string]: CommandCapturedCallback[] };

export const enum CommandCaptureStatus {
    Unknown = 0,
    Unused = 10,
    Disabled = 20,
    Redundant = 30,
    Valid = 40,
    Deprecated = 50,
}

export interface ICommandCapture extends State {
    id: number;
    startTime: number;
    commandEndTime: number;
    endTime: number;
    name: string;
    commandArguments: IArguments;
    result: any;
    stackTrace: string[];
    status: CommandCaptureStatus;
    text: string;
    marker: string;
    consumeCommandId?: number;
    [stateName: string]: any;
}
