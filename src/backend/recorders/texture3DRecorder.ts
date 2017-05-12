namespace SPECTOR.Recorders {
    @Decorators.recorder("WebGLTexture3D")
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

        protected update(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): void {
            if (!instance) {
                return;
            }

            const tag = WebGlObjects.getWebGlObjectTag(instance);
            if (!tag) {
                return;
            }

            let customData: ITextureRecorderData = null;
            if (functionInformation.name === "texImage3D") {
                customData = this.getTexImage3DCustomData(functionInformation, target, instance);
            }
            else if (functionInformation.name === "compressedTexImage3D") {
                customData = this.getCompressedTexImage3DCustomData(functionInformation, target, instance);
            }
            else if (functionInformation.name === "texStorage3D") {
                customData = this.getTexStorage3DCustomData(functionInformation, target, instance);
            }

            if (customData) {
                (instance as any).__SPECTOR_Object_CustomData = customData;
            }
        }

        private getTexStorage3DCustomData(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): ITextureRecorderData {
            let customData: ITextureRecorderData;
            if (functionInformation.arguments.length === 6) {
                // Custom data required to display the texture.
                customData = {
                    target,
                    // level: functionInformation.arguments[1],
                    internalFormat: functionInformation.arguments[2],
                    width: functionInformation.arguments[3],
                    height: functionInformation.arguments[4],
                    depth: functionInformation.arguments[5],
                };
            }

            // else NO DATA.
            return customData;
        }

        private getCompressedTexImage3DCustomData(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): ITextureRecorderData {
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
                    depth: functionInformation.arguments[5],
                };
            }

            // else NO DATA.
            return customData;
        }

        private getTexImage3DCustomData(functionInformation: IFunctionInformation, target: string, instance: WebGLTexture): ITextureRecorderData {
            if (functionInformation.arguments[1] !== 0) {
                // Only manage main lod... so far.
                return undefined;
            }

            let customData: ITextureRecorderData;
            if (functionInformation.arguments.length >= 9) {
                // Custom data required to display the texture.
                customData = {
                    target,
                    // level: functionInformation.arguments[1],
                    internalFormat: functionInformation.arguments[2],
                    width: functionInformation.arguments[3],
                    height: functionInformation.arguments[4],
                    depth: functionInformation.arguments[5],
                    format: functionInformation.arguments[7],
                    type: functionInformation.arguments[8],
                };
            }

            // else NO DATA.
            return customData;
        }
    }
}
