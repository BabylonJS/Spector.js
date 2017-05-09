namespace SPECTOR {
    export interface ITextureRecorderState {
        level: number;
        internalFormat: string;
        format: string;
        type: string;
        width: number;
        height: number;
        visual: { [target: string]: string };
    }
}
namespace SPECTOR.Recorders {
    export interface ITextureRecorderData {
        target: string;
        level: number;
        internalFormat: number;
        width: number;
        height: number;
        border?: number;
        format: number;
        type: number;
        visual: any;
    }

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
            // TODO. texSubImage2D, compressedTexImage2D, compressedTexSubImage2D, texImage3D, texSubImage3D, compressedTexImage3D, compressedTexSubImage3D
        }

        protected getDeleteCommandNames(): string[] {
            return ["deleteTexture"];
        }

        protected getBoundInstance(target: number): WebGLTexture {
            const gl = this.options.context;
            if (target === WebGlConstants.TEXTURE_2D.value) {
                return gl.getParameter(WebGlConstants.TEXTURE_BINDING_2D.value);
            }
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

        protected update(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): void {
            if (!instance) {
                return;
            }

            const tag = WebGlObjects.getWebGlObjectTag(instance);
            if (!tag) {
                return;
            }

            let customData: ITextureRecorderData = null;
            if (functionInformation.name === "texImage2D") {
                customData = this.getTexImage2DCustomData(functionInformation, target, instance);
            }
            // TODO. texSubImage2D, compressedTexImage2D, compressedTexSubImage2D, texImage3D, texSubImage3D, compressedTexImage3D, compressedTexSubImage3D

            if (customData) {
                tag.customData = tag.customData || {};
                (tag.customData as ITextureRecorderState).level = customData.level;
                (tag.customData as ITextureRecorderState).type = this.getWebGlConstant(customData.type);
                (tag.customData as ITextureRecorderState).format = this.getWebGlConstant(customData.format);
                (tag.customData as ITextureRecorderState).internalFormat = this.getWebGlConstant(customData.internalFormat);
                (tag.customData as ITextureRecorderState).width = customData.width;
                (tag.customData as ITextureRecorderState).height = customData.height;
                (tag.customData as ITextureRecorderState).visual = (tag.customData as ITextureRecorderState).visual || {};
                (tag.customData as ITextureRecorderState).visual[customData.target] = this.visualState.getBase64Visual(customData);
            }
        }

        private getTexImage2DCustomData(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): ITextureRecorderData {
            if (functionInformation.arguments[1] !== 0) {
                // Only manage main lod... so far.
                return undefined;
            }

            let customData: ITextureRecorderData;
            if (functionInformation.arguments.length >= 9) {
                const data = functionInformation.arguments[8];
                if (!data || !data.width) {
                    // Discard wegl2 pointer offsets... so far.
                    return undefined;
                }

                // Custom data required to display the texture.
                customData = {
                    target,
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
                    return undefined;
                }

                // Custom data required to display the texture.
                customData = {
                    target,
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
            return customData;
        }
    }
}
