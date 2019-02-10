import { BaseCommand } from "./baseCommand";

export class GetShaderPrecisionFormat extends BaseCommand {
    public static readonly commandName = "getShaderPrecisionFormat";

    protected get spiedCommandName(): string {
        return GetShaderPrecisionFormat.commandName;
    }

    protected stringifyResult(result: any): string {
        if (!result) {
            return undefined;
        }

        return `min: ${result.rangeMin}, max: ${result.rangeMax}, precision: ${result.precision}`;
    }
}
