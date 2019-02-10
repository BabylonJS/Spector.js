// tslint:disable:max-classes-per-file
import { BaseWebGlObject, WebGlObjects } from "./baseWebGlObject";

export class Buffer extends BaseWebGlObject {
    public get typeName() { return "WebGLBuffer"; }
}

export class FrameBuffer extends BaseWebGlObject {
    public get typeName() { return "WebGLFramebuffer"; }
}

export class Program extends BaseWebGlObject {
    public get typeName() { return "WebGLProgram"; }

    public static saveInGlobalStore(object: WebGLProgram): void {
        const tag = WebGlObjects.getWebGlObjectTag(object);
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

        const tag = WebGlObjects.getWebGlObjectTag(program);
        if (!tag) {
            return;
        }

        WebGlObjects.attachWebGlObjectTag(newProgram, tag);

        this.store[tag.id] = newProgram;
    }

    private static store: { [id: number]: WebGLObject } = {};
}

export class Query extends BaseWebGlObject {
    public get typeName() { return "WebGLQuery"; }
}

export class Renderbuffer extends BaseWebGlObject {
    public get typeName() { return "WebGLRenderbuffer"; }
}

export class Sampler extends BaseWebGlObject {
    public get typeName() { return "WebGLSampler"; }
}

export class Shader extends BaseWebGlObject {
    public get typeName() { return "WebGLShader"; }
}

export class Sync extends BaseWebGlObject {
    public get typeName() { return "WebGLSync"; }
}

export class Texture extends BaseWebGlObject {
    public get typeName() { return "WebGLTexture"; }
}

export class TransformFeedback extends BaseWebGlObject {
    public get typeName() { return "WebGLTransformFeedback"; }
}

export class UniformLocation extends BaseWebGlObject {
    public get typeName() { return "WebGLUniformLocation"; }
}

export class VertexArrayObject extends BaseWebGlObject {
    public get typeName() { return "WebGLVertexArrayObject"; }
}
