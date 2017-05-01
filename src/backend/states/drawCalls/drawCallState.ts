namespace SPECTOR.States {
    @Decorators.state("DrawCall")
    export class DrawCallState extends BaseState {

        public get requireStartAndStopStates(): boolean {
            return false;
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

            this.currentState.program = this.getTag(program);
            this.currentState.programStatus = {
                DELETE_STATUS: this.context.getProgramParameter(program, WebGlConstants.DELETE_STATUS.value),
                LINK_STATUS: this.context.getProgramParameter(program, WebGlConstants.LINK_STATUS.value),
                VALIDATE_STATUS: this.context.getProgramParameter(program, WebGlConstants.VALIDATE_STATUS.value)
            };

            const shaders = this.context.getAttachedShaders(program);
            this.currentState.shaders = [];
            for (const shader of shaders) {
                const shaderState = this.readShaderFromContext(shader);
                this.currentState.shaders.push(shaderState);
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
                this.readUniformsFromContextIntoState(program, uniformIndices, this.currentState.uniforms);

                const uniformBlocks = this.context.getProgramParameter(program, WebGlConstants.ACTIVE_UNIFORM_BLOCKS.value);
                this.currentState.uniformBlocks = [];
                for (let i = 0; i < uniformBlocks; i++) {
                    const uniformBlockState = this.readUniformBlockFromContext(program, i);
                    this.currentState.uniformBlocks.push(uniformBlockState);
                }

                const transformFeedbackActive = this.context.getParameter(WebGlConstants.TRANSFORM_FEEDBACK_ACTIVE.value);
                this.currentState.transformFeedbacks = [];
                if (transformFeedbackActive) {
                    const transformFeedbackModeValue = this.context.getProgramParameter(program, WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_MODE.value);
                    const transformFeedbackMode = this.getWebGlConstant(transformFeedbackModeValue);

                    const transformFeedbacks = this.context.getProgramParameter(program, WebGlConstants.TRANSFORM_FEEDBACK_VARYINGS.value);
                    for (let i = 0; i < transformFeedbacks; i++) {
                        const transformFeedbackState = this.readTransformFeedbackFromContext(program, i);
                        this.currentState.transformFeedbacks.push(transformFeedbackState);
                    }
                }
            }
        }

        protected readFrameBufferFromContext(): any {
            const frameBuffer = this.context.getParameter(WebGlConstants.FRAMEBUFFER_BINDING.value);
            if (!frameBuffer) {
                return null;
            }

            const frameBufferState: any = {};
            frameBufferState.frameBuffer = this.getTag(frameBuffer);

            frameBufferState.depthAttachment = this.readFrameBufferAttachmentFromContext(WebGlConstants.DEPTH_ATTACHMENT.value);
            frameBufferState.stencilAttachment = this.readFrameBufferAttachmentFromContext(WebGlConstants.STENCIL_ATTACHMENT.value);

            const drawBuffersExtension = this.extensions[WebGlConstants.MAX_DRAW_BUFFERS_WEBGL.extensionName];
            if (drawBuffersExtension) {
                frameBufferState.colorAttachments = [];
                const maxDrawBuffers = this.context.getParameter(WebGlConstants.MAX_DRAW_BUFFERS_WEBGL.value);
                for (let i = 0; i < maxDrawBuffers; i++) {
                    frameBufferState.colorAttachments.push(this.readFrameBufferAttachmentFromContext(WebGlConstantsByName["COLOR_ATTACHMENT" + i + "_WEBGL"].value))
                }
            }
            else if (this.contextVersion > 1) {
                const context2 = <WebGL2RenderingContext>this.context;
                // Already covered ny the introspection of depth and stencil.
                // frameBufferState.depthStencilAttachment = this.readFrameBufferAttachmentFromContext(WebGlConstants.DEPTH_STENCIL_ATTACHMENT.value);
                frameBufferState.colorAttachments = [];
                const maxDrawBuffers = context2.getParameter(WebGlConstants.MAX_DRAW_BUFFERS.value);
                for (let i = 0; i < maxDrawBuffers; i++) {
                    frameBufferState.colorAttachments.push(this.readFrameBufferAttachmentFromContext(WebGlConstantsByName["COLOR_ATTACHMENT" + i].value))
                }
            }

            return frameBufferState;
        }

        protected readFrameBufferAttachmentFromContext(attachment: number): any {
            const target = WebGlConstants.FRAMEBUFFER.value;
            const attachmentState: any = {};
            const type = this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE.value);
            if (type === WebGlConstants.NONE.value) {
                attachmentState.type = "NONE";
                return attachmentState;
            }

            const storage = this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME.value);
            if (type === WebGlConstants.RENDERBUFFER.value) {
                attachmentState.type = "RENDERBUFFER";
                attachmentState.buffer = this.options.tagWebGlObject(storage);
            }
            else if (type === WebGlConstants.TEXTURE.value) {
                attachmentState.type = "TEXTURE";
                attachmentState.texture = this.options.tagWebGlObject(storage);
                attachmentState.textureLevel = this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL.value);
                attachmentState.textureCubeMapFace = this.getWebGlConstant(this.context.getFramebufferAttachmentParameter(target, attachment, WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE.value));
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

        protected readShaderFromContext(shader: WebGLShader): {} {
            return {
                shader: this.getTag(shader),
                COMPILE_STATUS: this.context.getShaderParameter(shader, WebGlConstants.COMPILE_STATUS.value),
                DELETE_STATUS: this.context.getShaderParameter(shader, WebGlConstants.DELETE_STATUS.value),
                SHADER_TYPE: this.getWebGlConstant(this.context.getShaderParameter(shader, WebGlConstants.SHADER_TYPE.value)),
                source: this.context.getShaderSource(shader)
            };
        }

        protected readAttributeFromContext(program: WebGLProgram, activeAttributeIndex: number): {} {
            const info = this.context.getActiveAttrib(program, activeAttributeIndex);
            const location = this.context.getAttribLocation(program, info.name);

            const attributeState: any = {
                name: info.name,
                size: info.size,
                type: this.getWebGlConstant(info.type),
                location: location,
                offsetPointer: this.context.getVertexAttribOffset(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_POINTER.value),
                bufferBinding: this.getTag(this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING.value)),
                enabled: this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_ENABLED.value),
                arraySize: this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_SIZE.value),
                stride: this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_STRIDE.value),
                arrayType: this.getWebGlConstant(this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_TYPE.value)),
                normalized: this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_NORMALIZED.value),
                vertexAttrib: this.context.getVertexAttrib(location, WebGlConstants.CURRENT_VERTEX_ATTRIB.value),
            };

            if (this.extensions[WebGlConstants.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE.extensionName]) {
                attributeState.divisor = this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE.value);
            }
            else if (this.contextVersion > 1) {
                attributeState.integer = this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_INTEGER.value);
                attributeState.divisor = this.context.getVertexAttrib(location, WebGlConstants.VERTEX_ATTRIB_ARRAY_DIVISOR.value);
            }

            return attributeState;
        }

        protected readUniformFromContext(program: WebGLProgram, activeUniformIndex: number): {} {
            const info = this.context.getActiveUniform(program, activeUniformIndex);
            const location = this.context.getUniformLocation(program, info.name);
            if (location) {
                const value = this.context.getUniform(program, location);

                const uniformState: any = {
                    name: info.name,
                    size: info.size,
                    type: this.getWebGlConstant(info.type),
                    location: this.getTag(location),
                    value: value
                };

                const textureTarget = DrawCallState.samplerTypes[info.type];
                if (textureTarget) {
                    uniformState.texture = this.readTextureFromContext(value, textureTarget);
                }
                return uniformState;
            }
            else {
                const uniformState: any = {
                    name: info.name,
                    size: info.size,
                    type: this.getWebGlConstant(info.type),
                    location: null,
                    value: null
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
            }

            if (this.extensions[WebGlConstants.TEXTURE_MAX_ANISOTROPY_EXT.extensionName]) {
                textureState.anisotropy = this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_MAX_ANISOTROPY_EXT.value);
            }

            if (this.contextVersion > 1) {
                textureState.baseLevel = this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_BASE_LEVEL.value);
                textureState.immutable = this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_IMMUTABLE_FORMAT.value);
                textureState.immutableLevels = this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
                textureState.maxLevel = this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);

                const sampler = this.context.getParameter(WebGlConstants.SAMPLER_BINDING.value);
                if (sampler) {
                    textureState.sampler = this.getTag(sampler);
                    const context2 = <WebGL2RenderingContext>this.context;

                    textureState.samplerMaxLod = context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
                    textureState.samplerMinLod = context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
                    textureState.samplerCompareFunc = this.getWebGlConstant(context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_COMPARE_FUNC.value));
                    textureState.samplerCompareMode = this.getWebGlConstant(context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_COMPARE_MODE.value));
                    textureState.samplerWrapS = this.getWebGlConstant(context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_WRAP_S.value));
                    textureState.samplerWrapT = this.getWebGlConstant(context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_WRAP_T.value));
                    textureState.samplerWrapR = this.getWebGlConstant(context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value));
                    textureState.samplerMagFilter = this.getWebGlConstant(context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_MAG_FILTER.value));
                    textureState.samplerMinFilter = this.getWebGlConstant(context2.getSamplerParameter(sampler, WebGlConstants.TEXTURE_MIN_FILTER.value));
                }
                else {
                    textureState.maxLod = this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
                    textureState.minLod = this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
                    textureState.compareFunc = this.getWebGlConstant(this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_COMPARE_FUNC.value));
                    textureState.compareMode = this.getWebGlConstant(this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_COMPARE_MODE.value));
                    textureState.wrapR = this.getWebGlConstant(this.context.getTexParameter(target.value, WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value));
                }
            }

            this.context.activeTexture(activeTexture);
            return textureState;
        }

        protected readUniformsFromContextIntoState(program: WebGLProgram, uniformIndices: number[], uniformsState: any[]) {
            const context2 = <WebGL2RenderingContext>this.context;

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
            }
        }

        protected readTransformFeedbackFromContext(program: WebGLProgram, index: number): {} {
            const context2 = <WebGL2RenderingContext>this.context;
            const info = context2.getTransformFeedbackVarying(program, index);

            return {
                name: info.name,
                size: info.size,
                type: this.getWebGlConstant(info.type),
                buffer: this.getTag(context2.getIndexedParameter(WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_BINDING.value, index)),
                bufferSize: context2.getIndexedParameter(WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_SIZE.value, index),
                bufferStart: context2.getIndexedParameter(WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_START.value, index),
            }
        }

        protected readUniformBlockFromContext(program: WebGLProgram, index: number): {} {
            const context2 = <WebGL2RenderingContext>this.context;
            const bindingPoint = context2.getActiveUniformBlockParameter(program, index, WebGlConstants.UNIFORM_BLOCK_BINDING.value);

            return {
                name: context2.getActiveUniformBlockName(program, index),
                bindingPoint: bindingPoint,
                size: context2.getActiveUniformBlockParameter(program, index, WebGlConstants.UNIFORM_BLOCK_DATA_SIZE.value),
                activeUniformCount: context2.getActiveUniformBlockParameter(program, index, WebGlConstants.UNIFORM_BLOCK_ACTIVE_UNIFORMS.value),
                vertex: context2.getActiveUniformBlockParameter(program, index, WebGlConstants.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER.value),
                fragment: context2.getActiveUniformBlockParameter(program, index, WebGlConstants.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER.value),

                buffer: this.getTag(context2.getIndexedParameter(WebGlConstants.UNIFORM_BUFFER_BINDING.value, bindingPoint)),
                bufferSize: context2.getIndexedParameter(WebGlConstants.UNIFORM_BUFFER_SIZE.value, bindingPoint),
                bufferStart: context2.getIndexedParameter(WebGlConstants.UNIFORM_BUFFER_START.value, bindingPoint),
            }
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
            [WebGlConstants.UNSIGNED_INT_SAMPLER_2D_ARRAY.value]: WebGlConstants.TEXTURE_2D_ARRAY
        };

        private getWebGlConstant(value: number) {
            return WebGlConstantsByValue[value].name;
        }

        private getTag(object: any): any {
            if (!object) {
                return undefined;
            }

            const tag = WebGlObjects.getWebGlObjectTag(object);
            if (!tag) {
                this.options.tagWebGlObject(object);
            }

            return object;
        }
    }
}
