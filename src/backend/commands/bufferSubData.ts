import { BaseCommand } from "./baseCommand";

export class BufferSubData extends BaseCommand {
    public static readonly commandName = "bufferSubData";

    protected get spiedCommandName(): string {
        return BufferSubData.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        for (let i = 0; i < args.length; i++) {
            const arg = args[i];

            if (i > 0 && typeof arg === "number") {
                stringified.push(args[i]?.toFixed(0) ?? "0");
            }
            else {
                const stringifiedValue = this.stringifyValue(arg);
                stringified.push(stringifiedValue);
            }
        }
        return stringified;
    }
}
