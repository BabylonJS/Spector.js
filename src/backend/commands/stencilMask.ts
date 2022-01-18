import { BaseCommand } from "./baseCommand";

export class StencilMask extends BaseCommand {
    public static readonly commandName = "stencilMask";

    protected get spiedCommandName(): string {
        return StencilMask.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        stringified.push(`${args[0].toFixed(0)} (0b${(args[0] >>> 0).toString(2)})`);

        return stringified;
    }
}
