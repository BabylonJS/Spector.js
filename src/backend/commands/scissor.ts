import { BaseCommand } from "./baseCommand";

export class Scissor extends BaseCommand {
    public static readonly commandName = "scissor";

    protected get spiedCommandName(): string {
        return Scissor.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        for (let i = 0; i < 4; i++) {
            stringified.push(args[i].toFixed(0));
        }
        return stringified;
    }
}
