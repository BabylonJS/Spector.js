namespace SPECTOR {
    export interface IRenderBufferRecorderData {
        target: string;
        internalFormat: number;
        width: number;
        height: number;
    }
}
namespace SPECTOR.Recorders {
    @Decorators.recorder("WebGLRenderbuffer")
    export class RenderBufferRecorder extends BaseRecorder<WebGLRenderbuffer> {
        protected getCreateCommandNames(): string[] {
            return ["createRenderbuffer"];
        }

        protected getUpdateCommandNames(): string[] {
            return ["renderbufferStorage"];
        }

        protected getDeleteCommandNames(): string[] {
            return ["deleteRenderbuffer"];
        }

        protected getBoundInstance(target: number): WebGLTexture {
            const gl = this.options.context;
            if (target === WebGlConstants.RENDERBUFFER.value) {
                return gl.getParameter(WebGlConstants.RENDERBUFFER_BINDING.value);
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

            const customData: IRenderBufferRecorderData = {
                target,
                internalFormat: functionInformation.arguments[1],
                width: functionInformation.arguments[2],
                height: functionInformation.arguments[3],
            };

            if (customData) {
                (instance as any).__SPECTOR_Object_CustomData = customData;
            }
        }
    }
}
