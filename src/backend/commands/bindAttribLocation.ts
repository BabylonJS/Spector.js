import { BaseCommand } from "./baseCommand";

export class BindAttribLocation extends BaseCommand {
    public static readonly commandName = "bindAttribLocation";

    protected get spiedCommandName(): string {
        return BindAttribLocation.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        // Program
        if (args.length > 0) {
            const arg = args[0];
            const stringifiedValue = this.stringifyValue(arg);
            stringified.push(stringifiedValue);
        }
        // Index
        if (args.length > 1) {
            const arg = "" + args[1];
            stringified.push(arg);
        }
        // Name
        if (args.length > 2) {
            stringified.push(args[2]);
        }
        return stringified;
    }
}
