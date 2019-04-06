import { ParameterState, IParameter } from "../parameterState";
import { WebGlConstants } from "../../types/webglConstants";
import { ICommandCapture } from "../../../shared/capture/commandCapture";
import { drawCommands } from "../../utils/drawCommands";

export class PolygonOffsetState extends ParameterState {
    public static readonly stateName = "PolygonOffsetState";

    public get stateName(): string {
        return PolygonOffsetState.stateName;
    }

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
