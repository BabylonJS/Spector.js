import { BaseCommand } from "./baseCommand";

export class GetActiveAttrib extends BaseCommand {
    public static readonly commandName = "getActiveAttrib";

    protected get spiedCommandName(): string {
        return GetActiveAttrib.commandName;
    }

    protected stringifyResult(result: any): string {
        if (!result) {
            return undefined;
        }

        return `name: ${result.name}, size: ${result.size}, type: ${result.type}`;
    }
}
