import { ParameterState, IParameter, ParameterReturnType } from "../parameterState";
import { WebGlConstants } from "../../types/webglConstants";
import { ICommandCapture } from "../../../shared/capture/commandCapture";
import { drawCommands } from "../../utils/drawCommands";

// tslint:disable:max-line-length

export class DrawState extends ParameterState {
    public static readonly stateName = "DrawState";

    public get stateName(): string {
        return DrawState.stateName;
    }

    protected getWebgl1Parameters(): IParameter[] {
        return [{ constant: WebGlConstants.DITHER, changeCommands: ["enable", "disable"] },
        { constant: WebGlConstants.VIEWPORT, changeCommands: ["viewPort"] },
        { constant: WebGlConstants.FRONT_FACE, returnType: ParameterReturnType.GlEnum, changeCommands: ["frontFace"] },
        { constant: WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT_OES, changeCommands: ["hint"] }];
    }

    protected getWebgl2Parameters(): IParameter[] {
        return [{ constant: WebGlConstants.RASTERIZER_DISCARD, changeCommands: ["enable", "disable"] },
        { constant: WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT, changeCommands: ["hint"] }];
    }

    protected isValidChangeCommand(command: ICommandCapture, stateName: string): boolean {
        if (command.name === "enable" || command.name === "disable") {
            if (command.commandArguments[0] === WebGlConstants.DITHER.value) {
                return stateName === WebGlConstants.DITHER.name;
            }

            if (command.commandArguments[0] === WebGlConstants.RASTERIZER_DISCARD.value) {
                return stateName === WebGlConstants.RASTERIZER_DISCARD.name;
            }

            return false;
        }

        if (command.name === "hint") {
            if (command.commandArguments[0] === WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT_OES.value) {
                return stateName === WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT_OES.name;
            }

            if (command.commandArguments[0] === WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT.value) {
                return stateName === WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT.name;
            }

            return false;
        }
        return true;
    }

    protected getConsumeCommands(): string[] {
        return drawCommands;
    }

    protected isStateEnable(stateName: string, args: IArguments): boolean {
        switch (stateName) {
            case WebGlConstants.DITHER.name:
                return this.context.isEnabled(WebGlConstants.DITHER.value);
            case WebGlConstants.RASTERIZER_DISCARD.name:
                return this.context.isEnabled(WebGlConstants.RASTERIZER_DISCARD.value);
        }

        return true;
    }
}
