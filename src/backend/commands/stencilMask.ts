import { formatBinary } from "../utils/formatHelper";
import { BaseCommand } from "./baseCommand";

export class StencilMask extends BaseCommand {
    public static readonly commandName = "stencilMask";

    protected get spiedCommandName(): string {
        return StencilMask.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        stringified.push(formatBinary(args[0]));

        return stringified;
    }
}
