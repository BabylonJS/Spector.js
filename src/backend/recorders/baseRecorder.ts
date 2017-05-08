namespace SPECTOR {
    export interface IRecorder {
        readonly objectName: string;

        registerCallbacks(onFunctionCallbacks: FunctionCallbacks): void;
    }

    export interface IRecorderOptions extends IContextInformation {
        readonly objectName: string;
    }

    export type RecorderConstructor = {
        new (options: IRecorderOptions, logger: ILogger): IRecorder;
    };
}

namespace SPECTOR.Recorders {
    export abstract class BaseRecorder<T extends WebGLObject> implements IRecorder {

        public readonly objectName: string;

        protected readonly createCommandNames: string[];
        protected readonly updateCommandNames: string[];
        protected readonly deleteCommandNames: string[];

        constructor(protected readonly options: IRecorderOptions, protected readonly logger: ILogger) {
            this.createCommandNames = this.getCreateCommandNames();
            this.updateCommandNames = this.getUpdateCommandNames();
            this.deleteCommandNames = this.getDeleteCommandNames();
            this.objectName = options.objectName;
        }

        public registerCallbacks(onFunctionCallbacks: FunctionCallbacks): void {
            for (const command of this.createCommandNames) {
                onFunctionCallbacks[command] = onFunctionCallbacks[command] || [];
                onFunctionCallbacks[command].push(this.createWithoutSideEffects.bind(this));
            }

            for (const command of this.updateCommandNames) {
                onFunctionCallbacks[command] = onFunctionCallbacks[command] || [];
                onFunctionCallbacks[command].push(this.updateWithoutSideEffects.bind(this));
            }

            for (const command of this.deleteCommandNames) {
                onFunctionCallbacks[command] = onFunctionCallbacks[command] || [];
                onFunctionCallbacks[command].push(this.deleteWithoutSideEffects.bind(this));
            }
        }

        protected abstract getCreateCommandNames(): string[];
        protected abstract getUpdateCommandNames(): string[];
        protected abstract getDeleteCommandNames(): string[];
        protected abstract getBoundInstance(target: number): T;

        protected abstract update(functionInformation: IFunctionInformation, instance: T): void;

        protected create(functionInformation: IFunctionInformation): void {
            return undefined;
        }

        protected delete(functionInformation: IFunctionInformation): void {
            return undefined;
        }

        protected createWithoutSideEffects(functionInformation: IFunctionInformation): void {
            this.options.toggleCapture(false);
            this.create(functionInformation);
            this.options.toggleCapture(true);
        }

        protected updateWithoutSideEffects(functionInformation: IFunctionInformation): void {
            if (!functionInformation || functionInformation.arguments.length === 0) {
                return;
            }
            this.options.toggleCapture(false);
            const instance = this.getBoundInstance(functionInformation.arguments[0]);
            this.update(functionInformation, instance);
            this.options.toggleCapture(true);
        }

        protected deleteWithoutSideEffects(functionInformation: IFunctionInformation): void {
            this.options.toggleCapture(false);
            this.delete(functionInformation);
            this.options.toggleCapture(true);
        }

        protected getWebGlConstant(value: number): string {
            const constant = WebGlConstantsByValue[value];
            return constant ? constant.name : value + "";
        }
    }
}
