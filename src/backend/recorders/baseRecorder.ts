namespace SPECTOR {

    export type RecordId = {
        readonly version: number,
        readonly id: number
    }

    export interface IRecorder {
        readonly objectName: string;

        registerCallbacks(onFunctionCallbacks: FunctionCallbacks): void;
    }

    export interface IRecorderOptions extends IContextInformation {
        readonly objectName: string;
    }

    export type RecorderConstructor = {
        new (options: IRecorderOptions, logger: ILogger): IRecorder;
    }
}

namespace SPECTOR.Recorders {
    export abstract class BaseRecorder implements IRecorder {

        protected readonly createCommandNames: string[];
        protected readonly updateCommandNames: string[];
        protected readonly deleteCommandNames: string[];

        public readonly objectName: string;

        protected abstract getCreateCommandNames(): string[];
        protected abstract getUpdateCommandNames(): string[];
        protected abstract getDeleteCommandNames(): string[];
        protected abstract getBoundObject(target: number): object;

        constructor(protected options: IRecorderOptions, logger: ILogger) {
            this.createCommandNames = this.getCreateCommandNames();
            this.updateCommandNames = this.getUpdateCommandNames();
            this.deleteCommandNames = this.getDeleteCommandNames();
            this.objectName = options.objectName;
        }

        public registerCallbacks(onFunctionCallbacks: FunctionCallbacks): void {
            for (const command of this.createCommandNames) {
                onFunctionCallbacks[command] = onFunctionCallbacks[command] || [];
                onFunctionCallbacks[command].push(this.create.bind(this));
            };

            for (const command of this.updateCommandNames) {
                onFunctionCallbacks[command] = onFunctionCallbacks[command] || [];
                onFunctionCallbacks[command].push(this.update.bind(this));
            };

            for (const command of this.deleteCommandNames) {
                onFunctionCallbacks[command] = onFunctionCallbacks[command] || [];
                onFunctionCallbacks[command].push(this.delete.bind(this));
            };
        }

        public create(functionInformation: IFunctionInformation): RecordId {
            return undefined;
        }

        public update(functionInformation: IFunctionInformation): RecordId {
            return undefined;
        }

        public delete(functionInformation: IFunctionInformation): RecordId {
            return undefined;
        }

        protected createWithoutSideEffects(functionInformation: IFunctionInformation): RecordId {
            this.options.toggleCapture(false);
            const result = this.create(functionInformation);
            this.options.toggleCapture(true);
            return result;
        }

        protected updateWithoutSideEffects(functionInformation: IFunctionInformation): RecordId {
            this.options.toggleCapture(false);
            const result = this.update(functionInformation);
            this.options.toggleCapture(true);
            return result;
        }

        protected deleteWithoutSideEffects(functionInformation: IFunctionInformation): RecordId {
            this.options.toggleCapture(false);
            const result = this.delete(functionInformation);
            this.options.toggleCapture(true);
            return result;
        }
    }
}
