import { IContextInformation } from "../types/contextInformation";
import { Time } from "../../shared/utils/time";
import { WebGlConstants, WebGlConstantsByValue } from "../types/webglConstants";
import { FunctionCallbacks, IFunctionInformation } from "../types/functionInformation";
import { ICapture } from "../../shared/capture/capture";
import { WebGlObjects } from "../webGlObjects/baseWebGlObject";

export interface IRecorder {
    registerCallbacks(onFunctionCallbacks: FunctionCallbacks): void;
    startCapture(): void;
    stopCapture(): void;
    appendRecordedInformation(capture: ICapture): void;
}

export abstract class BaseRecorder<T extends WebGLObject> implements IRecorder {
    protected static byteSizePerInternalFormat: { [fromat: number]: number };

    protected static initializeByteSizeFormat(): void {
        if (this.byteSizePerInternalFormat) {
            return;
        }

        this.byteSizePerInternalFormat = {
            [WebGlConstants.R8.value]: 1,
            [WebGlConstants.R16F.value]: 2,
            [WebGlConstants.R32F.value]: 4,
            [WebGlConstants.R8UI.value]: 1,
            [WebGlConstants.RG8.value]: 2,
            [WebGlConstants.RG16F.value]: 4,
            [WebGlConstants.RG32F.value]: 8,
            [WebGlConstants.ALPHA.value]: 1,
            [WebGlConstants.RGB.value]: 3,
            [WebGlConstants.RGBA.value]: 4,
            [WebGlConstants.LUMINANCE.value]: 1,
            [WebGlConstants.LUMINANCE_ALPHA.value]: 2,
            [WebGlConstants.DEPTH_COMPONENT.value]: 1,
            [WebGlConstants.DEPTH_STENCIL.value]: 2,
            [WebGlConstants.SRGB_EXT.value]: 3,
            [WebGlConstants.SRGB_ALPHA_EXT.value]: 4,
            // [WebGlConstants.RGUI.value]: 2,
            [WebGlConstants.RGB8.value]: 3,
            [WebGlConstants.SRGB8.value]: 3,
            [WebGlConstants.RGB565.value]: 2,
            [WebGlConstants.R11F_G11F_B10F.value]: 4,
            [WebGlConstants.RGB9_E5.value]: 2,
            [WebGlConstants.RGB16F.value]: 6,
            [WebGlConstants.RGB32F.value]: 12,
            [WebGlConstants.RGB8UI.value]: 3,
            [WebGlConstants.RGBA8.value]: 4,
            // [WebGlConstants.SRGB_APLHA8.value]: 4,
            [WebGlConstants.RGB5_A1.value]: 2,
            // [WebGlConstants.RGBA4444.value]: 2,
            [WebGlConstants.RGBA16F.value]: 8,
            [WebGlConstants.RGBA32F.value]: 16,
            [WebGlConstants.RGBA8UI.value]: 4,
            [WebGlConstants.COMPRESSED_R11_EAC.value]: 4,
            [WebGlConstants.COMPRESSED_SIGNED_R11_EAC.value]: 4,
            [WebGlConstants.COMPRESSED_RG11_EAC.value]: 4,
            [WebGlConstants.COMPRESSED_SIGNED_RG11_EAC.value]: 4,
            [WebGlConstants.COMPRESSED_RGB8_ETC2.value]: 4,
            [WebGlConstants.COMPRESSED_RGBA8_ETC2_EAC.value]: 4,
            [WebGlConstants.COMPRESSED_SRGB8_ETC2.value]: 4,
            [WebGlConstants.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC.value]: 4,
            [WebGlConstants.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2.value]: 4,
            [WebGlConstants.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2.value]: 4,
            [WebGlConstants.COMPRESSED_RGB_S3TC_DXT1_EXT.value]: 0.5,
            [WebGlConstants.COMPRESSED_RGBA_S3TC_DXT3_EXT.value]: 1,
            [WebGlConstants.COMPRESSED_RGBA_S3TC_DXT5_EXT.value]: 1,
            [WebGlConstants.COMPRESSED_RGB_PVRTC_4BPPV1_IMG.value]: 0.5,
            [WebGlConstants.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG.value]: 0.5,
            [WebGlConstants.COMPRESSED_RGB_PVRTC_2BPPV1_IMG.value]: 0.25,
            [WebGlConstants.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG.value]: 0.25,
            [WebGlConstants.COMPRESSED_RGB_ETC1_WEBGL.value]: 0.5,
            [WebGlConstants.COMPRESSED_RGB_ATC_WEBGL.value]: 0.5,
            [WebGlConstants.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL.value]: 1,
            [WebGlConstants.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL.value]: 1,
        };
    }

    protected abstract readonly objectName: string;

    protected readonly createCommandNames: string[];
    protected readonly updateCommandNames: string[];
    protected readonly deleteCommandNames: string[];
    protected readonly startTime: number;
    protected readonly memoryPerSecond: { [second: number]: number };

    private totalMemory: number;
    private frameMemory: number;
    private capturing: boolean;

    constructor(protected readonly options: IContextInformation) {
        this.createCommandNames = this.getCreateCommandNames();
        this.updateCommandNames = this.getUpdateCommandNames();
        this.deleteCommandNames = this.getDeleteCommandNames();
        this.startTime = Time.now;
        this.memoryPerSecond = {};
        this.totalMemory = 0;
        this.frameMemory = 0;
        this.capturing = false;
        BaseRecorder.initializeByteSizeFormat();
    }

    public registerCallbacks(onFunctionCallbacks: FunctionCallbacks): void {
        for (const command of this.createCommandNames) {
            onFunctionCallbacks[command] = onFunctionCallbacks[command] || [];
            onFunctionCallbacks[command].push(this.createWithoutSideEffects.bind(this));
        }

        for (const command of this.updateCommandNames) {
            onFunctionCallbacks[command] = onFunctionCallbacks[command] || [];
            onFunctionCallbacks[command].push(this.updateWithoutSideEffects.bind(this));
        }

        for (const command of this.deleteCommandNames) {
            onFunctionCallbacks[command] = onFunctionCallbacks[command] || [];
            onFunctionCallbacks[command].push(this.deleteWithoutSideEffects.bind(this));
        }
    }

    public startCapture(): void {
        this.frameMemory = 0;
        this.capturing = true;
    }

    public stopCapture(): void {
        this.frameMemory = 0;
        this.capturing = false;
    }

    public appendRecordedInformation(capture: ICapture): void {
        capture.frameMemory[this.objectName] = this.frameMemory;
        capture.memory[this.objectName] = this.memoryPerSecond;
    }

    protected abstract getCreateCommandNames(): string[];
    protected abstract getUpdateCommandNames(): string[];
    protected abstract getDeleteCommandNames(): string[];
    protected abstract getBoundInstance(target: number): T;
    protected abstract update(functionInformation: IFunctionInformation, target: string, instance: T): number;
    protected abstract delete(instance: T): number;

    protected create(functionInformation: IFunctionInformation): void {
        // Nothing tracked currently on create.
    }

    protected createWithoutSideEffects(functionInformation: IFunctionInformation): void {
        this.options.toggleCapture(false);
        this.create(functionInformation);
        this.options.toggleCapture(true);
    }

    protected updateWithoutSideEffects(functionInformation: IFunctionInformation): void {
        if (!functionInformation || functionInformation.arguments.length === 0) {
            return;
        }

        this.options.toggleCapture(false);
        const target = functionInformation.arguments[0];
        const instance = this.getBoundInstance(target);
        if (!instance) {
            this.options.toggleCapture(true);
            return;
        }

        const tag = WebGlObjects.getWebGlObjectTag(instance);
        if (!tag) {
            this.options.toggleCapture(true);
            return;
        }

        const targetString = this.getWebGlConstant(target);
        const size = this.update(functionInformation, targetString, instance);
        this.changeMemorySize(size);
        this.options.toggleCapture(true);
    }

    protected deleteWithoutSideEffects(functionInformation: IFunctionInformation): void {
        if (!functionInformation || !functionInformation.arguments || functionInformation.arguments.length < 1) {
            return;
        }

        const instance = functionInformation.arguments[0] as T;
        if (!instance) {
            return;
        }

        this.options.toggleCapture(false);
        const size = this.delete(instance);
        this.changeMemorySize(-size);
        this.options.toggleCapture(true);
    }

    protected changeMemorySize(size: number) {
        this.totalMemory += size;
        if (this.capturing) {
            this.frameMemory += size;
        }
        const timeInMilliseconds = Time.now - this.startTime;
        const timeInSeconds = Math.round(timeInMilliseconds / 1000);
        this.memoryPerSecond[timeInSeconds] = this.totalMemory;
    }

    protected getWebGlConstant(value: number): string {
        const constant = WebGlConstantsByValue[value];
        return constant ? constant.name : value + "";
    }

    protected getByteSizeForInternalFormat(internalFormat: number) {
        const bytesPerElements = BaseRecorder.byteSizePerInternalFormat[internalFormat];
        return bytesPerElements || 4;
    }
}
