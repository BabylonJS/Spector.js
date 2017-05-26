namespace SPECTOR.Analysers {

    @Decorators.analyser("Primitives")
    export class PrimitivesAnalyser extends BaseAnalyser {

        protected appendToAnalysis(capture: ICapture, analysis: IAnalysis): void {
            if (!capture.commands) {
                return;
            }

            let totalPrimitives = 0;
            for (const command of capture.commands) {
                if (command.name === "drawArrays" && command.commandArguments.length >= 3) {
                    totalPrimitives += command.commandArguments[2];
                }
                else if (command.name === "drawArraysInstanced" && command.commandArguments.length >= 3) {
                    totalPrimitives += command.commandArguments[2];
                }
                else if (command.name === "drawElements" && command.commandArguments.length >= 2) {
                    totalPrimitives += command.commandArguments[1];
                }
                else if (command.name === "drawElementsInstanced" && command.commandArguments.length >= 2) {
                    totalPrimitives += command.commandArguments[1];
                }
                else if (command.name === "drawElementsInstancedANGLE" && command.commandArguments.length >= 2) {
                    totalPrimitives += command.commandArguments[1];
                }
                else if (command.name === "drawRangeElements" && command.commandArguments.length >= 4) {
                    totalPrimitives += command.commandArguments[3];
                }
            }

            analysis["totalDrawnPrimitives"] = totalPrimitives;
        }
    }
}
