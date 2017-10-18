// tslint:disable:max-classes-per-file
namespace SPECTOR.WebGlObjects {

    @Decorators.webGlObject("WebGLBuffer")
    export class Buffer extends BaseWebGlObject { }

    @Decorators.webGlObject("WebGLFramebuffer")
    export class FrameBuffer extends BaseWebGlObject { }

    @Decorators.webGlObject("WebGLProgram")
    export class Program extends BaseWebGlObject {
        public static saveInGlobalStore(object: WebGLProgram): void {
            const tag = getWebGlObjectTag(object);
            if (!tag) {
                return;
            }

            this.store[tag.id] = object;
        }

        public static getFromGlobalStore(id: number): WebGLProgram {
            return this.store[id];
        }

        public static updateInGlobalStore(id: number, newProgram: WebGLProgram): void {
            if (!newProgram) {
                return;
            }

            const program = this.getFromGlobalStore(id);
            if (!program) {
                return;
            }

            const tag = getWebGlObjectTag(program);
            if (!tag) {
                return;
            }

            attachWebGlObjectTag(newProgram, tag);

            this.store[tag.id] = newProgram;
        }

        private static store: { [id: number]: WebGLObject } = {};

        constructor(options: IWebGlObjectOptions, logger: ILogger) {
            super(options, logger);
        }
    }

    @Decorators.webGlObject("WebGLQuery")
    export class Query extends BaseWebGlObject { }

    @Decorators.webGlObject("WebGLRenderbuffer")
    export class Renderbuffer extends BaseWebGlObject { }

    @Decorators.webGlObject("WebGLSampler")
    export class Sampler extends BaseWebGlObject { }

    @Decorators.webGlObject("WebGLShader")
    export class Shader extends BaseWebGlObject { }

    @Decorators.webGlObject("WebGLSync")
    export class Sync extends BaseWebGlObject { }

    @Decorators.webGlObject("WebGLTexture")
    export class Texture extends BaseWebGlObject { }

    @Decorators.webGlObject("WebGLTransformFeedback")
    export class TransformFeedback extends BaseWebGlObject { }

    @Decorators.webGlObject("WebGLUniformLocation")
    export class UniformLocation extends BaseWebGlObject { }

    @Decorators.webGlObject("WebGLVertexArrayObject")
    export class VertexArrayObject extends BaseWebGlObject { }
}
