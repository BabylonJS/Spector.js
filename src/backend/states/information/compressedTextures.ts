import { ParameterState, IParameter } from "../parameterState";
import { WebGlConstants } from "../../types/webglConstants";
import { IContextInformation } from "../../types/contextInformation";

export class CompressedTextures extends ParameterState {
    public get stateName(): string {
        return "CompressedTextures";
    }

    constructor(options: IContextInformation) {
        super(options);

        this.currentState = this.startCapture(true, this.quickCapture, this.fullCapture);
    }

    protected getWebgl1Parameters(): IParameter[] {
        return [{ constant: WebGlConstants.COMPRESSED_TEXTURE_FORMATS }];
    }

    protected stringifyParameterValue(value: any, parameter: IParameter): any {
        const formats = [];
        for (const format of value) {
            formats.push(WebGlConstants.stringifyWebGlConstant(format as any, "getParameter"));
        }
        return formats;
    }
}
