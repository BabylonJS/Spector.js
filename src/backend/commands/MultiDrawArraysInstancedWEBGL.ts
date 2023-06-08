import { BaseCommand } from "./baseCommand";
import { WebGlConstants } from "../types/webglConstants";

export class MultiDrawArraysInstancedWEBGL extends BaseCommand {
    public static readonly commandName = "multiDrawArraysInstancedWEBGL";

    protected get spiedCommandName(): string {
        return MultiDrawArraysInstancedWEBGL.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        stringified.push(WebGlConstants.stringifyWebGlConstant(args[0], "drawArrays"));
        stringified.push(`drawCount=${args[7]}`);
        stringified.push(args[2]);
        stringified.push(args[4]);
        stringified.push(args[6]);

        return stringified;
    }
}
