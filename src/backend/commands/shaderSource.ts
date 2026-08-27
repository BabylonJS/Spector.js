import { BaseShaderCommand } from "./baseShaderCommand";
import { ICommandCapture } from "../../shared/capture/commandCapture";

/** Captures shader source without rendering the full source in the command list. */
export class ShaderSource extends BaseShaderCommand {
    public static readonly commandName = "shaderSource";

    protected get spiedCommandName(): string {
        return ShaderSource.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const source = typeof args[1] === "string" ? args[1] : "";
        return [
            this.stringifyValue(args[0]),
            source.length + " chars",
        ];
    }

    protected transformCapture(commandCapture: ICommandCapture): void {
        super.transformCapture(commandCapture);

        const source = commandCapture.commandArguments[1];
        if (commandCapture.shader && typeof source === "string") {
            // Preserve the exact argument even if a browser normalizes getShaderSource().
            commandCapture.shader.source = source;
            // Compilation data still belongs to the shader's previous source.
            commandCapture.shader.COMPILE_STATUS = null;
            commandCapture.shader.translatedSource = "";
            commandCapture.shader.infoLog = "";
        }
    }
}
