import { BaseCommand } from "./baseCommand";
import { WebGlObjects } from "../webGlObjects/baseWebGlObject";

export class GetParameter extends BaseCommand {
    public static readonly commandName = "getParameter";

    protected get spiedCommandName(): string {
        return GetParameter.commandName;
    }

    protected stringifyResult(result: any): string {
        if (!result) {
            return "null";
        }

        const tag = WebGlObjects.getWebGlObjectTag(result);
        if (tag) {
            return tag.displayText;
        }

        return result;
    }
}
