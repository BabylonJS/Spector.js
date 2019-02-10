import { BaseRecorder } from "./baseRecorder";
import { WebGlConstants } from "../types/webglConstants";
import { IFunctionInformation } from "../types/functionInformation";

export interface IRenderBufferRecorderData {
    target: string;
    internalFormat: number;
    width: number;
    height: number;
    length: number;
    samples: number;
}

export class RenderBufferRecorder extends BaseRecorder<WebGLRenderbuffer> {
    protected get objectName(): string {
        return "Renderbuffer";
    }

    protected getCreateCommandNames(): string[] {
        return ["createRenderbuffer"];
    }

    protected getUpdateCommandNames(): string[] {
        return ["renderbufferStorage", "renderbufferStorageMultisample"];
    }

    protected getDeleteCommandNames(): string[] {
        return ["deleteRenderbuffer"];
    }

    protected getBoundInstance(target: number): WebGLTexture {
        const gl = this.options.context;
        if (target === WebGlConstants.RENDERBUFFER.value) {
            return gl.getParameter(WebGlConstants.RENDERBUFFER_BINDING.value);
        }
        return undefined;
    }

    protected delete(instance: WebGLRenderbuffer): number {
        const customData = (instance as any).__SPECTOR_Object_CustomData;
        if (!customData) {
            return 0;
        }

        return customData.length;
    }

    protected update(functionInformation: IFunctionInformation, target: string, instance: WebGLRenderbuffer): number {
        const customData = this.getCustomData(functionInformation, target);
        if (!customData) {
            return 0;
        }

        const previousLength = (instance as any).__SPECTOR_Object_CustomData ? (instance as any).__SPECTOR_Object_CustomData.length : 0;
        customData.length = customData.width * customData.height * this.getByteSizeForInternalFormat(customData.internalFormat);
        (instance as any).__SPECTOR_Object_CustomData = customData;
        return customData.length - previousLength;
    }

    protected getCustomData(functionInformation: IFunctionInformation, target: string): IRenderBufferRecorderData {
        // renderbufferStorage
        if (functionInformation.arguments.length === 4) {
            return {
                target,
                internalFormat: functionInformation.arguments[1],
                width: functionInformation.arguments[2],
                height: functionInformation.arguments[3],
                length: 0,
                samples: 0,
            };
        }

        return {
            target,
            internalFormat: functionInformation.arguments[2],
            width: functionInformation.arguments[3],
            height: functionInformation.arguments[4],
            length: 0,
            samples: functionInformation.arguments[1],
        };
    }
}
