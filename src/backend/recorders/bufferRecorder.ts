namespace SPECTOR {
    export interface IBufferRecorderData {
        target: string;
        usage: number;
        length: number;
        offset?: number;
        sourceLength?: number;
    }
}
namespace SPECTOR.Recorders {
    @Decorators.recorder("WebGLBuffer")
    export class BufferRecorder extends BaseRecorder<WebGLBuffer> {
        protected getCreateCommandNames(): string[] {
            return ["createBuffer"];
        }

        protected getUpdateCommandNames(): string[] {
            return ["bufferData"];
        }

        protected getDeleteCommandNames(): string[] {
            return ["deleteBuffer"];
        }

        protected getBoundInstance(target: number): WebGLTexture {
            const gl = this.options.context;
            if (target === WebGlConstants.ARRAY_BUFFER.value) {
                return gl.getParameter(WebGlConstants.ARRAY_BUFFER_BINDING.value);
            }
            else if (target === WebGlConstants.ELEMENT_ARRAY_BUFFER.value) {
                return gl.getParameter(WebGlConstants.ELEMENT_ARRAY_BUFFER_BINDING.value);
            }
            else if (target === WebGlConstants.COPY_READ_BUFFER.value) {
                return gl.getParameter(WebGlConstants.COPY_READ_BUFFER_BINDING.value);
            }
            else if (target === WebGlConstants.COPY_WRITE_BUFFER.value) {
                return gl.getParameter(WebGlConstants.COPY_WRITE_BUFFER_BINDING.value);
            }
            else if (target === WebGlConstants.TRANSFORM_FEEDBACK_BUFFER.value) {
                return gl.getParameter(WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_BINDING.value);
            }
            else if (target === WebGlConstants.UNIFORM_BUFFER.value) {
                return gl.getParameter(WebGlConstants.UNIFORM_BUFFER_BINDING.value);
            }
            else if (target === WebGlConstants.PIXEL_PACK_BUFFER.value) {
                return gl.getParameter(WebGlConstants.PIXEL_PACK_BUFFER_BINDING.value);
            }
            else if (target === WebGlConstants.PIXEL_UNPACK_BUFFER.value) {
                return gl.getParameter(WebGlConstants.PIXEL_UNPACK_BUFFER_BINDING.value);
            }
            return undefined;
        }

        protected update(functionInformation: IFunctionInformation, target: string, instance: WebGLBuffer): void {
            if (!instance) {
                return;
            }

            const tag = WebGlObjects.getWebGlObjectTag(instance);
            if (!tag) {
                return;
            }

            const length = this.getLength(functionInformation);
            const customData = this.getCustomData(target, length, functionInformation);
            if (customData) {
                (instance as any).__SPECTOR_Object_CustomData = customData;
            }
        }

        protected getLength(functionInformation: IFunctionInformation): number {
            let length = -1;
            if (functionInformation.arguments.length === 5) {
                length = functionInformation.arguments[4];
            }

            if (length <= 0) {
                if (typeof functionInformation.arguments[1] === "number") {
                    length = functionInformation.arguments[1];
                }
                else if (functionInformation.arguments[1]) {
                    length = functionInformation.arguments[1].length;
                }
            }
            return length;
        }

        protected getCustomData(target: string, length: number, functionInformation: IFunctionInformation): IBufferRecorderData {
            if (functionInformation.arguments.length >= 4) {
                return {
                    target,
                    length,
                    usage: functionInformation.arguments[2],
                    offset: functionInformation.arguments[3],
                    sourceLength: functionInformation.arguments[1] ? functionInformation.arguments[1].length : -1,
                };
            }

            if (functionInformation.arguments.length === 3) {
                return {
                    target,
                    length,
                    usage: functionInformation.arguments[2],
                };
            }

            return undefined;
        }
    }
}
