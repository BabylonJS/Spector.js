namespace SPECTOR.Recorders {
    @Decorators.recorder("Texture3d")
    export class Texture3DRecorder extends BaseRecorder<WebGLTexture> {
        protected getCreateCommandNames(): string[] {
            return ["createTexture"];
        }

        protected getUpdateCommandNames(): string[] {
            return ["texImage3D", "compressedTexImage3D", "texStorage3D"];
        }

        protected getDeleteCommandNames(): string[] {
            return ["deleteTexture"];
        }

        protected getBoundInstance(target: number): WebGLTexture {
            const gl = this.options.context;
            if (target === WebGlConstants.TEXTURE_2D_ARRAY.value) {
                return gl.getParameter(WebGlConstants.TEXTURE_BINDING_2D_ARRAY.value);
            }
            else if (target === WebGlConstants.TEXTURE_3D.value) {
                return gl.getParameter(WebGlConstants.TEXTURE_BINDING_3D.value);
            }
            return undefined;
        }

        protected delete(instance: WebGLTexture): number {
            const customData = (instance as any).__SPECTOR_Object_CustomData;
            if (!customData) {
                return 0;
            }
            if (customData.target !== WebGlConstants.TEXTURE_2D_ARRAY.name && customData.target !== WebGlConstants.TEXTURE_3D.name) {
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
            customData.length = customData.width * customData.height * customData.depth
                * this.getByteSizeForInternalFormat(customData.internalFormat);

            if (customData) {
                (instance as any).__SPECTOR_Object_CustomData = customData;
            }

            return customData.length - previousLength;
        }

        private getCustomData(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): ITextureRecorderData {
            if (functionInformation.name === "texImage3D") {
                return this.getTexImage3DCustomData(functionInformation, target, instance);
            }
            else if (functionInformation.name === "compressedTexImage3D") {
                return this.getCompressedTexImage3DCustomData(functionInformation, target, instance);
            }
            else if (functionInformation.name === "texStorage3D") {
                return this.getTexStorage3DCustomData(functionInformation, target, instance);
            }
            return undefined;
        }

        private getTexStorage3DCustomData(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): ITextureRecorderData {
            let customData: ITextureRecorderData;
            if (functionInformation.args.length === 6) {
                // Custom data required to display the texture.
                customData = {
                    target,
                    // level: functionInformation.args[1],
                    internalFormat: functionInformation.args[2],
                    width: functionInformation.args[3],
                    height: functionInformation.args[4],
                    depth: functionInformation.args[5],
                    length: 0,
                };
            }

            // else NO DATA.
            return customData;
        }

        private getCompressedTexImage3DCustomData(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): ITextureRecorderData {
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
                    depth: functionInformation.args[5],
                    length: 0,
                };
            }

            // else NO DATA.
            return customData;
        }

        private getTexImage3DCustomData(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): ITextureRecorderData {
            if (functionInformation.args[1] !== 0) {
                // Only manage main lod... so far.
                return undefined;
            }

            let customData: ITextureRecorderData;
            if (functionInformation.args.length >= 9) {
                // Custom data required to display the texture.
                customData = {
                    target,
                    // level: functionInformation.args[1],
                    internalFormat: functionInformation.args[2],
                    width: functionInformation.args[3],
                    height: functionInformation.args[4],
                    depth: functionInformation.args[5],
                    format: functionInformation.args[7],
                    type: functionInformation.args[8],
                    length: 0,
                };
            }

            // else NO DATA.
            return customData;
        }
    }
}
