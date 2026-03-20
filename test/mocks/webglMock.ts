/**
 * Creates a mock WebGLRenderingContext with stub methods.
 * All GL functions return sensible defaults (0, null, true, etc).
 */
export function createMockWebGLContext(overrides: Partial<WebGLRenderingContext> = {}): WebGLRenderingContext {
    const gl: any = {
        canvas: createMockCanvas(),
        drawingBufferWidth: 800,
        drawingBufferHeight: 600,

        // State queries
        getParameter: jest.fn().mockReturnValue(null),
        getExtension: jest.fn().mockReturnValue(null),
        isEnabled: jest.fn().mockReturnValue(false),
        getError: jest.fn().mockReturnValue(0), // GL_NO_ERROR

        // Object creation
        createBuffer: jest.fn().mockReturnValue({}),
        createTexture: jest.fn().mockReturnValue({}),
        createProgram: jest.fn().mockReturnValue({}),
        createShader: jest.fn().mockReturnValue({}),
        createFramebuffer: jest.fn().mockReturnValue({}),
        createRenderbuffer: jest.fn().mockReturnValue({}),

        // Object deletion
        deleteBuffer: jest.fn(),
        deleteTexture: jest.fn(),
        deleteProgram: jest.fn(),
        deleteShader: jest.fn(),
        deleteFramebuffer: jest.fn(),
        deleteRenderbuffer: jest.fn(),

        // Drawing
        drawArrays: jest.fn(),
        drawElements: jest.fn(),
        clear: jest.fn(),
        clearColor: jest.fn(),

        // State
        enable: jest.fn(),
        disable: jest.fn(),
        viewport: jest.fn(),
        scissor: jest.fn(),
        blendFunc: jest.fn(),
        depthFunc: jest.fn(),

        // Shaders
        shaderSource: jest.fn(),
        compileShader: jest.fn(),
        attachShader: jest.fn(),
        linkProgram: jest.fn(),
        useProgram: jest.fn(),
        getShaderParameter: jest.fn().mockReturnValue(true),
        getProgramParameter: jest.fn().mockReturnValue(true),
        getShaderInfoLog: jest.fn().mockReturnValue(''),
        getProgramInfoLog: jest.fn().mockReturnValue(''),
        getAttribLocation: jest.fn().mockReturnValue(0),
        getUniformLocation: jest.fn().mockReturnValue({}),

        // Buffers
        bindBuffer: jest.fn(),
        bufferData: jest.fn(),

        // Textures
        bindTexture: jest.fn(),
        texImage2D: jest.fn(),
        texParameteri: jest.fn(),
        activeTexture: jest.fn(),

        // Framebuffers
        bindFramebuffer: jest.fn(),
        framebufferTexture2D: jest.fn(),
        checkFramebufferStatus: jest.fn().mockReturnValue(0x8CD5), // FRAMEBUFFER_COMPLETE

        // Pixels
        readPixels: jest.fn((x: number, y: number, width: number, height: number, format: number, type: number, pixels: ArrayBufferView | null) => {
            // Fill with test pattern: solid red
            if (pixels instanceof Uint8Array) {
                for (let i = 0; i < pixels.length; i += 4) {
                    pixels[i] = 255;     // R
                    pixels[i + 1] = 0;   // G
                    pixels[i + 2] = 0;   // B
                    pixels[i + 3] = 255; // A
                }
            }
        }),

        // Vertex attributes
        enableVertexAttribArray: jest.fn(),
        vertexAttribPointer: jest.fn(),

        // Uniforms
        uniform1f: jest.fn(),
        uniform1i: jest.fn(),
        uniform2f: jest.fn(),
        uniform3f: jest.fn(),
        uniform4f: jest.fn(),
        uniformMatrix4fv: jest.fn(),

        ...overrides,
    };

    return gl;
}

export function createMockWebGL2Context(overrides: Partial<WebGL2RenderingContext> = {}): WebGL2RenderingContext {
    const gl1 = createMockWebGLContext();
    const gl2: any = {
        ...gl1,
        // WebGL2 additions
        getIndexedParameter: jest.fn().mockReturnValue(null),
        drawArraysInstanced: jest.fn(),
        drawElementsInstanced: jest.fn(),
        texStorage2D: jest.fn(),
        texStorage3D: jest.fn(),
        texImage3D: jest.fn(),
        compressedTexImage3D: jest.fn(),
        renderbufferStorageMultisample: jest.fn(),
        beginQuery: jest.fn(),
        endQuery: jest.fn(),
        createQuery: jest.fn().mockReturnValue({}),
        deleteQuery: jest.fn(),
        createVertexArray: jest.fn().mockReturnValue({}),
        deleteVertexArray: jest.fn(),
        bindVertexArray: jest.fn(),
        createSampler: jest.fn().mockReturnValue({}),
        deleteSampler: jest.fn(),
        bindSampler: jest.fn(),
        createTransformFeedback: jest.fn().mockReturnValue({}),
        deleteTransformFeedback: jest.fn(),
        bindTransformFeedback: jest.fn(),
        fenceSync: jest.fn().mockReturnValue({}),
        deleteSync: jest.fn(),
        ...overrides,
    };
    return gl2;
}

/** Creates a minimal mock canvas for testing. */
export function createMockCanvas(width = 800, height = 600): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    Object.defineProperty(canvas, 'clientWidth', { value: width, writable: true });
    Object.defineProperty(canvas, 'clientHeight', { value: height, writable: true });
    return canvas;
}
