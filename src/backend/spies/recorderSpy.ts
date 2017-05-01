namespace SPECTOR {

    export interface IRecorderSpy {
        readonly contextInformation: IContextInformation;
        recordCommand(functionInformation: IFunctionInformation): void;
    }

    export interface IRecorderSpyOptions {
        readonly contextInformation: IContextInformation;
        readonly recorderNamespace: FunctionIndexer;
    }

    export type RecorderSpyConstructor = {
        new (options: IRecorderSpyOptions, logger: ILogger): IRecorderSpy;
    }
}

namespace SPECTOR.Spies {
    export class RecorderSpy implements IRecorderSpy {

        private readonly recorderConstructors: { [objectName: string]: RecorderConstructor; }
        private readonly recorders: { [objectName: string]: IRecorder };
        private readonly onCommandCallbacks: FunctionCallbacks;

        public readonly contextInformation: IContextInformation;

        constructor(public readonly options: IRecorderSpyOptions, private readonly logger: ILogger) {
            this.recorders = {};
            this.recorderConstructors = {};
            this.onCommandCallbacks = {};
            this.contextInformation = options.contextInformation;

            this.initAvailableRecorders();
            this.initRecorders();
        }

        public recordCommand(functionInformation: IFunctionInformation): void {
            const callbacks = this.onCommandCallbacks[functionInformation.name];
            if (callbacks) {
                for (let callback of callbacks) {
                    callback(functionInformation);
                }
            }
        }

        private initAvailableRecorders(): void {
            for (const recorder in this.options.recorderNamespace) {
                const recorderCtor = this.options.recorderNamespace[recorder];
                const objectName = Decorators.getRecorderName(recorderCtor);
                if (objectName) {
                    this.recorderConstructors[objectName] = recorderCtor;
                }
            }
        }

        private initRecorders(): void {
            for (const objectName in this.recorderConstructors) {
                const options = merge(
                    { objectName: objectName },
                    this.contextInformation
                );

                const recorder = new this.recorderConstructors[objectName](options, this.logger);
                this.recorders[objectName] = recorder;

                recorder.registerCallbacks(this.onCommandCallbacks);
            }
        }
    }
}
