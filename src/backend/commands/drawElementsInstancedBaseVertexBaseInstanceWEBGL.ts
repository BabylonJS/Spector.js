import { BaseCommand } from "./baseCommand";
import { WebGlConstants } from "../types/webglConstants";

export class DrawElementsInstancedBaseVertexBaseInstanceWEBGL extends BaseCommand {
    public static readonly commandName = "drawElementsInstancedBaseVertexBaseInstanceWEBGL";

    protected get spiedCommandName(): string {
        return DrawElementsInstancedBaseVertexBaseInstanceWEBGL .commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        stringified.push(WebGlConstants.stringifyWebGlConstant(args[0], "drawElementsInstanced"));
        stringified.push(args[1]);
        stringified.push(WebGlConstants.stringifyWebGlConstant(args[2], "drawElementsInstanced"));
        stringified.push(args[3]);
        stringified.push(args[4]);

        stringified.push(`baseVertex = ${args[5]}`);
        stringified.push(`baseInstance = ${args[6]}`);

        return stringified;
    }
}
