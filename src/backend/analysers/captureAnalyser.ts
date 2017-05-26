namespace SPECTOR {
    export interface ICaptureAnalyser {
        appendAnalyses(capture: ICapture): void;
    }

    export interface ICaptureAnalyserOptions {
        readonly contextInformation: IContextInformation;
        readonly analyserNamespace: FunctionIndexer;
    }

    export type CaptureAnalyserConstructor = {
        new (options: ICaptureAnalyserOptions, logger: ILogger): ICaptureAnalyser,
    };
}

namespace SPECTOR.Analysers {
    export class CaptureAnalyser implements ICaptureAnalyser {
        private readonly contextInformation: IContextInformation;

        private readonly analyserConstructors: { [objectName: string]: AnalyserConstructor; };
        private readonly analysers: { [objectName: string]: IAnalyser };

        constructor(public readonly options: ICaptureAnalyserOptions, private readonly logger: ILogger) {
            this.analysers = {};
            this.analyserConstructors = {};
            this.contextInformation = options.contextInformation;

            this.initAvailableAnalysers();
            this.initAnalysers();
        }

        public appendAnalyses(capture: ICapture): void {
            for (const analyserName in this.analysers) {
                if (this.analysers.hasOwnProperty(analyserName)) {
                    const analyser = this.analysers[analyserName];
                    analyser.appendAnalysis(capture);
                }
            }
        }

        private initAvailableAnalysers(): void {
            for (const analyser in this.options.analyserNamespace) {
                if (this.options.analyserNamespace.hasOwnProperty(analyser)) {
                    const analyserCtor = this.options.analyserNamespace[analyser];
                    const analyserName = Decorators.getAnalyserName(analyserCtor);
                    if (analyserName) {
                        this.analyserConstructors[analyserName] = analyserCtor;
                    }
                }
            }
        }

        private initAnalysers(): void {
            for (const analyserName in this.analyserConstructors) {
                if (this.analyserConstructors.hasOwnProperty(analyserName)) {
                    const options = merge(
                        { analyserName },
                        this.contextInformation,
                    );

                    const recorder = new this.analyserConstructors[analyserName](options, this.logger);
                    this.analysers[analyserName] = recorder;
                }
            }
        }
    }
}
