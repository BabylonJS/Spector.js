import { BaseCommand } from "./baseCommand";
import { WebGlConstants } from "../types/webglConstants";

export class StencilFuncSeparate extends BaseCommand {
    public static readonly commandName = "stencilFuncSeparate";

    protected get spiedCommandName(): string {
        return StencilFuncSeparate.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        stringified.push(WebGlConstants.stringifyWebGlConstant(args[0], "stencilFuncSeparate"));
        stringified.push(WebGlConstants.stringifyWebGlConstant(args[1], "stencilFuncSeparate"));
        stringified.push(`${args[2].toFixed(0)} (0b${(args[2] >>> 0).toString(2)})`);
        stringified.push(`${args[3].toFixed(0)} (0b${(args[3] >>> 0).toString(2)})`);

        return stringified;
    }
}
