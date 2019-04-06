import { BaseAnalyser } from "./baseAnalyser";
import { ICapture } from "../../shared/capture/capture";
import { IAnalysis } from "../../shared/capture/analysis";

export class CommandsAnalyser extends BaseAnalyser {
    public static readonly analyserName = "Commands";

    protected get analyserName(): string {
        return CommandsAnalyser.analyserName;
    }

    protected appendToAnalysis(capture: ICapture, analysis: IAnalysis): void {
        if (!capture.commands) {
            return;
        }

        const unorderedItems: { [key: string]: number } = {};
        for (const command of capture.commands) {
            unorderedItems[command.name] = unorderedItems[command.name] || 0;
            unorderedItems[command.name]++;
        }

        // Create items array
        const items = Object.keys(unorderedItems).map((key) => {
            return [key, unorderedItems[key]];
        });

        // Sort the array based on the second element
        items.sort((first, second) => {
            const difference = (second[1] as number) - (first[1] as number);

            // Alpha order in case of equality
            if (difference === 0) {
                return (first[0] as string).localeCompare(second[0] as string);
            }

            return difference;
        });

        // Appends to state
        for (const item of items) {
            const commandName = item[0] as string;
            analysis[commandName] = item[1];
        }
    }
}
