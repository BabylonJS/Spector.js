import { ParameterState, IParameter, ParameterReturnType } from "../parameterState";
import { WebGlConstants } from "../../types/webglConstants";
import { IContextInformation } from "../../types/contextInformation";

export class Capabilities extends ParameterState {
    public get stateName(): string {
        return "Capabilities";
    }

    constructor(options: IContextInformation) {
        super(options);

        this.currentState = this.startCapture(true, this.quickCapture, this.fullCapture);
    }

    protected getWebgl1Parameters(): IParameter[] {
        return [{ constant: WebGlConstants.RENDERER },
        { constant: WebGlConstants.VENDOR },
        { constant: WebGlConstants.VERSION },
        { constant: WebGlConstants.SHADING_LANGUAGE_VERSION },
        { constant: WebGlConstants.SAMPLES },
        { constant: WebGlConstants.SAMPLE_BUFFERS },
        { constant: WebGlConstants.RED_BITS },
        { constant: WebGlConstants.GREEN_BITS },
        { constant: WebGlConstants.BLUE_BITS },
        { constant: WebGlConstants.ALPHA_BITS },
        { constant: WebGlConstants.DEPTH_BITS },
        { constant: WebGlConstants.STENCIL_BITS },
        { constant: WebGlConstants.SUBPIXEL_BITS },
        { constant: WebGlConstants.LINE_WIDTH },
        { constant: WebGlConstants.ALIASED_LINE_WIDTH_RANGE },
        { constant: WebGlConstants.ALIASED_POINT_SIZE_RANGE },
        { constant: WebGlConstants.IMPLEMENTATION_COLOR_READ_FORMAT, returnType: ParameterReturnType.GlEnum },
        { constant: WebGlConstants.IMPLEMENTATION_COLOR_READ_TYPE, returnType: ParameterReturnType.GlEnum },
        // { constant: WebGlConstants.UNIFORM_BUFFER_OFFSET_ALIGNMENT },

        { constant: WebGlConstants.MAX_COMBINED_TEXTURE_IMAGE_UNITS },
        { constant: WebGlConstants.MAX_CUBE_MAP_TEXTURE_SIZE },
        { constant: WebGlConstants.MAX_FRAGMENT_UNIFORM_VECTORS },
        { constant: WebGlConstants.MAX_RENDERBUFFER_SIZE },
        { constant: WebGlConstants.MAX_TEXTURE_IMAGE_UNITS },
        { constant: WebGlConstants.MAX_TEXTURE_SIZE },
        { constant: WebGlConstants.MAX_VARYING_VECTORS },
        { constant: WebGlConstants.MAX_VERTEX_ATTRIBS },
        { constant: WebGlConstants.MAX_VERTEX_TEXTURE_IMAGE_UNITS },
        { constant: WebGlConstants.MAX_VERTEX_UNIFORM_VECTORS },
        { constant: WebGlConstants.MAX_VIEWPORT_DIMS },
        { constant: WebGlConstants.MAX_TEXTURE_MAX_ANISOTROPY_EXT },
        { constant: WebGlConstants.MAX_COLOR_ATTACHMENTS_WEBGL },
        { constant: WebGlConstants.MAX_DRAW_BUFFERS_WEBGL }];
    }

    protected getWebgl2Parameters(): IParameter[] {
        return [{ constant: WebGlConstants.MAX_3D_TEXTURE_SIZE },
        { constant: WebGlConstants.MAX_ARRAY_TEXTURE_LAYERS },
        { constant: WebGlConstants.MAX_CLIENT_WAIT_TIMEOUT_WEBGL },
        { constant: WebGlConstants.MAX_COLOR_ATTACHMENTS },
        { constant: WebGlConstants.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS },
        { constant: WebGlConstants.MAX_COMBINED_UNIFORM_BLOCKS },
        { constant: WebGlConstants.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS },
        { constant: WebGlConstants.MAX_DRAW_BUFFERS },
        { constant: WebGlConstants.MAX_ELEMENT_INDEX },
        { constant: WebGlConstants.MAX_ELEMENTS_INDICES },
        { constant: WebGlConstants.MAX_ELEMENTS_VERTICES },
        { constant: WebGlConstants.MAX_FRAGMENT_INPUT_COMPONENTS },
        { constant: WebGlConstants.MAX_FRAGMENT_UNIFORM_BLOCKS },
        { constant: WebGlConstants.MAX_FRAGMENT_UNIFORM_COMPONENTS },
        { constant: WebGlConstants.MAX_PROGRAM_TEXEL_OFFSET },
        { constant: WebGlConstants.MAX_SAMPLES },
        { constant: WebGlConstants.MAX_SERVER_WAIT_TIMEOUT },
        { constant: WebGlConstants.MAX_TEXTURE_LOD_BIAS },
        { constant: WebGlConstants.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS },
        { constant: WebGlConstants.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS },
        { constant: WebGlConstants.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS },
        { constant: WebGlConstants.MAX_UNIFORM_BLOCK_SIZE },
        { constant: WebGlConstants.MAX_UNIFORM_BUFFER_BINDINGS },
        { constant: WebGlConstants.MAX_VARYING_COMPONENTS },
        { constant: WebGlConstants.MAX_VERTEX_OUTPUT_COMPONENTS },
        { constant: WebGlConstants.MAX_VERTEX_UNIFORM_BLOCKS },
        { constant: WebGlConstants.MAX_VERTEX_UNIFORM_COMPONENTS },
        { constant: WebGlConstants.MIN_PROGRAM_TEXEL_OFFSET }];
    }
}
