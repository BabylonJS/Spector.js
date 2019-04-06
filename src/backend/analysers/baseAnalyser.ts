import { IContextInformation } from "../types/contextInformation";
import { ICapture } from "../../shared/capture/capture";
import { IAnalysis } from "../../shared/capture/analysis";

export abstract class BaseAnalyser {
    protected abstract get analyserName(): string;

    constructor(protected readonly options: IContextInformation) { }

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
