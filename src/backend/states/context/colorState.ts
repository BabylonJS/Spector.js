import { ParameterState, IParameter } from "../parameterState";
import { WebGlConstants } from "../../types/webglConstants";
import { drawCommands } from "../../utils/drawCommands";

export class ColorState extends ParameterState {
    public static readonly stateName = "ColorState";

    public get stateName(): string {
        return ColorState.stateName;
    }

    protected getWebgl1Parameters(): IParameter[] {
        return [{ constant: WebGlConstants.COLOR_WRITEMASK, changeCommands: ["colorMask"] }];
    }

    protected getConsumeCommands(): string[] {
        return drawCommands;
    }
}
