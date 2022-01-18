import { BaseCommand } from "./baseCommand";
import { WebGlConstants } from "../types/webglConstants";

export class StencilFunc extends BaseCommand {
    public static readonly commandName = "stencilFunc";

    protected get spiedCommandName(): string {
        return StencilFunc.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        stringified.push(WebGlConstants.stringifyWebGlConstant(args[0], "stencilFunc"));
        stringified.push(`${args[1].toFixed(0)} (0b${(args[1] >>> 0).toString(2)})`);
        stringified.push(`${args[2].toFixed(0)} (0b${(args[2] >>> 0).toString(2)})`);

        return stringified;
    }
}
