namespace SPECTOR {
    export type FunctionIndexer = { [key: string]: any };

    export type FunctionCallback = (functionInformation: IFunctionInformation) => void;

    export type FunctionCallbacks = { [name: string]: FunctionCallback[] };

    export interface IFunctionInformation {
        readonly name: string;
        readonly args: IArguments;
        readonly result: any;
        readonly startTime: number;
        readonly endTime: number;
    }
}
