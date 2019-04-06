export type FunctionCallback = (functionInformation: IFunctionInformation) => void;

export type FunctionCallbacks = { [name: string]: FunctionCallback[] };

export interface IFunctionInformation {
    readonly name: string;
    readonly arguments: IArguments;
    readonly result: any;
    readonly startTime: number;
    readonly endTime: number;
}
