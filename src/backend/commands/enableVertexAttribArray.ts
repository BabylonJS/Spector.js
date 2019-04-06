import { BaseCommand } from "./baseCommand";

export class EnableVertexAttribArray extends BaseCommand {
    public static readonly commandName = "enableVertexAttribArray";

    protected get spiedCommandName(): string {
        return EnableVertexAttribArray.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        stringified.push(args[0]);
        return stringified;
    }
}
