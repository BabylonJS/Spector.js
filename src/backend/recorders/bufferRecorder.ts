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
        const sizeOrData = functionInformation.arguments[1];
        const offset = functionInformation.arguments[3];
        const length = functionInformation.arguments[4];

        // bufferData(target, size, usage)
        if (typeof sizeOrData === 'number') {
            return sizeOrData;
        }

        // bufferData(target, srcData, usage, srcOffset, length)
        if (typeof length === 'number' && length > 0) {
            return length;
        }

        const dataLength = sizeOrData.byteLength || sizeOrData.length || 0;

        // bufferData(target, srcData, usage, srcOffset)
        if (typeof offset === 'number' && offset > 0) {
            return dataLength - offset;
        }
        // bufferData(target, srcData, usage)
        else {
            return dataLength;
        }
    }
}
