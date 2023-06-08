import { BaseCommand } from "./baseCommand";
import { WebGlConstants } from "../types/webglConstants";
import { formatBinary } from "../utils/formatHelper";

export class StencilFunc extends BaseCommand {
    public static readonly commandName = "stencilFunc";

    protected get spiedCommandName(): string {
        return StencilFunc.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        stringified.push(WebGlConstants.stringifyWebGlConstant(args[0], "stencilFunc"));
        stringified.push(formatBinary(args[1]));
        stringified.push(formatBinary(args[2]));

        return stringified;
    }
}
