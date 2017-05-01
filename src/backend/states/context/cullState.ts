// tslint:disable:max-line-length

namespace SPECTOR.States {

    @Decorators.state("CullState")
    export class CullState extends ParameterState {

        protected getWebgl1Parameters(): IParameter[] {
            return [{ constant: WebGlConstants.CULL_FACE, changeCommands: ["enable", "disable"] },
            { constant: WebGlConstants.CULL_FACE_MODE, returnType: ParameterReturnType.GlEnum, changeCommands: ["cullFace"] }];
        }

        protected getConsumeCommands(): string[] {
            return drawCommands;
        }

        protected isValidChangeCommand(command: ICommandCapture, stateName: string): boolean {
            if (command.name === "enable" || command.name === "disable") {
                return command.commandArguments[0] === WebGlConstants.CULL_FACE.value;
            }
            return true;
        }

        protected isStateEnable(stateName: string, args: IArguments): boolean {
            return this.context.isEnabled(WebGlConstants.CULL_FACE.value);
        }
    }
}
