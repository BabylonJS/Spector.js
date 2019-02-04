namespace SPECTOR {
    export interface IAnalyser {
        readonly analyserName: string;

        appendAnalysis(capture: ICapture): void;
        getAnalysis(capture: ICapture): IAnalysis;
    }

    export interface IAnalyserOptions extends IContextInformation {
        readonly analyserName: string;
    }

    export type AnalyserConstructor = new (options: IAnalyserOptions, logger: ILogger) => IAnalyser;
}

namespace SPECTOR.Analysers {
    export abstract class BaseAnalyser implements IAnalyser {

        public readonly analyserName: string;

        constructor(protected readonly options: IAnalyserOptions,
            protected readonly logger: ILogger) {
            this.analyserName = options.analyserName;
        }

        public appendAnalysis(capture: ICapture): void {
            capture.analyses = capture.analyses || [];
            const analysis = this.getAnalysis(capture);
            capture.analyses.push(analysis);
        }

        public getAnalysis(capture: ICapture): IAnalysis {
            const analysis: IAnalysis = {
                analyserName: this.analyserName,
            };
            this.appendToAnalysis(capture, analysis);
            return analysis;
        }

        protected abstract appendToAnalysis(capture: ICapture, analysis: IAnalysis): void;
    }
}
