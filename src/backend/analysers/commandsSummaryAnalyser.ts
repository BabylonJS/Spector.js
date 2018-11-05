namespace SPECTOR.Analysers {

    @Decorators.analyser("CommandsSummary")
    export class CommandsSummaryAnalyser extends BaseAnalyser {

        private static drawCommands = [
            "drawArrays",
            "drawElements",
            "drawArraysInstanced",
            "drawArraysInstancedANGLE",
            "drawElementsInstanced",
            "drawElementsInstancedANGLE",
            "drawRangeElements",
        ];

        protected appendToAnalysis(capture: ICapture, analysis: IAnalysis): void {
            if (!capture.commands) {
                return;
            }

            analysis.total = capture.commands.length;
            analysis.draw = 0;
            analysis.clear = 0;

            for (const command of capture.commands) {
                if (command.name === "clear") {
                    analysis.clear++;
                }
                else if (CommandsSummaryAnalyser.drawCommands.indexOf(command.name) > -1) {
                    analysis.draw++;
                }
            }
        }
    }
}
