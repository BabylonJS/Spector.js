import { IContextInformation } from "../types/contextInformation";
import { ICapture } from "../../shared/capture/capture";
import { BaseAnalyser } from "./baseAnalyser";
import { CommandsAnalyser } from "./commandsAnalyser";
import { CommandsSummaryAnalyser } from "./commandsSummaryAnalyser";
import { PrimitivesAnalyser } from "./primitivesAnalyser";

export class CaptureAnalyser {
    private readonly analysers: BaseAnalyser[];

    constructor(private readonly contextInformation: IContextInformation) {
        this.analysers = [];
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

    private initAnalysers(): void {
        this.analysers.push(
            new CommandsAnalyser(this.contextInformation),
            new CommandsSummaryAnalyser(this.contextInformation),
            new PrimitivesAnalyser(this.contextInformation),
        );
    }
}
