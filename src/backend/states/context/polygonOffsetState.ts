namespace SPECTOR.States {

    @Decorators.state("PolygonOffsetState")
    export class PolygonOffsetState extends ParameterState {

        protected getWebgl1Parameters(): IParameter[] {
            return [{ constant: WebGlConstants.POLYGON_OFFSET_FILL, changeCommands: ["enable", "disable"] },
            { constant: WebGlConstants.POLYGON_OFFSET_FACTOR, changeCommands: ["polygonOffset"] },
            { constant: WebGlConstants.POLYGON_OFFSET_UNITS, changeCommands: ["polygonOffset"] }];
        }

        protected isValidChangeCommand(command: ICommandCapture, stateName: string): boolean {
            if (command.name === "enable" || command.name === "disable") {
                return command.commandArguments[0] === WebGlConstants.POLYGON_OFFSET_FILL.value;
            }
            return true;
        }

        protected getConsumeCommands(): string[] {
            return drawCommands;
        }

        protected isStateEnable(stateName: string, args: IArguments): boolean {
            return this.context.isEnabled(WebGlConstants.POLYGON_OFFSET_FILL.value);
        }
    }
}
