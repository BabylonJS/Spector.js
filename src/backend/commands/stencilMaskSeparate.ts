import { BaseCommand } from "./baseCommand";
import { WebGlConstants } from "../types/webglConstants";

export class StencilMaskSeparate extends BaseCommand {
    public static readonly commandName = "stencilMaskSeparate";

    protected get spiedCommandName(): string {
        return StencilMaskSeparate.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        stringified.push(WebGlConstants.stringifyWebGlConstant(args[0], "stencilMaskSeparate"));
        stringified.push(`${args[1].toFixed(0)} (0b${(args[1] >>> 0).toString(2)})`);

        return stringified;
    }
}
