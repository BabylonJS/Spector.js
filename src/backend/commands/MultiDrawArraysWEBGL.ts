import { BaseCommand } from "./baseCommand";
import { WebGlConstants } from "../types/webglConstants";

export class MultiDrawArraysWEBGL extends BaseCommand {
    public static readonly commandName = "multiDrawArraysWEBGL";

    protected get spiedCommandName(): string {
        return MultiDrawArraysWEBGL.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        stringified.push(WebGlConstants.stringifyWebGlConstant(args[0], "drawArrays"));
        stringified.push(`drawCount=${args[5]}`);
        stringified.push(args[2]);
        stringified.push(args[4]);

        return stringified;
    }
}
