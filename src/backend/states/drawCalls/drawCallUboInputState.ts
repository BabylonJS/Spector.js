import { WebGlConstants } from "../../types/webglConstants";
import { IContextInformation } from "../../types/contextInformation";

interface IWebGLUniformTypesInfo {
    arrayBufferView: any;
    lengthMultiplier: number;
}

export class DrawCallUboInputState {
    private static uboTypes: { [type: number]: IWebGLUniformTypesInfo } = {
        [WebGlConstants.BOOL.value]: { arrayBufferView: Uint8Array, lengthMultiplier: 1 },
        [WebGlConstants.BOOL_VEC2.value]: { arrayBufferView: Uint8Array, lengthMultiplier: 2 },
        [WebGlConstants.BOOL_VEC3.value]: { arrayBufferView: Uint8Array, lengthMultiplier: 3 },
        [WebGlConstants.BOOL_VEC4.value]: { arrayBufferView: Uint8Array, lengthMultiplier: 4 },

        [WebGlConstants.INT.value]: { arrayBufferView: Int32Array, lengthMultiplier: 1 },
        [WebGlConstants.INT_VEC2.value]: { arrayBufferView: Int32Array, lengthMultiplier: 2 },
        [WebGlConstants.INT_VEC3.value]: { arrayBufferView: Int32Array, lengthMultiplier: 3 },
        [WebGlConstants.INT_VEC4.value]: { arrayBufferView: Int32Array, lengthMultiplier: 4 },

        [WebGlConstants.UNSIGNED_INT.value]: { arrayBufferView: Uint32Array, lengthMultiplier: 1 },
        [WebGlConstants.UNSIGNED_INT_VEC2.value]: { arrayBufferView: Uint32Array, lengthMultiplier: 2 },
        [WebGlConstants.UNSIGNED_INT_VEC3.value]: { arrayBufferView: Uint32Array, lengthMultiplier: 3 },
        [WebGlConstants.UNSIGNED_INT_VEC4.value]: { arrayBufferView: Uint32Array, lengthMultiplier: 4 },

        [WebGlConstants.FLOAT.value]: { arrayBufferView: Float32Array, lengthMultiplier: 1 },
        [WebGlConstants.FLOAT_VEC2.value]: { arrayBufferView: Float32Array, lengthMultiplier: 2 },
        [WebGlConstants.FLOAT_VEC3.value]: { arrayBufferView: Float32Array, lengthMultiplier: 3 },
        [WebGlConstants.FLOAT_VEC4.value]: { arrayBufferView: Float32Array, lengthMultiplier: 4 },
        [WebGlConstants.FLOAT_MAT2.value]: { arrayBufferView: Float32Array, lengthMultiplier: 4 },
        [WebGlConstants.FLOAT_MAT2x3.value]: { arrayBufferView: Float32Array, lengthMultiplier: 6 },
        [WebGlConstants.FLOAT_MAT2x4.value]: { arrayBufferView: Float32Array, lengthMultiplier: 8 },
        [WebGlConstants.FLOAT_MAT3.value]: { arrayBufferView: Float32Array, lengthMultiplier: 9 },
        [WebGlConstants.FLOAT_MAT3x2.value]: { arrayBufferView: Float32Array, lengthMultiplier: 6 },
        [WebGlConstants.FLOAT_MAT3x4.value]: { arrayBufferView: Float32Array, lengthMultiplier: 12 },
        [WebGlConstants.FLOAT_MAT4.value]: { arrayBufferView: Float32Array, lengthMultiplier: 16 },
        [WebGlConstants.FLOAT_MAT4x2.value]: { arrayBufferView: Float32Array, lengthMultiplier: 8 },
        [WebGlConstants.FLOAT_MAT4x3.value]: { arrayBufferView: Float32Array, lengthMultiplier: 12 },

        [WebGlConstants.SAMPLER_2D.value]: { arrayBufferView: Uint8Array, lengthMultiplier: 1 },
        [WebGlConstants.SAMPLER_CUBE.value]: { arrayBufferView: Uint8Array, lengthMultiplier: 1 },
    };

    private readonly context: WebGLRenderingContext;

    constructor(options: IContextInformation) {
        this.context = options.context;
    }

    public getUboValue(bindingPoint: number, offset: number, size: number, type: number): any {
        const uboType = DrawCallUboInputState.uboTypes[type];
        if (!uboType) {
            return undefined;
        }
        const destination = new uboType.arrayBufferView(size * uboType.lengthMultiplier);

        const context2 = this.context as WebGL2RenderingContext;
        const ownerbuffer = context2.getIndexedParameter(WebGlConstants.UNIFORM_BUFFER_BINDING.value, bindingPoint);
        if (ownerbuffer) {
            const startOffset = context2.getIndexedParameter(WebGlConstants.UNIFORM_BUFFER_START.value, bindingPoint);
            const boundBuffer = context2.getParameter(WebGlConstants.UNIFORM_BUFFER_BINDING.value);
            try {
                context2.bindBuffer(WebGlConstants.UNIFORM_BUFFER.value, ownerbuffer);
                context2.getBufferSubData(WebGlConstants.UNIFORM_BUFFER.value, startOffset + offset, destination);
            }
            catch (e) {
                // Prevent back fromats to break the capture.
                return undefined;
            }
            if (boundBuffer) {
                context2.bindBuffer(WebGlConstants.UNIFORM_BUFFER.value, boundBuffer);
            }
        }

        return Array.prototype.slice.call(destination);
    }
}
