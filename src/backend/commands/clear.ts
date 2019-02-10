import { BaseCommand } from "./baseCommand";

import { WebGlConstants } from "../types/webglConstants";

export class Clear extends BaseCommand {
    public static readonly commandName = "clear";

    protected get spiedCommandName(): string {
        return Clear.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        if ((args[0] & WebGlConstants.DEPTH_BUFFER_BIT.value) === WebGlConstants.DEPTH_BUFFER_BIT.value) {
            stringified.push(WebGlConstants.DEPTH_BUFFER_BIT.name);
        }
        if ((args[0] & WebGlConstants.STENCIL_BUFFER_BIT.value) === WebGlConstants.STENCIL_BUFFER_BIT.value) {
            stringified.push(WebGlConstants.STENCIL_BUFFER_BIT.name);
        }
        if ((args[0] & WebGlConstants.COLOR_BUFFER_BIT.value) === WebGlConstants.COLOR_BUFFER_BIT.value) {
            stringified.push(WebGlConstants.COLOR_BUFFER_BIT.name);
        }

        return stringified;
    }
}
