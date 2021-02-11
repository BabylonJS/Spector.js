import { BaseState } from "../baseState";
import { WebGlConstants, WebGlConstantsByName, WebGlConstant, WebGlConstantsByValue } from "../../types/webglConstants";
import { DrawCallTextureInputState } from "./drawCallTextureInputState";
import { DrawCallUboInputState } from "./drawCallUboInputState";
import { ProgramRecompilerHelper } from "../../utils/programRecompilerHelper";
import { drawCommands } from "../../utils/drawCommands";
import { Program } from "../../webGlObjects/webGlObjects";
import { IContextInformation } from "../../types/contextInformation";
import { IRenderBufferRecorderData } from "../../recorders/renderBufferRecorder";
import { IBufferRecorderData } from "../../recorders/bufferRecorder";
import { ReadProgramHelper } from "../../utils/readProgramHelper";

export class DrawCallState extends BaseState {
    public static readonly stateName = "DrawCall";

    public get stateName(): string {
        return DrawCallState.stateName;
    }

    private static samplerTypes = {
        [WebGlConstants.SAMPLER_2D.value]: WebGlConstants.TEXTURE_2D,
        [WebGlConstants.SAMPLER_CUBE.value]: WebGlConstants.TEXTURE_CUBE_MAP,

        [WebGlConstants.SAMPLER_3D.value]: WebGlConstants.TEXTURE_3D,
        [WebGlConstants.SAMPLER_2D_SHADOW.value]: WebGlConstants.TEXTURE_2D,
        [WebGlConstants.SAMPLER_2D_ARRAY.value]: WebGlConstants.TEXTURE_2D_ARRAY,
        [WebGlConstants.SAMPLER_2D_ARRAY_SHADOW.value]: WebGlConstants.TEXTURE_2D_ARRAY,
        [WebGlConstants.SAMPLER_CUBE_SHADOW.value]: WebGlConstants.TEXTURE_CUBE_MAP,

        [WebGlConstants.INT_SAMPLER_2D.value]: WebGlConstants.TEXTURE_2D,
        [WebGlConstants.INT_SAMPLER_3D.value]: WebGlConstants.TEXTURE_3D,
        [WebGlConstants.INT_SAMPLER_CUBE.value]: WebGlConstants.TEXTURE_CUBE_MAP,
        [WebGlConstants.INT_SAMPLER_2D_ARRAY.value]: WebGlConstants.TEXTURE_2D_ARRAY,

        [WebGlConstants.UNSIGNED_INT_SAMPLER_2D.value]: WebGlConstants.TEXTURE_2D,
        [WebGlConstants.UNSIGNED_INT_SAMPLER_3D.value]: WebGlConstants.TEXTURE_3D,
        [WebGlConstants.UNSIGNED_INT_SAMPLER_CUBE.value]: WebGlConstants.TEXTURE_CUBE_MAP,
        [WebGlConstants.UNSIGNED_INT_SAMPLER_2D_ARRAY.value]: WebGlConstants.TEXTURE_2D_ARRAY,
    };

    public get requireStartAndStopStates(): boolean {
        return false;
    }

    private readonly drawCallTextureInputState: DrawCallTextureInputState;
    private readonly drawCallUboInputState: DrawCallUboInputState;

    constructor(options: IContextInformation) {
        super(options);
        this.drawCallTextureInputState = new DrawCallTextureInputState(options);
        this.drawCallUboInputState = new DrawCallUboInputState(options);
    }

    protected getConsumeCommands(): string[] {
        return drawCommands;
    }

    protected getChangeCommandsByState(): { [key: string]: string[] } {
        return {};
    }

    protected readFromContext(): void {
        const program = this.context.getParameter(WebGlConstants.CURRENT_PROGRAM.value);
        if (!program) {
            return;
        }

        this.currentState.frameBuffer = this.readFrameBufferFromContext();

        const programCapture = program.__SPECTOR_Object_CustomData ?
            program.__SPECTOR_Object_CustomData :
            ReadProgramHelper.getProgramData(this.context, program);

        this.currentState.programStatus = {
            ...programCapture.programStatus
        };
        this.currentState.programStatus.program = this.getSpectorData(program);
        this.currentState.programStatus.RECOMPILABLE = ProgramRecompilerHelper.isBuildableProgram(program);
        if (this.currentState.programStatus.RECOMPILABLE) {
            Program.saveInGlobalStore(program);
        }

        this.currentState.shaders = programCapture.shaders;

        if (this.lastCommandName?.indexOf("Elements") >= 0) {
            const elementArrayBuffer = this.context.getParameter(this.context.ELEMENT_ARRAY_BUFFER_BINDING);
            if (elementArrayBuffer) {
                this.currentState.elementArray = {};
                this.currentState.elementArray.arrayBuffer = this.getSpectorData(elementArrayBuffer);
            }
        }

        const attributes = this.context.getProgramParameter(program, WebGlConstants.ACTIVE_ATTRIBUTES.value);
        this.currentState.attributes = [];
        for (let i = 0; i < attributes; i++) {
            const attributeState = this.readAttributeFromContext(program, i);
            this.currentState.attributes.push(attributeState);
        }

        const uniforms = this.context.getProgramParameter(program, WebGlConstants.ACTIVE_UNIFORMS.value);
        this.currentState.uniforms = [];
        const uniformIndices = [];
        for (let i = 0; i < uniforms; i++) {
            uniformIndices.push(i);
            const uniformState = this.readUniformFromContext(program, i);
            this.currentState.uniforms.push(uniformState);
        }

        if (this.contextVersion > 1) {
            const uniformBlocks = this.context.getProgramParameter(program, WebGlConstants.ACTIVE_UNIFORM_BLOCKS.value);
            this.currentState.uniformBlocks = [];
            for (let i = 0; i < uniformBlocks; i++) {
                const uniformBlockState = this.readUniformBlockFromContext(program, i);
                this.currentState.uniformBlocks.push(uniformBlockState);
            }

            this.readUniformsFromContextIntoState(program, uniformIndices, this.currentState.uniforms, this.currentState.uniformBlocks);

            const transformFeedbackActive = this.context.getParameter(WebGlConstants.TRANSFORM_FEEDBACK_ACTIVE.value);
            if (transformFeedbackActive) {
                const transformFeedbackModeValue = this.context.getProgramParameter(program, WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_MODE.value);
                this.currentState.transformFeedbackMode = this.getWebGlConstant(transformFeedbackModeValue);

                this.currentState.transformFeedbacks = [];
                const transformFeedbacks = this.context.getProgramParameter(program, WebGlConstants.TRANSFORM_FEEDBACK_VARYINGS.value);
                for (let i = 0; i < transformFeedbacks; i++) {
                    const transformFeedbackState = this.readTransformFeedbackFromContext(program, i);
                    this.currentState.transformFeedbacks.push(transformFeedbackState);
                }
            }
        }

        // Insert texture state at the end of the uniform datas.
        for (let i = 0; i < uniformIndices.length; i++) {
            const uniformState = this.currentState.uniforms[i];
            if (uniformState.value !== null && uniformState.value !== undefined) {
                const textureTarget = DrawCallState.samplerTypes[uniformState.typeValue];
                if (textureTarget) {
                    if (uniformState.value.length) {
                        uniformState.textures = [];
                        for (let j = 0; j < uniformState.value.length; j++) {
                            uniformState.textures.push(this.readTextureFromContext(uniformState.value[j], textureTarget));
                        }
                    }
                    else {
                        uniformState.texture = this.readTextureFromContext(uniformState.value, textureTarget);
                    }
                }
            }
            delete uniformState.typeValue;
        }
    }

    protected readFrameBufferFromContext(): any {
        const frameBuffer = this.context.getParameter(WebGlConstants.FRAMEBUFFER_BINDING.value);
        if (!frameBuffer) {
            return null;
        }

        const frameBufferState: any = {};
        frameBufferState.frameBuffer = this.getSpectorData(frameBuffer);

        const depthAttachment = this.readFrameBufferAttachmentFromContext(WebGlConstants.DEPTH_ATTACHMENT.value);
        if (depthAttachment) {
            frameBufferState.depthAttachment = this.readFrameBufferAttachmentFromContext(WebGlConstants.DEPTH_ATTACHMENT.value);
        }

        const stencilAttachment = this.readFrameBufferAttachmentFromContext(WebGlConstants.STENCIL_ATTACHMENT.value);
        if (stencilAttachment) {
            frameBufferState.stencilAttachment = this.readFrameBufferAttachmentFromContext(WebGlConstants.STENCIL_ATTACHMENT.value);
        }

        const drawBuffersExtension = this.extensions[WebGlConstants.MAX_DRAW_BUFFERS_WEBGL.extensionName];
        if (drawBuffersExtension) {
            frameBufferState.colorAttachments = [];
            const maxDrawBuffers = this.context.getParameter(WebGlConstants.MAX_DRAW_BUFFERS_WEBGL.value);
            for (let i = 0; i < maxDrawBuffers; i++) {
                const attachment = this.readFrameBufferAttachmentFromContext(WebGlConstantsByName["COLOR_ATTACHMENT" + i + "_WEBGL"].value);
                if (attachment) {
                    frameBufferState.colorAttachments.push(attachment);
                }
            }
        }
        else if (this.contextVersion > 1) {
            const context2 = this.context as WebGL2RenderingContext;
            // Already covered ny the introspection of depth and stencil.
            // frameBufferState.depthStencilAttachment = this.readFrameBufferAttachmentFromContext(WebGlConstants.DEPTH_STENCIL_ATTACHMENT.value);
            frameBufferState.colorAttachments = [];
            const maxDrawBuffers = context2.getParameter(WebGlConstants.MAX_DRAW_BUFFERS.value);
            for (let i = 0; i < maxDrawBuffers; i++) {
                const attachment = this.readFrameBufferAttachmentFromContext(WebGlConstantsByName["COLOR_ATTACHMENT" + i].value);
                if (attachment) {
                    frameBufferState.colorAttachments.push(attachment);
                }
            }
        }
        else {
            const attachment = this.readFrameBufferAttachmentFromContext(WebGlConstantsByName["COLOR_ATTACHMENT0"].value);
            if (attachment) {
                frameBufferState.colorAttachments = [attachment];
            }
        }

        return frameBufferState;
    }

    protected readFrameBufferAttachmentFromContext(attachment: number): any {
        const target = WebGlConstants.FRAMEBUFFER.value;
        const type = this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE.value);
        if (type === WebGlConstants.NONE.value) {
            return undefined;
        }

        const attachmentState: any = {};
        const storage = this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME.value);
        if (type === WebGlConstants.RENDERBUFFER.value) {
            attachmentState.type = "RENDERBUFFER";
            attachmentState.buffer = this.getSpectorData(storage);

            // Check for custom data.
            if (storage) {
                const customData: IRenderBufferRecorderData = (storage as any).__SPECTOR_Object_CustomData;
                if (customData) {
                    if (customData.internalFormat) {
                        attachmentState.internalFormat = this.getWebGlConstant(customData.internalFormat);
                    }
                    attachmentState.width = customData.width;
                    attachmentState.height = customData.height;
                    attachmentState.msaaSamples = customData.samples;
                }
            }
        }
        else if (type === WebGlConstants.TEXTURE.value) {
            attachmentState.type = "TEXTURE";
            attachmentState.texture = this.getSpectorData(storage);
            attachmentState.textureLevel = this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL.value);
            const cubeMapFace = this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE.value);
            attachmentState.textureCubeMapFace = this.getWebGlConstant(cubeMapFace);
            this.drawCallTextureInputState.appendTextureState(attachmentState, storage, null, this.fullCapture);
        }

        if (this.extensions["EXT_sRGB"]) {
            attachmentState.encoding = this.getWebGlConstant(this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT.value));
        }

        if (this.contextVersion > 1) {
            attachmentState.alphaSize = this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE.value);
            attachmentState.blueSize = this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE.value);
            attachmentState.encoding = this.getWebGlConstant(this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING.value));
            attachmentState.componentType = this.getWebGlConstant(this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE.value));
            attachmentState.depthSize = this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE.value);
            attachmentState.greenSize = this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE.value);
            attachmentState.redSize = this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_RED_SIZE.value);
            attachmentState.stencilSize = this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE.value);

            if (type === WebGlConstants.TEXTURE.value) {
                attachmentState.textureLayer = this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER.value);
            }
        }

        return attachmentState;
    }

    protected readAttributeFromContext(program: WebGLProgram, activeAttributeIndex: number): {} {
        const info = this.context.getActiveAttrib(program, activeAttributeIndex);
        const location = this.context.getAttribLocation(program, info.name);
        if (location === -1) {
            return {
                name: info.name,
                size: info.size,
                type: this.getWebGlConstant(info.type),
                location: -1,
            };
        }

        const unbufferedValue = this.context.getVertexAttrib(location, WebGlConstants.CURRENT_VERTEX_ATTRIB.value);
        const boundBuffer = this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING.value);
        const attributeState: any = {
            name: info.name,
            size: info.size,
            type: this.getWebGlConstant(info.type),
            location,
            offsetPointer: this.context.getVertexAttribOffset(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_POINTER.value),
            bufferBinding: this.getSpectorData(boundBuffer),
            enabled: this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_ENABLED.value),
            arraySize: this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_SIZE.value),
            stride: this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_STRIDE.value),
            arrayType: this.getWebGlConstant(this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_TYPE.value)),
            normalized: this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_NORMALIZED.value),
            vertexAttrib: Array.prototype.slice.call(unbufferedValue),
        };

        if (this.extensions[WebGlConstants.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE.extensionName]) {
            attributeState.divisor = this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE.value);
        }
        else if (this.contextVersion > 1) {
            attributeState.integer = this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_INTEGER.value);
            attributeState.divisor = this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_DIVISOR.value);
        }

        this.appendBufferCustomData(attributeState, boundBuffer);
        return attributeState;
    }

    protected readUniformFromContext(program: WebGLProgram, activeUniformIndex: number): {} {
        const info = this.context.getActiveUniform(program, activeUniformIndex);
        const location = this.context.getUniformLocation(program, info.name);
        if (location) {

            if (info.size > 1 && info.name && info.name.indexOf("[0]") === info.name.length - 3) {
                const values: any = [];
                for (let i = 0; i < info.size; i++) {
                    const locationInArray = this.context.getUniformLocation(program, info.name.replace("[0]", "[" + i + "]"));
                    if (locationInArray) {
                        let value = this.context.getUniform(program, locationInArray);
                        if (value.length) {
                            value = Array.prototype.slice.call(value);
                        }
                        values.push({ value });
                    }
                }

                const uniformState: any = {
                    name: info.name.replace("[0]", ""),
                    size: info.size,
                    type: this.getWebGlConstant(info.type),
                    typeValue: info.type,
                    location: this.getSpectorData(location),
                    values,
                };
                return uniformState;
            }
            else {
                let value = this.context.getUniform(program, location);
                if (value.length) {
                    value = Array.prototype.slice.call(value);
                }

                const uniformState: any = {
                    name: info.name,
                    size: info.size,
                    type: this.getWebGlConstant(info.type),
                    typeValue: info.type,
                    location: this.getSpectorData(location),
                    value,
                };
                return uniformState;
            }
        }
        else {
            const uniformState: any = {
                name: info.name,
                size: info.size,
                type: this.getWebGlConstant(info.type),
                typeValue: info.type,
            };
            return uniformState;
        }
    }

    protected readTextureFromContext(textureUnit: number, target: WebGlConstant): {} {
        const activeTexture = this.context.getParameter(WebGlConstants.ACTIVE_TEXTURE.value);

        this.context.activeTexture(WebGlConstants.TEXTURE0.value + textureUnit);
        const textureState: any = {
            magFilter: this.getWebGlConstant(this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_MAG_FILTER.value)),
            minFilter: this.getWebGlConstant(this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_MIN_FILTER.value)),
            wrapS: this.getWebGlConstant(this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_WRAP_S.value)),
            wrapT: this.getWebGlConstant(this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_WRAP_T.value)),
        };

        if (this.extensions[WebGlConstants.TEXTURE_MAX_ANISOTROPY_EXT.extensionName]) {
            textureState.anisotropy = this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_MAX_ANISOTROPY_EXT.value);
        }

        if (this.contextVersion > 1) {
            textureState.baseLevel = this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_BASE_LEVEL.value);
            textureState.immutable = this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_IMMUTABLE_FORMAT.value);
            textureState.immutableLevels = this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
            textureState.maxLevel = this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_MAX_LEVEL.value);

            const sampler = this.context.getParameter(WebGlConstants.SAMPLER_BINDING.value);
            if (sampler) {
                textureState.sampler = this.getSpectorData(sampler);
                const context2 = this.context as WebGL2RenderingContext;

                textureState.samplerMaxLod = context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_MAX_LOD.value);
                textureState.samplerMinLod = context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_MIN_LOD.value);
                textureState.samplerCompareFunc = this.getWebGlConstant(context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_COMPARE_FUNC.value));
                textureState.samplerCompareMode = this.getWebGlConstant(context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_COMPARE_MODE.value));
                textureState.samplerWrapS = this.getWebGlConstant(context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_WRAP_S.value));
                textureState.samplerWrapT = this.getWebGlConstant(context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_WRAP_T.value));
                textureState.samplerWrapR = this.getWebGlConstant(context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_WRAP_R.value));
                textureState.samplerMagFilter = this.getWebGlConstant(context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_MAG_FILTER.value));
                textureState.samplerMinFilter = this.getWebGlConstant(context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_MIN_FILTER.value));
            }
            else {
                textureState.maxLod = this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_MAX_LOD.value);
                textureState.minLod = this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_MIN_LOD.value);
                textureState.compareFunc = this.getWebGlConstant(this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_COMPARE_FUNC.value));
                textureState.compareMode = this.getWebGlConstant(this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_COMPARE_MODE.value));
                textureState.wrapR = this.getWebGlConstant(this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_WRAP_R.value));
            }
        }

        const storage = this.getTextureStorage(target);
        if (storage) {
            // Null will prevent the visual target to be captured.
            const textureStateTarget = this.quickCapture ? null : target;
            this.drawCallTextureInputState.appendTextureState(textureState, storage, textureStateTarget, this.fullCapture);
        }

        this.context.activeTexture(activeTexture);
        return textureState;
    }

    protected getTextureStorage(target: WebGlConstant): any {
        if (target === WebGlConstants.TEXTURE_2D) {
            return this.context.getParameter(WebGlConstants.TEXTURE_BINDING_2D.value);
        }
        else if (target === WebGlConstants.TEXTURE_CUBE_MAP) {
            return this.context.getParameter(WebGlConstants.TEXTURE_BINDING_CUBE_MAP.value);
        }
        else if (target === WebGlConstants.TEXTURE_3D) {
            return this.context.getParameter(WebGlConstants.TEXTURE_BINDING_3D.value);
        }
        else if (target === WebGlConstants.TEXTURE_2D_ARRAY) {
            return this.context.getParameter(WebGlConstants.TEXTURE_BINDING_2D_ARRAY.value);
        }
        return undefined;
    }

    protected readUniformsFromContextIntoState(program: WebGLProgram, uniformIndices: number[], uniformsState: any[], uniformBlockState: any[]) {
        const context2 = this.context as WebGL2RenderingContext;

        const typeValues = context2.getActiveUniforms(program, uniformIndices, WebGlConstants.UNIFORM_TYPE.value);
        const sizes = context2.getActiveUniforms(program, uniformIndices, WebGlConstants.UNIFORM_SIZE.value);
        const blockIndices = context2.getActiveUniforms(program, uniformIndices, WebGlConstants.UNIFORM_BLOCK_INDEX.value);
        const offsets = context2.getActiveUniforms(program, uniformIndices, WebGlConstants.UNIFORM_OFFSET.value);
        const arrayStrides = context2.getActiveUniforms(program, uniformIndices, WebGlConstants.UNIFORM_ARRAY_STRIDE.value);
        const matrixStrides = context2.getActiveUniforms(program, uniformIndices, WebGlConstants.UNIFORM_MATRIX_STRIDE.value);
        const rowMajors = context2.getActiveUniforms(program, uniformIndices, WebGlConstants.UNIFORM_IS_ROW_MAJOR.value);

        for (let i = 0; i < uniformIndices.length; i++) {
            const uniformState = uniformsState[i];
            uniformState.type = this.getWebGlConstant(typeValues[i]);
            uniformState.size = sizes[i];
            uniformState.blockIndice = blockIndices[i];
            if (uniformState.blockIndice > -1) {
                uniformState.blockName = context2.getActiveUniformBlockName(program, uniformState.blockIndice);
            }
            uniformState.offset = offsets[i];
            uniformState.arrayStride = arrayStrides[i];
            uniformState.matrixStride = matrixStrides[i];
            uniformState.rowMajor = rowMajors[i];
            if (uniformState.blockIndice > -1) {
                const bindingPoint = uniformBlockState[blockIndices[i]].bindingPoint;
                uniformState.value = this.drawCallUboInputState.getUboValue(bindingPoint,
                    uniformState.offset,
                    uniformState.size,
                    typeValues[i]);
            }
        }
    }

    protected readTransformFeedbackFromContext(program: WebGLProgram, index: number): {} {
        const context2 = this.context as WebGL2RenderingContext;
        const info = context2.getTransformFeedbackVarying(program, index);

        const boundBuffer = context2.getIndexedParameter(WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_BINDING.value, index);
        const transformFeedbackState = {
            name: info.name,
            size: info.size,
            type: this.getWebGlConstant(info.type),
            buffer: this.getSpectorData(boundBuffer),
            bufferSize: context2.getIndexedParameter(WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_SIZE.value, index),
            bufferStart: context2.getIndexedParameter(WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_START.value, index),
        };

        this.appendBufferCustomData(transformFeedbackState, boundBuffer);
        return transformFeedbackState;
    }

    protected readUniformBlockFromContext(program: WebGLProgram, index: number): {} {
        const context2 = this.context as WebGL2RenderingContext;
        const bindingPoint = context2.getActiveUniformBlockParameter(program, index, WebGlConstants.UNIFORM_BLOCK_BINDING.value);

        const boundBuffer = context2.getIndexedParameter(WebGlConstants.UNIFORM_BUFFER_BINDING.value, bindingPoint);
        const uniformBlockState = {
            name: context2.getActiveUniformBlockName(program, index),
            bindingPoint,
            size: context2.getActiveUniformBlockParameter(program, index, WebGlConstants.UNIFORM_BLOCK_DATA_SIZE.value),
            activeUniformCount: context2.getActiveUniformBlockParameter(program, index, WebGlConstants.UNIFORM_BLOCK_ACTIVE_UNIFORMS.value),
            vertex: context2.getActiveUniformBlockParameter(program, index, WebGlConstants.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER.value),
            fragment: context2.getActiveUniformBlockParameter(program, index, WebGlConstants.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER.value),

            buffer: this.getSpectorData(boundBuffer),
            // Do not display Ptr data.
            // bufferSize: context2.getIndexedParameter(WebGlConstants.UNIFORM_BUFFER_SIZE.value, bindingPoint),
            // bufferStart: context2.getIndexedParameter(WebGlConstants.UNIFORM_BUFFER_START.value, bindingPoint),
        };
        this.appendBufferCustomData(uniformBlockState, boundBuffer);
        return uniformBlockState;
    }

    private appendBufferCustomData(state: any, buffer: WebGLBuffer) {
        if (buffer) {
            // Check for custom data.
            const customData: IBufferRecorderData = (buffer as any).__SPECTOR_Object_CustomData;
            if (customData) {
                if (customData.usage) {
                    state.bufferUsage = this.getWebGlConstant(customData.usage);
                }
                state.bufferLength = customData.length;
                if (customData.offset) {
                    state.bufferOffset = customData.offset;
                }
                if (customData.sourceLength) {
                    state.bufferSourceLength = customData.sourceLength;
                }
            }
        }
    }

    private getWebGlConstant(value: number) {
        const constant = WebGlConstantsByValue[value];
        return constant ? constant.name : value;
    }
}
