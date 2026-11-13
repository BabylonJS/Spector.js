import { BaseRecorder } from "./baseRecorder";
import { WebGlConstants } from "../types/webglConstants";
import { IFunctionInformation } from "../types/functionInformation";
import { WebGlObjects } from "../webGlObjects/baseWebGlObject";
import { ICapture } from "../../shared/capture/capture";
import { Base64 } from "../utils/base64";

export interface IBufferRecorderData {
    target: string;
    usage: number;
    length: number;
    offset?: number;
    sourceLength?: number;
}

interface ICapturedBuffer {
    /** Truncated to {@link BufferRecorder.cap} when the buffer is larger. */
    bytes: Uint8Array;
    /** Total length even when truncated. */
    byteLength: number;
    usage?: number;
}

export class BufferRecorder extends BaseRecorder<WebGLBuffer> {
    public static cap: number = 4 * 1024 * 1024;

    private capturedBuffers: { [id: number]: ICapturedBuffer } = {};

    protected get objectName(): string {
        return "Buffer";
    }

    protected getCreateCommandNames(): string[] {
        return ["createBuffer"];
    }

    protected getUpdateCommandNames(): string[] {
        return ["bufferData", "bufferSubData"];
    }

    protected getDeleteCommandNames(): string[] {
        return ["deleteBuffer"];
    }

    public startCapture(): void {
        super.startCapture();
        this.capturedBuffers = {};
    }

    public appendRecordedInformation(capture: ICapture): void {
        super.appendRecordedInformation(capture);

        const ids = Object.keys(this.capturedBuffers);
        if (ids.length === 0) {
            return;
        }

        capture.buffers = capture.buffers || {};
        for (const key of ids) {
            const id = Number(key);
            const captured = this.capturedBuffers[id];
            capture.buffers[id] = {
                data: Base64.encode(captured.bytes),
                byteLength: captured.byteLength,
                capped: captured.byteLength > captured.bytes.length,
                usage: captured.usage === undefined ? undefined : this.getWebGlConstant(captured.usage),
            };
        }
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
        const id = this.getInstanceId(instance);
        if (id !== undefined) {
            delete this.capturedBuffers[id];
        }

        const customData = (instance as any).__SPECTOR_Object_CustomData;
        if (!customData) {
            return 0;
        }

        return customData.length;
    }

    protected update(functionInformation: IFunctionInformation, target: string, instance: WebGLBuffer): number {
        const id = this.getInstanceId(instance);

        if (functionInformation.name === "bufferSubData") {
            if (this.capturing && id !== undefined) {
                this.captureBufferSubData(id, functionInformation);
            }
            return 0;
        }

        const customData = this.getCustomData(target, functionInformation);
        if (!customData) {
            return 0;
        }

        const previousLength = (instance as any).__SPECTOR_Object_CustomData ? (instance as any).__SPECTOR_Object_CustomData.length : 0;
        (instance as any).__SPECTOR_Object_CustomData = customData;

        if (this.capturing && id !== undefined) {
            this.captureBufferData(id, functionInformation, customData.usage);
        }

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

    /** Snapshot the bytes uploaded by a bufferData call. */
    private captureBufferData(id: number, functionInformation: IFunctionInformation, usage: number): void {
        const sizeOrData = functionInformation.arguments[1];

        // bufferData(target, size, usage): storage is allocated zero-filled and only filled
        // later by bufferSubData, so seed a zero buffer that those writes can splice into.
        if (typeof sizeOrData === "number") {
            const byteLength = sizeOrData;
            this.capturedBuffers[id] = {
                bytes: new Uint8Array(Math.min(byteLength, BufferRecorder.cap)),
                byteLength,
                usage,
            };
            return;
        }

        const source = this.extractSourceBytes(sizeOrData, functionInformation.arguments[3], functionInformation.arguments[4]);
        this.capturedBuffers[id] = {
            bytes: source.slice(0, Math.min(source.length, BufferRecorder.cap)),
            byteLength: source.length,
            usage,
        };
    }

    /** Merge the bytes written by a bufferSubData call into the stored copy. */
    private captureBufferSubData(id: number, functionInformation: IFunctionInformation): void {
        const dstByteOffset = functionInformation.arguments[1] as number;
        const source = functionInformation.arguments[2];
        if (!source || typeof source === "number") {
            return;
        }

        const bytes = this.extractSourceBytes(source, functionInformation.arguments[3], functionInformation.arguments[4]);
        const writeEnd = dstByteOffset + bytes.length;

        let captured = this.capturedBuffers[id];
        if (!captured) {
            captured = {
                bytes: new Uint8Array(Math.min(writeEnd, BufferRecorder.cap)),
                byteLength: writeEnd,
            };
            this.capturedBuffers[id] = captured;
        }
        else if (writeEnd > captured.byteLength) {
            captured.byteLength = writeEnd;
        }

        // Splice into the stored window.
        const capLimit = captured.bytes.length;
        for (let i = 0; i < bytes.length; i++) {
            const destination = dstByteOffset + i;
            if (destination >= capLimit) {
                break;
            }
            captured.bytes[destination] = bytes[i];
        }
    }

    private extractSourceBytes(source: ArrayBuffer | ArrayBufferView, srcOffset: number, length: number): Uint8Array {
        let bytes: Uint8Array;
        if (source instanceof ArrayBuffer) {
            bytes = new Uint8Array(source);
        }
        else {
            const view = source as ArrayBufferView;
            bytes = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
        }

        // srcOffset/length are counted in the source view's elements, not bytes.
        const bytesPerElement = (source as any).BYTES_PER_ELEMENT || 1;
        if (typeof srcOffset === "number" && srcOffset > 0) {
            bytes = bytes.subarray(srcOffset * bytesPerElement);
        }
        if (typeof length === "number" && length > 0) {
            bytes = bytes.subarray(0, length * bytesPerElement);
        }
        return bytes;
    }

    private getInstanceId(instance: WebGLBuffer): number {
        const tag = WebGlObjects.getWebGlObjectTag(instance);
        return tag ? tag.id : undefined;
    }
}
