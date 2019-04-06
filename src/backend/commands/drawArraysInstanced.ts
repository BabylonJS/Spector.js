import { BaseCommand } from "./baseCommand";
import { WebGlConstants } from "../types/webglConstants";

export class DrawArraysInstanced extends BaseCommand {
    public static readonly commandName = "drawArraysInstanced";

    protected get spiedCommandName(): string {
        return DrawArraysInstanced.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        stringified.push(WebGlConstants.stringifyWebGlConstant(args[0], "drawArraysInstanced"));
        stringified.push(args[1]);
        stringified.push(args[2]);
        stringified.push(args[3]);

        return stringified;
    }
}
