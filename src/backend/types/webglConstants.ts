// tslint:disable:max-file-line-count
// tslint:disable:interface-name
// tslint:disable:max-line-length
// tslint:disable:variable-name

// Generated file disable rules.
export interface WebGlConstant {
    readonly name: string;
    readonly value: number;
    readonly description: string;
    readonly extensionName?: string;
}

export class WebGlConstants {
    public static readonly DEPTH_BUFFER_BIT: WebGlConstant = { name: "DEPTH_BUFFER_BIT", value: 256, description: "Passed to clear to clear the current depth buffer." };
    public static readonly STENCIL_BUFFER_BIT: WebGlConstant = { name: "STENCIL_BUFFER_BIT", value: 1024, description: "Passed to clear to clear the current stencil buffer." };
    public static readonly COLOR_BUFFER_BIT: WebGlConstant = { name: "COLOR_BUFFER_BIT", value: 16384, description: "Passed to clear to clear the current color buffer." };
    public static readonly POINTS: WebGlConstant = { name: "POINTS", value: 0, description: "Passed to drawElements or drawArrays to draw single points." };
    public static readonly LINES: WebGlConstant = { name: "LINES", value: 1, description: "Passed to drawElements or drawArrays to draw lines. Each vertex connects to the one after it." };
    public static readonly LINE_LOOP: WebGlConstant = { name: "LINE_LOOP", value: 2, description: "Passed to drawElements or drawArrays to draw lines. Each set of two vertices is treated as a separate line segment." };
    public static readonly LINE_STRIP: WebGlConstant = { name: "LINE_STRIP", value: 3, description: "Passed to drawElements or drawArrays to draw a connected group of line segments from the first vertex to the last." };
    public static readonly TRIANGLES: WebGlConstant = { name: "TRIANGLES", value: 4, description: "Passed to drawElements or drawArrays to draw triangles. Each set of three vertices creates a separate triangle." };
    public static readonly TRIANGLE_STRIP: WebGlConstant = { name: "TRIANGLE_STRIP", value: 5, description: "Passed to drawElements or drawArrays to draw a connected group of triangles." };
    public static readonly TRIANGLE_FAN: WebGlConstant = { name: "TRIANGLE_FAN", value: 6, description: "Passed to drawElements or drawArrays to draw a connected group of triangles. Each vertex connects to the previous and the first vertex in the fan." };
    public static readonly ZERO: WebGlConstant = { name: "ZERO", value: 0, description: "Passed to blendFunc or blendFuncSeparate to turn off a component." };
    public static readonly ONE: WebGlConstant = { name: "ONE", value: 1, description: "Passed to blendFunc or blendFuncSeparate to turn on a component." };
    public static readonly SRC_COLOR: WebGlConstant = { name: "SRC_COLOR", value: 768, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by the source elements color." };
    public static readonly ONE_MINUS_SRC_COLOR: WebGlConstant = { name: "ONE_MINUS_SRC_COLOR", value: 769, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the source elements color." };
    public static readonly SRC_ALPHA: WebGlConstant = { name: "SRC_ALPHA", value: 770, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by the source's alpha." };
    public static readonly ONE_MINUS_SRC_ALPHA: WebGlConstant = { name: "ONE_MINUS_SRC_ALPHA", value: 771, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the source's alpha." };
    public static readonly DST_ALPHA: WebGlConstant = { name: "DST_ALPHA", value: 772, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by the destination's alpha." };
    public static readonly ONE_MINUS_DST_ALPHA: WebGlConstant = { name: "ONE_MINUS_DST_ALPHA", value: 773, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the destination's alpha." };
    public static readonly DST_COLOR: WebGlConstant = { name: "DST_COLOR", value: 774, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by the destination's color." };
    public static readonly ONE_MINUS_DST_COLOR: WebGlConstant = { name: "ONE_MINUS_DST_COLOR", value: 775, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the destination's color." };
    public static readonly SRC_ALPHA_SATURATE: WebGlConstant = { name: "SRC_ALPHA_SATURATE", value: 776, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by the minimum of source's alpha or one minus the destination's alpha." };
    public static readonly CONSTANT_COLOR: WebGlConstant = { name: "CONSTANT_COLOR", value: 32769, description: "Passed to blendFunc or blendFuncSeparate to specify a constant color blend function." };
    public static readonly ONE_MINUS_CONSTANT_COLOR: WebGlConstant = { name: "ONE_MINUS_CONSTANT_COLOR", value: 32770, description: "Passed to blendFunc or blendFuncSeparate to specify one minus a constant color blend function." };
    public static readonly CONSTANT_ALPHA: WebGlConstant = { name: "CONSTANT_ALPHA", value: 32771, description: "Passed to blendFunc or blendFuncSeparate to specify a constant alpha blend function." };
    public static readonly ONE_MINUS_CONSTANT_ALPHA: WebGlConstant = { name: "ONE_MINUS_CONSTANT_ALPHA", value: 32772, description: "Passed to blendFunc or blendFuncSeparate to specify one minus a constant alpha blend function." };
    public static readonly FUNC_ADD: WebGlConstant = { name: "FUNC_ADD", value: 32774, description: "Passed to blendEquation or blendEquationSeparate to set an addition blend function." };
    public static readonly FUNC_SUBSTRACT: WebGlConstant = { name: "FUNC_SUBSTRACT", value: 32778, description: "Passed to blendEquation or blendEquationSeparate to specify a subtraction blend function (source - destination)." };
    public static readonly FUNC_REVERSE_SUBTRACT: WebGlConstant = { name: "FUNC_REVERSE_SUBTRACT", value: 32779, description: "Passed to blendEquation or blendEquationSeparate to specify a reverse subtraction blend function (destination - source)." };
    public static readonly BLEND_EQUATION: WebGlConstant = { name: "BLEND_EQUATION", value: 32777, description: "Passed to getParameter to get the current RGB blend function." };
    public static readonly BLEND_EQUATION_RGB: WebGlConstant = { name: "BLEND_EQUATION_RGB", value: 32777, description: "Passed to getParameter to get the current RGB blend function. Same as BLEND_EQUATION" };
    public static readonly BLEND_EQUATION_ALPHA: WebGlConstant = { name: "BLEND_EQUATION_ALPHA", value: 34877, description: "Passed to getParameter to get the current alpha blend function. Same as BLEND_EQUATION" };
    public static readonly BLEND_DST_RGB: WebGlConstant = { name: "BLEND_DST_RGB", value: 32968, description: "Passed to getParameter to get the current destination RGB blend function." };
    public static readonly BLEND_SRC_RGB: WebGlConstant = { name: "BLEND_SRC_RGB", value: 32969, description: "Passed to getParameter to get the current destination RGB blend function." };
    public static readonly BLEND_DST_ALPHA: WebGlConstant = { name: "BLEND_DST_ALPHA", value: 32970, description: "Passed to getParameter to get the current destination alpha blend function." };
    public static readonly BLEND_SRC_ALPHA: WebGlConstant = { name: "BLEND_SRC_ALPHA", value: 32971, description: "Passed to getParameter to get the current source alpha blend function." };
    public static readonly BLEND_COLOR: WebGlConstant = { name: "BLEND_COLOR", value: 32773, description: "Passed to getParameter to return a the current blend color." };
    public static readonly ARRAY_BUFFER_BINDING: WebGlConstant = { name: "ARRAY_BUFFER_BINDING", value: 34964, description: "Passed to getParameter to get the array buffer binding." };
    public static readonly ELEMENT_ARRAY_BUFFER_BINDING: WebGlConstant = { name: "ELEMENT_ARRAY_BUFFER_BINDING", value: 34965, description: "Passed to getParameter to get the current element array buffer." };
    public static readonly LINE_WIDTH: WebGlConstant = { name: "LINE_WIDTH", value: 2849, description: "Passed to getParameter to get the current lineWidth (set by the lineWidth method)." };
    public static readonly ALIASED_POINT_SIZE_RANGE: WebGlConstant = { name: "ALIASED_POINT_SIZE_RANGE", value: 33901, description: "Passed to getParameter to get the current size of a point drawn with gl.POINTS" };
    public static readonly ALIASED_LINE_WIDTH_RANGE: WebGlConstant = { name: "ALIASED_LINE_WIDTH_RANGE", value: 33902, description: "Passed to getParameter to get the range of available widths for a line. Returns a length-2 array with the lo value at 0, and hight at 1." };
    public static readonly CULL_FACE_MODE: WebGlConstant = { name: "CULL_FACE_MODE", value: 2885, description: "Passed to getParameter to get the current value of cullFace. Should return FRONT, BACK, or FRONT_AND_BACK" };
    public static readonly FRONT_FACE: WebGlConstant = { name: "FRONT_FACE", value: 2886, description: "Passed to getParameter to determine the current value of frontFace. Should return CW or CCW." };
    public static readonly DEPTH_RANGE: WebGlConstant = { name: "DEPTH_RANGE", value: 2928, description: "Passed to getParameter to return a length-2 array of floats giving the current depth range." };
    public static readonly DEPTH_WRITEMASK: WebGlConstant = { name: "DEPTH_WRITEMASK", value: 2930, description: "Passed to getParameter to determine if the depth write mask is enabled." };
    public static readonly DEPTH_CLEAR_VALUE: WebGlConstant = { name: "DEPTH_CLEAR_VALUE", value: 2931, description: "Passed to getParameter to determine the current depth clear value." };
    public static readonly DEPTH_FUNC: WebGlConstant = { name: "DEPTH_FUNC", value: 2932, description: "Passed to getParameter to get the current depth function. Returns NEVER, ALWAYS, LESS, EQUAL, LEQUAL, GREATER, GEQUAL, or NOTEQUAL." };
    public static readonly STENCIL_CLEAR_VALUE: WebGlConstant = { name: "STENCIL_CLEAR_VALUE", value: 2961, description: "Passed to getParameter to get the value the stencil will be cleared to." };
    public static readonly STENCIL_FUNC: WebGlConstant = { name: "STENCIL_FUNC", value: 2962, description: "Passed to getParameter to get the current stencil function. Returns NEVER, ALWAYS, LESS, EQUAL, LEQUAL, GREATER, GEQUAL, or NOTEQUAL." };
    public static readonly STENCIL_FAIL: WebGlConstant = { name: "STENCIL_FAIL", value: 2964, description: "Passed to getParameter to get the current stencil fail function. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP." };
    public static readonly STENCIL_PASS_DEPTH_FAIL: WebGlConstant = { name: "STENCIL_PASS_DEPTH_FAIL", value: 2965, description: "Passed to getParameter to get the current stencil fail function should the depth buffer test fail. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP." };
    public static readonly STENCIL_PASS_DEPTH_PASS: WebGlConstant = { name: "STENCIL_PASS_DEPTH_PASS", value: 2966, description: "Passed to getParameter to get the current stencil fail function should the depth buffer test pass. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP." };
    public static readonly STENCIL_REF: WebGlConstant = { name: "STENCIL_REF", value: 2967, description: "Passed to getParameter to get the reference value used for stencil tests." };
    public static readonly STENCIL_VALUE_MASK: WebGlConstant = { name: "STENCIL_VALUE_MASK", value: 2963, description: " " };
    public static readonly STENCIL_WRITEMASK: WebGlConstant = { name: "STENCIL_WRITEMASK", value: 2968, description: " " };
    public static readonly STENCIL_BACK_FUNC: WebGlConstant = { name: "STENCIL_BACK_FUNC", value: 34816, description: " " };
    public static readonly STENCIL_BACK_FAIL: WebGlConstant = { name: "STENCIL_BACK_FAIL", value: 34817, description: " " };
    public static readonly STENCIL_BACK_PASS_DEPTH_FAIL: WebGlConstant = { name: "STENCIL_BACK_PASS_DEPTH_FAIL", value: 34818, description: " " };
    public static readonly STENCIL_BACK_PASS_DEPTH_PASS: WebGlConstant = { name: "STENCIL_BACK_PASS_DEPTH_PASS", value: 34819, description: " " };
    public static readonly STENCIL_BACK_REF: WebGlConstant = { name: "STENCIL_BACK_REF", value: 36003, description: " " };
    public static readonly STENCIL_BACK_VALUE_MASK: WebGlConstant = { name: "STENCIL_BACK_VALUE_MASK", value: 36004, description: " " };
    public static readonly STENCIL_BACK_WRITEMASK: WebGlConstant = { name: "STENCIL_BACK_WRITEMASK", value: 36005, description: " " };
    public static readonly VIEWPORT: WebGlConstant = { name: "VIEWPORT", value: 2978, description: "Returns an Int32Array with four elements for the current viewport dimensions." };
    public static readonly SCISSOR_BOX: WebGlConstant = { name: "SCISSOR_BOX", value: 3088, description: "Returns an Int32Array with four elements for the current scissor box dimensions." };
    public static readonly COLOR_CLEAR_VALUE: WebGlConstant = { name: "COLOR_CLEAR_VALUE", value: 3106, description: " " };
    public static readonly COLOR_WRITEMASK: WebGlConstant = { name: "COLOR_WRITEMASK", value: 3107, description: " " };
    public static readonly UNPACK_ALIGNMENT: WebGlConstant = { name: "UNPACK_ALIGNMENT", value: 3317, description: " " };
    public static readonly PACK_ALIGNMENT: WebGlConstant = { name: "PACK_ALIGNMENT", value: 3333, description: " " };
    public static readonly MAX_TEXTURE_SIZE: WebGlConstant = { name: "MAX_TEXTURE_SIZE", value: 3379, description: " " };
    public static readonly MAX_VIEWPORT_DIMS: WebGlConstant = { name: "MAX_VIEWPORT_DIMS", value: 3386, description: " " };
    public static readonly SUBPIXEL_BITS: WebGlConstant = { name: "SUBPIXEL_BITS", value: 3408, description: " " };
    public static readonly RED_BITS: WebGlConstant = { name: "RED_BITS", value: 3410, description: " " };
    public static readonly GREEN_BITS: WebGlConstant = { name: "GREEN_BITS", value: 3411, description: " " };
    public static readonly BLUE_BITS: WebGlConstant = { name: "BLUE_BITS", value: 3412, description: " " };
    public static readonly ALPHA_BITS: WebGlConstant = { name: "ALPHA_BITS", value: 3413, description: " " };
    public static readonly DEPTH_BITS: WebGlConstant = { name: "DEPTH_BITS", value: 3414, description: " " };
    public static readonly STENCIL_BITS: WebGlConstant = { name: "STENCIL_BITS", value: 3415, description: " " };
    public static readonly POLYGON_OFFSET_UNITS: WebGlConstant = { name: "POLYGON_OFFSET_UNITS", value: 10752, description: " " };
    public static readonly POLYGON_OFFSET_FACTOR: WebGlConstant = { name: "POLYGON_OFFSET_FACTOR", value: 32824, description: " " };
    public static readonly TEXTURE_BINDING_2D: WebGlConstant = { name: "TEXTURE_BINDING_2D", value: 32873, description: " " };
    public static readonly SAMPLE_BUFFERS: WebGlConstant = { name: "SAMPLE_BUFFERS", value: 32936, description: " " };
    public static readonly SAMPLES: WebGlConstant = { name: "SAMPLES", value: 32937, description: " " };
    public static readonly SAMPLE_COVERAGE_VALUE: WebGlConstant = { name: "SAMPLE_COVERAGE_VALUE", value: 32938, description: " " };
    public static readonly SAMPLE_COVERAGE_INVERT: WebGlConstant = { name: "SAMPLE_COVERAGE_INVERT", value: 32939, description: " " };
    public static readonly COMPRESSED_TEXTURE_FORMATS: WebGlConstant = { name: "COMPRESSED_TEXTURE_FORMATS", value: 34467, description: " " };
    public static readonly VENDOR: WebGlConstant = { name: "VENDOR", value: 7936, description: " " };
    public static readonly RENDERER: WebGlConstant = { name: "RENDERER", value: 7937, description: " " };
    public static readonly VERSION: WebGlConstant = { name: "VERSION", value: 7938, description: " " };
    public static readonly IMPLEMENTATION_COLOR_READ_TYPE: WebGlConstant = { name: "IMPLEMENTATION_COLOR_READ_TYPE", value: 35738, description: " " };
    public static readonly IMPLEMENTATION_COLOR_READ_FORMAT: WebGlConstant = { name: "IMPLEMENTATION_COLOR_READ_FORMAT", value: 35739, description: " " };
    public static readonly BROWSER_DEFAULT_WEBGL: WebGlConstant = { name: "BROWSER_DEFAULT_WEBGL", value: 37444, description: " " };
    public static readonly STATIC_DRAW: WebGlConstant = { name: "STATIC_DRAW", value: 35044, description: "Passed to bufferData as a hint about whether the contents of the buffer are likely to be used often and not change often." };
    public static readonly STREAM_DRAW: WebGlConstant = { name: "STREAM_DRAW", value: 35040, description: "Passed to bufferData as a hint about whether the contents of the buffer are likely to not be used often." };
    public static readonly DYNAMIC_DRAW: WebGlConstant = { name: "DYNAMIC_DRAW", value: 35048, description: "Passed to bufferData as a hint about whether the contents of the buffer are likely to be used often and change often." };
    public static readonly ARRAY_BUFFER: WebGlConstant = { name: "ARRAY_BUFFER", value: 34962, description: "Passed to bindBuffer or bufferData to specify the type of buffer being used." };
    public static readonly ELEMENT_ARRAY_BUFFER: WebGlConstant = { name: "ELEMENT_ARRAY_BUFFER", value: 34963, description: "Passed to bindBuffer or bufferData to specify the type of buffer being used." };
    public static readonly BUFFER_SIZE: WebGlConstant = { name: "BUFFER_SIZE", value: 34660, description: "Passed to getBufferParameter to get a buffer's size." };
    public static readonly BUFFER_USAGE: WebGlConstant = { name: "BUFFER_USAGE", value: 34661, description: "Passed to getBufferParameter to get the hint for the buffer passed in when it was created." };
    public static readonly CURRENT_VERTEX_ATTRIB: WebGlConstant = { name: "CURRENT_VERTEX_ATTRIB", value: 34342, description: "Passed to getVertexAttrib to read back the current vertex attribute." };
    public static readonly VERTEX_ATTRIB_ARRAY_ENABLED: WebGlConstant = { name: "VERTEX_ATTRIB_ARRAY_ENABLED", value: 34338, description: " " };
    public static readonly VERTEX_ATTRIB_ARRAY_SIZE: WebGlConstant = { name: "VERTEX_ATTRIB_ARRAY_SIZE", value: 34339, description: " " };
    public static readonly VERTEX_ATTRIB_ARRAY_STRIDE: WebGlConstant = { name: "VERTEX_ATTRIB_ARRAY_STRIDE", value: 34340, description: " " };
    public static readonly VERTEX_ATTRIB_ARRAY_TYPE: WebGlConstant = { name: "VERTEX_ATTRIB_ARRAY_TYPE", value: 34341, description: " " };
    public static readonly VERTEX_ATTRIB_ARRAY_NORMALIZED: WebGlConstant = { name: "VERTEX_ATTRIB_ARRAY_NORMALIZED", value: 34922, description: " " };
    public static readonly VERTEX_ATTRIB_ARRAY_POINTER: WebGlConstant = { name: "VERTEX_ATTRIB_ARRAY_POINTER", value: 34373, description: " " };
    public static readonly VERTEX_ATTRIB_ARRAY_BUFFER_BINDING: WebGlConstant = { name: "VERTEX_ATTRIB_ARRAY_BUFFER_BINDING", value: 34975, description: " " };
    public static readonly CULL_FACE: WebGlConstant = { name: "CULL_FACE", value: 2884, description: "Passed to enable/disable to turn on/off culling. Can also be used with getParameter to find the current culling method." };
    public static readonly FRONT: WebGlConstant = { name: "FRONT", value: 1028, description: "Passed to cullFace to specify that only front faces should be drawn." };
    public static readonly BACK: WebGlConstant = { name: "BACK", value: 1029, description: "Passed to cullFace to specify that only back faces should be drawn." };
    public static readonly FRONT_AND_BACK: WebGlConstant = { name: "FRONT_AND_BACK", value: 1032, description: "Passed to cullFace to specify that front and back faces should be drawn." };
    public static readonly BLEND: WebGlConstant = { name: "BLEND", value: 3042, description: "Passed to enable/disable to turn on/off blending. Can also be used with getParameter to find the current blending method." };
    public static readonly DEPTH_TEST: WebGlConstant = { name: "DEPTH_TEST", value: 2929, description: "Passed to enable/disable to turn on/off the depth test. Can also be used with getParameter to query the depth test." };
    public static readonly DITHER: WebGlConstant = { name: "DITHER", value: 3024, description: "Passed to enable/disable to turn on/off dithering. Can also be used with getParameter to find the current dithering method." };
    public static readonly POLYGON_OFFSET_FILL: WebGlConstant = { name: "POLYGON_OFFSET_FILL", value: 32823, description: "Passed to enable/disable to turn on/off the polygon offset. Useful for rendering hidden-line images, decals, and or solids with highlighted edges. Can also be used with getParameter to query the scissor test." };
    public static readonly SAMPLE_ALPHA_TO_COVERAGE: WebGlConstant = { name: "SAMPLE_ALPHA_TO_COVERAGE", value: 32926, description: "Passed to enable/disable to turn on/off the alpha to coverage. Used in multi-sampling alpha channels." };
    public static readonly SAMPLE_COVERAGE: WebGlConstant = { name: "SAMPLE_COVERAGE", value: 32928, description: "Passed to enable/disable to turn on/off the sample coverage. Used in multi-sampling." };
    public static readonly SCISSOR_TEST: WebGlConstant = { name: "SCISSOR_TEST", value: 3089, description: "Passed to enable/disable to turn on/off the scissor test. Can also be used with getParameter to query the scissor test." };
    public static readonly STENCIL_TEST: WebGlConstant = { name: "STENCIL_TEST", value: 2960, description: "Passed to enable/disable to turn on/off the stencil test. Can also be used with getParameter to query the stencil test." };
    public static readonly NO_ERROR: WebGlConstant = { name: "NO_ERROR", value: 0, description: "Returned from getError." };
    public static readonly INVALID_ENUM: WebGlConstant = { name: "INVALID_ENUM", value: 1280, description: "Returned from getError." };
    public static readonly INVALID_VALUE: WebGlConstant = { name: "INVALID_VALUE", value: 1281, description: "Returned from getError." };
    public static readonly INVALID_OPERATION: WebGlConstant = { name: "INVALID_OPERATION", value: 1282, description: "Returned from getError." };
    public static readonly OUT_OF_MEMORY: WebGlConstant = { name: "OUT_OF_MEMORY", value: 1285, description: "Returned from getError." };
    public static readonly CONTEXT_LOST_WEBGL: WebGlConstant = { name: "CONTEXT_LOST_WEBGL", value: 37442, description: "Returned from getError." };
    public static readonly CW: WebGlConstant = { name: "CW", value: 2304, description: "Passed to frontFace to specify the front face of a polygon is drawn in the clockwise direction" };
    public static readonly CCW: WebGlConstant = { name: "CCW", value: 2305, description: "Passed to frontFace to specify the front face of a polygon is drawn in the counter clockwise direction" };
    public static readonly DONT_CARE: WebGlConstant = { name: "DONT_CARE", value: 4352, description: "There is no preference for this behavior." };
    public static readonly FASTEST: WebGlConstant = { name: "FASTEST", value: 4353, description: "The most efficient behavior should be used." };
    public static readonly NICEST: WebGlConstant = { name: "NICEST", value: 4354, description: "The most correct or the highest quality option should be used." };
    public static readonly GENERATE_MIPMAP_HINT: WebGlConstant = { name: "GENERATE_MIPMAP_HINT", value: 33170, description: "Hint for the quality of filtering when generating mipmap images with WebGLRenderingContext.generateMipmap()." };
    public static readonly BYTE: WebGlConstant = { name: "BYTE", value: 5120, description: " " };
    public static readonly UNSIGNED_BYTE: WebGlConstant = { name: "UNSIGNED_BYTE", value: 5121, description: " " };
    public static readonly SHORT: WebGlConstant = { name: "SHORT", value: 5122, description: " " };
    public static readonly UNSIGNED_SHORT: WebGlConstant = { name: "UNSIGNED_SHORT", value: 5123, description: " " };
    public static readonly INT: WebGlConstant = { name: "INT", value: 5124, description: " " };
    public static readonly UNSIGNED_INT: WebGlConstant = { name: "UNSIGNED_INT", value: 5125, description: " " };
    public static readonly FLOAT: WebGlConstant = { name: "FLOAT", value: 5126, description: " " };
    public static readonly DEPTH_COMPONENT: WebGlConstant = { name: "DEPTH_COMPONENT", value: 6402, description: " " };
    public static readonly ALPHA: WebGlConstant = { name: "ALPHA", value: 6406, description: " " };
    public static readonly RGB: WebGlConstant = { name: "RGB", value: 6407, description: " " };
    public static readonly RGBA: WebGlConstant = { name: "RGBA", value: 6408, description: " " };
    public static readonly LUMINANCE: WebGlConstant = { name: "LUMINANCE", value: 6409, description: " " };
    public static readonly LUMINANCE_ALPHA: WebGlConstant = { name: "LUMINANCE_ALPHA", value: 6410, description: " " };
    public static readonly UNSIGNED_SHORT_4_4_4_4: WebGlConstant = { name: "UNSIGNED_SHORT_4_4_4_4", value: 32819, description: " " };
    public static readonly UNSIGNED_SHORT_5_5_5_1: WebGlConstant = { name: "UNSIGNED_SHORT_5_5_5_1", value: 32820, description: " " };
    public static readonly UNSIGNED_SHORT_5_6_5: WebGlConstant = { name: "UNSIGNED_SHORT_5_6_5", value: 33635, description: " " };
    public static readonly FRAGMENT_SHADER: WebGlConstant = { name: "FRAGMENT_SHADER", value: 35632, description: "Passed to createShader to define a fragment shader." };
    public static readonly VERTEX_SHADER: WebGlConstant = { name: "VERTEX_SHADER", value: 35633, description: "Passed to createShader to define a vertex shader" };
    public static readonly COMPILE_STATUS: WebGlConstant = { name: "COMPILE_STATUS", value: 35713, description: "Passed to getShaderParamter to get the status of the compilation. Returns false if the shader was not compiled. You can then query getShaderInfoLog to find the exact error" };
    public static readonly DELETE_STATUS: WebGlConstant = { name: "DELETE_STATUS", value: 35712, description: "Passed to getShaderParamter to determine if a shader was deleted via deleteShader. Returns true if it was, false otherwise." };
    public static readonly LINK_STATUS: WebGlConstant = { name: "LINK_STATUS", value: 35714, description: "Passed to getProgramParameter after calling linkProgram to determine if a program was linked correctly. Returns false if there were errors. Use getProgramInfoLog to find the exact error." };
    public static readonly VALIDATE_STATUS: WebGlConstant = { name: "VALIDATE_STATUS", value: 35715, description: "Passed to getProgramParameter after calling validateProgram to determine if it is valid. Returns false if errors were found." };
    public static readonly ATTACHED_SHADERS: WebGlConstant = { name: "ATTACHED_SHADERS", value: 35717, description: "Passed to getProgramParameter after calling attachShader to determine if the shader was attached correctly. Returns false if errors occurred." };
    public static readonly ACTIVE_ATTRIBUTES: WebGlConstant = { name: "ACTIVE_ATTRIBUTES", value: 35721, description: "Passed to getProgramParameter to get the number of attributes active in a program." };
    public static readonly ACTIVE_UNIFORMS: WebGlConstant = { name: "ACTIVE_UNIFORMS", value: 35718, description: "Passed to getProgramParamter to get the number of uniforms active in a program." };
    public static readonly MAX_VERTEX_ATTRIBS: WebGlConstant = { name: "MAX_VERTEX_ATTRIBS", value: 34921, description: " " };
    public static readonly MAX_VERTEX_UNIFORM_VECTORS: WebGlConstant = { name: "MAX_VERTEX_UNIFORM_VECTORS", value: 36347, description: " " };
    public static readonly MAX_VARYING_VECTORS: WebGlConstant = { name: "MAX_VARYING_VECTORS", value: 36348, description: " " };
    public static readonly MAX_COMBINED_TEXTURE_IMAGE_UNITS: WebGlConstant = { name: "MAX_COMBINED_TEXTURE_IMAGE_UNITS", value: 35661, description: " " };
    public static readonly MAX_VERTEX_TEXTURE_IMAGE_UNITS: WebGlConstant = { name: "MAX_VERTEX_TEXTURE_IMAGE_UNITS", value: 35660, description: " " };
    public static readonly MAX_TEXTURE_IMAGE_UNITS: WebGlConstant = { name: "MAX_TEXTURE_IMAGE_UNITS", value: 34930, description: "Implementation dependent number of maximum texture units. At least 8." };
    public static readonly MAX_FRAGMENT_UNIFORM_VECTORS: WebGlConstant = { name: "MAX_FRAGMENT_UNIFORM_VECTORS", value: 36349, description: " " };
    public static readonly SHADER_TYPE: WebGlConstant = { name: "SHADER_TYPE", value: 35663, description: " " };
    public static readonly SHADING_LANGUAGE_VERSION: WebGlConstant = { name: "SHADING_LANGUAGE_VERSION", value: 35724, description: " " };
    public static readonly CURRENT_PROGRAM: WebGlConstant = { name: "CURRENT_PROGRAM", value: 35725, description: " " };
    public static readonly NEVER: WebGlConstant = { name: "NEVER", value: 512, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will never pass. i.e. Nothing will be drawn." };
    public static readonly ALWAYS: WebGlConstant = { name: "ALWAYS", value: 519, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will always pass. i.e. Pixels will be drawn in the order they are drawn." };
    public static readonly LESS: WebGlConstant = { name: "LESS", value: 513, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than the stored value." };
    public static readonly EQUAL: WebGlConstant = { name: "EQUAL", value: 514, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is equals to the stored value." };
    public static readonly LEQUAL: WebGlConstant = { name: "LEQUAL", value: 515, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than or equal to the stored value." };
    public static readonly GREATER: WebGlConstant = { name: "GREATER", value: 516, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than the stored value." };
    public static readonly GEQUAL: WebGlConstant = { name: "GEQUAL", value: 518, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than or equal to the stored value." };
    public static readonly NOTEQUAL: WebGlConstant = { name: "NOTEQUAL", value: 517, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is not equal to the stored value." };
    public static readonly KEEP: WebGlConstant = { name: "KEEP", value: 7680, description: " " };
    public static readonly REPLACE: WebGlConstant = { name: "REPLACE", value: 7681, description: " " };
    public static readonly INCR: WebGlConstant = { name: "INCR", value: 7682, description: " " };
    public static readonly DECR: WebGlConstant = { name: "DECR", value: 7683, description: " " };
    public static readonly INVERT: WebGlConstant = { name: "INVERT", value: 5386, description: " " };
    public static readonly INCR_WRAP: WebGlConstant = { name: "INCR_WRAP", value: 34055, description: " " };
    public static readonly DECR_WRAP: WebGlConstant = { name: "DECR_WRAP", value: 34056, description: " " };
    public static readonly NEAREST: WebGlConstant = { name: "NEAREST", value: 9728, description: " " };
    public static readonly LINEAR: WebGlConstant = { name: "LINEAR", value: 9729, description: " " };
    public static readonly NEAREST_MIPMAP_NEAREST: WebGlConstant = { name: "NEAREST_MIPMAP_NEAREST", value: 9984, description: " " };
    public static readonly LINEAR_MIPMAP_NEAREST: WebGlConstant = { name: "LINEAR_MIPMAP_NEAREST", value: 9985, description: " " };
    public static readonly NEAREST_MIPMAP_LINEAR: WebGlConstant = { name: "NEAREST_MIPMAP_LINEAR", value: 9986, description: " " };
    public static readonly LINEAR_MIPMAP_LINEAR: WebGlConstant = { name: "LINEAR_MIPMAP_LINEAR", value: 9987, description: " " };
    public static readonly TEXTURE_MAG_FILTER: WebGlConstant = { name: "TEXTURE_MAG_FILTER", value: 10240, description: " " };
    public static readonly TEXTURE_MIN_FILTER: WebGlConstant = { name: "TEXTURE_MIN_FILTER", value: 10241, description: " " };
    public static readonly TEXTURE_WRAP_S: WebGlConstant = { name: "TEXTURE_WRAP_S", value: 10242, description: " " };
    public static readonly TEXTURE_WRAP_T: WebGlConstant = { name: "TEXTURE_WRAP_T", value: 10243, description: " " };
    public static readonly TEXTURE_2D: WebGlConstant = { name: "TEXTURE_2D", value: 3553, description: " " };
    public static readonly TEXTURE: WebGlConstant = { name: "TEXTURE", value: 5890, description: " " };
    public static readonly TEXTURE_CUBE_MAP: WebGlConstant = { name: "TEXTURE_CUBE_MAP", value: 34067, description: " " };
    public static readonly TEXTURE_BINDING_CUBE_MAP: WebGlConstant = { name: "TEXTURE_BINDING_CUBE_MAP", value: 34068, description: " " };
    public static readonly TEXTURE_CUBE_MAP_POSITIVE_X: WebGlConstant = { name: "TEXTURE_CUBE_MAP_POSITIVE_X", value: 34069, description: " " };
    public static readonly TEXTURE_CUBE_MAP_NEGATIVE_X: WebGlConstant = { name: "TEXTURE_CUBE_MAP_NEGATIVE_X", value: 34070, description: " " };
    public static readonly TEXTURE_CUBE_MAP_POSITIVE_Y: WebGlConstant = { name: "TEXTURE_CUBE_MAP_POSITIVE_Y", value: 34071, description: " " };
    public static readonly TEXTURE_CUBE_MAP_NEGATIVE_Y: WebGlConstant = { name: "TEXTURE_CUBE_MAP_NEGATIVE_Y", value: 34072, description: " " };
    public static readonly TEXTURE_CUBE_MAP_POSITIVE_Z: WebGlConstant = { name: "TEXTURE_CUBE_MAP_POSITIVE_Z", value: 34073, description: " " };
    public static readonly TEXTURE_CUBE_MAP_NEGATIVE_Z: WebGlConstant = { name: "TEXTURE_CUBE_MAP_NEGATIVE_Z", value: 34074, description: " " };
    public static readonly MAX_CUBE_MAP_TEXTURE_SIZE: WebGlConstant = { name: "MAX_CUBE_MAP_TEXTURE_SIZE", value: 34076, description: " " };
    public static readonly TEXTURE0: WebGlConstant = { name: "TEXTURE0", value: 33984, description: "A texture unit." };
    public static readonly TEXTURE1: WebGlConstant = { name: "TEXTURE1", value: 33985, description: "A texture unit." };
    public static readonly TEXTURE2: WebGlConstant = { name: "TEXTURE2", value: 33986, description: "A texture unit." };
    public static readonly TEXTURE3: WebGlConstant = { name: "TEXTURE3", value: 33987, description: "A texture unit." };
    public static readonly TEXTURE4: WebGlConstant = { name: "TEXTURE4", value: 33988, description: "A texture unit." };
    public static readonly TEXTURE5: WebGlConstant = { name: "TEXTURE5", value: 33989, description: "A texture unit." };
    public static readonly TEXTURE6: WebGlConstant = { name: "TEXTURE6", value: 33990, description: "A texture unit." };
    public static readonly TEXTURE7: WebGlConstant = { name: "TEXTURE7", value: 33991, description: "A texture unit." };
    public static readonly TEXTURE8: WebGlConstant = { name: "TEXTURE8", value: 33992, description: "A texture unit." };
    public static readonly TEXTURE9: WebGlConstant = { name: "TEXTURE9", value: 33993, description: "A texture unit." };
    public static readonly TEXTURE10: WebGlConstant = { name: "TEXTURE10", value: 33994, description: "A texture unit." };
    public static readonly TEXTURE11: WebGlConstant = { name: "TEXTURE11", value: 33995, description: "A texture unit." };
    public static readonly TEXTURE12: WebGlConstant = { name: "TEXTURE12", value: 33996, description: "A texture unit." };
    public static readonly TEXTURE13: WebGlConstant = { name: "TEXTURE13", value: 33997, description: "A texture unit." };
    public static readonly TEXTURE14: WebGlConstant = { name: "TEXTURE14", value: 33998, description: "A texture unit." };
    public static readonly TEXTURE15: WebGlConstant = { name: "TEXTURE15", value: 33999, description: "A texture unit." };
    public static readonly TEXTURE16: WebGlConstant = { name: "TEXTURE16", value: 34000, description: "A texture unit." };
    public static readonly TEXTURE17: WebGlConstant = { name: "TEXTURE17", value: 34001, description: "A texture unit." };
    public static readonly TEXTURE18: WebGlConstant = { name: "TEXTURE18", value: 34002, description: "A texture unit." };
    public static readonly TEXTURE19: WebGlConstant = { name: "TEXTURE19", value: 34003, description: "A texture unit." };
    public static readonly TEXTURE20: WebGlConstant = { name: "TEXTURE20", value: 34004, description: "A texture unit." };
    public static readonly TEXTURE21: WebGlConstant = { name: "TEXTURE21", value: 34005, description: "A texture unit." };
    public static readonly TEXTURE22: WebGlConstant = { name: "TEXTURE22", value: 34006, description: "A texture unit." };
    public static readonly TEXTURE23: WebGlConstant = { name: "TEXTURE23", value: 34007, description: "A texture unit." };
    public static readonly TEXTURE24: WebGlConstant = { name: "TEXTURE24", value: 34008, description: "A texture unit." };
    public static readonly TEXTURE25: WebGlConstant = { name: "TEXTURE25", value: 34009, description: "A texture unit." };
    public static readonly TEXTURE26: WebGlConstant = { name: "TEXTURE26", value: 34010, description: "A texture unit." };
    public static readonly TEXTURE27: WebGlConstant = { name: "TEXTURE27", value: 34011, description: "A texture unit." };
    public static readonly TEXTURE28: WebGlConstant = { name: "TEXTURE28", value: 34012, description: "A texture unit." };
    public static readonly TEXTURE29: WebGlConstant = { name: "TEXTURE29", value: 34013, description: "A texture unit." };
    public static readonly TEXTURE30: WebGlConstant = { name: "TEXTURE30", value: 34014, description: "A texture unit." };
    public static readonly TEXTURE31: WebGlConstant = { name: "TEXTURE31", value: 34015, description: "A texture unit." };
    public static readonly ACTIVE_TEXTURE: WebGlConstant = { name: "ACTIVE_TEXTURE", value: 34016, description: "The current active texture unit." };
    public static readonly REPEAT: WebGlConstant = { name: "REPEAT", value: 10497, description: " " };
    public static readonly CLAMP_TO_EDGE: WebGlConstant = { name: "CLAMP_TO_EDGE", value: 33071, description: " " };
    public static readonly MIRRORED_REPEAT: WebGlConstant = { name: "MIRRORED_REPEAT", value: 33648, description: " " };
    public static readonly FLOAT_VEC2: WebGlConstant = { name: "FLOAT_VEC2", value: 35664, description: " " };
    public static readonly FLOAT_VEC3: WebGlConstant = { name: "FLOAT_VEC3", value: 35665, description: " " };
    public static readonly FLOAT_VEC4: WebGlConstant = { name: "FLOAT_VEC4", value: 35666, description: " " };
    public static readonly INT_VEC2: WebGlConstant = { name: "INT_VEC2", value: 35667, description: " " };
    public static readonly INT_VEC3: WebGlConstant = { name: "INT_VEC3", value: 35668, description: " " };
    public static readonly INT_VEC4: WebGlConstant = { name: "INT_VEC4", value: 35669, description: " " };
    public static readonly BOOL: WebGlConstant = { name: "BOOL", value: 35670, description: " " };
    public static readonly BOOL_VEC2: WebGlConstant = { name: "BOOL_VEC2", value: 35671, description: " " };
    public static readonly BOOL_VEC3: WebGlConstant = { name: "BOOL_VEC3", value: 35672, description: " " };
    public static readonly BOOL_VEC4: WebGlConstant = { name: "BOOL_VEC4", value: 35673, description: " " };
    public static readonly FLOAT_MAT2: WebGlConstant = { name: "FLOAT_MAT2", value: 35674, description: " " };
    public static readonly FLOAT_MAT3: WebGlConstant = { name: "FLOAT_MAT3", value: 35675, description: " " };
    public static readonly FLOAT_MAT4: WebGlConstant = { name: "FLOAT_MAT4", value: 35676, description: " " };
    public static readonly SAMPLER_2D: WebGlConstant = { name: "SAMPLER_2D", value: 35678, description: " " };
    public static readonly SAMPLER_CUBE: WebGlConstant = { name: "SAMPLER_CUBE", value: 35680, description: " " };
    public static readonly LOW_FLOAT: WebGlConstant = { name: "LOW_FLOAT", value: 36336, description: " " };
    public static readonly MEDIUM_FLOAT: WebGlConstant = { name: "MEDIUM_FLOAT", value: 36337, description: " " };
    public static readonly HIGH_FLOAT: WebGlConstant = { name: "HIGH_FLOAT", value: 36338, description: " " };
    public static readonly LOW_INT: WebGlConstant = { name: "LOW_INT", value: 36339, description: " " };
    public static readonly MEDIUM_INT: WebGlConstant = { name: "MEDIUM_INT", value: 36340, description: " " };
    public static readonly HIGH_INT: WebGlConstant = { name: "HIGH_INT", value: 36341, description: " " };
    public static readonly FRAMEBUFFER: WebGlConstant = { name: "FRAMEBUFFER", value: 36160, description: " " };
    public static readonly RENDERBUFFER: WebGlConstant = { name: "RENDERBUFFER", value: 36161, description: " " };
    public static readonly RGBA4: WebGlConstant = { name: "RGBA4", value: 32854, description: " " };
    public static readonly RGB5_A1: WebGlConstant = { name: "RGB5_A1", value: 32855, description: " " };
    public static readonly RGB565: WebGlConstant = { name: "RGB565", value: 36194, description: " " };
    public static readonly DEPTH_COMPONENT16: WebGlConstant = { name: "DEPTH_COMPONENT16", value: 33189, description: " " };
    public static readonly STENCIL_INDEX: WebGlConstant = { name: "STENCIL_INDEX", value: 6401, description: " " };
    public static readonly STENCIL_INDEX8: WebGlConstant = { name: "STENCIL_INDEX8", value: 36168, description: " " };
    public static readonly DEPTH_STENCIL: WebGlConstant = { name: "DEPTH_STENCIL", value: 34041, description: " " };
    public static readonly RENDERBUFFER_WIDTH: WebGlConstant = { name: "RENDERBUFFER_WIDTH", value: 36162, description: " " };
    public static readonly RENDERBUFFER_HEIGHT: WebGlConstant = { name: "RENDERBUFFER_HEIGHT", value: 36163, description: " " };
    public static readonly RENDERBUFFER_INTERNAL_FORMAT: WebGlConstant = { name: "RENDERBUFFER_INTERNAL_FORMAT", value: 36164, description: " " };
    public static readonly RENDERBUFFER_RED_SIZE: WebGlConstant = { name: "RENDERBUFFER_RED_SIZE", value: 36176, description: " " };
    public static readonly RENDERBUFFER_GREEN_SIZE: WebGlConstant = { name: "RENDERBUFFER_GREEN_SIZE", value: 36177, description: " " };
    public static readonly RENDERBUFFER_BLUE_SIZE: WebGlConstant = { name: "RENDERBUFFER_BLUE_SIZE", value: 36178, description: " " };
    public static readonly RENDERBUFFER_ALPHA_SIZE: WebGlConstant = { name: "RENDERBUFFER_ALPHA_SIZE", value: 36179, description: " " };
    public static readonly RENDERBUFFER_DEPTH_SIZE: WebGlConstant = { name: "RENDERBUFFER_DEPTH_SIZE", value: 36180, description: " " };
    public static readonly RENDERBUFFER_STENCIL_SIZE: WebGlConstant = { name: "RENDERBUFFER_STENCIL_SIZE", value: 36181, description: " " };
    public static readonly FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE: WebGlConstant = { name: "FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE", value: 36048, description: " " };
    public static readonly FRAMEBUFFER_ATTACHMENT_OBJECT_NAME: WebGlConstant = { name: "FRAMEBUFFER_ATTACHMENT_OBJECT_NAME", value: 36049, description: " " };
    public static readonly FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL: WebGlConstant = { name: "FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL", value: 36050, description: " " };
    public static readonly FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE: WebGlConstant = { name: "FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE", value: 36051, description: " " };
    public static readonly COLOR_ATTACHMENT0: WebGlConstant = { name: "COLOR_ATTACHMENT0", value: 36064, description: " " };
    public static readonly DEPTH_ATTACHMENT: WebGlConstant = { name: "DEPTH_ATTACHMENT", value: 36096, description: " " };
    public static readonly STENCIL_ATTACHMENT: WebGlConstant = { name: "STENCIL_ATTACHMENT", value: 36128, description: " " };
    public static readonly DEPTH_STENCIL_ATTACHMENT: WebGlConstant = { name: "DEPTH_STENCIL_ATTACHMENT", value: 33306, description: " " };
    public static readonly NONE: WebGlConstant = { name: "NONE", value: 0, description: " " };
    public static readonly FRAMEBUFFER_COMPLETE: WebGlConstant = { name: "FRAMEBUFFER_COMPLETE", value: 36053, description: " " };
    public static readonly FRAMEBUFFER_INCOMPLETE_ATTACHMENT: WebGlConstant = { name: "FRAMEBUFFER_INCOMPLETE_ATTACHMENT", value: 36054, description: " " };
    public static readonly FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT: WebGlConstant = { name: "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT", value: 36055, description: " " };
    public static readonly FRAMEBUFFER_INCOMPLETE_DIMENSIONS: WebGlConstant = { name: "FRAMEBUFFER_INCOMPLETE_DIMENSIONS", value: 36057, description: " " };
    public static readonly FRAMEBUFFER_UNSUPPORTED: WebGlConstant = { name: "FRAMEBUFFER_UNSUPPORTED", value: 36061, description: " " };
    public static readonly FRAMEBUFFER_BINDING: WebGlConstant = { name: "FRAMEBUFFER_BINDING", value: 36006, description: " " };
    public static readonly RENDERBUFFER_BINDING: WebGlConstant = { name: "RENDERBUFFER_BINDING", value: 36007, description: " " };
    public static readonly MAX_RENDERBUFFER_SIZE: WebGlConstant = { name: "MAX_RENDERBUFFER_SIZE", value: 34024, description: " " };
    public static readonly INVALID_FRAMEBUFFER_OPERATION: WebGlConstant = { name: "INVALID_FRAMEBUFFER_OPERATION", value: 1286, description: " " };
    public static readonly UNPACK_FLIP_Y_WEBGL: WebGlConstant = { name: "UNPACK_FLIP_Y_WEBGL", value: 37440, description: " " };
    public static readonly UNPACK_PREMULTIPLY_ALPHA_WEBGL: WebGlConstant = { name: "UNPACK_PREMULTIPLY_ALPHA_WEBGL", value: 37441, description: " " };
    public static readonly UNPACK_COLORSPACE_CONVERSION_WEBGL: WebGlConstant = { name: "UNPACK_COLORSPACE_CONVERSION_WEBGL", value: 37443, description: " " };
    public static readonly READ_BUFFER: WebGlConstant = { name: "READ_BUFFER", value: 3074, description: " " };
    public static readonly UNPACK_ROW_LENGTH: WebGlConstant = { name: "UNPACK_ROW_LENGTH", value: 3314, description: " " };
    public static readonly UNPACK_SKIP_ROWS: WebGlConstant = { name: "UNPACK_SKIP_ROWS", value: 3315, description: " " };
    public static readonly UNPACK_SKIP_PIXELS: WebGlConstant = { name: "UNPACK_SKIP_PIXELS", value: 3316, description: " " };
    public static readonly PACK_ROW_LENGTH: WebGlConstant = { name: "PACK_ROW_LENGTH", value: 3330, description: " " };
    public static readonly PACK_SKIP_ROWS: WebGlConstant = { name: "PACK_SKIP_ROWS", value: 3331, description: " " };
    public static readonly PACK_SKIP_PIXELS: WebGlConstant = { name: "PACK_SKIP_PIXELS", value: 3332, description: " " };
    public static readonly TEXTURE_BINDING_3D: WebGlConstant = { name: "TEXTURE_BINDING_3D", value: 32874, description: " " };
    public static readonly UNPACK_SKIP_IMAGES: WebGlConstant = { name: "UNPACK_SKIP_IMAGES", value: 32877, description: " " };
    public static readonly UNPACK_IMAGE_HEIGHT: WebGlConstant = { name: "UNPACK_IMAGE_HEIGHT", value: 32878, description: " " };
    public static readonly MAX_3D_TEXTURE_SIZE: WebGlConstant = { name: "MAX_3D_TEXTURE_SIZE", value: 32883, description: " " };
    public static readonly MAX_ELEMENTS_VERTICES: WebGlConstant = { name: "MAX_ELEMENTS_VERTICES", value: 33000, description: " " };
    public static readonly MAX_ELEMENTS_INDICES: WebGlConstant = { name: "MAX_ELEMENTS_INDICES", value: 33001, description: " " };
    public static readonly MAX_TEXTURE_LOD_BIAS: WebGlConstant = { name: "MAX_TEXTURE_LOD_BIAS", value: 34045, description: " " };
    public static readonly MAX_FRAGMENT_UNIFORM_COMPONENTS: WebGlConstant = { name: "MAX_FRAGMENT_UNIFORM_COMPONENTS", value: 35657, description: " " };
    public static readonly MAX_VERTEX_UNIFORM_COMPONENTS: WebGlConstant = { name: "MAX_VERTEX_UNIFORM_COMPONENTS", value: 35658, description: " " };
    public static readonly MAX_ARRAY_TEXTURE_LAYERS: WebGlConstant = { name: "MAX_ARRAY_TEXTURE_LAYERS", value: 35071, description: " " };
    public static readonly MIN_PROGRAM_TEXEL_OFFSET: WebGlConstant = { name: "MIN_PROGRAM_TEXEL_OFFSET", value: 35076, description: " " };
    public static readonly MAX_PROGRAM_TEXEL_OFFSET: WebGlConstant = { name: "MAX_PROGRAM_TEXEL_OFFSET", value: 35077, description: " " };
    public static readonly MAX_VARYING_COMPONENTS: WebGlConstant = { name: "MAX_VARYING_COMPONENTS", value: 35659, description: " " };
    public static readonly FRAGMENT_SHADER_DERIVATIVE_HINT: WebGlConstant = { name: "FRAGMENT_SHADER_DERIVATIVE_HINT", value: 35723, description: " " };
    public static readonly RASTERIZER_DISCARD: WebGlConstant = { name: "RASTERIZER_DISCARD", value: 35977, description: " " };
    public static readonly VERTEX_ARRAY_BINDING: WebGlConstant = { name: "VERTEX_ARRAY_BINDING", value: 34229, description: " " };
    public static readonly MAX_VERTEX_OUTPUT_COMPONENTS: WebGlConstant = { name: "MAX_VERTEX_OUTPUT_COMPONENTS", value: 37154, description: " " };
    public static readonly MAX_FRAGMENT_INPUT_COMPONENTS: WebGlConstant = { name: "MAX_FRAGMENT_INPUT_COMPONENTS", value: 37157, description: " " };
    public static readonly MAX_SERVER_WAIT_TIMEOUT: WebGlConstant = { name: "MAX_SERVER_WAIT_TIMEOUT", value: 37137, description: " " };
    public static readonly MAX_ELEMENT_INDEX: WebGlConstant = { name: "MAX_ELEMENT_INDEX", value: 36203, description: " " };
    public static readonly RED: WebGlConstant = { name: "RED", value: 6403, description: " " };
    public static readonly RGB8: WebGlConstant = { name: "RGB8", value: 32849, description: " " };
    public static readonly RGBA8: WebGlConstant = { name: "RGBA8", value: 32856, description: " " };
    public static readonly RGB10_A2: WebGlConstant = { name: "RGB10_A2", value: 32857, description: " " };
    public static readonly TEXTURE_3D: WebGlConstant = { name: "TEXTURE_3D", value: 32879, description: " " };
    public static readonly TEXTURE_WRAP_R: WebGlConstant = { name: "TEXTURE_WRAP_R", value: 32882, description: " " };
    public static readonly TEXTURE_MIN_LOD: WebGlConstant = { name: "TEXTURE_MIN_LOD", value: 33082, description: " " };
    public static readonly TEXTURE_MAX_LOD: WebGlConstant = { name: "TEXTURE_MAX_LOD", value: 33083, description: " " };
    public static readonly TEXTURE_BASE_LEVEL: WebGlConstant = { name: "TEXTURE_BASE_LEVEL", value: 33084, description: " " };
    public static readonly TEXTURE_MAX_LEVEL: WebGlConstant = { name: "TEXTURE_MAX_LEVEL", value: 33085, description: " " };
    public static readonly TEXTURE_COMPARE_MODE: WebGlConstant = { name: "TEXTURE_COMPARE_MODE", value: 34892, description: " " };
    public static readonly TEXTURE_COMPARE_FUNC: WebGlConstant = { name: "TEXTURE_COMPARE_FUNC", value: 34893, description: " " };
    public static readonly SRGB: WebGlConstant = { name: "SRGB", value: 35904, description: " " };
    public static readonly SRGB8: WebGlConstant = { name: "SRGB8", value: 35905, description: " " };
    public static readonly SRGB8_ALPHA8: WebGlConstant = { name: "SRGB8_ALPHA8", value: 35907, description: " " };
    public static readonly COMPARE_REF_TO_TEXTURE: WebGlConstant = { name: "COMPARE_REF_TO_TEXTURE", value: 34894, description: " " };
    public static readonly RGBA32F: WebGlConstant = { name: "RGBA32F", value: 34836, description: " " };
    public static readonly RGB32F: WebGlConstant = { name: "RGB32F", value: 34837, description: " " };
    public static readonly RGBA16F: WebGlConstant = { name: "RGBA16F", value: 34842, description: " " };
    public static readonly RGB16F: WebGlConstant = { name: "RGB16F", value: 34843, description: " " };
    public static readonly TEXTURE_2D_ARRAY: WebGlConstant = { name: "TEXTURE_2D_ARRAY", value: 35866, description: " " };
    public static readonly TEXTURE_BINDING_2D_ARRAY: WebGlConstant = { name: "TEXTURE_BINDING_2D_ARRAY", value: 35869, description: " " };
    public static readonly R11F_G11F_B10F: WebGlConstant = { name: "R11F_G11F_B10F", value: 35898, description: " " };
    public static readonly RGB9_E5: WebGlConstant = { name: "RGB9_E5", value: 35901, description: " " };
    public static readonly RGBA32UI: WebGlConstant = { name: "RGBA32UI", value: 36208, description: " " };
    public static readonly RGB32UI: WebGlConstant = { name: "RGB32UI", value: 36209, description: " " };
    public static readonly RGBA16UI: WebGlConstant = { name: "RGBA16UI", value: 36214, description: " " };
    public static readonly RGB16UI: WebGlConstant = { name: "RGB16UI", value: 36215, description: " " };
    public static readonly RGBA8UI: WebGlConstant = { name: "RGBA8UI", value: 36220, description: " " };
    public static readonly RGB8UI: WebGlConstant = { name: "RGB8UI", value: 36221, description: " " };
    public static readonly RGBA32I: WebGlConstant = { name: "RGBA32I", value: 36226, description: " " };
    public static readonly RGB32I: WebGlConstant = { name: "RGB32I", value: 36227, description: " " };
    public static readonly RGBA16I: WebGlConstant = { name: "RGBA16I", value: 36232, description: " " };
    public static readonly RGB16I: WebGlConstant = { name: "RGB16I", value: 36233, description: " " };
    public static readonly RGBA8I: WebGlConstant = { name: "RGBA8I", value: 36238, description: " " };
    public static readonly RGB8I: WebGlConstant = { name: "RGB8I", value: 36239, description: " " };
    public static readonly RED_INTEGER: WebGlConstant = { name: "RED_INTEGER", value: 36244, description: " " };
    public static readonly RGB_INTEGER: WebGlConstant = { name: "RGB_INTEGER", value: 36248, description: " " };
    public static readonly RGBA_INTEGER: WebGlConstant = { name: "RGBA_INTEGER", value: 36249, description: " " };
    public static readonly R8: WebGlConstant = { name: "R8", value: 33321, description: " " };
    public static readonly RG8: WebGlConstant = { name: "RG8", value: 33323, description: " " };
    public static readonly R16F: WebGlConstant = { name: "R16F", value: 33325, description: " " };
    public static readonly R32F: WebGlConstant = { name: "R32F", value: 33326, description: " " };
    public static readonly RG16F: WebGlConstant = { name: "RG16F", value: 33327, description: " " };
    public static readonly RG32F: WebGlConstant = { name: "RG32F", value: 33328, description: " " };
    public static readonly R8I: WebGlConstant = { name: "R8I", value: 33329, description: " " };
    public static readonly R8UI: WebGlConstant = { name: "R8UI", value: 33330, description: " " };
    public static readonly R16I: WebGlConstant = { name: "R16I", value: 33331, description: " " };
    public static readonly R16UI: WebGlConstant = { name: "R16UI", value: 33332, description: " " };
    public static readonly R32I: WebGlConstant = { name: "R32I", value: 33333, description: " " };
    public static readonly R32UI: WebGlConstant = { name: "R32UI", value: 33334, description: " " };
    public static readonly RG8I: WebGlConstant = { name: "RG8I", value: 33335, description: " " };
    public static readonly RG8UI: WebGlConstant = { name: "RG8UI", value: 33336, description: " " };
    public static readonly RG16I: WebGlConstant = { name: "RG16I", value: 33337, description: " " };
    public static readonly RG16UI: WebGlConstant = { name: "RG16UI", value: 33338, description: " " };
    public static readonly RG32I: WebGlConstant = { name: "RG32I", value: 33339, description: " " };
    public static readonly RG32UI: WebGlConstant = { name: "RG32UI", value: 33340, description: " " };
    public static readonly R8_SNORM: WebGlConstant = { name: "R8_SNORM", value: 36756, description: " " };
    public static readonly RG8_SNORM: WebGlConstant = { name: "RG8_SNORM", value: 36757, description: " " };
    public static readonly RGB8_SNORM: WebGlConstant = { name: "RGB8_SNORM", value: 36758, description: " " };
    public static readonly RGBA8_SNORM: WebGlConstant = { name: "RGBA8_SNORM", value: 36759, description: " " };
    public static readonly RGB10_A2UI: WebGlConstant = { name: "RGB10_A2UI", value: 36975, description: " " };
    public static readonly TEXTURE_IMMUTABLE_FORMAT: WebGlConstant = { name: "TEXTURE_IMMUTABLE_FORMAT", value: 37167, description: " " };
    public static readonly TEXTURE_IMMUTABLE_LEVELS: WebGlConstant = { name: "TEXTURE_IMMUTABLE_LEVELS", value: 33503, description: " " };
    public static readonly UNSIGNED_INT_2_10_10_10_REV: WebGlConstant = { name: "UNSIGNED_INT_2_10_10_10_REV", value: 33640, description: " " };
    public static readonly UNSIGNED_INT_10F_11F_11F_REV: WebGlConstant = { name: "UNSIGNED_INT_10F_11F_11F_REV", value: 35899, description: " " };
    public static readonly UNSIGNED_INT_5_9_9_9_REV: WebGlConstant = { name: "UNSIGNED_INT_5_9_9_9_REV", value: 35902, description: " " };
    public static readonly FLOAT_32_UNSIGNED_INT_24_8_REV: WebGlConstant = { name: "FLOAT_32_UNSIGNED_INT_24_8_REV", value: 36269, description: " " };
    public static readonly UNSIGNED_INT_24_8: WebGlConstant = { name: "UNSIGNED_INT_24_8", value: 34042, description: " " };
    public static readonly HALF_FLOAT: WebGlConstant = { name: "HALF_FLOAT", value: 5131, description: " " };
    public static readonly RG: WebGlConstant = { name: "RG", value: 33319, description: " " };
    public static readonly RG_INTEGER: WebGlConstant = { name: "RG_INTEGER", value: 33320, description: " " };
    public static readonly INT_2_10_10_10_REV: WebGlConstant = { name: "INT_2_10_10_10_REV", value: 36255, description: " " };
    public static readonly CURRENT_QUERY: WebGlConstant = { name: "CURRENT_QUERY", value: 34917, description: " " };
    public static readonly QUERY_RESULT: WebGlConstant = { name: "QUERY_RESULT", value: 34918, description: " " };
    public static readonly QUERY_RESULT_AVAILABLE: WebGlConstant = { name: "QUERY_RESULT_AVAILABLE", value: 34919, description: " " };
    public static readonly ANY_SAMPLES_PASSED: WebGlConstant = { name: "ANY_SAMPLES_PASSED", value: 35887, description: " " };
    public static readonly ANY_SAMPLES_PASSED_CONSERVATIVE: WebGlConstant = { name: "ANY_SAMPLES_PASSED_CONSERVATIVE", value: 36202, description: " " };
    public static readonly MAX_DRAW_BUFFERS: WebGlConstant = { name: "MAX_DRAW_BUFFERS", value: 34852, description: " " };
    public static readonly DRAW_BUFFER0: WebGlConstant = { name: "DRAW_BUFFER0", value: 34853, description: " " };
    public static readonly DRAW_BUFFER1: WebGlConstant = { name: "DRAW_BUFFER1", value: 34854, description: " " };
    public static readonly DRAW_BUFFER2: WebGlConstant = { name: "DRAW_BUFFER2", value: 34855, description: " " };
    public static readonly DRAW_BUFFER3: WebGlConstant = { name: "DRAW_BUFFER3", value: 34856, description: " " };
    public static readonly DRAW_BUFFER4: WebGlConstant = { name: "DRAW_BUFFER4", value: 34857, description: " " };
    public static readonly DRAW_BUFFER5: WebGlConstant = { name: "DRAW_BUFFER5", value: 34858, description: " " };
    public static readonly DRAW_BUFFER6: WebGlConstant = { name: "DRAW_BUFFER6", value: 34859, description: " " };
    public static readonly DRAW_BUFFER7: WebGlConstant = { name: "DRAW_BUFFER7", value: 34860, description: " " };
    public static readonly DRAW_BUFFER8: WebGlConstant = { name: "DRAW_BUFFER8", value: 34861, description: " " };
    public static readonly DRAW_BUFFER9: WebGlConstant = { name: "DRAW_BUFFER9", value: 34862, description: " " };
    public static readonly DRAW_BUFFER10: WebGlConstant = { name: "DRAW_BUFFER10", value: 34863, description: " " };
    public static readonly DRAW_BUFFER11: WebGlConstant = { name: "DRAW_BUFFER11", value: 34864, description: " " };
    public static readonly DRAW_BUFFER12: WebGlConstant = { name: "DRAW_BUFFER12", value: 34865, description: " " };
    public static readonly DRAW_BUFFER13: WebGlConstant = { name: "DRAW_BUFFER13", value: 34866, description: " " };
    public static readonly DRAW_BUFFER14: WebGlConstant = { name: "DRAW_BUFFER14", value: 34867, description: " " };
    public static readonly DRAW_BUFFER15: WebGlConstant = { name: "DRAW_BUFFER15", value: 34868, description: " " };
    public static readonly MAX_COLOR_ATTACHMENTS: WebGlConstant = { name: "MAX_COLOR_ATTACHMENTS", value: 36063, description: " " };
    public static readonly COLOR_ATTACHMENT1: WebGlConstant = { name: "COLOR_ATTACHMENT1", value: 36065, description: " " };
    public static readonly COLOR_ATTACHMENT2: WebGlConstant = { name: "COLOR_ATTACHMENT2", value: 36066, description: " " };
    public static readonly COLOR_ATTACHMENT3: WebGlConstant = { name: "COLOR_ATTACHMENT3", value: 36067, description: " " };
    public static readonly COLOR_ATTACHMENT4: WebGlConstant = { name: "COLOR_ATTACHMENT4", value: 36068, description: " " };
    public static readonly COLOR_ATTACHMENT5: WebGlConstant = { name: "COLOR_ATTACHMENT5", value: 36069, description: " " };
    public static readonly COLOR_ATTACHMENT6: WebGlConstant = { name: "COLOR_ATTACHMENT6", value: 36070, description: " " };
    public static readonly COLOR_ATTACHMENT7: WebGlConstant = { name: "COLOR_ATTACHMENT7", value: 36071, description: " " };
    public static readonly COLOR_ATTACHMENT8: WebGlConstant = { name: "COLOR_ATTACHMENT8", value: 36072, description: " " };
    public static readonly COLOR_ATTACHMENT9: WebGlConstant = { name: "COLOR_ATTACHMENT9", value: 36073, description: " " };
    public static readonly COLOR_ATTACHMENT10: WebGlConstant = { name: "COLOR_ATTACHMENT10", value: 36074, description: " " };
    public static readonly COLOR_ATTACHMENT11: WebGlConstant = { name: "COLOR_ATTACHMENT11", value: 36075, description: " " };
    public static readonly COLOR_ATTACHMENT12: WebGlConstant = { name: "COLOR_ATTACHMENT12", value: 36076, description: " " };
    public static readonly COLOR_ATTACHMENT13: WebGlConstant = { name: "COLOR_ATTACHMENT13", value: 36077, description: " " };
    public static readonly COLOR_ATTACHMENT14: WebGlConstant = { name: "COLOR_ATTACHMENT14", value: 36078, description: " " };
    public static readonly COLOR_ATTACHMENT15: WebGlConstant = { name: "COLOR_ATTACHMENT15", value: 36079, description: " " };
    public static readonly SAMPLER_3D: WebGlConstant = { name: "SAMPLER_3D", value: 35679, description: " " };
    public static readonly SAMPLER_2D_SHADOW: WebGlConstant = { name: "SAMPLER_2D_SHADOW", value: 35682, description: " " };
    public static readonly SAMPLER_2D_ARRAY: WebGlConstant = { name: "SAMPLER_2D_ARRAY", value: 36289, description: " " };
    public static readonly SAMPLER_2D_ARRAY_SHADOW: WebGlConstant = { name: "SAMPLER_2D_ARRAY_SHADOW", value: 36292, description: " " };
    public static readonly SAMPLER_CUBE_SHADOW: WebGlConstant = { name: "SAMPLER_CUBE_SHADOW", value: 36293, description: " " };
    public static readonly INT_SAMPLER_2D: WebGlConstant = { name: "INT_SAMPLER_2D", value: 36298, description: " " };
    public static readonly INT_SAMPLER_3D: WebGlConstant = { name: "INT_SAMPLER_3D", value: 36299, description: " " };
    public static readonly INT_SAMPLER_CUBE: WebGlConstant = { name: "INT_SAMPLER_CUBE", value: 36300, description: " " };
    public static readonly INT_SAMPLER_2D_ARRAY: WebGlConstant = { name: "INT_SAMPLER_2D_ARRAY", value: 36303, description: " " };
    public static readonly UNSIGNED_INT_SAMPLER_2D: WebGlConstant = { name: "UNSIGNED_INT_SAMPLER_2D", value: 36306, description: " " };
    public static readonly UNSIGNED_INT_SAMPLER_3D: WebGlConstant = { name: "UNSIGNED_INT_SAMPLER_3D", value: 36307, description: " " };
    public static readonly UNSIGNED_INT_SAMPLER_CUBE: WebGlConstant = { name: "UNSIGNED_INT_SAMPLER_CUBE", value: 36308, description: " " };
    public static readonly UNSIGNED_INT_SAMPLER_2D_ARRAY: WebGlConstant = { name: "UNSIGNED_INT_SAMPLER_2D_ARRAY", value: 36311, description: " " };
    public static readonly MAX_SAMPLES: WebGlConstant = { name: "MAX_SAMPLES", value: 36183, description: " " };
    public static readonly SAMPLER_BINDING: WebGlConstant = { name: "SAMPLER_BINDING", value: 35097, description: " " };
    public static readonly PIXEL_PACK_BUFFER: WebGlConstant = { name: "PIXEL_PACK_BUFFER", value: 35051, description: " " };
    public static readonly PIXEL_UNPACK_BUFFER: WebGlConstant = { name: "PIXEL_UNPACK_BUFFER", value: 35052, description: " " };
    public static readonly PIXEL_PACK_BUFFER_BINDING: WebGlConstant = { name: "PIXEL_PACK_BUFFER_BINDING", value: 35053, description: " " };
    public static readonly PIXEL_UNPACK_BUFFER_BINDING: WebGlConstant = { name: "PIXEL_UNPACK_BUFFER_BINDING", value: 35055, description: " " };
    public static readonly COPY_READ_BUFFER: WebGlConstant = { name: "COPY_READ_BUFFER", value: 36662, description: " " };
    public static readonly COPY_WRITE_BUFFER: WebGlConstant = { name: "COPY_WRITE_BUFFER", value: 36663, description: " " };
    public static readonly COPY_READ_BUFFER_BINDING: WebGlConstant = { name: "COPY_READ_BUFFER_BINDING", value: 36662, description: " " };
    public static readonly COPY_WRITE_BUFFER_BINDING: WebGlConstant = { name: "COPY_WRITE_BUFFER_BINDING", value: 36663, description: " " };
    public static readonly FLOAT_MAT2x3: WebGlConstant = { name: "FLOAT_MAT2x3", value: 35685, description: " " };
    public static readonly FLOAT_MAT2x4: WebGlConstant = { name: "FLOAT_MAT2x4", value: 35686, description: " " };
    public static readonly FLOAT_MAT3x2: WebGlConstant = { name: "FLOAT_MAT3x2", value: 35687, description: " " };
    public static readonly FLOAT_MAT3x4: WebGlConstant = { name: "FLOAT_MAT3x4", value: 35688, description: " " };
    public static readonly FLOAT_MAT4x2: WebGlConstant = { name: "FLOAT_MAT4x2", value: 35689, description: " " };
    public static readonly FLOAT_MAT4x3: WebGlConstant = { name: "FLOAT_MAT4x3", value: 35690, description: " " };
    public static readonly UNSIGNED_INT_VEC2: WebGlConstant = { name: "UNSIGNED_INT_VEC2", value: 36294, description: " " };
    public static readonly UNSIGNED_INT_VEC3: WebGlConstant = { name: "UNSIGNED_INT_VEC3", value: 36295, description: " " };
    public static readonly UNSIGNED_INT_VEC4: WebGlConstant = { name: "UNSIGNED_INT_VEC4", value: 36296, description: " " };
    public static readonly UNSIGNED_NORMALIZED: WebGlConstant = { name: "UNSIGNED_NORMALIZED", value: 35863, description: " " };
    public static readonly SIGNED_NORMALIZED: WebGlConstant = { name: "SIGNED_NORMALIZED", value: 36764, description: " " };
    public static readonly VERTEX_ATTRIB_ARRAY_INTEGER: WebGlConstant = { name: "VERTEX_ATTRIB_ARRAY_INTEGER", value: 35069, description: " " };
    public static readonly VERTEX_ATTRIB_ARRAY_DIVISOR: WebGlConstant = { name: "VERTEX_ATTRIB_ARRAY_DIVISOR", value: 35070, description: " " };
    public static readonly TRANSFORM_FEEDBACK_BUFFER_MODE: WebGlConstant = { name: "TRANSFORM_FEEDBACK_BUFFER_MODE", value: 35967, description: " " };
    public static readonly MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS: WebGlConstant = { name: "MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS", value: 35968, description: " " };
    public static readonly TRANSFORM_FEEDBACK_VARYINGS: WebGlConstant = { name: "TRANSFORM_FEEDBACK_VARYINGS", value: 35971, description: " " };
    public static readonly TRANSFORM_FEEDBACK_BUFFER_START: WebGlConstant = { name: "TRANSFORM_FEEDBACK_BUFFER_START", value: 35972, description: " " };
    public static readonly TRANSFORM_FEEDBACK_BUFFER_SIZE: WebGlConstant = { name: "TRANSFORM_FEEDBACK_BUFFER_SIZE", value: 35973, description: " " };
    public static readonly TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN: WebGlConstant = { name: "TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN", value: 35976, description: " " };
    public static readonly MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS: WebGlConstant = { name: "MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS", value: 35978, description: " " };
    public static readonly MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS: WebGlConstant = { name: "MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS", value: 35979, description: " " };
    public static readonly INTERLEAVED_ATTRIBS: WebGlConstant = { name: "INTERLEAVED_ATTRIBS", value: 35980, description: " " };
    public static readonly SEPARATE_ATTRIBS: WebGlConstant = { name: "SEPARATE_ATTRIBS", value: 35981, description: " " };
    public static readonly TRANSFORM_FEEDBACK_BUFFER: WebGlConstant = { name: "TRANSFORM_FEEDBACK_BUFFER", value: 35982, description: " " };
    public static readonly TRANSFORM_FEEDBACK_BUFFER_BINDING: WebGlConstant = { name: "TRANSFORM_FEEDBACK_BUFFER_BINDING", value: 35983, description: " " };
    public static readonly TRANSFORM_FEEDBACK: WebGlConstant = { name: "TRANSFORM_FEEDBACK", value: 36386, description: " " };
    public static readonly TRANSFORM_FEEDBACK_PAUSED: WebGlConstant = { name: "TRANSFORM_FEEDBACK_PAUSED", value: 36387, description: " " };
    public static readonly TRANSFORM_FEEDBACK_ACTIVE: WebGlConstant = { name: "TRANSFORM_FEEDBACK_ACTIVE", value: 36388, description: " " };
    public static readonly TRANSFORM_FEEDBACK_BINDING: WebGlConstant = { name: "TRANSFORM_FEEDBACK_BINDING", value: 36389, description: " " };
    public static readonly FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING: WebGlConstant = { name: "FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING", value: 33296, description: " " };
    public static readonly FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE: WebGlConstant = { name: "FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE", value: 33297, description: " " };
    public static readonly FRAMEBUFFER_ATTACHMENT_RED_SIZE: WebGlConstant = { name: "FRAMEBUFFER_ATTACHMENT_RED_SIZE", value: 33298, description: " " };
    public static readonly FRAMEBUFFER_ATTACHMENT_GREEN_SIZE: WebGlConstant = { name: "FRAMEBUFFER_ATTACHMENT_GREEN_SIZE", value: 33299, description: " " };
    public static readonly FRAMEBUFFER_ATTACHMENT_BLUE_SIZE: WebGlConstant = { name: "FRAMEBUFFER_ATTACHMENT_BLUE_SIZE", value: 33300, description: " " };
    public static readonly FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE: WebGlConstant = { name: "FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE", value: 33301, description: " " };
    public static readonly FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE: WebGlConstant = { name: "FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE", value: 33302, description: " " };
    public static readonly FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE: WebGlConstant = { name: "FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE", value: 33303, description: " " };
    public static readonly FRAMEBUFFER_DEFAULT: WebGlConstant = { name: "FRAMEBUFFER_DEFAULT", value: 33304, description: " " };
    public static readonly DEPTH24_STENCIL8: WebGlConstant = { name: "DEPTH24_STENCIL8", value: 35056, description: " " };
    public static readonly DRAW_FRAMEBUFFER_BINDING: WebGlConstant = { name: "DRAW_FRAMEBUFFER_BINDING", value: 36006, description: " " };
    public static readonly READ_FRAMEBUFFER: WebGlConstant = { name: "READ_FRAMEBUFFER", value: 36008, description: " " };
    public static readonly DRAW_FRAMEBUFFER: WebGlConstant = { name: "DRAW_FRAMEBUFFER", value: 36009, description: " " };
    public static readonly READ_FRAMEBUFFER_BINDING: WebGlConstant = { name: "READ_FRAMEBUFFER_BINDING", value: 36010, description: " " };
    public static readonly RENDERBUFFER_SAMPLES: WebGlConstant = { name: "RENDERBUFFER_SAMPLES", value: 36011, description: " " };
    public static readonly FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER: WebGlConstant = { name: "FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER", value: 36052, description: " " };
    public static readonly FRAMEBUFFER_INCOMPLETE_MULTISAMPLE: WebGlConstant = { name: "FRAMEBUFFER_INCOMPLETE_MULTISAMPLE", value: 36182, description: " " };
    public static readonly UNIFORM_BUFFER: WebGlConstant = { name: "UNIFORM_BUFFER", value: 35345, description: " " };
    public static readonly UNIFORM_BUFFER_BINDING: WebGlConstant = { name: "UNIFORM_BUFFER_BINDING", value: 35368, description: " " };
    public static readonly UNIFORM_BUFFER_START: WebGlConstant = { name: "UNIFORM_BUFFER_START", value: 35369, description: " " };
    public static readonly UNIFORM_BUFFER_SIZE: WebGlConstant = { name: "UNIFORM_BUFFER_SIZE", value: 35370, description: " " };
    public static readonly MAX_VERTEX_UNIFORM_BLOCKS: WebGlConstant = { name: "MAX_VERTEX_UNIFORM_BLOCKS", value: 35371, description: " " };
    public static readonly MAX_FRAGMENT_UNIFORM_BLOCKS: WebGlConstant = { name: "MAX_FRAGMENT_UNIFORM_BLOCKS", value: 35373, description: " " };
    public static readonly MAX_COMBINED_UNIFORM_BLOCKS: WebGlConstant = { name: "MAX_COMBINED_UNIFORM_BLOCKS", value: 35374, description: " " };
    public static readonly MAX_UNIFORM_BUFFER_BINDINGS: WebGlConstant = { name: "MAX_UNIFORM_BUFFER_BINDINGS", value: 35375, description: " " };
    public static readonly MAX_UNIFORM_BLOCK_SIZE: WebGlConstant = { name: "MAX_UNIFORM_BLOCK_SIZE", value: 35376, description: " " };
    public static readonly MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS: WebGlConstant = { name: "MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS", value: 35377, description: " " };
    public static readonly MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS: WebGlConstant = { name: "MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS", value: 35379, description: " " };
    public static readonly UNIFORM_BUFFER_OFFSET_ALIGNMENT: WebGlConstant = { name: "UNIFORM_BUFFER_OFFSET_ALIGNMENT", value: 35380, description: " " };
    public static readonly ACTIVE_UNIFORM_BLOCKS: WebGlConstant = { name: "ACTIVE_UNIFORM_BLOCKS", value: 35382, description: " " };
    public static readonly UNIFORM_TYPE: WebGlConstant = { name: "UNIFORM_TYPE", value: 35383, description: " " };
    public static readonly UNIFORM_SIZE: WebGlConstant = { name: "UNIFORM_SIZE", value: 35384, description: " " };
    public static readonly UNIFORM_BLOCK_INDEX: WebGlConstant = { name: "UNIFORM_BLOCK_INDEX", value: 35386, description: " " };
    public static readonly UNIFORM_OFFSET: WebGlConstant = { name: "UNIFORM_OFFSET", value: 35387, description: " " };
    public static readonly UNIFORM_ARRAY_STRIDE: WebGlConstant = { name: "UNIFORM_ARRAY_STRIDE", value: 35388, description: " " };
    public static readonly UNIFORM_MATRIX_STRIDE: WebGlConstant = { name: "UNIFORM_MATRIX_STRIDE", value: 35389, description: " " };
    public static readonly UNIFORM_IS_ROW_MAJOR: WebGlConstant = { name: "UNIFORM_IS_ROW_MAJOR", value: 35390, description: " " };
    public static readonly UNIFORM_BLOCK_BINDING: WebGlConstant = { name: "UNIFORM_BLOCK_BINDING", value: 35391, description: " " };
    public static readonly UNIFORM_BLOCK_DATA_SIZE: WebGlConstant = { name: "UNIFORM_BLOCK_DATA_SIZE", value: 35392, description: " " };
    public static readonly UNIFORM_BLOCK_ACTIVE_UNIFORMS: WebGlConstant = { name: "UNIFORM_BLOCK_ACTIVE_UNIFORMS", value: 35394, description: " " };
    public static readonly UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES: WebGlConstant = { name: "UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES", value: 35395, description: " " };
    public static readonly UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER: WebGlConstant = { name: "UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER", value: 35396, description: " " };
    public static readonly UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER: WebGlConstant = { name: "UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER", value: 35398, description: " " };
    public static readonly OBJECT_TYPE: WebGlConstant = { name: "OBJECT_TYPE", value: 37138, description: " " };
    public static readonly SYNC_CONDITION: WebGlConstant = { name: "SYNC_CONDITION", value: 37139, description: " " };
    public static readonly SYNC_STATUS: WebGlConstant = { name: "SYNC_STATUS", value: 37140, description: " " };
    public static readonly SYNC_FLAGS: WebGlConstant = { name: "SYNC_FLAGS", value: 37141, description: " " };
    public static readonly SYNC_FENCE: WebGlConstant = { name: "SYNC_FENCE", value: 37142, description: " " };
    public static readonly SYNC_GPU_COMMANDS_COMPLETE: WebGlConstant = { name: "SYNC_GPU_COMMANDS_COMPLETE", value: 37143, description: " " };
    public static readonly UNSIGNALED: WebGlConstant = { name: "UNSIGNALED", value: 37144, description: " " };
    public static readonly SIGNALED: WebGlConstant = { name: "SIGNALED", value: 37145, description: " " };
    public static readonly ALREADY_SIGNALED: WebGlConstant = { name: "ALREADY_SIGNALED", value: 37146, description: " " };
    public static readonly TIMEOUT_EXPIRED: WebGlConstant = { name: "TIMEOUT_EXPIRED", value: 37147, description: " " };
    public static readonly CONDITION_SATISFIED: WebGlConstant = { name: "CONDITION_SATISFIED", value: 37148, description: " " };
    public static readonly WAIT_FAILED: WebGlConstant = { name: "WAIT_FAILED", value: 37149, description: " " };
    public static readonly SYNC_FLUSH_COMMANDS_BIT: WebGlConstant = { name: "SYNC_FLUSH_COMMANDS_BIT", value: 1, description: " " };
    public static readonly COLOR: WebGlConstant = { name: "COLOR", value: 6144, description: " " };
    public static readonly DEPTH: WebGlConstant = { name: "DEPTH", value: 6145, description: " " };
    public static readonly STENCIL: WebGlConstant = { name: "STENCIL", value: 6146, description: " " };
    public static readonly MIN: WebGlConstant = { name: "MIN", value: 32775, description: " " };
    public static readonly MAX: WebGlConstant = { name: "MAX", value: 32776, description: " " };
    public static readonly DEPTH_COMPONENT24: WebGlConstant = { name: "DEPTH_COMPONENT24", value: 33190, description: " " };
    public static readonly STREAM_READ: WebGlConstant = { name: "STREAM_READ", value: 35041, description: " " };
    public static readonly STREAM_COPY: WebGlConstant = { name: "STREAM_COPY", value: 35042, description: " " };
    public static readonly STATIC_READ: WebGlConstant = { name: "STATIC_READ", value: 35045, description: " " };
    public static readonly STATIC_COPY: WebGlConstant = { name: "STATIC_COPY", value: 35046, description: " " };
    public static readonly DYNAMIC_READ: WebGlConstant = { name: "DYNAMIC_READ", value: 35049, description: " " };
    public static readonly DYNAMIC_COPY: WebGlConstant = { name: "DYNAMIC_COPY", value: 35050, description: " " };
    public static readonly DEPTH_COMPONENT32F: WebGlConstant = { name: "DEPTH_COMPONENT32F", value: 36012, description: " " };
    public static readonly DEPTH32F_STENCIL8: WebGlConstant = { name: "DEPTH32F_STENCIL8", value: 36013, description: " " };
    public static readonly INVALID_INDEX: WebGlConstant = { name: "INVALID_INDEX", value: 4294967295, description: " " };
    public static readonly TIMEOUT_IGNORED: WebGlConstant = { name: "TIMEOUT_IGNORED", value: -1, description: " " };
    public static readonly MAX_CLIENT_WAIT_TIMEOUT_WEBGL: WebGlConstant = { name: "MAX_CLIENT_WAIT_TIMEOUT_WEBGL", value: 37447, description: " " };
    // extensions
    public static readonly VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE: WebGlConstant = { name: "VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE", value: 35070, description: "Describes the frequency divisor used for instanced rendering.", extensionName: "ANGLE_instanced_arrays" };
    public static readonly UNMASKED_VENDOR_WEBGL: WebGlConstant = { name: "UNMASKED_VENDOR_WEBGL", value: 37445, description: "Passed to getParameter to get the vendor string of the graphics driver.", extensionName: "ANGLE_instanced_arrays" };
    public static readonly UNMASKED_RENDERER_WEBGL: WebGlConstant = { name: "UNMASKED_RENDERER_WEBGL", value: 37446, description: "Passed to getParameter to get the renderer string of the graphics driver.", extensionName: "WEBGL_debug_renderer_info" };
    public static readonly MAX_TEXTURE_MAX_ANISOTROPY_EXT: WebGlConstant = { name: "MAX_TEXTURE_MAX_ANISOTROPY_EXT", value: 34047, description: "Returns the maximum available anisotropy.", extensionName: "EXT_texture_filter_anisotropic" };
    public static readonly TEXTURE_MAX_ANISOTROPY_EXT: WebGlConstant = { name: "TEXTURE_MAX_ANISOTROPY_EXT", value: 34046, description: "Passed to texParameter to set the desired maximum anisotropy for a texture.", extensionName: "EXT_texture_filter_anisotropic" };
    public static readonly COMPRESSED_RGB_S3TC_DXT1_EXT: WebGlConstant = { name: "COMPRESSED_RGB_S3TC_DXT1_EXT", value: 33776, description: "A DXT1-compressed image in an RGB image format.", extensionName: "WEBGL_compressed_texture_s3tc" };
    public static readonly COMPRESSED_RGBA_S3TC_DXT1_EXT: WebGlConstant = { name: "COMPRESSED_RGBA_S3TC_DXT1_EXT", value: 33777, description: "A DXT1-compressed image in an RGB image format with a simple on/off alpha value.", extensionName: "WEBGL_compressed_texture_s3tc" };
    public static readonly COMPRESSED_RGBA_S3TC_DXT3_EXT: WebGlConstant = { name: "COMPRESSED_RGBA_S3TC_DXT3_EXT", value: 33778, description: "A DXT3-compressed image in an RGBA image format. Compared to a 32-bit RGBA texture, it offers 4:1 compression.", extensionName: "WEBGL_compressed_texture_s3tc" };
    public static readonly COMPRESSED_RGBA_S3TC_DXT5_EXT: WebGlConstant = { name: "COMPRESSED_RGBA_S3TC_DXT5_EXT", value: 33779, description: "A DXT5-compressed image in an RGBA image format. It also provides a 4:1 compression, but differs to the DXT3 compression in how the alpha compression is done.", extensionName: "WEBGL_compressed_texture_s3tc" };
    public static readonly COMPRESSED_R11_EAC: WebGlConstant = { name: "COMPRESSED_R11_EAC", value: 37488, description: "One-channel (red) unsigned format compression.", extensionName: "WEBGL_compressed_texture_etc" };
    public static readonly COMPRESSED_SIGNED_R11_EAC: WebGlConstant = { name: "COMPRESSED_SIGNED_R11_EAC", value: 37489, description: "One-channel (red) signed format compression.", extensionName: "WEBGL_compressed_texture_etc" };
    public static readonly COMPRESSED_RG11_EAC: WebGlConstant = { name: "COMPRESSED_RG11_EAC", value: 37490, description: "Two-channel (red and green) unsigned format compression.", extensionName: "WEBGL_compressed_texture_etc" };
    public static readonly COMPRESSED_SIGNED_RG11_EAC: WebGlConstant = { name: "COMPRESSED_SIGNED_RG11_EAC", value: 37491, description: "Two-channel (red and green) signed format compression.", extensionName: "WEBGL_compressed_texture_etc" };
    public static readonly COMPRESSED_RGB8_ETC2: WebGlConstant = { name: "COMPRESSED_RGB8_ETC2", value: 37492, description: "Compresses RBG8 data with no alpha channel.", extensionName: "WEBGL_compressed_texture_etc" };
    public static readonly COMPRESSED_RGBA8_ETC2_EAC: WebGlConstant = { name: "COMPRESSED_RGBA8_ETC2_EAC", value: 37493, description: "Compresses RGBA8 data. The RGB part is encoded the same as RGB_ETC2, but the alpha part is encoded separately.", extensionName: "WEBGL_compressed_texture_etc" };
    public static readonly COMPRESSED_SRGB8_ETC2: WebGlConstant = { name: "COMPRESSED_SRGB8_ETC2", value: 37494, description: "Compresses sRBG8 data with no alpha channel.", extensionName: "WEBGL_compressed_texture_etc" };
    public static readonly COMPRESSED_SRGB8_ALPHA8_ETC2_EAC: WebGlConstant = { name: "COMPRESSED_SRGB8_ALPHA8_ETC2_EAC", value: 37495, description: "Compresses sRGBA8 data. The sRGB part is encoded the same as SRGB_ETC2, but the alpha part is encoded separately.", extensionName: "WEBGL_compressed_texture_etc" };
    public static readonly COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2: WebGlConstant = { name: "COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2", value: 37496, description: "Similar to RGB8_ETC, but with ability to punch through the alpha channel, which means to make it completely opaque or transparent.", extensionName: "WEBGL_compressed_texture_etc" };
    public static readonly COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2: WebGlConstant = { name: "COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2", value: 37497, description: "Similar to SRGB8_ETC, but with ability to punch through the alpha channel, which means to make it completely opaque or transparent.", extensionName: "WEBGL_compressed_texture_etc" };
    public static readonly COMPRESSED_RGB_PVRTC_4BPPV1_IMG: WebGlConstant = { name: "COMPRESSED_RGB_PVRTC_4BPPV1_IMG", value: 35840, description: "RGB compression in 4-bit mode. One block for each 4×4 pixels.", extensionName: "WEBGL_compressed_texture_pvrtc" };
    public static readonly COMPRESSED_RGBA_PVRTC_4BPPV1_IMG: WebGlConstant = { name: "COMPRESSED_RGBA_PVRTC_4BPPV1_IMG", value: 35842, description: "RGBA compression in 4-bit mode. One block for each 4×4 pixels.", extensionName: "WEBGL_compressed_texture_pvrtc" };
    public static readonly COMPRESSED_RGB_PVRTC_2BPPV1_IMG: WebGlConstant = { name: "COMPRESSED_RGB_PVRTC_2BPPV1_IMG", value: 35841, description: "RGB compression in 2-bit mode. One block for each 8×4 pixels.", extensionName: "WEBGL_compressed_texture_pvrtc" };
    public static readonly COMPRESSED_RGBA_PVRTC_2BPPV1_IMG: WebGlConstant = { name: "COMPRESSED_RGBA_PVRTC_2BPPV1_IMG", value: 35843, description: "RGBA compression in 2-bit mode. One block for each 8×4 pixe", extensionName: "WEBGL_compressed_texture_pvrtc" };
    public static readonly COMPRESSED_RGB_ETC1_WEBGL: WebGlConstant = { name: "COMPRESSED_RGB_ETC1_WEBGL", value: 36196, description: "Compresses 24-bit RGB data with no alpha channel.", extensionName: "WEBGL_compressed_texture_etc1" };
    public static readonly COMPRESSED_RGB_ATC_WEBGL: WebGlConstant = { name: "COMPRESSED_RGB_ATC_WEBGL", value: 35986, description: "Compresses RGB textures with no alpha channel.", extensionName: "WEBGL_compressed_texture_atc" };
    public static readonly COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL: WebGlConstant = { name: "COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL", value: 35986, description: "Compresses RGBA textures using explicit alpha encoding (useful when alpha transitions are sharp).", extensionName: "WEBGL_compressed_texture_atc" };
    public static readonly COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL: WebGlConstant = { name: "COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL", value: 34798, description: "Compresses RGBA textures using interpolated alpha encoding (useful when alpha transitions are gradient).", extensionName: "WEBGL_compressed_texture_atc" };
    public static readonly UNSIGNED_INT_24_8_WEBGL: WebGlConstant = { name: "UNSIGNED_INT_24_8_WEBGL", value: 34042, description: "Unsigned integer type for 24-bit depth texture data.", extensionName: "WEBGL_depth_texture" };
    public static readonly HALF_FLOAT_OES: WebGlConstant = { name: "HALF_FLOAT_OES", value: 36193, description: "Half floating-point type (16-bit).", extensionName: "OES_texture_half_float" };
    // public static readonly RGBA32F_EXT: WebGlConstant = { name: "RGBA32F_EXT", value: 34836, description: "RGBA 32-bit floating-point color-renderable format.", extensionName: "WEBGL_color_buffer_float" };
    // public static readonly RGB32F_EXT: WebGlConstant = { name: "RGB32F_EXT", value: 34837, description: "RGB 32-bit floating-point color-renderable format.", extensionName: "WEBGL_color_buffer_float" };
    public static readonly FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT: WebGlConstant = { name: "FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT", value: 33297, description: " ", extensionName: "WEBGL_color_buffer_float" };
    public static readonly UNSIGNED_NORMALIZED_EXT: WebGlConstant = { name: "UNSIGNED_NORMALIZED_EXT", value: 35863, description: " ", extensionName: "WEBGL_color_buffer_float" };
    public static readonly MIN_EXT: WebGlConstant = { name: "MIN_EXT", value: 32775, description: "Produces the minimum color components of the source and destination colors.", extensionName: "EXT_blend_minmax" };
    public static readonly MAX_EXT: WebGlConstant = { name: "MAX_EXT", value: 32776, description: "Produces the maximum color components of the source and destination colors.", extensionName: "EXT_blend_minmax" };
    public static readonly SRGB_EXT: WebGlConstant = { name: "SRGB_EXT", value: 35904, description: "Unsized sRGB format that leaves the precision up to the driver.", extensionName: "EXT_sRGB" };
    public static readonly SRGB_ALPHA_EXT: WebGlConstant = { name: "SRGB_ALPHA_EXT", value: 35906, description: "Unsized sRGB format with unsized alpha component.", extensionName: "EXT_sRGB" };
    public static readonly SRGB8_ALPHA8_EXT: WebGlConstant = { name: "SRGB8_ALPHA8_EXT", value: 35907, description: "Sized (8-bit) sRGB and alpha formats.", extensionName: "EXT_sRGB" };
    public static readonly FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT: WebGlConstant = { name: "FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT", value: 33296, description: "Returns the framebuffer color encoding.", extensionName: "EXT_sRGB" };
    public static readonly FRAGMENT_SHADER_DERIVATIVE_HINT_OES: WebGlConstant = { name: "FRAGMENT_SHADER_DERIVATIVE_HINT_OES", value: 35723, description: "Indicates the accuracy of the derivative calculation for the GLSL built-in functions: dFdx, dFdy, and fwidth.", extensionName: "OES_standard_derivatives" };
    public static readonly COLOR_ATTACHMENT0_WEBGL: WebGlConstant = { name: "COLOR_ATTACHMENT0_WEBGL", value: 36064, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    public static readonly COLOR_ATTACHMENT1_WEBGL: WebGlConstant = { name: "COLOR_ATTACHMENT1_WEBGL", value: 36065, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    public static readonly COLOR_ATTACHMENT2_WEBGL: WebGlConstant = { name: "COLOR_ATTACHMENT2_WEBGL", value: 36066, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    public static readonly COLOR_ATTACHMENT3_WEBGL: WebGlConstant = { name: "COLOR_ATTACHMENT3_WEBGL", value: 36067, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    public static readonly COLOR_ATTACHMENT4_WEBGL: WebGlConstant = { name: "COLOR_ATTACHMENT4_WEBGL", value: 36068, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    public static readonly COLOR_ATTACHMENT5_WEBGL: WebGlConstant = { name: "COLOR_ATTACHMENT5_WEBGL", value: 36069, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    public static readonly COLOR_ATTACHMENT6_WEBGL: WebGlConstant = { name: "COLOR_ATTACHMENT6_WEBGL", value: 36070, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    public static readonly COLOR_ATTACHMENT7_WEBGL: WebGlConstant = { name: "COLOR_ATTACHMENT7_WEBGL", value: 36071, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    public static readonly COLOR_ATTACHMENT8_WEBGL: WebGlConstant = { name: "COLOR_ATTACHMENT8_WEBGL", value: 36072, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    public static readonly COLOR_ATTACHMENT9_WEBGL: WebGlConstant = { name: "COLOR_ATTACHMENT9_WEBGL", value: 36073, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    public static readonly COLOR_ATTACHMENT10_WEBGL: WebGlConstant = { name: "COLOR_ATTACHMENT10_WEBGL", value: 36074, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    public static readonly COLOR_ATTACHMENT11_WEBGL: WebGlConstant = { name: "COLOR_ATTACHMENT11_WEBGL", value: 36075, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    public static readonly COLOR_ATTACHMENT12_WEBGL: WebGlConstant = { name: "COLOR_ATTACHMENT12_WEBGL", value: 36076, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    public static readonly COLOR_ATTACHMENT13_WEBGL: WebGlConstant = { name: "COLOR_ATTACHMENT13_WEBGL", value: 36077, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    public static readonly COLOR_ATTACHMENT14_WEBGL: WebGlConstant = { name: "COLOR_ATTACHMENT14_WEBGL", value: 36078, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    public static readonly COLOR_ATTACHMENT15_WEBGL: WebGlConstant = { name: "COLOR_ATTACHMENT15_WEBGL", value: 36079, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
    public static readonly DRAW_BUFFER0_WEBGL: WebGlConstant = { name: "DRAW_BUFFER0_WEBGL", value: 34853, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    public static readonly DRAW_BUFFER1_WEBGL: WebGlConstant = { name: "DRAW_BUFFER1_WEBGL", value: 34854, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    public static readonly DRAW_BUFFER2_WEBGL: WebGlConstant = { name: "DRAW_BUFFER2_WEBGL", value: 34855, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    public static readonly DRAW_BUFFER3_WEBGL: WebGlConstant = { name: "DRAW_BUFFER3_WEBGL", value: 34856, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    public static readonly DRAW_BUFFER4_WEBGL: WebGlConstant = { name: "DRAW_BUFFER4_WEBGL", value: 34857, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    public static readonly DRAW_BUFFER5_WEBGL: WebGlConstant = { name: "DRAW_BUFFER5_WEBGL", value: 34858, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    public static readonly DRAW_BUFFER6_WEBGL: WebGlConstant = { name: "DRAW_BUFFER6_WEBGL", value: 34859, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    public static readonly DRAW_BUFFER7_WEBGL: WebGlConstant = { name: "DRAW_BUFFER7_WEBGL", value: 34860, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    public static readonly DRAW_BUFFER8_WEBGL: WebGlConstant = { name: "DRAW_BUFFER8_WEBGL", value: 34861, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    public static readonly DRAW_BUFFER9_WEBGL: WebGlConstant = { name: "DRAW_BUFFER9_WEBGL", value: 34862, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    public static readonly DRAW_BUFFER10_WEBGL: WebGlConstant = { name: "DRAW_BUFFER10_WEBGL", value: 34863, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    public static readonly DRAW_BUFFER11_WEBGL: WebGlConstant = { name: "DRAW_BUFFER11_WEBGL", value: 34864, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    public static readonly DRAW_BUFFER12_WEBGL: WebGlConstant = { name: "DRAW_BUFFER12_WEBGL", value: 34865, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    public static readonly DRAW_BUFFER13_WEBGL: WebGlConstant = { name: "DRAW_BUFFER13_WEBGL", value: 34866, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    public static readonly DRAW_BUFFER14_WEBGL: WebGlConstant = { name: "DRAW_BUFFER14_WEBGL", value: 34867, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    public static readonly DRAW_BUFFER15_WEBGL: WebGlConstant = { name: "DRAW_BUFFER15_WEBGL", value: 34868, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
    public static readonly MAX_COLOR_ATTACHMENTS_WEBGL: WebGlConstant = { name: "MAX_COLOR_ATTACHMENTS_WEBGL", value: 36063, description: "Maximum number of framebuffer color attachment points", extensionName: "WEBGL_draw_buffers" };
    public static readonly MAX_DRAW_BUFFERS_WEBGL: WebGlConstant = { name: "MAX_DRAW_BUFFERS_WEBGL", value: 34852, description: "Maximum number of draw buffers", extensionName: "WEBGL_draw_buffers" };
    public static readonly VERTEX_ARRAY_BINDING_OES: WebGlConstant = { name: "VERTEX_ARRAY_BINDING_OES", value: 34229, description: "The bound vertex array object (VAO).", extensionName: "VERTEX_ARRAY_BINDING_OES" };
    public static readonly QUERY_COUNTER_BITS_EXT: WebGlConstant = { name: "QUERY_COUNTER_BITS_EXT", value: 34916, description: "The number of bits used to hold the query result for the given target.", extensionName: "EXT_disjoint_timer_query" };
    public static readonly CURRENT_QUERY_EXT: WebGlConstant = { name: "CURRENT_QUERY_EXT", value: 34917, description: "The currently active query.", extensionName: "EXT_disjoint_timer_query" };
    public static readonly QUERY_RESULT_EXT: WebGlConstant = { name: "QUERY_RESULT_EXT", value: 34918, description: "The query result.", extensionName: "EXT_disjoint_timer_query" };
    public static readonly QUERY_RESULT_AVAILABLE_EXT: WebGlConstant = { name: "QUERY_RESULT_AVAILABLE_EXT", value: 34919, description: "A Boolean indicating whether or not a query result is available.", extensionName: "EXT_disjoint_timer_query" };
    public static readonly TIME_ELAPSED_EXT: WebGlConstant = { name: "TIME_ELAPSED_EXT", value: 35007, description: "Elapsed time (in nanoseconds).", extensionName: "EXT_disjoint_timer_query" };
    public static readonly TIMESTAMP_EXT: WebGlConstant = { name: "TIMESTAMP_EXT", value: 36392, description: "The current time.", extensionName: "EXT_disjoint_timer_query" };
    public static readonly GPU_DISJOINT_EXT: WebGlConstant = { name: "GPU_DISJOINT_EXT", value: 36795, description: "A Boolean indicating whether or not the GPU performed any disjoint operation.", extensionName: "EXT_disjoint_timer_query" };

    public static isWebGlConstant(value: number): boolean {
        return WebGlConstantsByValue[value] !== null && WebGlConstantsByValue[value] !== undefined;
    }

    public static stringifyWebGlConstant(value: number, command: string): string {
        if (value === undefined || value === null) {
            return "";
        }

        if (value === 0) {
            const meaning = this.zeroMeaningByCommand[command];
            if (meaning) {
                return meaning;
            }

            return "0";
        }
        else if (value === 1) {
            const meaning = this.oneMeaningByCommand[command];
            if (meaning) {
                return meaning;
            }

            return "1";
        }

        const webglConstant = WebGlConstantsByValue[value];
        return webglConstant ? webglConstant.name : value + "";
    }

    protected static readonly zeroMeaningByCommand: { [commandName: string]: string } = {
        getError: "NO_ERROR",
        blendFunc: "ZERO",
        blendFuncSeparate: "ZERO",
        readBuffer: "NONE",
        getFramebufferAttachmentParameter: "NONE",
        texParameterf: "NONE",
        texParameteri: "NONE",
        drawArrays: "POINTS",
        drawElements: "POINTS",
        drawArraysInstanced: "POINTS",
        drawArraysInstancedAngle: "POINTS",
        drawBuffers: "POINTS",
        drawElementsInstanced: "POINTS",
        drawRangeElements: "POINTS",
    };

    protected static readonly oneMeaningByCommand: { [commandName: string]: string } = {
        blendFunc: "ONE",
        blendFuncSeparate: "ONE",
        drawArrays: "LINES",
        drawElements: "LINES",
        drawArraysInstanced: "LINES",
        drawArraysInstancedAngle: "LINES",
        drawBuffers: "LINES",
        drawElementsInstanced: "LINES",
        drawRangeElements: "LINES",
    };
}

export interface WebGlConstantsByName {
    [name: string]: WebGlConstant;
}

export interface WebGlConstantsByValue {
    [value: number]: WebGlConstant;
}

export const WebGlConstantsByName: WebGlConstantsByName = {};

export const WebGlConstantsByValue: WebGlConstantsByValue = {};

(function init() {
    for (const name in WebGlConstants) {
        if (WebGlConstants.hasOwnProperty(name)) {
            const constant = (WebGlConstants as any)[name];
            WebGlConstantsByName[constant.name] = constant;
            WebGlConstantsByValue[constant.value] = constant;
        }
    }
})();
