import { BaseCommand } from "./baseCommand";
import { WebGlConstants } from "../types/webglConstants";

export class DrawArraysInstancedAngle extends BaseCommand {
    public static readonly commandName = "drawArraysInstancedANGLE";

    protected get spiedCommandName(): string {
        return DrawArraysInstancedAngle.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        stringified.push(WebGlConstants.stringifyWebGlConstant(args[0], "drawArraysInstancedANGLE"));
        stringified.push(args[1]);
        stringified.push(args[2]);
        stringified.push(args[3]);

        return stringified;
    }
}
