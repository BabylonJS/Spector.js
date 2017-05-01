namespace SPECTOR.States.Information {
    export class CompressedTextures extends ParameterState {

        constructor(options: IStateOptions, logger: ILogger) {
            super(options, logger);

            this.currentState = this.startCapture();
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
}
