import { BaseCommand } from "./baseCommand";

export class GetTransformFeedbackVarying extends BaseCommand {
    public static readonly commandName = "getTransformFeedbackVarying";

    protected get spiedCommandName(): string {
        return GetTransformFeedbackVarying.commandName;
    }

    protected stringifyResult(result: any): string {
        if (!result) {
            return undefined;
        }

        return `name: ${result.name}, size: ${result.size}, type: ${result.type}`;
    }
}
