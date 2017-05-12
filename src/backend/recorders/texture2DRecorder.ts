namespace SPECTOR {
    export interface ITextureRecorderData {
        target: string;
        internalFormat: number;
        width: number;
        height: number;
        format?: number;
        type?: number;
        depth?: number;
    }
}
namespace SPECTOR.Recorders {
    @Decorators.recorder("WebGLTexture2D")
    export class Texture2DRecorder extends BaseRecorder<WebGLTexture> {
        protected getCreateCommandNames(): string[] {
            return ["createTexture"];
        }

        protected getUpdateCommandNames(): string[] {
            return ["texImage2D", "compressedTexImage2D", "texStorage2D"];
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
            else if (functionInformation.name === "compressedTexImage2D") {
                customData = this.getCompressedTexImage2DCustomData(functionInformation, target, instance);
            }
            else if (functionInformation.name === "texStorage2D") {
                customData = this.getTexStorage2DCustomData(functionInformation, target, instance);
            }

            if (customData) {
                (instance as any).__SPECTOR_Object_CustomData = customData;
            }
        }

        private getTexStorage2DCustomData(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): ITextureRecorderData {
            let customData: ITextureRecorderData;
            if (functionInformation.arguments.length === 5) {
                // Custom data required to display the texture.
                customData = {
                    target,
                    // level: functionInformation.arguments[1],
                    internalFormat: functionInformation.arguments[2],
                    width: functionInformation.arguments[3],
                    height: functionInformation.arguments[4],
                };
            }

            // else NO DATA.
            return customData;
        }

        private getCompressedTexImage2DCustomData(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): ITextureRecorderData {
            if (functionInformation.arguments[1] !== 0) {
                // Only manage main lod... so far.
                return undefined;
            }

            let customData: ITextureRecorderData;
            if (functionInformation.arguments.length >= 7) {
                // Custom data required to display the texture.
                customData = {
                    target,
                    // level: functionInformation.arguments[1],
                    internalFormat: functionInformation.arguments[2],
                    width: functionInformation.arguments[3],
                    height: functionInformation.arguments[4],
                };
            }

            // else NO DATA.
            return customData;
        }

        private getTexImage2DCustomData(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): ITextureRecorderData {
            if (functionInformation.arguments[1] !== 0) {
                // Only manage main lod... so far.
                return undefined;
            }

            let customData: ITextureRecorderData;
            if (functionInformation.arguments.length >= 8) {
                // Custom data required to display the texture.
                customData = {
                    target,
                    // level: functionInformation.arguments[1],
                    internalFormat: functionInformation.arguments[2],
                    width: functionInformation.arguments[3],
                    height: functionInformation.arguments[4],
                    format: functionInformation.arguments[6],
                    type: functionInformation.arguments[7],
                };
            }
            else if (functionInformation.arguments.length === 6) {
                // Custom data required to display the texture.
                customData = {
                    target,
                    // level: functionInformation.arguments[1],
                    internalFormat: functionInformation.arguments[2],
                    width: functionInformation.arguments[5].width,
                    height: functionInformation.arguments[5].height,
                    format: functionInformation.arguments[3],
                    type: functionInformation.arguments[4],
                };
            }

            // else NO DATA.
            return customData;
        }
    }
}
