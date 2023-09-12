import { BaseCommand } from "./baseCommand";
import { WebGlConstants } from "../types/webglConstants";

export class DrawArraysInstancedBaseInstanceWEBGL extends BaseCommand {
    public static readonly commandName = "drawArraysInstancedBaseInstanceWEBGL";

    protected get spiedCommandName(): string {
        return DrawArraysInstancedBaseInstanceWEBGL.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        stringified.push(WebGlConstants.stringifyWebGlConstant(args[0], "drawArraysInstanced"));
        stringified.push(args[1]);
        stringified.push(args[2]);
        stringified.push(args[3]);
        stringified.push(`baseInstance = ${args[4]}`);

        return stringified;
    }
}
