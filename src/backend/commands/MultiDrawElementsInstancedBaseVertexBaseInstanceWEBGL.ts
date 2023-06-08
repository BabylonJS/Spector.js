import { BaseCommand } from "./baseCommand";
import { WebGlConstants } from "../types/webglConstants";

export class MultiDrawElementsInstancedBaseVertexBaseInstanceWEBGL extends BaseCommand {
    public static readonly commandName = "multiDrawElementsInstancedBaseVertexBaseInstanceWEBGL";

    protected get spiedCommandName(): string {
        return MultiDrawElementsInstancedBaseVertexBaseInstanceWEBGL.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        stringified.push(WebGlConstants.stringifyWebGlConstant(args[0], "drawArrays"));
        stringified.push(WebGlConstants.stringifyWebGlConstant(args[3], "drawArrays"));
        stringified.push(`drawCount=${args[11]}`);
        stringified.push(args[2]);
        stringified.push(args[4]);
        stringified.push(args[6]);
        stringified.push(args[8]);
        stringified.push(args[10]);

        return stringified;
    }
}
