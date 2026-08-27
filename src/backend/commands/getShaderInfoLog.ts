import { BaseShaderCommand } from "./baseShaderCommand";

/** Captures shader source alongside an application's getShaderInfoLog call. */
export class GetShaderInfoLog extends BaseShaderCommand {
    public static readonly commandName = "getShaderInfoLog";

    protected get spiedCommandName(): string {
        return GetShaderInfoLog.commandName;
    }

    protected stringifyResult(result: any): string {
        if (typeof result !== "string" || result.trim().length === 0) {
            return "No messages";
        }

        const messageCount = result.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
        return messageCount + (messageCount === 1 ? " message" : " messages");
    }
}
