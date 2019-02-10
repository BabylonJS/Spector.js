import { BaseCommand } from "./baseCommand";

export class Viewport extends BaseCommand {
    public static readonly commandName = "viewport";

    protected get spiedCommandName(): string {
        return Viewport.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        for (let i = 0; i < 4; i++) {
            stringified.push(args[i].toFixed(0));
        }
        return stringified;
    }
}
