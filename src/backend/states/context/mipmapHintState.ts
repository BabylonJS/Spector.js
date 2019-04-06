import { ParameterState, IParameter } from "../parameterState";
import { WebGlConstants } from "../../types/webglConstants";

export class MipmapHintState extends ParameterState {
    public static readonly stateName = "MipmapHintState";

    public get stateName(): string {
        return MipmapHintState.stateName;
    }

    protected getWebgl1Parameters(): IParameter[] {
        return [{ constant: WebGlConstants.GENERATE_MIPMAP_HINT, changeCommands: ["hint"] }];
    }

    protected getConsumeCommands(): string[] {
        return ["generateMipmap"];
    }
}
