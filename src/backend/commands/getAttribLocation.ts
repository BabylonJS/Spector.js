import { BaseCommand } from "./baseCommand";

export class GetAttribLocation extends BaseCommand {
    public static readonly commandName = "getAttribLocation";

    protected get spiedCommandName(): string {
        return GetAttribLocation.commandName;
    }

    protected stringifyResult(result: any): string {
        if (!result) {
            return undefined;
        }

        return result?.toFixed(0) ?? "0";
    }
}
