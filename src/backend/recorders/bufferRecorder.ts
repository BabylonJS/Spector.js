import { BaseRecorder } from "./baseRecorder";
import { WebGlConstants } from "../types/webglConstants";
import { IFunctionInformation } from "../types/functionInformation";

export interface IBufferRecorderData {
    target: string;
    usage: number;
    length: number;
    offset?: number;
    sourceLength?: number;
}

export class BufferRecorder extends BaseRecorder<WebGLBuffer> {
    protected get objectName(): string {
        return "Buffer";
    }

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

    protected delete(instance: WebGLBuffer): number {
        const customData = (instance as any).__SPECTOR_Object_CustomData;
        if (!customData) {
            return 0;
        }

        return customData.length;
    }

    protected update(functionInformation: IFunctionInformation, target: string, instance: WebGLBuffer): number {
        const customData = this.getCustomData(target, functionInformation);
        if (!customData) {
            return 0;
        }

        const previousLength = (instance as any).__SPECTOR_Object_CustomData ? (instance as any).__SPECTOR_Object_CustomData.length : 0;
        (instance as any).__SPECTOR_Object_CustomData = customData;
        return customData.length - previousLength;
    }

    protected getCustomData(target: string, functionInformation: IFunctionInformation): IBufferRecorderData {
        const length = this.getLength(functionInformation);
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

    protected getLength(functionInformation: IFunctionInformation): number {
        /* tslint:disable */
        let length = -1;
        let offset = 0;
        if (functionInformation.arguments.length === 5) {
            length = functionInformation.arguments[4];
            offset = functionInformation.arguments[3];
        }

        if (length <= 0) {
            if (typeof functionInformation.arguments[1] === "number") {
                length = functionInformation.arguments[1];
            }
            else if (functionInformation.arguments[1]) {
                length = functionInformation.arguments[1].byteLength || functionInformation.arguments[1].length || 0;
            }
            else {
                length = 0;
            }
        }

        return length - offset;
    }
}
