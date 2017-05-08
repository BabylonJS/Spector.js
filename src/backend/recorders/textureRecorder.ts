namespace SPECTOR {
    export interface ITextureRecorderData {
        level: number;
        internalFormat: number;
        width: number;
        height: number;
        border?: number;
        format: number;
        type: number;
        visual: any;
    }
}
namespace SPECTOR.Recorders {

    @Decorators.recorder("WebGLTexture")
    export class TextureRecorder extends BaseRecorder<WebGLTexture> {

        private readonly visualState: TextureRecorderVisualState;

        constructor(options: IRecorderOptions, logger: ILogger) {
            super(options, logger);
            this.visualState = new TextureRecorderVisualState(options, logger);
        }

        protected getCreateCommandNames(): string[] {
            return ["createTexture"];
        }

        protected getUpdateCommandNames(): string[] {
            return ["texImage2D"];
        }

        protected getDeleteCommandNames(): string[] {
            return ["deleteTexture"];
        }

        protected getBoundInstance(target: number): WebGLTexture {
            const gl = this.options.context;
            if (target === WebGlConstants.TEXTURE_2D.value) {
                return gl.getParameter(WebGlConstants.TEXTURE_BINDING_2D.value);
            }
            // ToDo. Keep All Faces.
            else if (target === WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_X.value ||
                target === WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_Y.value ||
                target === WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_Z.value ||
                target === WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_X.value ||
                target === WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_Y.value ||
                target === WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_Z.value) {
                return gl.getParameter(WebGlConstants.TEXTURE_BINDING_CUBE_MAP.value);
            }
            else if (target === WebGlConstants.TEXTURE_2D_ARRAY.value) {
                return gl.getParameter(WebGlConstants.TEXTURE_BINDING_2D_ARRAY.value);
            }
            else if (target === WebGlConstants.TEXTURE_3D.value) {
                return gl.getParameter(WebGlConstants.TEXTURE_BINDING_3D.value);
            }
            return undefined;
        }

        protected update(functionInformation: IFunctionInformation, instance: WebGLTexture): void {
            if (!instance) {
                return;
            }

            const tag = WebGlObjects.getWebGlObjectTag(instance);
            if (!tag) {
                return;
            }

            let customData: ITextureRecorderData = null;
            if (functionInformation.name === "texImage2D") {
                if (functionInformation.arguments.length >= 9) {
                    const data = functionInformation.arguments[8];
                    if (!data || !data.width) {
                        // Discard wegl2 offests... so far.
                        return;
                    }

                    if (functionInformation.arguments[1] !== 0) {
                        // Only manage main lod... so far.
                        return;
                    }

                    // Custom data required to display the texture.
                    customData = {
                        level: functionInformation.arguments[1],
                        internalFormat: functionInformation.arguments[2],
                        width: functionInformation.arguments[3],
                        height: functionInformation.arguments[4],
                        border: functionInformation.arguments[5],
                        format: functionInformation.arguments[6],
                        type: functionInformation.arguments[7],
                        visual: functionInformation.arguments[8],
                    };
                }
                else if (functionInformation.arguments.length === 6) {
                    const data = functionInformation.arguments[5];
                    if (!data || !data.width) {
                        // Discard wegl2 offests... so far.
                        return;
                    }

                    if (functionInformation.arguments[1] !== 0) {
                        // Only manage main lod... so far.
                        return;
                    }

                    // Custom data required to display the texture.
                    customData = {
                        level: functionInformation.arguments[1],
                        internalFormat: functionInformation.arguments[2],
                        width: functionInformation.arguments[5].width,
                        height: functionInformation.arguments[5].height,
                        format: functionInformation.arguments[3],
                        type: functionInformation.arguments[4],
                        visual: functionInformation.arguments[5],
                    };
                }
                // else NO DATA.
            }

            if (customData) {
                tag.customData = {
                    visual: this.visualState.getBase64Visual(customData),
                    level: customData.level,
                    width: customData.width,
                    height: customData.height,
                    internalFormat: this.getWebGlConstant(customData.internalFormat),
                    format: this.getWebGlConstant(customData.format),
                    type: this.getWebGlConstant(customData.type),
                };
            }
        }
    }
}
