import { ParameterState, IParameter, ParameterReturnType } from "../parameterState";
import { WebGlConstants } from "../../types/webglConstants";
import { drawCommands } from "../../utils/drawCommands";
import { ICommandCapture } from "../../../shared/capture/commandCapture";

// tslint:disable:max-line-length

export class DepthState extends ParameterState {
    public static readonly stateName = "DepthState";

    public get stateName(): string {
        return DepthState.stateName;
    }

    protected getWebgl1Parameters(): IParameter[] {
        return [{ constant: WebGlConstants.DEPTH_TEST, changeCommands: ["enable", "disable"] },
        { constant: WebGlConstants.DEPTH_FUNC, returnType: ParameterReturnType.GlEnum, changeCommands: ["depthFunc"] },
        { constant: WebGlConstants.DEPTH_RANGE, changeCommands: ["depthRange"] },
        { constant: WebGlConstants.DEPTH_WRITEMASK, changeCommands: ["depthMask"] }];
    }

    protected getConsumeCommands(): string[] {
        return drawCommands;
    }

    protected isValidChangeCommand(command: ICommandCapture, stateName: string): boolean {
        if (command.name === "enable" || command.name === "disable") {
            return command.commandArguments[0] === WebGlConstants.DEPTH_TEST.value;
        }
        return true;
    }

    protected isStateEnable(stateName: string, args: IArguments): boolean {
        return this.context.isEnabled(WebGlConstants.DEPTH_TEST.value);
    }
}
