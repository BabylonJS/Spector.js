import { BaseCommand } from "./baseCommand";

export class DisableVertexAttribArray extends BaseCommand {
    public static readonly commandName = "disableVertexAttribArray";

    protected get spiedCommandName(): string {
        return DisableVertexAttribArray.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        stringified.push(args[0]);
        return stringified;
    }
}
