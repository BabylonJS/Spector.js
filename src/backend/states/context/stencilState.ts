import { ParameterState, IParameter, ParameterReturnType } from "../parameterState";
import { WebGlConstants } from "../../types/webglConstants";
import { ICommandCapture } from "../../../shared/capture/commandCapture";
import { drawCommands } from "../../utils/drawCommands";

export class StencilState extends ParameterState {
    public static readonly stateName = "StencilState";

    public get stateName(): string {
        return StencilState.stateName;
    }

    private static stencilOpStates = [WebGlConstants.STENCIL_BACK_FAIL.value,
    WebGlConstants.STENCIL_BACK_PASS_DEPTH_FAIL.value,
    WebGlConstants.STENCIL_BACK_PASS_DEPTH_PASS.value,
    WebGlConstants.STENCIL_FAIL.value,
    WebGlConstants.STENCIL_PASS_DEPTH_FAIL.value,
    WebGlConstants.STENCIL_PASS_DEPTH_PASS.value];

    private static stencilFuncStates = [WebGlConstants.STENCIL_BACK_FUNC.value,
    WebGlConstants.STENCIL_BACK_REF.value,
    WebGlConstants.STENCIL_BACK_VALUE_MASK.value,
    WebGlConstants.STENCIL_FUNC.value,
    WebGlConstants.STENCIL_REF.value,
    WebGlConstants.STENCIL_VALUE_MASK.value];

    private static stencilMaskStates = [WebGlConstants.STENCIL_BACK_WRITEMASK.value,
    WebGlConstants.STENCIL_WRITEMASK.value];

    protected getWebgl1Parameters(): IParameter[] {
        return [{ constant: WebGlConstants.STENCIL_TEST, changeCommands: ["enable", "disable"] },
        { constant: WebGlConstants.STENCIL_BACK_FAIL, returnType: ParameterReturnType.GlEnum, changeCommands: ["stencilOp", "stencilOpSeparate"] },
        { constant: WebGlConstants.STENCIL_BACK_FUNC, returnType: ParameterReturnType.GlEnum, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
        { constant: WebGlConstants.STENCIL_BACK_PASS_DEPTH_FAIL, returnType: ParameterReturnType.GlEnum, changeCommands: ["stencilOp", "stencilOpSeparate"] },
        { constant: WebGlConstants.STENCIL_BACK_PASS_DEPTH_PASS, returnType: ParameterReturnType.GlEnum, changeCommands: ["stencilOp", "stencilOpSeparate"] },
        { constant: WebGlConstants.STENCIL_BACK_REF, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
        { constant: WebGlConstants.STENCIL_BACK_VALUE_MASK, returnType: ParameterReturnType.GlUint, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
        { constant: WebGlConstants.STENCIL_BACK_WRITEMASK, returnType: ParameterReturnType.GlUint, changeCommands: ["stencilMask", "stencilMaskSeparate"] },
        { constant: WebGlConstants.STENCIL_FAIL, returnType: ParameterReturnType.GlEnum, changeCommands: ["stencilOp", "stencilOpSeparate"] },
        { constant: WebGlConstants.STENCIL_FUNC, returnType: ParameterReturnType.GlEnum, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
        { constant: WebGlConstants.STENCIL_PASS_DEPTH_FAIL, returnType: ParameterReturnType.GlEnum, changeCommands: ["stencilOp", "stencilOpSeparate"] },
        { constant: WebGlConstants.STENCIL_PASS_DEPTH_PASS, returnType: ParameterReturnType.GlEnum, changeCommands: ["stencilOp", "stencilOpSeparate"] },
        { constant: WebGlConstants.STENCIL_REF, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
        { constant: WebGlConstants.STENCIL_VALUE_MASK, returnType: ParameterReturnType.GlUint, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
        { constant: WebGlConstants.STENCIL_WRITEMASK, returnType: ParameterReturnType.GlUint, changeCommands: ["stencilMask", "stencilMaskSeparate"] }];
    }

    protected readFromContext(): void {
        super.readFromContext();

        const gl = this.context;
        const target = WebGlConstants.FRAMEBUFFER.value;
        const attachment = WebGlConstants.STENCIL_ATTACHMENT.value;
        const frameBuffer = gl.getParameter(WebGlConstants.FRAMEBUFFER_BINDING.value);

        let value = 0;
        if (!frameBuffer) {
            value = this.readParameterFromContext({ constant: WebGlConstants.STENCIL_BITS });
        }
        else {
            const type = this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE.value);
            if (type !== WebGlConstants.NONE.value) {
                if (this.contextVersion > 1) {
                    value = this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE.value);
                }
                else {
                    const storage = this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME.value);
                    if (storage === WebGlConstants.RENDERBUFFER.value) {
                        value = gl.getRenderbufferParameter(gl.RENDERBUFFER, gl.RENDERBUFFER_STENCIL_SIZE);
                    }
                }
            }
        }

        this.currentState[WebGlConstants.STENCIL_BITS.name] = "" + value;
    }

    protected isValidChangeCommand(command: ICommandCapture, stateName: string): boolean {
        if (command.name === "enable" || command.name === "disable") {
            return command.commandArguments[0] === WebGlConstants.STENCIL_TEST.value;
        }
        if (command.name === "stencilOp" || command.name === "stencilOpSeparate") {
            return StencilState.stencilOpStates.indexOf(command.commandArguments[0]) > 0;
        }
        if (command.name === "stencilFunc" || command.name === "stencilFuncSeparate") {
            return StencilState.stencilFuncStates.indexOf(command.commandArguments[0]) > 0;
        }
        if (command.name === "stencilMask" || command.name === "stencilMaskSeparate") {
            return StencilState.stencilMaskStates.indexOf(command.commandArguments[0]) > 0;
        }

        return true;
    }

    protected getConsumeCommands(): string[] {
        return drawCommands;
    }

    protected isStateEnable(stateName: string, args: IArguments): boolean {
        return this.context.isEnabled(WebGlConstants.STENCIL_TEST.value);
    }
}
