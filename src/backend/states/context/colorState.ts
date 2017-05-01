namespace SPECTOR.States {

    @Decorators.state("ColorState")
    export class ColorState extends ParameterState {
        protected getWebgl1Parameters(): IParameter[] {
            return [{ constant: WebGlConstants.COLOR_WRITEMASK, changeCommands: ["colorMask"] }]
        }

        protected getConsumeCommands(): string[] {
            return drawCommands;
        }
    }
}
