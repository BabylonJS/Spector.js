namespace SPECTOR.States {

    @Decorators.state("CoverageState")
    export class CoverageState extends ParameterState {

        protected getWebgl1Parameters(): IParameter[] {
            return [{ constant: WebGlConstants.SAMPLE_COVERAGE_VALUE, changeCommands: ["sampleCoverage"] },
            { constant: WebGlConstants.SAMPLE_COVERAGE_INVERT, changeCommands: ["sampleCoverage"] }];
        }

        protected getWebgl2Parameters(): IParameter[] {
            return [{ constant: WebGlConstants.SAMPLE_COVERAGE, changeCommands: ["enable", "disable"] },
            { constant: WebGlConstants.SAMPLE_ALPHA_TO_COVERAGE, changeCommands: ["enable", "disable"] }]
        }

        protected isValidChangeCommand(command: ICommandCapture, stateName: string): boolean {
            if (command.name === "enable" || command.name === "disable") {
                if (command.commandArguments[0] == WebGlConstants.SAMPLE_COVERAGE.value) {
                    return stateName === WebGlConstants.SAMPLE_COVERAGE.name;
                }

                if (command.commandArguments[0] == WebGlConstants.SAMPLE_ALPHA_TO_COVERAGE.value) {
                    return stateName === WebGlConstants.SAMPLE_ALPHA_TO_COVERAGE.name;
                }

                return false;
            }
            return true;
        }

        protected getConsumeCommands(): string[] {
            return drawCommands;
        }

        protected isStateEnable(stateName: string, args: IArguments): boolean {
            if (this.contextVersion === 2) {
                return this.context.isEnabled(WebGlConstants.SAMPLE_COVERAGE.value);
            }
            return false;
        }
    }
}
