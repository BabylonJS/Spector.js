namespace SPECTOR {
    export interface ITextureRecorderData {
        target: string;
        internalFormat: number;
        width: number;
        height: number;
        length: number;
        format?: number;
        type?: number;
        depth?: number;
    }
}
namespace SPECTOR.Recorders {
    @Decorators.recorder("Texture2d")
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

        protected delete(instance: WebGLTexture): number {
            const customData = (instance as any).__SPECTOR_Object_CustomData;
            if (!customData) {
                return 0;
            }
            if (customData.target === WebGlConstants.TEXTURE_2D_ARRAY.name || customData.target === WebGlConstants.TEXTURE_3D.name) {
                return 0;
            }

            return customData.length;
        }

        protected update(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): number {
            if (functionInformation.args.length >= 2 && functionInformation.args[1] !== 0) {
                return 0;
            }

            const customData = this.getCustomData(functionInformation, target, instance);
            if (!customData) {
                return 0;
            }

            const previousLength = (instance as any).__SPECTOR_Object_CustomData ? (instance as any).__SPECTOR_Object_CustomData.length : 0;
            const cubeMapMultiplier = target === "TEXTURE_2D" ? 1 : 6;
            customData.length = customData.width * customData.height * cubeMapMultiplier * this.getByteSizeForInternalFormat(customData.internalFormat);
            (instance as any).__SPECTOR_Object_CustomData = customData;
            return customData.length - previousLength;
        }

        private getCustomData(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): ITextureRecorderData {
            if (functionInformation.name === "texImage2D") {
                return this.getTexImage2DCustomData(functionInformation, target, instance);
            }
            else if (functionInformation.name === "compressedTexImage2D") {
                return this.getCompressedTexImage2DCustomData(functionInformation, target, instance);
            }
            else if (functionInformation.name === "texStorage2D") {
                return this.getTexStorage2DCustomData(functionInformation, target, instance);
            }
            return undefined;
        }

        private getTexStorage2DCustomData(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): ITextureRecorderData {
            let customData: ITextureRecorderData;
            if (functionInformation.args.length === 5) {
                // Custom data required to display the texture.
                customData = {
                    target,
                    // level: functionInformation.args[1],
                    internalFormat: functionInformation.args[2],
                    width: functionInformation.args[3],
                    height: functionInformation.args[4],
                    length: 0,
                };
            }

            // else NO DATA.
            return customData;
        }

        private getCompressedTexImage2DCustomData(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): ITextureRecorderData {
            if (functionInformation.args[1] !== 0) {
                // Only manage main lod... so far.
                return undefined;
            }

            let customData: ITextureRecorderData;
            if (functionInformation.args.length >= 7) {
                // Custom data required to display the texture.
                customData = {
                    target,
                    // level: functionInformation.args[1],
                    internalFormat: functionInformation.args[2],
                    width: functionInformation.args[3],
                    height: functionInformation.args[4],
                    length: 0,
                };
            }

            // else NO DATA.
            return customData;
        }

        private getTexImage2DCustomData(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): ITextureRecorderData {
            if (functionInformation.args[1] !== 0) {
                // Only manage main lod... so far.
                return undefined;
            }

            let customData: ITextureRecorderData;
            if (functionInformation.args.length >= 8) {
                // Custom data required to display the texture.
                customData = {
                    target,
                    // level: functionInformation.args[1],
                    internalFormat: functionInformation.args[2],
                    width: functionInformation.args[3],
                    height: functionInformation.args[4],
                    format: functionInformation.args[6],
                    type: functionInformation.args[7],
                    length: 0,
                };
            }
            else if (functionInformation.args.length === 6) {
                // Custom data required to display the texture.
                customData = {
                    target,
                    // level: functionInformation.args[1],
                    internalFormat: functionInformation.args[2],
                    width: functionInformation.args[5].width,
                    height: functionInformation.args[5].height,
                    format: functionInformation.args[3],
                    type: functionInformation.args[4],
                    length: 0,
                };
            }

            // else NO DATA.
            return customData;
        }
    }
}
