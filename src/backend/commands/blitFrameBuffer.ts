import { BaseCommand } from "./baseCommand";
import { WebGlConstants } from "../types/webglConstants";

export class BlitFrameBuffer extends BaseCommand {
    public static readonly commandName = "blitFrameBuffer";

    protected get spiedCommandName(): string {
        return BlitFrameBuffer.commandName;
    }

    protected stringifyArgs(args: IArguments): string[] {
        const stringified = [];
        const readFrameBuffer = this.options.context.getParameter(WebGlConstants.READ_FRAMEBUFFER_BINDING.value);
        const readFrameBufferTag = this.options.tagWebGlObject(readFrameBuffer);
        stringified.push("READ FROM: " + this.stringifyValue(readFrameBufferTag));

        const drawFrameBuffer = this.options.context.getParameter(WebGlConstants.DRAW_FRAMEBUFFER_BINDING.value);
        const drawFrameBufferTag = this.options.tagWebGlObject(drawFrameBuffer);
        stringified.push("WRITE TO: " + this.stringifyValue(drawFrameBufferTag));

        for (let i = 0; i < 8; i++) {
            stringified.push(args[i]);
        }

        if ((args[8] & WebGlConstants.DEPTH_BUFFER_BIT.value) === WebGlConstants.DEPTH_BUFFER_BIT.value) {
            stringified.push(WebGlConstants.DEPTH_BUFFER_BIT.name);
        }
        if ((args[8] & WebGlConstants.STENCIL_BUFFER_BIT.value) === WebGlConstants.STENCIL_BUFFER_BIT.value) {
            stringified.push(WebGlConstants.STENCIL_BUFFER_BIT.name);
        }
        if ((args[8] & WebGlConstants.COLOR_BUFFER_BIT.value) === WebGlConstants.COLOR_BUFFER_BIT.value) {
            stringified.push(WebGlConstants.COLOR_BUFFER_BIT.name);
        }

        stringified.push(WebGlConstants.stringifyWebGlConstant(args[9], "blitFrameBuffer"));

        return stringified;
    }
}
