import { BaseRecorder } from "./baseRecorder";

import { IFunctionInformation } from "../types/functionInformation";
import { ReadProgramHelper } from "../utils/readProgramHelper";
import { IProgramCapture } from "../../shared/capture/programCapture";

export class ProgramRecorder extends BaseRecorder<WebGLProgram> {
    protected get objectName(): string {
        return "Program";
    }

    protected getCreateCommandNames(): string[] {
        return ["createProgram"];
    }

    protected getUpdateCommandNames(): string[] {
        return ["linkProgram"];
    }

    protected getDeleteCommandNames(): string[] {
        return ["deleteProgram"];
    }

    protected getBoundInstance(target: WebGLProgram): WebGLProgram {
        return target;
    }

    protected delete(instance: WebGLProgram): number {
        const customData = (instance as any).__SPECTOR_Object_CustomData;
        if (!customData) {
            return 0;
        }

        return customData.length;
    }

    protected update(functionInformation: IFunctionInformation, target: WebGLProgram, instance: WebGLProgram): number {
        if (functionInformation.arguments.length >= 1 && !functionInformation.arguments[0]) {
            return 0;
        }

        const customData = this.getCustomData(instance);
        if (!customData) {
            return 0;
        }

        const previousLength = (instance as any).__SPECTOR_Object_CustomData ? (instance as any).__SPECTOR_Object_CustomData.length : 0;
        (instance as any).__SPECTOR_Object_CustomData = customData;
        return customData.length - previousLength;
    }

    private getCustomData(program: WebGLProgram): IProgramCapture {
        const context = this.options.context;
        const programCapture = ReadProgramHelper.getProgramData(context, program);
        return programCapture;
    }
}
