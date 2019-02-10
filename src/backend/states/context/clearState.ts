import { ParameterState, IParameter } from "../parameterState";
import { WebGlConstants } from "../../types/webglConstants";

export class ClearState extends ParameterState {
    public static readonly stateName = "ClearState";

    public get stateName(): string {
        return ClearState.stateName;
    }

    protected getWebgl1Parameters(): IParameter[] {
        return [{ constant: WebGlConstants.COLOR_CLEAR_VALUE, changeCommands: ["clearColor"] },
        { constant: WebGlConstants.DEPTH_CLEAR_VALUE, changeCommands: ["clearDepth"] },
        { constant: WebGlConstants.STENCIL_CLEAR_VALUE, changeCommands: ["clearStencil"] }];
    }

    protected getConsumeCommands(): string[] {
        return ["clear"];
    }

    protected isStateEnable(stateName: string, args: IArguments): boolean {
        switch (stateName) {
            case WebGlConstants.COLOR_CLEAR_VALUE.name:
                return WebGlConstants.COLOR_BUFFER_BIT.value === (args[0] & WebGlConstants.COLOR_BUFFER_BIT.value);

            case WebGlConstants.DEPTH_CLEAR_VALUE.name:
                return WebGlConstants.DEPTH_BUFFER_BIT.value === (args[0] & WebGlConstants.DEPTH_BUFFER_BIT.value);

            case WebGlConstants.STENCIL_CLEAR_VALUE.name:
                return WebGlConstants.STENCIL_BUFFER_BIT.value ===
                    (args[0] & WebGlConstants.STENCIL_BUFFER_BIT.value);
        }
        return false;
    }
}
