import { BaseShaderCommand } from "./baseShaderCommand";
import { ICommandCapture } from "../../shared/capture/commandCapture";

/** Captures the source and compiler log immediately after shader compilation. */
export class CompileShader extends BaseShaderCommand {
    public static readonly commandName = "compileShader";

    protected get spiedCommandName(): string {
        return CompileShader.commandName;
    }

    protected transformCapture(commandCapture: ICommandCapture): void {
        super.transformCapture(commandCapture);

        if (commandCapture.shader) {
            const status = commandCapture.shader.COMPILE_STATUS ? "compiled" : "failed";
            commandCapture.text = `${this.spiedCommandName}: ${this.getShaderDisplayText(commandCapture)} -> ${status}`;
        }
    }
}
