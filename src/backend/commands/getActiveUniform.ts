import { BaseCommand } from "./baseCommand";

export class GetActiveUniform extends BaseCommand {
    public static readonly commandName = "getActiveUniform";

    protected get spiedCommandName(): string {
        return GetActiveUniform.commandName;
    }

    protected stringifyResult(result: any): string {
        if (!result) {
            return undefined;
        }

        return `name: ${result.name}, size: ${result.size}, type: ${result.type}`;
    }
}
