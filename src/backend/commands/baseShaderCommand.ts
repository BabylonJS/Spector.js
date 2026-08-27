import { BaseCommand } from "./baseCommand";
import { ICommandCapture } from "../../shared/capture/commandCapture";
import { IContextInformation } from "../types/contextInformation";
import { ReadProgramHelper } from "../utils/readProgramHelper";

/**
 * Captures the shader source and compiler diagnostics associated with a
 * shader command while keeping Spector's own WebGL reads out of the command
 * stream.
 */
export abstract class BaseShaderCommand extends BaseCommand {
    constructor(options: IContextInformation) {
        super(options);
    }

    protected transformCapture(commandCapture: ICommandCapture): void {
        const shader = commandCapture.commandArguments[0] as WebGLShader;
        if (!shader) {
            return;
        }

        const toggleCapture = this.options.toggleCapture;
        if (toggleCapture) {
            toggleCapture(false);
        }

        try {
            commandCapture.shader = ReadProgramHelper.getShaderData(this.options.context, shader);
        }
        finally {
            if (toggleCapture) {
                toggleCapture(true);
            }
        }
    }

    protected getShaderDisplayText(commandCapture: ICommandCapture): string {
        return this.stringifyValue(commandCapture.commandArguments[0]);
    }
}
