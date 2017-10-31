var SPECTOR;
(function (SPECTOR) {
    var Utils;
    (function (Utils) {
        var Event = /** @class */ (function () {
            function Event() {
                this.callbacks = [];
                this.counter = -1;
            }
            Event.prototype.add = function (callback, context) {
                this.counter++;
                if (context) {
                    callback = callback.bind(context);
                }
                this.callbacks[this.counter] = callback;
                return this.counter;
            };
            Event.prototype.remove = function (id) {
                delete this.callbacks[id];
            };
            Event.prototype.clear = function () {
                this.callbacks = {};
            };
            Event.prototype.trigger = function (value) {
                for (var key in this.callbacks) {
                    if (this.callbacks.hasOwnProperty(key)) {
                        this.callbacks[key](value);
                    }
                }
            };
            return Event;
        }());
        Utils.Event = Event;
    })(Utils = SPECTOR.Utils || (SPECTOR.Utils = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel["noLog"] = 0] = "noLog";
        LogLevel[LogLevel["error"] = 1] = "error";
        LogLevel[LogLevel["warning"] = 2] = "warning";
        LogLevel[LogLevel["info"] = 3] = "info";
    })(LogLevel = SPECTOR.LogLevel || (SPECTOR.LogLevel = {}));
})(SPECTOR || (SPECTOR = {}));
(function (SPECTOR) {
    var Utils;
    (function (Utils) {
        var ConsoleLogger = /** @class */ (function () {
            function ConsoleLogger(level) {
                if (level === void 0) { level = SPECTOR.LogLevel.warning; }
                this.level = level;
            }
            ConsoleLogger.prototype.setLevel = function (level) {
                this.level = level;
            };
            ConsoleLogger.prototype.error = function (msg) {
                var restOfMsg = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    restOfMsg[_i - 1] = arguments[_i];
                }
                if (this.level > 0) {
                    // tslint:disable-next-line:no-console
                    console.error(msg, restOfMsg);
                }
            };
            ConsoleLogger.prototype.warn = function (msg) {
                var restOfMsg = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    restOfMsg[_i - 1] = arguments[_i];
                }
                if (this.level > 1) {
                    // tslint:disable-next-line:no-console
                    console.warn(msg, restOfMsg);
                }
            };
            ConsoleLogger.prototype.info = function (msg) {
                var restOfMsg = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    restOfMsg[_i - 1] = arguments[_i];
                }
                if (this.level > 2) {
                    // tslint:disable-next-line:no-console
                    console.log(msg, restOfMsg);
                }
            };
            return ConsoleLogger;
        }());
        Utils.ConsoleLogger = ConsoleLogger;
    })(Utils = SPECTOR.Utils || (SPECTOR.Utils = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Utils;
    (function (Utils) {
        var StackTrace = /** @class */ (function () {
            function StackTrace() {
            }
            StackTrace.prototype.getStackTrace = function (removeFirstNCalls, removeLastNCalls) {
                if (removeFirstNCalls === void 0) { removeFirstNCalls = 0; }
                if (removeLastNCalls === void 0) { removeLastNCalls = 0; }
                var callstack = [];
                try {
                    throw new Error("Errorator.");
                }
                catch (err) {
                    if (err.stack) {
                        var lines = err.stack.split("\n");
                        for (var i = 0, len = lines.length; i < len; i++) {
                            if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
                                callstack.push(lines[i]);
                            }
                            else if (lines[i].indexOf("    at ") === 0) {
                                lines[i] = lines[i].replace("    at ", "");
                                callstack.push(lines[i]);
                            }
                            else if (lines[i].indexOf("/<@http") !== -1) {
                                lines[i] = lines[i].substring(lines[i].indexOf("/<@http") + 3);
                                callstack.push(lines[i]);
                            }
                            else if (lines[i].indexOf("@http") !== -1) {
                                lines[i] = lines[i].replace("@http", " (http");
                                lines[i] = lines[i] + ")";
                                callstack.push(lines[i]);
                            }
                        }
                    }
                    else if (err.message) {
                        var lines = err.message.split("\n");
                        for (var i = 0, len = lines.length; i < len; i++) {
                            if (lines[i].match(/^\s*[A-Za-z0-9\-_\$]+\(/)) {
                                var entry = lines[i];
                                // Append next line also since it has the file info
                                if (lines[i + 1]) {
                                    entry += " at " + lines[i + 1];
                                    i++;
                                }
                                callstack.push(entry);
                            }
                        }
                    }
                }
                if (!callstack) {
                    // tslint:disable-next-line:no-arg
                    var currentFunction = arguments.callee.caller;
                    while (currentFunction) {
                        var fn = currentFunction.toString();
                        var fname = fn.substring(fn.indexOf("function") + 8, fn.indexOf("")) || "anonymous";
                        callstack.push(fname);
                        currentFunction = currentFunction.caller;
                    }
                }
                // Remove this call and Spy.
                if (callstack) {
                    callstack.shift();
                    for (var i = 0; i < removeFirstNCalls; i++) {
                        if (callstack.length > 0) {
                            callstack.shift();
                        }
                        else {
                            break;
                        }
                    }
                    for (var i = 0; i < removeLastNCalls; i++) {
                        if (callstack.length > 0) {
                            callstack.pop();
                        }
                        else {
                            break;
                        }
                    }
                }
                return callstack;
            };
            return StackTrace;
        }());
        Utils.StackTrace = StackTrace;
    })(Utils = SPECTOR.Utils || (SPECTOR.Utils = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Utils;
    (function (Utils) {
        var Time = /** @class */ (function () {
            function Time() {
                if (window.performance && window.performance.now) {
                    this.nowFunction = this.dateBasedPerformanceNow.bind(this);
                }
                else {
                    var date = new Date();
                    this.nowFunction = date.getTime.bind(date);
                }
            }
            Time.prototype.dateBasedPerformanceNow = function () {
                return performance.timing.navigationStart + performance.now();
            };
            Object.defineProperty(Time.prototype, "now", {
                get: function () {
                    return this.nowFunction();
                },
                enumerable: true,
                configurable: true
            });
            return Time;
        }());
        Utils.Time = Time;
    })(Utils = SPECTOR.Utils || (SPECTOR.Utils = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    function merge(first, second) {
        var result = {};
        for (var id in first) {
            if (first.hasOwnProperty(id)) {
                result[id] = first[id];
            }
        }
        for (var id in second) {
            if (!result.hasOwnProperty(id)) {
                result[id] = second[id];
            }
        }
        return result;
    }
    SPECTOR.merge = merge;
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var CaptureComparisonStatus;
    (function (CaptureComparisonStatus) {
        CaptureComparisonStatus[CaptureComparisonStatus["Equal"] = 0] = "Equal";
        CaptureComparisonStatus[CaptureComparisonStatus["Different"] = 1] = "Different";
        CaptureComparisonStatus[CaptureComparisonStatus["OnlyInA"] = 2] = "OnlyInA";
        CaptureComparisonStatus[CaptureComparisonStatus["OnlyInB"] = 3] = "OnlyInB";
    })(CaptureComparisonStatus = SPECTOR.CaptureComparisonStatus || (SPECTOR.CaptureComparisonStatus = {}));
})(SPECTOR || (SPECTOR = {}));
// tslint:disable:max-file-line-count
// tslint:disable:interface-name
// tslint:disable:max-line-length
// tslint:disable:variable-name
// Generated file disable rules.
var SPECTOR;
(function (SPECTOR) {
    var WebGlConstants = /** @class */ (function () {
        function WebGlConstants() {
        }
        WebGlConstants.isWebGlConstant = function (value) {
            return SPECTOR.WebGlConstantsByValue[value] !== null && SPECTOR.WebGlConstantsByValue[value] !== undefined;
        };
        WebGlConstants.stringifyWebGlConstant = function (value, command) {
            if (value === 0) {
                var meaning = this.zeroMeaningByCommand[command];
                if (meaning) {
                    return meaning;
                }
                return "0";
            }
            else if (value === 1) {
                var meaning = this.oneMeaningByCommand[command];
                if (meaning) {
                    return meaning;
                }
                return "1";
            }
            var webglConstant = SPECTOR.WebGlConstantsByValue[value];
            return webglConstant ? webglConstant.name : value + "";
        };
        WebGlConstants.DEPTH_BUFFER_BIT = { name: "DEPTH_BUFFER_BIT", value: 256, description: "Passed to clear to clear the current depth buffer." };
        WebGlConstants.STENCIL_BUFFER_BIT = { name: "STENCIL_BUFFER_BIT", value: 1024, description: "Passed to clear to clear the current stencil buffer." };
        WebGlConstants.COLOR_BUFFER_BIT = { name: "COLOR_BUFFER_BIT", value: 16384, description: "Passed to clear to clear the current color buffer." };
        WebGlConstants.POINTS = { name: "POINTS", value: 0, description: "Passed to drawElements or drawArrays to draw single points." };
        WebGlConstants.LINES = { name: "LINES", value: 1, description: "Passed to drawElements or drawArrays to draw lines. Each vertex connects to the one after it." };
        WebGlConstants.LINE_LOOP = { name: "LINE_LOOP", value: 2, description: "Passed to drawElements or drawArrays to draw lines. Each set of two vertices is treated as a separate line segment." };
        WebGlConstants.LINE_STRIP = { name: "LINE_STRIP", value: 3, description: "Passed to drawElements or drawArrays to draw a connected group of line segments from the first vertex to the last." };
        WebGlConstants.TRIANGLES = { name: "TRIANGLES", value: 4, description: "Passed to drawElements or drawArrays to draw triangles. Each set of three vertices creates a separate triangle." };
        WebGlConstants.TRIANGLE_STRIP = { name: "TRIANGLE_STRIP", value: 5, description: "Passed to drawElements or drawArrays to draw a connected group of triangles." };
        WebGlConstants.TRIANGLE_FAN = { name: "TRIANGLE_FAN", value: 6, description: "Passed to drawElements or drawArrays to draw a connected group of triangles. Each vertex connects to the previous and the first vertex in the fan." };
        WebGlConstants.ZERO = { name: "ZERO", value: 0, description: "Passed to blendFunc or blendFuncSeparate to turn off a component." };
        WebGlConstants.ONE = { name: "ONE", value: 1, description: "Passed to blendFunc or blendFuncSeparate to turn on a component." };
        WebGlConstants.SRC_COLOR = { name: "SRC_COLOR", value: 768, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by the source elements color." };
        WebGlConstants.ONE_MINUS_SRC_COLOR = { name: "ONE_MINUS_SRC_COLOR", value: 769, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the source elements color." };
        WebGlConstants.SRC_ALPHA = { name: "SRC_ALPHA", value: 770, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by the source's alpha." };
        WebGlConstants.ONE_MINUS_SRC_ALPHA = { name: "ONE_MINUS_SRC_ALPHA", value: 771, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the source's alpha." };
        WebGlConstants.DST_ALPHA = { name: "DST_ALPHA", value: 772, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by the destination's alpha." };
        WebGlConstants.ONE_MINUS_DST_ALPHA = { name: "ONE_MINUS_DST_ALPHA", value: 773, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the destination's alpha." };
        WebGlConstants.DST_COLOR = { name: "DST_COLOR", value: 774, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by the destination's color." };
        WebGlConstants.ONE_MINUS_DST_COLOR = { name: "ONE_MINUS_DST_COLOR", value: 775, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by one minus the destination's color." };
        WebGlConstants.SRC_ALPHA_SATURATE = { name: "SRC_ALPHA_SATURATE", value: 776, description: "Passed to blendFunc or blendFuncSeparate to multiply a component by the minimum of source's alpha or one minus the destination's alpha." };
        WebGlConstants.CONSTANT_COLOR = { name: "CONSTANT_COLOR", value: 32769, description: "Passed to blendFunc or blendFuncSeparate to specify a constant color blend function." };
        WebGlConstants.ONE_MINUS_CONSTANT_COLOR = { name: "ONE_MINUS_CONSTANT_COLOR", value: 32770, description: "Passed to blendFunc or blendFuncSeparate to specify one minus a constant color blend function." };
        WebGlConstants.CONSTANT_ALPHA = { name: "CONSTANT_ALPHA", value: 32771, description: "Passed to blendFunc or blendFuncSeparate to specify a constant alpha blend function." };
        WebGlConstants.ONE_MINUS_CONSTANT_ALPHA = { name: "ONE_MINUS_CONSTANT_ALPHA", value: 32772, description: "Passed to blendFunc or blendFuncSeparate to specify one minus a constant alpha blend function." };
        WebGlConstants.FUNC_ADD = { name: "FUNC_ADD", value: 32774, description: "Passed to blendEquation or blendEquationSeparate to set an addition blend function." };
        WebGlConstants.FUNC_SUBSTRACT = { name: "FUNC_SUBSTRACT", value: 32778, description: "Passed to blendEquation or blendEquationSeparate to specify a subtraction blend function (source - destination)." };
        WebGlConstants.FUNC_REVERSE_SUBTRACT = { name: "FUNC_REVERSE_SUBTRACT", value: 32779, description: "Passed to blendEquation or blendEquationSeparate to specify a reverse subtraction blend function (destination - source)." };
        WebGlConstants.BLEND_EQUATION = { name: "BLEND_EQUATION", value: 32777, description: "Passed to getParameter to get the current RGB blend function." };
        WebGlConstants.BLEND_EQUATION_RGB = { name: "BLEND_EQUATION_RGB", value: 32777, description: "Passed to getParameter to get the current RGB blend function. Same as BLEND_EQUATION" };
        WebGlConstants.BLEND_EQUATION_ALPHA = { name: "BLEND_EQUATION_ALPHA", value: 34877, description: "Passed to getParameter to get the current alpha blend function. Same as BLEND_EQUATION" };
        WebGlConstants.BLEND_DST_RGB = { name: "BLEND_DST_RGB", value: 32968, description: "Passed to getParameter to get the current destination RGB blend function." };
        WebGlConstants.BLEND_SRC_RGB = { name: "BLEND_SRC_RGB", value: 32969, description: "Passed to getParameter to get the current destination RGB blend function." };
        WebGlConstants.BLEND_DST_ALPHA = { name: "BLEND_DST_ALPHA", value: 32970, description: "Passed to getParameter to get the current destination alpha blend function." };
        WebGlConstants.BLEND_SRC_ALPHA = { name: "BLEND_SRC_ALPHA", value: 32971, description: "Passed to getParameter to get the current source alpha blend function." };
        WebGlConstants.BLEND_COLOR = { name: "BLEND_COLOR", value: 32773, description: "Passed to getParameter to return a the current blend color." };
        WebGlConstants.ARRAY_BUFFER_BINDING = { name: "ARRAY_BUFFER_BINDING", value: 34964, description: "Passed to getParameter to get the array buffer binding." };
        WebGlConstants.ELEMENT_ARRAY_BUFFER_BINDING = { name: "ELEMENT_ARRAY_BUFFER_BINDING", value: 34965, description: "Passed to getParameter to get the current element array buffer." };
        WebGlConstants.LINE_WIDTH = { name: "LINE_WIDTH", value: 2849, description: "Passed to getParameter to get the current lineWidth (set by the lineWidth method)." };
        WebGlConstants.ALIASED_POINT_SIZE_RANGE = { name: "ALIASED_POINT_SIZE_RANGE", value: 33901, description: "Passed to getParameter to get the current size of a point drawn with gl.POINTS" };
        WebGlConstants.ALIASED_LINE_WIDTH_RANGE = { name: "ALIASED_LINE_WIDTH_RANGE", value: 33902, description: "Passed to getParameter to get the range of available widths for a line. Returns a length-2 array with the lo value at 0, and hight at 1." };
        WebGlConstants.CULL_FACE_MODE = { name: "CULL_FACE_MODE", value: 2885, description: "Passed to getParameter to get the current value of cullFace. Should return FRONT, BACK, or FRONT_AND_BACK" };
        WebGlConstants.FRONT_FACE = { name: "FRONT_FACE", value: 2886, description: "Passed to getParameter to determine the current value of frontFace. Should return CW or CCW." };
        WebGlConstants.DEPTH_RANGE = { name: "DEPTH_RANGE", value: 2928, description: "Passed to getParameter to return a length-2 array of floats giving the current depth range." };
        WebGlConstants.DEPTH_WRITEMASK = { name: "DEPTH_WRITEMASK", value: 2930, description: "Passed to getParameter to determine if the depth write mask is enabled." };
        WebGlConstants.DEPTH_CLEAR_VALUE = { name: "DEPTH_CLEAR_VALUE", value: 2931, description: "Passed to getParameter to determine the current depth clear value." };
        WebGlConstants.DEPTH_FUNC = { name: "DEPTH_FUNC", value: 2932, description: "Passed to getParameter to get the current depth function. Returns NEVER, ALWAYS, LESS, EQUAL, LEQUAL, GREATER, GEQUAL, or NOTEQUAL." };
        WebGlConstants.STENCIL_CLEAR_VALUE = { name: "STENCIL_CLEAR_VALUE", value: 2961, description: "Passed to getParameter to get the value the stencil will be cleared to." };
        WebGlConstants.STENCIL_FUNC = { name: "STENCIL_FUNC", value: 2962, description: "Passed to getParameter to get the current stencil function. Returns NEVER, ALWAYS, LESS, EQUAL, LEQUAL, GREATER, GEQUAL, or NOTEQUAL." };
        WebGlConstants.STENCIL_FAIL = { name: "STENCIL_FAIL", value: 2964, description: "Passed to getParameter to get the current stencil fail function. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP." };
        WebGlConstants.STENCIL_PASS_DEPTH_FAIL = { name: "STENCIL_PASS_DEPTH_FAIL", value: 2965, description: "Passed to getParameter to get the current stencil fail function should the depth buffer test fail. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP." };
        WebGlConstants.STENCIL_PASS_DEPTH_PASS = { name: "STENCIL_PASS_DEPTH_PASS", value: 2966, description: "Passed to getParameter to get the current stencil fail function should the depth buffer test pass. Should return KEEP, REPLACE, INCR, DECR, INVERT, INCR_WRAP, or DECR_WRAP." };
        WebGlConstants.STENCIL_REF = { name: "STENCIL_REF", value: 2967, description: "Passed to getParameter to get the reference value used for stencil tests." };
        WebGlConstants.STENCIL_VALUE_MASK = { name: "STENCIL_VALUE_MASK", value: 2963, description: " " };
        WebGlConstants.STENCIL_WRITEMASK = { name: "STENCIL_WRITEMASK", value: 2968, description: " " };
        WebGlConstants.STENCIL_BACK_FUNC = { name: "STENCIL_BACK_FUNC", value: 34816, description: " " };
        WebGlConstants.STENCIL_BACK_FAIL = { name: "STENCIL_BACK_FAIL", value: 34817, description: " " };
        WebGlConstants.STENCIL_BACK_PASS_DEPTH_FAIL = { name: "STENCIL_BACK_PASS_DEPTH_FAIL", value: 34818, description: " " };
        WebGlConstants.STENCIL_BACK_PASS_DEPTH_PASS = { name: "STENCIL_BACK_PASS_DEPTH_PASS", value: 34819, description: " " };
        WebGlConstants.STENCIL_BACK_REF = { name: "STENCIL_BACK_REF", value: 36003, description: " " };
        WebGlConstants.STENCIL_BACK_VALUE_MASK = { name: "STENCIL_BACK_VALUE_MASK", value: 36004, description: " " };
        WebGlConstants.STENCIL_BACK_WRITEMASK = { name: "STENCIL_BACK_WRITEMASK", value: 36005, description: " " };
        WebGlConstants.VIEWPORT = { name: "VIEWPORT", value: 2978, description: "Returns an Int32Array with four elements for the current viewport dimensions." };
        WebGlConstants.SCISSOR_BOX = { name: "SCISSOR_BOX", value: 3088, description: "Returns an Int32Array with four elements for the current scissor box dimensions." };
        WebGlConstants.COLOR_CLEAR_VALUE = { name: "COLOR_CLEAR_VALUE", value: 3106, description: " " };
        WebGlConstants.COLOR_WRITEMASK = { name: "COLOR_WRITEMASK", value: 3107, description: " " };
        WebGlConstants.UNPACK_ALIGNMENT = { name: "UNPACK_ALIGNMENT", value: 3317, description: " " };
        WebGlConstants.PACK_ALIGNMENT = { name: "PACK_ALIGNMENT", value: 3333, description: " " };
        WebGlConstants.MAX_TEXTURE_SIZE = { name: "MAX_TEXTURE_SIZE", value: 3379, description: " " };
        WebGlConstants.MAX_VIEWPORT_DIMS = { name: "MAX_VIEWPORT_DIMS", value: 3386, description: " " };
        WebGlConstants.SUBPIXEL_BITS = { name: "SUBPIXEL_BITS", value: 3408, description: " " };
        WebGlConstants.RED_BITS = { name: "RED_BITS", value: 3410, description: " " };
        WebGlConstants.GREEN_BITS = { name: "GREEN_BITS", value: 3411, description: " " };
        WebGlConstants.BLUE_BITS = { name: "BLUE_BITS", value: 3412, description: " " };
        WebGlConstants.ALPHA_BITS = { name: "ALPHA_BITS", value: 3413, description: " " };
        WebGlConstants.DEPTH_BITS = { name: "DEPTH_BITS", value: 3414, description: " " };
        WebGlConstants.STENCIL_BITS = { name: "STENCIL_BITS", value: 3415, description: " " };
        WebGlConstants.POLYGON_OFFSET_UNITS = { name: "POLYGON_OFFSET_UNITS", value: 10752, description: " " };
        WebGlConstants.POLYGON_OFFSET_FACTOR = { name: "POLYGON_OFFSET_FACTOR", value: 32824, description: " " };
        WebGlConstants.TEXTURE_BINDING_2D = { name: "TEXTURE_BINDING_2D", value: 32873, description: " " };
        WebGlConstants.SAMPLE_BUFFERS = { name: "SAMPLE_BUFFERS", value: 32936, description: " " };
        WebGlConstants.SAMPLES = { name: "SAMPLES", value: 32937, description: " " };
        WebGlConstants.SAMPLE_COVERAGE_VALUE = { name: "SAMPLE_COVERAGE_VALUE", value: 32938, description: " " };
        WebGlConstants.SAMPLE_COVERAGE_INVERT = { name: "SAMPLE_COVERAGE_INVERT", value: 32939, description: " " };
        WebGlConstants.COMPRESSED_TEXTURE_FORMATS = { name: "COMPRESSED_TEXTURE_FORMATS", value: 34467, description: " " };
        WebGlConstants.VENDOR = { name: "VENDOR", value: 7936, description: " " };
        WebGlConstants.RENDERER = { name: "RENDERER", value: 7937, description: " " };
        WebGlConstants.VERSION = { name: "VERSION", value: 7938, description: " " };
        WebGlConstants.IMPLEMENTATION_COLOR_READ_TYPE = { name: "IMPLEMENTATION_COLOR_READ_TYPE", value: 35738, description: " " };
        WebGlConstants.IMPLEMENTATION_COLOR_READ_FORMAT = { name: "IMPLEMENTATION_COLOR_READ_FORMAT", value: 35739, description: " " };
        WebGlConstants.BROWSER_DEFAULT_WEBGL = { name: "BROWSER_DEFAULT_WEBGL", value: 37444, description: " " };
        WebGlConstants.STATIC_DRAW = { name: "STATIC_DRAW", value: 35044, description: "Passed to bufferData as a hint about whether the contents of the buffer are likely to be used often and not change often." };
        WebGlConstants.STREAM_DRAW = { name: "STREAM_DRAW", value: 35040, description: "Passed to bufferData as a hint about whether the contents of the buffer are likely to not be used often." };
        WebGlConstants.DYNAMIC_DRAW = { name: "DYNAMIC_DRAW", value: 35048, description: "Passed to bufferData as a hint about whether the contents of the buffer are likely to be used often and change often." };
        WebGlConstants.ARRAY_BUFFER = { name: "ARRAY_BUFFER", value: 34962, description: "Passed to bindBuffer or bufferData to specify the type of buffer being used." };
        WebGlConstants.ELEMENT_ARRAY_BUFFER = { name: "ELEMENT_ARRAY_BUFFER", value: 34963, description: "Passed to bindBuffer or bufferData to specify the type of buffer being used." };
        WebGlConstants.BUFFER_SIZE = { name: "BUFFER_SIZE", value: 34660, description: "Passed to getBufferParameter to get a buffer's size." };
        WebGlConstants.BUFFER_USAGE = { name: "BUFFER_USAGE", value: 34661, description: "Passed to getBufferParameter to get the hint for the buffer passed in when it was created." };
        WebGlConstants.CURRENT_VERTEX_ATTRIB = { name: "CURRENT_VERTEX_ATTRIB", value: 34342, description: "Passed to getVertexAttrib to read back the current vertex attribute." };
        WebGlConstants.VERTEX_ATTRIB_ARRAY_ENABLED = { name: "VERTEX_ATTRIB_ARRAY_ENABLED", value: 34338, description: " " };
        WebGlConstants.VERTEX_ATTRIB_ARRAY_SIZE = { name: "VERTEX_ATTRIB_ARRAY_SIZE", value: 34339, description: " " };
        WebGlConstants.VERTEX_ATTRIB_ARRAY_STRIDE = { name: "VERTEX_ATTRIB_ARRAY_STRIDE", value: 34340, description: " " };
        WebGlConstants.VERTEX_ATTRIB_ARRAY_TYPE = { name: "VERTEX_ATTRIB_ARRAY_TYPE", value: 34341, description: " " };
        WebGlConstants.VERTEX_ATTRIB_ARRAY_NORMALIZED = { name: "VERTEX_ATTRIB_ARRAY_NORMALIZED", value: 34922, description: " " };
        WebGlConstants.VERTEX_ATTRIB_ARRAY_POINTER = { name: "VERTEX_ATTRIB_ARRAY_POINTER", value: 34373, description: " " };
        WebGlConstants.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING = { name: "VERTEX_ATTRIB_ARRAY_BUFFER_BINDING", value: 34975, description: " " };
        WebGlConstants.CULL_FACE = { name: "CULL_FACE", value: 2884, description: "Passed to enable/disable to turn on/off culling. Can also be used with getParameter to find the current culling method." };
        WebGlConstants.FRONT = { name: "FRONT", value: 1028, description: "Passed to cullFace to specify that only front faces should be drawn." };
        WebGlConstants.BACK = { name: "BACK", value: 1029, description: "Passed to cullFace to specify that only back faces should be drawn." };
        WebGlConstants.FRONT_AND_BACK = { name: "FRONT_AND_BACK", value: 1032, description: "Passed to cullFace to specify that front and back faces should be drawn." };
        WebGlConstants.BLEND = { name: "BLEND", value: 3042, description: "Passed to enable/disable to turn on/off blending. Can also be used with getParameter to find the current blending method." };
        WebGlConstants.DEPTH_TEST = { name: "DEPTH_TEST", value: 2929, description: "Passed to enable/disable to turn on/off the depth test. Can also be used with getParameter to query the depth test." };
        WebGlConstants.DITHER = { name: "DITHER", value: 3024, description: "Passed to enable/disable to turn on/off dithering. Can also be used with getParameter to find the current dithering method." };
        WebGlConstants.POLYGON_OFFSET_FILL = { name: "POLYGON_OFFSET_FILL", value: 32823, description: "Passed to enable/disable to turn on/off the polygon offset. Useful for rendering hidden-line images, decals, and or solids with highlighted edges. Can also be used with getParameter to query the scissor test." };
        WebGlConstants.SAMPLE_ALPHA_TO_COVERAGE = { name: "SAMPLE_ALPHA_TO_COVERAGE", value: 32926, description: "Passed to enable/disable to turn on/off the alpha to coverage. Used in multi-sampling alpha channels." };
        WebGlConstants.SAMPLE_COVERAGE = { name: "SAMPLE_COVERAGE", value: 32928, description: "Passed to enable/disable to turn on/off the sample coverage. Used in multi-sampling." };
        WebGlConstants.SCISSOR_TEST = { name: "SCISSOR_TEST", value: 3089, description: "Passed to enable/disable to turn on/off the scissor test. Can also be used with getParameter to query the scissor test." };
        WebGlConstants.STENCIL_TEST = { name: "STENCIL_TEST", value: 2960, description: "Passed to enable/disable to turn on/off the stencil test. Can also be used with getParameter to query the stencil test." };
        WebGlConstants.NO_ERROR = { name: "NO_ERROR", value: 0, description: "Returned from getError." };
        WebGlConstants.INVALID_ENUM = { name: "INVALID_ENUM", value: 1280, description: "Returned from getError." };
        WebGlConstants.INVALID_VALUE = { name: "INVALID_VALUE", value: 1281, description: "Returned from getError." };
        WebGlConstants.INVALID_OPERATION = { name: "INVALID_OPERATION", value: 1282, description: "Returned from getError." };
        WebGlConstants.OUT_OF_MEMORY = { name: "OUT_OF_MEMORY", value: 1285, description: "Returned from getError." };
        WebGlConstants.CONTEXT_LOST_WEBGL = { name: "CONTEXT_LOST_WEBGL", value: 37442, description: "Returned from getError." };
        WebGlConstants.CW = { name: "CW", value: 2304, description: "Passed to frontFace to specify the front face of a polygon is drawn in the clockwise direction" };
        WebGlConstants.CCW = { name: "CCW", value: 2305, description: "Passed to frontFace to specify the front face of a polygon is drawn in the counter clockwise direction" };
        WebGlConstants.DONT_CARE = { name: "DONT_CARE", value: 4352, description: "There is no preference for this behavior." };
        WebGlConstants.FASTEST = { name: "FASTEST", value: 4353, description: "The most efficient behavior should be used." };
        WebGlConstants.NICEST = { name: "NICEST", value: 4354, description: "The most correct or the highest quality option should be used." };
        WebGlConstants.GENERATE_MIPMAP_HINT = { name: "GENERATE_MIPMAP_HINT", value: 33170, description: "Hint for the quality of filtering when generating mipmap images with WebGLRenderingContext.generateMipmap()." };
        WebGlConstants.BYTE = { name: "BYTE", value: 5120, description: " " };
        WebGlConstants.UNSIGNED_BYTE = { name: "UNSIGNED_BYTE", value: 5121, description: " " };
        WebGlConstants.SHORT = { name: "SHORT", value: 5122, description: " " };
        WebGlConstants.UNSIGNED_SHORT = { name: "UNSIGNED_SHORT", value: 5123, description: " " };
        WebGlConstants.INT = { name: "INT", value: 5124, description: " " };
        WebGlConstants.UNSIGNED_INT = { name: "UNSIGNED_INT", value: 5125, description: " " };
        WebGlConstants.FLOAT = { name: "FLOAT", value: 5126, description: " " };
        WebGlConstants.DEPTH_COMPONENT = { name: "DEPTH_COMPONENT", value: 6402, description: " " };
        WebGlConstants.ALPHA = { name: "ALPHA", value: 6406, description: " " };
        WebGlConstants.RGB = { name: "RGB", value: 6407, description: " " };
        WebGlConstants.RGBA = { name: "RGBA", value: 6408, description: " " };
        WebGlConstants.LUMINANCE = { name: "LUMINANCE", value: 6409, description: " " };
        WebGlConstants.LUMINANCE_ALPHA = { name: "LUMINANCE_ALPHA", value: 6410, description: " " };
        WebGlConstants.UNSIGNED_SHORT_4_4_4_4 = { name: "UNSIGNED_SHORT_4_4_4_4", value: 32819, description: " " };
        WebGlConstants.UNSIGNED_SHORT_5_5_5_1 = { name: "UNSIGNED_SHORT_5_5_5_1", value: 32820, description: " " };
        WebGlConstants.UNSIGNED_SHORT_5_6_5 = { name: "UNSIGNED_SHORT_5_6_5", value: 33635, description: " " };
        WebGlConstants.FRAGMENT_SHADER = { name: "FRAGMENT_SHADER", value: 35632, description: "Passed to createShader to define a fragment shader." };
        WebGlConstants.VERTEX_SHADER = { name: "VERTEX_SHADER", value: 35633, description: "Passed to createShader to define a vertex shader" };
        WebGlConstants.COMPILE_STATUS = { name: "COMPILE_STATUS", value: 35713, description: "Passed to getShaderParamter to get the status of the compilation. Returns false if the shader was not compiled. You can then query getShaderInfoLog to find the exact error" };
        WebGlConstants.DELETE_STATUS = { name: "DELETE_STATUS", value: 35712, description: "Passed to getShaderParamter to determine if a shader was deleted via deleteShader. Returns true if it was, false otherwise." };
        WebGlConstants.LINK_STATUS = { name: "LINK_STATUS", value: 35714, description: "Passed to getProgramParameter after calling linkProgram to determine if a program was linked correctly. Returns false if there were errors. Use getProgramInfoLog to find the exact error." };
        WebGlConstants.VALIDATE_STATUS = { name: "VALIDATE_STATUS", value: 35715, description: "Passed to getProgramParameter after calling validateProgram to determine if it is valid. Returns false if errors were found." };
        WebGlConstants.ATTACHED_SHADERS = { name: "ATTACHED_SHADERS", value: 35717, description: "Passed to getProgramParameter after calling attachShader to determine if the shader was attached correctly. Returns false if errors occurred." };
        WebGlConstants.ACTIVE_ATTRIBUTES = { name: "ACTIVE_ATTRIBUTES", value: 35721, description: "Passed to getProgramParameter to get the number of attributes active in a program." };
        WebGlConstants.ACTIVE_UNIFORMS = { name: "ACTIVE_UNIFORMS", value: 35718, description: "Passed to getProgramParamter to get the number of uniforms active in a program." };
        WebGlConstants.MAX_VERTEX_ATTRIBS = { name: "MAX_VERTEX_ATTRIBS", value: 34921, description: " " };
        WebGlConstants.MAX_VERTEX_UNIFORM_VECTORS = { name: "MAX_VERTEX_UNIFORM_VECTORS", value: 36347, description: " " };
        WebGlConstants.MAX_VARYING_VECTORS = { name: "MAX_VARYING_VECTORS", value: 36348, description: " " };
        WebGlConstants.MAX_COMBINED_TEXTURE_IMAGE_UNITS = { name: "MAX_COMBINED_TEXTURE_IMAGE_UNITS", value: 35661, description: " " };
        WebGlConstants.MAX_VERTEX_TEXTURE_IMAGE_UNITS = { name: "MAX_VERTEX_TEXTURE_IMAGE_UNITS", value: 35660, description: " " };
        WebGlConstants.MAX_TEXTURE_IMAGE_UNITS = { name: "MAX_TEXTURE_IMAGE_UNITS", value: 34930, description: "Implementation dependent number of maximum texture units. At least 8." };
        WebGlConstants.MAX_FRAGMENT_UNIFORM_VECTORS = { name: "MAX_FRAGMENT_UNIFORM_VECTORS", value: 36349, description: " " };
        WebGlConstants.SHADER_TYPE = { name: "SHADER_TYPE", value: 35663, description: " " };
        WebGlConstants.SHADING_LANGUAGE_VERSION = { name: "SHADING_LANGUAGE_VERSION", value: 35724, description: " " };
        WebGlConstants.CURRENT_PROGRAM = { name: "CURRENT_PROGRAM", value: 35725, description: " " };
        WebGlConstants.NEVER = { name: "NEVER", value: 512, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will never pass. i.e. Nothing will be drawn." };
        WebGlConstants.ALWAYS = { name: "ALWAYS", value: 519, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will always pass. i.e. Pixels will be drawn in the order they are drawn." };
        WebGlConstants.LESS = { name: "LESS", value: 513, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than the stored value." };
        WebGlConstants.EQUAL = { name: "EQUAL", value: 514, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is equals to the stored value." };
        WebGlConstants.LEQUAL = { name: "LEQUAL", value: 515, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is less than or equal to the stored value." };
        WebGlConstants.GREATER = { name: "GREATER", value: 516, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than the stored value." };
        WebGlConstants.GEQUAL = { name: "GEQUAL", value: 518, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is greater than or equal to the stored value." };
        WebGlConstants.NOTEQUAL = { name: "NOTEQUAL", value: 517, description: "Passed to depthFunction or stencilFunction to specify depth or stencil tests will pass if the new depth value is not equal to the stored value." };
        WebGlConstants.KEEP = { name: "KEEP", value: 7680, description: " " };
        WebGlConstants.REPLACE = { name: "REPLACE", value: 7681, description: " " };
        WebGlConstants.INCR = { name: "INCR", value: 7682, description: " " };
        WebGlConstants.DECR = { name: "DECR", value: 7683, description: " " };
        WebGlConstants.INVERT = { name: "INVERT", value: 5386, description: " " };
        WebGlConstants.INCR_WRAP = { name: "INCR_WRAP", value: 34055, description: " " };
        WebGlConstants.DECR_WRAP = { name: "DECR_WRAP", value: 34056, description: " " };
        WebGlConstants.NEAREST = { name: "NEAREST", value: 9728, description: " " };
        WebGlConstants.LINEAR = { name: "LINEAR", value: 9729, description: " " };
        WebGlConstants.NEAREST_MIPMAP_NEAREST = { name: "NEAREST_MIPMAP_NEAREST", value: 9984, description: " " };
        WebGlConstants.LINEAR_MIPMAP_NEAREST = { name: "LINEAR_MIPMAP_NEAREST", value: 9985, description: " " };
        WebGlConstants.NEAREST_MIPMAP_LINEAR = { name: "NEAREST_MIPMAP_LINEAR", value: 9986, description: " " };
        WebGlConstants.LINEAR_MIPMAP_LINEAR = { name: "LINEAR_MIPMAP_LINEAR", value: 9987, description: " " };
        WebGlConstants.TEXTURE_MAG_FILTER = { name: "TEXTURE_MAG_FILTER", value: 10240, description: " " };
        WebGlConstants.TEXTURE_MIN_FILTER = { name: "TEXTURE_MIN_FILTER", value: 10241, description: " " };
        WebGlConstants.TEXTURE_WRAP_S = { name: "TEXTURE_WRAP_S", value: 10242, description: " " };
        WebGlConstants.TEXTURE_WRAP_T = { name: "TEXTURE_WRAP_T", value: 10243, description: " " };
        WebGlConstants.TEXTURE_2D = { name: "TEXTURE_2D", value: 3553, description: " " };
        WebGlConstants.TEXTURE = { name: "TEXTURE", value: 5890, description: " " };
        WebGlConstants.TEXTURE_CUBE_MAP = { name: "TEXTURE_CUBE_MAP", value: 34067, description: " " };
        WebGlConstants.TEXTURE_BINDING_CUBE_MAP = { name: "TEXTURE_BINDING_CUBE_MAP", value: 34068, description: " " };
        WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_X = { name: "TEXTURE_CUBE_MAP_POSITIVE_X", value: 34069, description: " " };
        WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_X = { name: "TEXTURE_CUBE_MAP_NEGATIVE_X", value: 34070, description: " " };
        WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_Y = { name: "TEXTURE_CUBE_MAP_POSITIVE_Y", value: 34071, description: " " };
        WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_Y = { name: "TEXTURE_CUBE_MAP_NEGATIVE_Y", value: 34072, description: " " };
        WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_Z = { name: "TEXTURE_CUBE_MAP_POSITIVE_Z", value: 34073, description: " " };
        WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_Z = { name: "TEXTURE_CUBE_MAP_NEGATIVE_Z", value: 34074, description: " " };
        WebGlConstants.MAX_CUBE_MAP_TEXTURE_SIZE = { name: "MAX_CUBE_MAP_TEXTURE_SIZE", value: 34076, description: " " };
        WebGlConstants.TEXTURE0 = { name: "TEXTURE0", value: 33984, description: "A texture unit." };
        WebGlConstants.TEXTURE1 = { name: "TEXTURE1", value: 33985, description: "A texture unit." };
        WebGlConstants.TEXTURE2 = { name: "TEXTURE2", value: 33986, description: "A texture unit." };
        WebGlConstants.TEXTURE3 = { name: "TEXTURE3", value: 33987, description: "A texture unit." };
        WebGlConstants.TEXTURE4 = { name: "TEXTURE4", value: 33988, description: "A texture unit." };
        WebGlConstants.TEXTURE5 = { name: "TEXTURE5", value: 33989, description: "A texture unit." };
        WebGlConstants.TEXTURE6 = { name: "TEXTURE6", value: 33990, description: "A texture unit." };
        WebGlConstants.TEXTURE7 = { name: "TEXTURE7", value: 33991, description: "A texture unit." };
        WebGlConstants.TEXTURE8 = { name: "TEXTURE8", value: 33992, description: "A texture unit." };
        WebGlConstants.TEXTURE9 = { name: "TEXTURE9", value: 33993, description: "A texture unit." };
        WebGlConstants.TEXTURE10 = { name: "TEXTURE10", value: 33994, description: "A texture unit." };
        WebGlConstants.TEXTURE11 = { name: "TEXTURE11", value: 33995, description: "A texture unit." };
        WebGlConstants.TEXTURE12 = { name: "TEXTURE12", value: 33996, description: "A texture unit." };
        WebGlConstants.TEXTURE13 = { name: "TEXTURE13", value: 33997, description: "A texture unit." };
        WebGlConstants.TEXTURE14 = { name: "TEXTURE14", value: 33998, description: "A texture unit." };
        WebGlConstants.TEXTURE15 = { name: "TEXTURE15", value: 33999, description: "A texture unit." };
        WebGlConstants.TEXTURE16 = { name: "TEXTURE16", value: 34000, description: "A texture unit." };
        WebGlConstants.TEXTURE17 = { name: "TEXTURE17", value: 34001, description: "A texture unit." };
        WebGlConstants.TEXTURE18 = { name: "TEXTURE18", value: 34002, description: "A texture unit." };
        WebGlConstants.TEXTURE19 = { name: "TEXTURE19", value: 34003, description: "A texture unit." };
        WebGlConstants.TEXTURE20 = { name: "TEXTURE20", value: 34004, description: "A texture unit." };
        WebGlConstants.TEXTURE21 = { name: "TEXTURE21", value: 34005, description: "A texture unit." };
        WebGlConstants.TEXTURE22 = { name: "TEXTURE22", value: 34006, description: "A texture unit." };
        WebGlConstants.TEXTURE23 = { name: "TEXTURE23", value: 34007, description: "A texture unit." };
        WebGlConstants.TEXTURE24 = { name: "TEXTURE24", value: 34008, description: "A texture unit." };
        WebGlConstants.TEXTURE25 = { name: "TEXTURE25", value: 34009, description: "A texture unit." };
        WebGlConstants.TEXTURE26 = { name: "TEXTURE26", value: 34010, description: "A texture unit." };
        WebGlConstants.TEXTURE27 = { name: "TEXTURE27", value: 34011, description: "A texture unit." };
        WebGlConstants.TEXTURE28 = { name: "TEXTURE28", value: 34012, description: "A texture unit." };
        WebGlConstants.TEXTURE29 = { name: "TEXTURE29", value: 34013, description: "A texture unit." };
        WebGlConstants.TEXTURE30 = { name: "TEXTURE30", value: 34014, description: "A texture unit." };
        WebGlConstants.TEXTURE31 = { name: "TEXTURE31", value: 34015, description: "A texture unit." };
        WebGlConstants.ACTIVE_TEXTURE = { name: "ACTIVE_TEXTURE", value: 34016, description: "The current active texture unit." };
        WebGlConstants.REPEAT = { name: "REPEAT", value: 10497, description: " " };
        WebGlConstants.CLAMP_TO_EDGE = { name: "CLAMP_TO_EDGE", value: 33071, description: " " };
        WebGlConstants.MIRRORED_REPEAT = { name: "MIRRORED_REPEAT", value: 33648, description: " " };
        WebGlConstants.FLOAT_VEC2 = { name: "FLOAT_VEC2", value: 35664, description: " " };
        WebGlConstants.FLOAT_VEC3 = { name: "FLOAT_VEC3", value: 35665, description: " " };
        WebGlConstants.FLOAT_VEC4 = { name: "FLOAT_VEC4", value: 35666, description: " " };
        WebGlConstants.INT_VEC2 = { name: "INT_VEC2", value: 35667, description: " " };
        WebGlConstants.INT_VEC3 = { name: "INT_VEC3", value: 35668, description: " " };
        WebGlConstants.INT_VEC4 = { name: "INT_VEC4", value: 35669, description: " " };
        WebGlConstants.BOOL = { name: "BOOL", value: 35670, description: " " };
        WebGlConstants.BOOL_VEC2 = { name: "BOOL_VEC2", value: 35671, description: " " };
        WebGlConstants.BOOL_VEC3 = { name: "BOOL_VEC3", value: 35672, description: " " };
        WebGlConstants.BOOL_VEC4 = { name: "BOOL_VEC4", value: 35673, description: " " };
        WebGlConstants.FLOAT_MAT2 = { name: "FLOAT_MAT2", value: 35674, description: " " };
        WebGlConstants.FLOAT_MAT3 = { name: "FLOAT_MAT3", value: 35675, description: " " };
        WebGlConstants.FLOAT_MAT4 = { name: "FLOAT_MAT4", value: 35676, description: " " };
        WebGlConstants.SAMPLER_2D = { name: "SAMPLER_2D", value: 35678, description: " " };
        WebGlConstants.SAMPLER_CUBE = { name: "SAMPLER_CUBE", value: 35680, description: " " };
        WebGlConstants.LOW_FLOAT = { name: "LOW_FLOAT", value: 36336, description: " " };
        WebGlConstants.MEDIUM_FLOAT = { name: "MEDIUM_FLOAT", value: 36337, description: " " };
        WebGlConstants.HIGH_FLOAT = { name: "HIGH_FLOAT", value: 36338, description: " " };
        WebGlConstants.LOW_INT = { name: "LOW_INT", value: 36339, description: " " };
        WebGlConstants.MEDIUM_INT = { name: "MEDIUM_INT", value: 36340, description: " " };
        WebGlConstants.HIGH_INT = { name: "HIGH_INT", value: 36341, description: " " };
        WebGlConstants.FRAMEBUFFER = { name: "FRAMEBUFFER", value: 36160, description: " " };
        WebGlConstants.RENDERBUFFER = { name: "RENDERBUFFER", value: 36161, description: " " };
        WebGlConstants.RGBA4 = { name: "RGBA4", value: 32854, description: " " };
        WebGlConstants.RGB5_A1 = { name: "RGB5_A1", value: 32855, description: " " };
        WebGlConstants.RGB565 = { name: "RGB565", value: 36194, description: " " };
        WebGlConstants.DEPTH_COMPONENT16 = { name: "DEPTH_COMPONENT16", value: 33189, description: " " };
        WebGlConstants.STENCIL_INDEX = { name: "STENCIL_INDEX", value: 6401, description: " " };
        WebGlConstants.STENCIL_INDEX8 = { name: "STENCIL_INDEX8", value: 36168, description: " " };
        WebGlConstants.DEPTH_STENCIL = { name: "DEPTH_STENCIL", value: 34041, description: " " };
        WebGlConstants.RENDERBUFFER_WIDTH = { name: "RENDERBUFFER_WIDTH", value: 36162, description: " " };
        WebGlConstants.RENDERBUFFER_HEIGHT = { name: "RENDERBUFFER_HEIGHT", value: 36163, description: " " };
        WebGlConstants.RENDERBUFFER_INTERNAL_FORMAT = { name: "RENDERBUFFER_INTERNAL_FORMAT", value: 36164, description: " " };
        WebGlConstants.RENDERBUFFER_RED_SIZE = { name: "RENDERBUFFER_RED_SIZE", value: 36176, description: " " };
        WebGlConstants.RENDERBUFFER_GREEN_SIZE = { name: "RENDERBUFFER_GREEN_SIZE", value: 36177, description: " " };
        WebGlConstants.RENDERBUFFER_BLUE_SIZE = { name: "RENDERBUFFER_BLUE_SIZE", value: 36178, description: " " };
        WebGlConstants.RENDERBUFFER_ALPHA_SIZE = { name: "RENDERBUFFER_ALPHA_SIZE", value: 36179, description: " " };
        WebGlConstants.RENDERBUFFER_DEPTH_SIZE = { name: "RENDERBUFFER_DEPTH_SIZE", value: 36180, description: " " };
        WebGlConstants.RENDERBUFFER_STENCIL_SIZE = { name: "RENDERBUFFER_STENCIL_SIZE", value: 36181, description: " " };
        WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE = { name: "FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE", value: 36048, description: " " };
        WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME = { name: "FRAMEBUFFER_ATTACHMENT_OBJECT_NAME", value: 36049, description: " " };
        WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL = { name: "FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL", value: 36050, description: " " };
        WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE = { name: "FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE", value: 36051, description: " " };
        WebGlConstants.COLOR_ATTACHMENT0 = { name: "COLOR_ATTACHMENT0", value: 36064, description: " " };
        WebGlConstants.DEPTH_ATTACHMENT = { name: "DEPTH_ATTACHMENT", value: 36096, description: " " };
        WebGlConstants.STENCIL_ATTACHMENT = { name: "STENCIL_ATTACHMENT", value: 36128, description: " " };
        WebGlConstants.DEPTH_STENCIL_ATTACHMENT = { name: "DEPTH_STENCIL_ATTACHMENT", value: 33306, description: " " };
        WebGlConstants.NONE = { name: "NONE", value: 0, description: " " };
        WebGlConstants.FRAMEBUFFER_COMPLETE = { name: "FRAMEBUFFER_COMPLETE", value: 36053, description: " " };
        WebGlConstants.FRAMEBUFFER_INCOMPLETE_ATTACHMENT = { name: "FRAMEBUFFER_INCOMPLETE_ATTACHMENT", value: 36054, description: " " };
        WebGlConstants.FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = { name: "FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT", value: 36055, description: " " };
        WebGlConstants.FRAMEBUFFER_INCOMPLETE_DIMENSIONS = { name: "FRAMEBUFFER_INCOMPLETE_DIMENSIONS", value: 36057, description: " " };
        WebGlConstants.FRAMEBUFFER_UNSUPPORTED = { name: "FRAMEBUFFER_UNSUPPORTED", value: 36061, description: " " };
        WebGlConstants.FRAMEBUFFER_BINDING = { name: "FRAMEBUFFER_BINDING", value: 36006, description: " " };
        WebGlConstants.RENDERBUFFER_BINDING = { name: "RENDERBUFFER_BINDING", value: 36007, description: " " };
        WebGlConstants.MAX_RENDERBUFFER_SIZE = { name: "MAX_RENDERBUFFER_SIZE", value: 34024, description: " " };
        WebGlConstants.INVALID_FRAMEBUFFER_OPERATION = { name: "INVALID_FRAMEBUFFER_OPERATION", value: 1286, description: " " };
        WebGlConstants.UNPACK_FLIP_Y_WEBGL = { name: "UNPACK_FLIP_Y_WEBGL", value: 37440, description: " " };
        WebGlConstants.UNPACK_PREMULTIPLY_ALPHA_WEBGL = { name: "UNPACK_PREMULTIPLY_ALPHA_WEBGL", value: 37441, description: " " };
        WebGlConstants.UNPACK_COLORSPACE_CONVERSION_WEBGL = { name: "UNPACK_COLORSPACE_CONVERSION_WEBGL", value: 37443, description: " " };
        WebGlConstants.READ_BUFFER = { name: "READ_BUFFER", value: 3074, description: " " };
        WebGlConstants.UNPACK_ROW_LENGTH = { name: "UNPACK_ROW_LENGTH", value: 3314, description: " " };
        WebGlConstants.UNPACK_SKIP_ROWS = { name: "UNPACK_SKIP_ROWS", value: 3315, description: " " };
        WebGlConstants.UNPACK_SKIP_PIXELS = { name: "UNPACK_SKIP_PIXELS", value: 3316, description: " " };
        WebGlConstants.PACK_ROW_LENGTH = { name: "PACK_ROW_LENGTH", value: 3330, description: " " };
        WebGlConstants.PACK_SKIP_ROWS = { name: "PACK_SKIP_ROWS", value: 3331, description: " " };
        WebGlConstants.PACK_SKIP_PIXELS = { name: "PACK_SKIP_PIXELS", value: 3332, description: " " };
        WebGlConstants.TEXTURE_BINDING_3D = { name: "TEXTURE_BINDING_3D", value: 32874, description: " " };
        WebGlConstants.UNPACK_SKIP_IMAGES = { name: "UNPACK_SKIP_IMAGES", value: 32877, description: " " };
        WebGlConstants.UNPACK_IMAGE_HEIGHT = { name: "UNPACK_IMAGE_HEIGHT", value: 32878, description: " " };
        WebGlConstants.MAX_3D_TEXTURE_SIZE = { name: "MAX_3D_TEXTURE_SIZE", value: 32883, description: " " };
        WebGlConstants.MAX_ELEMENTS_VERTICES = { name: "MAX_ELEMENTS_VERTICES", value: 33000, description: " " };
        WebGlConstants.MAX_ELEMENTS_INDICES = { name: "MAX_ELEMENTS_INDICES", value: 33001, description: " " };
        WebGlConstants.MAX_TEXTURE_LOD_BIAS = { name: "MAX_TEXTURE_LOD_BIAS", value: 34045, description: " " };
        WebGlConstants.MAX_FRAGMENT_UNIFORM_COMPONENTS = { name: "MAX_FRAGMENT_UNIFORM_COMPONENTS", value: 35657, description: " " };
        WebGlConstants.MAX_VERTEX_UNIFORM_COMPONENTS = { name: "MAX_VERTEX_UNIFORM_COMPONENTS", value: 35658, description: " " };
        WebGlConstants.MAX_ARRAY_TEXTURE_LAYERS = { name: "MAX_ARRAY_TEXTURE_LAYERS", value: 35071, description: " " };
        WebGlConstants.MIN_PROGRAM_TEXEL_OFFSET = { name: "MIN_PROGRAM_TEXEL_OFFSET", value: 35076, description: " " };
        WebGlConstants.MAX_PROGRAM_TEXEL_OFFSET = { name: "MAX_PROGRAM_TEXEL_OFFSET", value: 35077, description: " " };
        WebGlConstants.MAX_VARYING_COMPONENTS = { name: "MAX_VARYING_COMPONENTS", value: 35659, description: " " };
        WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT = { name: "FRAGMENT_SHADER_DERIVATIVE_HINT", value: 35723, description: " " };
        WebGlConstants.RASTERIZER_DISCARD = { name: "RASTERIZER_DISCARD", value: 35977, description: " " };
        WebGlConstants.VERTEX_ARRAY_BINDING = { name: "VERTEX_ARRAY_BINDING", value: 34229, description: " " };
        WebGlConstants.MAX_VERTEX_OUTPUT_COMPONENTS = { name: "MAX_VERTEX_OUTPUT_COMPONENTS", value: 37154, description: " " };
        WebGlConstants.MAX_FRAGMENT_INPUT_COMPONENTS = { name: "MAX_FRAGMENT_INPUT_COMPONENTS", value: 37157, description: " " };
        WebGlConstants.MAX_SERVER_WAIT_TIMEOUT = { name: "MAX_SERVER_WAIT_TIMEOUT", value: 37137, description: " " };
        WebGlConstants.MAX_ELEMENT_INDEX = { name: "MAX_ELEMENT_INDEX", value: 36203, description: " " };
        WebGlConstants.RED = { name: "RED", value: 6403, description: " " };
        WebGlConstants.RGB8 = { name: "RGB8", value: 32849, description: " " };
        WebGlConstants.RGBA8 = { name: "RGBA8", value: 32856, description: " " };
        WebGlConstants.RGB10_A2 = { name: "RGB10_A2", value: 32857, description: " " };
        WebGlConstants.TEXTURE_3D = { name: "TEXTURE_3D", value: 32879, description: " " };
        WebGlConstants.TEXTURE_WRAP_R = { name: "TEXTURE_WRAP_R", value: 32882, description: " " };
        WebGlConstants.TEXTURE_MIN_LOD = { name: "TEXTURE_MIN_LOD", value: 33082, description: " " };
        WebGlConstants.TEXTURE_MAX_LOD = { name: "TEXTURE_MAX_LOD", value: 33083, description: " " };
        WebGlConstants.TEXTURE_BASE_LEVEL = { name: "TEXTURE_BASE_LEVEL", value: 33084, description: " " };
        WebGlConstants.TEXTURE_MAX_LEVEL = { name: "TEXTURE_MAX_LEVEL", value: 33085, description: " " };
        WebGlConstants.TEXTURE_COMPARE_MODE = { name: "TEXTURE_COMPARE_MODE", value: 34892, description: " " };
        WebGlConstants.TEXTURE_COMPARE_FUNC = { name: "TEXTURE_COMPARE_FUNC", value: 34893, description: " " };
        WebGlConstants.SRGB = { name: "SRGB", value: 35904, description: " " };
        WebGlConstants.SRGB8 = { name: "SRGB8", value: 35905, description: " " };
        WebGlConstants.SRGB8_ALPHA8 = { name: "SRGB8_ALPHA8", value: 35907, description: " " };
        WebGlConstants.COMPARE_REF_TO_TEXTURE = { name: "COMPARE_REF_TO_TEXTURE", value: 34894, description: " " };
        WebGlConstants.RGBA32F = { name: "RGBA32F", value: 34836, description: " " };
        WebGlConstants.RGB32F = { name: "RGB32F", value: 34837, description: " " };
        WebGlConstants.RGBA16F = { name: "RGBA16F", value: 34842, description: " " };
        WebGlConstants.RGB16F = { name: "RGB16F", value: 34843, description: " " };
        WebGlConstants.TEXTURE_2D_ARRAY = { name: "TEXTURE_2D_ARRAY", value: 35866, description: " " };
        WebGlConstants.TEXTURE_BINDING_2D_ARRAY = { name: "TEXTURE_BINDING_2D_ARRAY", value: 35869, description: " " };
        WebGlConstants.R11F_G11F_B10F = { name: "R11F_G11F_B10F", value: 35898, description: " " };
        WebGlConstants.RGB9_E5 = { name: "RGB9_E5", value: 35901, description: " " };
        WebGlConstants.RGBA32UI = { name: "RGBA32UI", value: 36208, description: " " };
        WebGlConstants.RGB32UI = { name: "RGB32UI", value: 36209, description: " " };
        WebGlConstants.RGBA16UI = { name: "RGBA16UI", value: 36214, description: " " };
        WebGlConstants.RGB16UI = { name: "RGB16UI", value: 36215, description: " " };
        WebGlConstants.RGBA8UI = { name: "RGBA8UI", value: 36220, description: " " };
        WebGlConstants.RGB8UI = { name: "RGB8UI", value: 36221, description: " " };
        WebGlConstants.RGBA32I = { name: "RGBA32I", value: 36226, description: " " };
        WebGlConstants.RGB32I = { name: "RGB32I", value: 36227, description: " " };
        WebGlConstants.RGBA16I = { name: "RGBA16I", value: 36232, description: " " };
        WebGlConstants.RGB16I = { name: "RGB16I", value: 36233, description: " " };
        WebGlConstants.RGBA8I = { name: "RGBA8I", value: 36238, description: " " };
        WebGlConstants.RGB8I = { name: "RGB8I", value: 36239, description: " " };
        WebGlConstants.RED_INTEGER = { name: "RED_INTEGER", value: 36244, description: " " };
        WebGlConstants.RGB_INTEGER = { name: "RGB_INTEGER", value: 36248, description: " " };
        WebGlConstants.RGBA_INTEGER = { name: "RGBA_INTEGER", value: 36249, description: " " };
        WebGlConstants.R8 = { name: "R8", value: 33321, description: " " };
        WebGlConstants.RG8 = { name: "RG8", value: 33323, description: " " };
        WebGlConstants.R16F = { name: "R16F", value: 33325, description: " " };
        WebGlConstants.R32F = { name: "R32F", value: 33326, description: " " };
        WebGlConstants.RG16F = { name: "RG16F", value: 33327, description: " " };
        WebGlConstants.RG32F = { name: "RG32F", value: 33328, description: " " };
        WebGlConstants.R8I = { name: "R8I", value: 33329, description: " " };
        WebGlConstants.R8UI = { name: "R8UI", value: 33330, description: " " };
        WebGlConstants.R16I = { name: "R16I", value: 33331, description: " " };
        WebGlConstants.R16UI = { name: "R16UI", value: 33332, description: " " };
        WebGlConstants.R32I = { name: "R32I", value: 33333, description: " " };
        WebGlConstants.R32UI = { name: "R32UI", value: 33334, description: " " };
        WebGlConstants.RG8I = { name: "RG8I", value: 33335, description: " " };
        WebGlConstants.RG8UI = { name: "RG8UI", value: 33336, description: " " };
        WebGlConstants.RG16I = { name: "RG16I", value: 33337, description: " " };
        WebGlConstants.RG16UI = { name: "RG16UI", value: 33338, description: " " };
        WebGlConstants.RG32I = { name: "RG32I", value: 33339, description: " " };
        WebGlConstants.RG32UI = { name: "RG32UI", value: 33340, description: " " };
        WebGlConstants.R8_SNORM = { name: "R8_SNORM", value: 36756, description: " " };
        WebGlConstants.RG8_SNORM = { name: "RG8_SNORM", value: 36757, description: " " };
        WebGlConstants.RGB8_SNORM = { name: "RGB8_SNORM", value: 36758, description: " " };
        WebGlConstants.RGBA8_SNORM = { name: "RGBA8_SNORM", value: 36759, description: " " };
        WebGlConstants.RGB10_A2UI = { name: "RGB10_A2UI", value: 36975, description: " " };
        WebGlConstants.TEXTURE_IMMUTABLE_FORMAT = { name: "TEXTURE_IMMUTABLE_FORMAT", value: 37167, description: " " };
        WebGlConstants.TEXTURE_IMMUTABLE_LEVELS = { name: "TEXTURE_IMMUTABLE_LEVELS", value: 33503, description: " " };
        WebGlConstants.UNSIGNED_INT_2_10_10_10_REV = { name: "UNSIGNED_INT_2_10_10_10_REV", value: 33640, description: " " };
        WebGlConstants.UNSIGNED_INT_10F_11F_11F_REV = { name: "UNSIGNED_INT_10F_11F_11F_REV", value: 35899, description: " " };
        WebGlConstants.UNSIGNED_INT_5_9_9_9_REV = { name: "UNSIGNED_INT_5_9_9_9_REV", value: 35902, description: " " };
        WebGlConstants.FLOAT_32_UNSIGNED_INT_24_8_REV = { name: "FLOAT_32_UNSIGNED_INT_24_8_REV", value: 36269, description: " " };
        WebGlConstants.UNSIGNED_INT_24_8 = { name: "UNSIGNED_INT_24_8", value: 34042, description: " " };
        WebGlConstants.HALF_FLOAT = { name: "HALF_FLOAT", value: 5131, description: " " };
        WebGlConstants.RG = { name: "RG", value: 33319, description: " " };
        WebGlConstants.RG_INTEGER = { name: "RG_INTEGER", value: 33320, description: " " };
        WebGlConstants.INT_2_10_10_10_REV = { name: "INT_2_10_10_10_REV", value: 36255, description: " " };
        WebGlConstants.CURRENT_QUERY = { name: "CURRENT_QUERY", value: 34917, description: " " };
        WebGlConstants.QUERY_RESULT = { name: "QUERY_RESULT", value: 34918, description: " " };
        WebGlConstants.QUERY_RESULT_AVAILABLE = { name: "QUERY_RESULT_AVAILABLE", value: 34919, description: " " };
        WebGlConstants.ANY_SAMPLES_PASSED = { name: "ANY_SAMPLES_PASSED", value: 35887, description: " " };
        WebGlConstants.ANY_SAMPLES_PASSED_CONSERVATIVE = { name: "ANY_SAMPLES_PASSED_CONSERVATIVE", value: 36202, description: " " };
        WebGlConstants.MAX_DRAW_BUFFERS = { name: "MAX_DRAW_BUFFERS", value: 34852, description: " " };
        WebGlConstants.DRAW_BUFFER0 = { name: "DRAW_BUFFER0", value: 34853, description: " " };
        WebGlConstants.DRAW_BUFFER1 = { name: "DRAW_BUFFER1", value: 34854, description: " " };
        WebGlConstants.DRAW_BUFFER2 = { name: "DRAW_BUFFER2", value: 34855, description: " " };
        WebGlConstants.DRAW_BUFFER3 = { name: "DRAW_BUFFER3", value: 34856, description: " " };
        WebGlConstants.DRAW_BUFFER4 = { name: "DRAW_BUFFER4", value: 34857, description: " " };
        WebGlConstants.DRAW_BUFFER5 = { name: "DRAW_BUFFER5", value: 34858, description: " " };
        WebGlConstants.DRAW_BUFFER6 = { name: "DRAW_BUFFER6", value: 34859, description: " " };
        WebGlConstants.DRAW_BUFFER7 = { name: "DRAW_BUFFER7", value: 34860, description: " " };
        WebGlConstants.DRAW_BUFFER8 = { name: "DRAW_BUFFER8", value: 34861, description: " " };
        WebGlConstants.DRAW_BUFFER9 = { name: "DRAW_BUFFER9", value: 34862, description: " " };
        WebGlConstants.DRAW_BUFFER10 = { name: "DRAW_BUFFER10", value: 34863, description: " " };
        WebGlConstants.DRAW_BUFFER11 = { name: "DRAW_BUFFER11", value: 34864, description: " " };
        WebGlConstants.DRAW_BUFFER12 = { name: "DRAW_BUFFER12", value: 34865, description: " " };
        WebGlConstants.DRAW_BUFFER13 = { name: "DRAW_BUFFER13", value: 34866, description: " " };
        WebGlConstants.DRAW_BUFFER14 = { name: "DRAW_BUFFER14", value: 34867, description: " " };
        WebGlConstants.DRAW_BUFFER15 = { name: "DRAW_BUFFER15", value: 34868, description: " " };
        WebGlConstants.MAX_COLOR_ATTACHMENTS = { name: "MAX_COLOR_ATTACHMENTS", value: 36063, description: " " };
        WebGlConstants.COLOR_ATTACHMENT1 = { name: "COLOR_ATTACHMENT1", value: 36065, description: " " };
        WebGlConstants.COLOR_ATTACHMENT2 = { name: "COLOR_ATTACHMENT2", value: 36066, description: " " };
        WebGlConstants.COLOR_ATTACHMENT3 = { name: "COLOR_ATTACHMENT3", value: 36067, description: " " };
        WebGlConstants.COLOR_ATTACHMENT4 = { name: "COLOR_ATTACHMENT4", value: 36068, description: " " };
        WebGlConstants.COLOR_ATTACHMENT5 = { name: "COLOR_ATTACHMENT5", value: 36069, description: " " };
        WebGlConstants.COLOR_ATTACHMENT6 = { name: "COLOR_ATTACHMENT6", value: 36070, description: " " };
        WebGlConstants.COLOR_ATTACHMENT7 = { name: "COLOR_ATTACHMENT7", value: 36071, description: " " };
        WebGlConstants.COLOR_ATTACHMENT8 = { name: "COLOR_ATTACHMENT8", value: 36072, description: " " };
        WebGlConstants.COLOR_ATTACHMENT9 = { name: "COLOR_ATTACHMENT9", value: 36073, description: " " };
        WebGlConstants.COLOR_ATTACHMENT10 = { name: "COLOR_ATTACHMENT10", value: 36074, description: " " };
        WebGlConstants.COLOR_ATTACHMENT11 = { name: "COLOR_ATTACHMENT11", value: 36075, description: " " };
        WebGlConstants.COLOR_ATTACHMENT12 = { name: "COLOR_ATTACHMENT12", value: 36076, description: " " };
        WebGlConstants.COLOR_ATTACHMENT13 = { name: "COLOR_ATTACHMENT13", value: 36077, description: " " };
        WebGlConstants.COLOR_ATTACHMENT14 = { name: "COLOR_ATTACHMENT14", value: 36078, description: " " };
        WebGlConstants.COLOR_ATTACHMENT15 = { name: "COLOR_ATTACHMENT15", value: 36079, description: " " };
        WebGlConstants.SAMPLER_3D = { name: "SAMPLER_3D", value: 35679, description: " " };
        WebGlConstants.SAMPLER_2D_SHADOW = { name: "SAMPLER_2D_SHADOW", value: 35682, description: " " };
        WebGlConstants.SAMPLER_2D_ARRAY = { name: "SAMPLER_2D_ARRAY", value: 36289, description: " " };
        WebGlConstants.SAMPLER_2D_ARRAY_SHADOW = { name: "SAMPLER_2D_ARRAY_SHADOW", value: 36292, description: " " };
        WebGlConstants.SAMPLER_CUBE_SHADOW = { name: "SAMPLER_CUBE_SHADOW", value: 36293, description: " " };
        WebGlConstants.INT_SAMPLER_2D = { name: "INT_SAMPLER_2D", value: 36298, description: " " };
        WebGlConstants.INT_SAMPLER_3D = { name: "INT_SAMPLER_3D", value: 36299, description: " " };
        WebGlConstants.INT_SAMPLER_CUBE = { name: "INT_SAMPLER_CUBE", value: 36300, description: " " };
        WebGlConstants.INT_SAMPLER_2D_ARRAY = { name: "INT_SAMPLER_2D_ARRAY", value: 36303, description: " " };
        WebGlConstants.UNSIGNED_INT_SAMPLER_2D = { name: "UNSIGNED_INT_SAMPLER_2D", value: 36306, description: " " };
        WebGlConstants.UNSIGNED_INT_SAMPLER_3D = { name: "UNSIGNED_INT_SAMPLER_3D", value: 36307, description: " " };
        WebGlConstants.UNSIGNED_INT_SAMPLER_CUBE = { name: "UNSIGNED_INT_SAMPLER_CUBE", value: 36308, description: " " };
        WebGlConstants.UNSIGNED_INT_SAMPLER_2D_ARRAY = { name: "UNSIGNED_INT_SAMPLER_2D_ARRAY", value: 36311, description: " " };
        WebGlConstants.MAX_SAMPLES = { name: "MAX_SAMPLES", value: 36183, description: " " };
        WebGlConstants.SAMPLER_BINDING = { name: "SAMPLER_BINDING", value: 35097, description: " " };
        WebGlConstants.PIXEL_PACK_BUFFER = { name: "PIXEL_PACK_BUFFER", value: 35051, description: " " };
        WebGlConstants.PIXEL_UNPACK_BUFFER = { name: "PIXEL_UNPACK_BUFFER", value: 35052, description: " " };
        WebGlConstants.PIXEL_PACK_BUFFER_BINDING = { name: "PIXEL_PACK_BUFFER_BINDING", value: 35053, description: " " };
        WebGlConstants.PIXEL_UNPACK_BUFFER_BINDING = { name: "PIXEL_UNPACK_BUFFER_BINDING", value: 35055, description: " " };
        WebGlConstants.COPY_READ_BUFFER = { name: "COPY_READ_BUFFER", value: 36662, description: " " };
        WebGlConstants.COPY_WRITE_BUFFER = { name: "COPY_WRITE_BUFFER", value: 36663, description: " " };
        WebGlConstants.COPY_READ_BUFFER_BINDING = { name: "COPY_READ_BUFFER_BINDING", value: 36662, description: " " };
        WebGlConstants.COPY_WRITE_BUFFER_BINDING = { name: "COPY_WRITE_BUFFER_BINDING", value: 36663, description: " " };
        WebGlConstants.FLOAT_MAT2x3 = { name: "FLOAT_MAT2x3", value: 35685, description: " " };
        WebGlConstants.FLOAT_MAT2x4 = { name: "FLOAT_MAT2x4", value: 35686, description: " " };
        WebGlConstants.FLOAT_MAT3x2 = { name: "FLOAT_MAT3x2", value: 35687, description: " " };
        WebGlConstants.FLOAT_MAT3x4 = { name: "FLOAT_MAT3x4", value: 35688, description: " " };
        WebGlConstants.FLOAT_MAT4x2 = { name: "FLOAT_MAT4x2", value: 35689, description: " " };
        WebGlConstants.FLOAT_MAT4x3 = { name: "FLOAT_MAT4x3", value: 35690, description: " " };
        WebGlConstants.UNSIGNED_INT_VEC2 = { name: "UNSIGNED_INT_VEC2", value: 36294, description: " " };
        WebGlConstants.UNSIGNED_INT_VEC3 = { name: "UNSIGNED_INT_VEC3", value: 36295, description: " " };
        WebGlConstants.UNSIGNED_INT_VEC4 = { name: "UNSIGNED_INT_VEC4", value: 36296, description: " " };
        WebGlConstants.UNSIGNED_NORMALIZED = { name: "UNSIGNED_NORMALIZED", value: 35863, description: " " };
        WebGlConstants.SIGNED_NORMALIZED = { name: "SIGNED_NORMALIZED", value: 36764, description: " " };
        WebGlConstants.VERTEX_ATTRIB_ARRAY_INTEGER = { name: "VERTEX_ATTRIB_ARRAY_INTEGER", value: 35069, description: " " };
        WebGlConstants.VERTEX_ATTRIB_ARRAY_DIVISOR = { name: "VERTEX_ATTRIB_ARRAY_DIVISOR", value: 35070, description: " " };
        WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_MODE = { name: "TRANSFORM_FEEDBACK_BUFFER_MODE", value: 35967, description: " " };
        WebGlConstants.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS = { name: "MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS", value: 35968, description: " " };
        WebGlConstants.TRANSFORM_FEEDBACK_VARYINGS = { name: "TRANSFORM_FEEDBACK_VARYINGS", value: 35971, description: " " };
        WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_START = { name: "TRANSFORM_FEEDBACK_BUFFER_START", value: 35972, description: " " };
        WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_SIZE = { name: "TRANSFORM_FEEDBACK_BUFFER_SIZE", value: 35973, description: " " };
        WebGlConstants.TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN = { name: "TRANSFORM_FEEDBACK_PRIMITIVES_WRITTEN", value: 35976, description: " " };
        WebGlConstants.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS = { name: "MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS", value: 35978, description: " " };
        WebGlConstants.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS = { name: "MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS", value: 35979, description: " " };
        WebGlConstants.INTERLEAVED_ATTRIBS = { name: "INTERLEAVED_ATTRIBS", value: 35980, description: " " };
        WebGlConstants.SEPARATE_ATTRIBS = { name: "SEPARATE_ATTRIBS", value: 35981, description: " " };
        WebGlConstants.TRANSFORM_FEEDBACK_BUFFER = { name: "TRANSFORM_FEEDBACK_BUFFER", value: 35982, description: " " };
        WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_BINDING = { name: "TRANSFORM_FEEDBACK_BUFFER_BINDING", value: 35983, description: " " };
        WebGlConstants.TRANSFORM_FEEDBACK = { name: "TRANSFORM_FEEDBACK", value: 36386, description: " " };
        WebGlConstants.TRANSFORM_FEEDBACK_PAUSED = { name: "TRANSFORM_FEEDBACK_PAUSED", value: 36387, description: " " };
        WebGlConstants.TRANSFORM_FEEDBACK_ACTIVE = { name: "TRANSFORM_FEEDBACK_ACTIVE", value: 36388, description: " " };
        WebGlConstants.TRANSFORM_FEEDBACK_BINDING = { name: "TRANSFORM_FEEDBACK_BINDING", value: 36389, description: " " };
        WebGlConstants.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING = { name: "FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING", value: 33296, description: " " };
        WebGlConstants.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE = { name: "FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE", value: 33297, description: " " };
        WebGlConstants.FRAMEBUFFER_ATTACHMENT_RED_SIZE = { name: "FRAMEBUFFER_ATTACHMENT_RED_SIZE", value: 33298, description: " " };
        WebGlConstants.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE = { name: "FRAMEBUFFER_ATTACHMENT_GREEN_SIZE", value: 33299, description: " " };
        WebGlConstants.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE = { name: "FRAMEBUFFER_ATTACHMENT_BLUE_SIZE", value: 33300, description: " " };
        WebGlConstants.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE = { name: "FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE", value: 33301, description: " " };
        WebGlConstants.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE = { name: "FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE", value: 33302, description: " " };
        WebGlConstants.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE = { name: "FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE", value: 33303, description: " " };
        WebGlConstants.FRAMEBUFFER_DEFAULT = { name: "FRAMEBUFFER_DEFAULT", value: 33304, description: " " };
        WebGlConstants.DEPTH24_STENCIL8 = { name: "DEPTH24_STENCIL8", value: 35056, description: " " };
        WebGlConstants.DRAW_FRAMEBUFFER_BINDING = { name: "DRAW_FRAMEBUFFER_BINDING", value: 36006, description: " " };
        WebGlConstants.READ_FRAMEBUFFER = { name: "READ_FRAMEBUFFER", value: 36008, description: " " };
        WebGlConstants.DRAW_FRAMEBUFFER = { name: "DRAW_FRAMEBUFFER", value: 36009, description: " " };
        WebGlConstants.READ_FRAMEBUFFER_BINDING = { name: "READ_FRAMEBUFFER_BINDING", value: 36010, description: " " };
        WebGlConstants.RENDERBUFFER_SAMPLES = { name: "RENDERBUFFER_SAMPLES", value: 36011, description: " " };
        WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER = { name: "FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER", value: 36052, description: " " };
        WebGlConstants.FRAMEBUFFER_INCOMPLETE_MULTISAMPLE = { name: "FRAMEBUFFER_INCOMPLETE_MULTISAMPLE", value: 36182, description: " " };
        WebGlConstants.UNIFORM_BUFFER = { name: "UNIFORM_BUFFER", value: 35345, description: " " };
        WebGlConstants.UNIFORM_BUFFER_BINDING = { name: "UNIFORM_BUFFER_BINDING", value: 35368, description: " " };
        WebGlConstants.UNIFORM_BUFFER_START = { name: "UNIFORM_BUFFER_START", value: 35369, description: " " };
        WebGlConstants.UNIFORM_BUFFER_SIZE = { name: "UNIFORM_BUFFER_SIZE", value: 35370, description: " " };
        WebGlConstants.MAX_VERTEX_UNIFORM_BLOCKS = { name: "MAX_VERTEX_UNIFORM_BLOCKS", value: 35371, description: " " };
        WebGlConstants.MAX_FRAGMENT_UNIFORM_BLOCKS = { name: "MAX_FRAGMENT_UNIFORM_BLOCKS", value: 35373, description: " " };
        WebGlConstants.MAX_COMBINED_UNIFORM_BLOCKS = { name: "MAX_COMBINED_UNIFORM_BLOCKS", value: 35374, description: " " };
        WebGlConstants.MAX_UNIFORM_BUFFER_BINDINGS = { name: "MAX_UNIFORM_BUFFER_BINDINGS", value: 35375, description: " " };
        WebGlConstants.MAX_UNIFORM_BLOCK_SIZE = { name: "MAX_UNIFORM_BLOCK_SIZE", value: 35376, description: " " };
        WebGlConstants.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS = { name: "MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS", value: 35377, description: " " };
        WebGlConstants.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS = { name: "MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS", value: 35379, description: " " };
        WebGlConstants.UNIFORM_BUFFER_OFFSET_ALIGNMENT = { name: "UNIFORM_BUFFER_OFFSET_ALIGNMENT", value: 35380, description: " " };
        WebGlConstants.ACTIVE_UNIFORM_BLOCKS = { name: "ACTIVE_UNIFORM_BLOCKS", value: 35382, description: " " };
        WebGlConstants.UNIFORM_TYPE = { name: "UNIFORM_TYPE", value: 35383, description: " " };
        WebGlConstants.UNIFORM_SIZE = { name: "UNIFORM_SIZE", value: 35384, description: " " };
        WebGlConstants.UNIFORM_BLOCK_INDEX = { name: "UNIFORM_BLOCK_INDEX", value: 35386, description: " " };
        WebGlConstants.UNIFORM_OFFSET = { name: "UNIFORM_OFFSET", value: 35387, description: " " };
        WebGlConstants.UNIFORM_ARRAY_STRIDE = { name: "UNIFORM_ARRAY_STRIDE", value: 35388, description: " " };
        WebGlConstants.UNIFORM_MATRIX_STRIDE = { name: "UNIFORM_MATRIX_STRIDE", value: 35389, description: " " };
        WebGlConstants.UNIFORM_IS_ROW_MAJOR = { name: "UNIFORM_IS_ROW_MAJOR", value: 35390, description: " " };
        WebGlConstants.UNIFORM_BLOCK_BINDING = { name: "UNIFORM_BLOCK_BINDING", value: 35391, description: " " };
        WebGlConstants.UNIFORM_BLOCK_DATA_SIZE = { name: "UNIFORM_BLOCK_DATA_SIZE", value: 35392, description: " " };
        WebGlConstants.UNIFORM_BLOCK_ACTIVE_UNIFORMS = { name: "UNIFORM_BLOCK_ACTIVE_UNIFORMS", value: 35394, description: " " };
        WebGlConstants.UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES = { name: "UNIFORM_BLOCK_ACTIVE_UNIFORM_INDICES", value: 35395, description: " " };
        WebGlConstants.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER = { name: "UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER", value: 35396, description: " " };
        WebGlConstants.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER = { name: "UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER", value: 35398, description: " " };
        WebGlConstants.OBJECT_TYPE = { name: "OBJECT_TYPE", value: 37138, description: " " };
        WebGlConstants.SYNC_CONDITION = { name: "SYNC_CONDITION", value: 37139, description: " " };
        WebGlConstants.SYNC_STATUS = { name: "SYNC_STATUS", value: 37140, description: " " };
        WebGlConstants.SYNC_FLAGS = { name: "SYNC_FLAGS", value: 37141, description: " " };
        WebGlConstants.SYNC_FENCE = { name: "SYNC_FENCE", value: 37142, description: " " };
        WebGlConstants.SYNC_GPU_COMMANDS_COMPLETE = { name: "SYNC_GPU_COMMANDS_COMPLETE", value: 37143, description: " " };
        WebGlConstants.UNSIGNALED = { name: "UNSIGNALED", value: 37144, description: " " };
        WebGlConstants.SIGNALED = { name: "SIGNALED", value: 37145, description: " " };
        WebGlConstants.ALREADY_SIGNALED = { name: "ALREADY_SIGNALED", value: 37146, description: " " };
        WebGlConstants.TIMEOUT_EXPIRED = { name: "TIMEOUT_EXPIRED", value: 37147, description: " " };
        WebGlConstants.CONDITION_SATISFIED = { name: "CONDITION_SATISFIED", value: 37148, description: " " };
        WebGlConstants.WAIT_FAILED = { name: "WAIT_FAILED", value: 37149, description: " " };
        WebGlConstants.SYNC_FLUSH_COMMANDS_BIT = { name: "SYNC_FLUSH_COMMANDS_BIT", value: 1, description: " " };
        WebGlConstants.COLOR = { name: "COLOR", value: 6144, description: " " };
        WebGlConstants.DEPTH = { name: "DEPTH", value: 6145, description: " " };
        WebGlConstants.STENCIL = { name: "STENCIL", value: 6146, description: " " };
        WebGlConstants.MIN = { name: "MIN", value: 32775, description: " " };
        WebGlConstants.MAX = { name: "MAX", value: 32776, description: " " };
        WebGlConstants.DEPTH_COMPONENT24 = { name: "DEPTH_COMPONENT24", value: 33190, description: " " };
        WebGlConstants.STREAM_READ = { name: "STREAM_READ", value: 35041, description: " " };
        WebGlConstants.STREAM_COPY = { name: "STREAM_COPY", value: 35042, description: " " };
        WebGlConstants.STATIC_READ = { name: "STATIC_READ", value: 35045, description: " " };
        WebGlConstants.STATIC_COPY = { name: "STATIC_COPY", value: 35046, description: " " };
        WebGlConstants.DYNAMIC_READ = { name: "DYNAMIC_READ", value: 35049, description: " " };
        WebGlConstants.DYNAMIC_COPY = { name: "DYNAMIC_COPY", value: 35050, description: " " };
        WebGlConstants.DEPTH_COMPONENT32F = { name: "DEPTH_COMPONENT32F", value: 36012, description: " " };
        WebGlConstants.DEPTH32F_STENCIL8 = { name: "DEPTH32F_STENCIL8", value: 36013, description: " " };
        WebGlConstants.INVALID_INDEX = { name: "INVALID_INDEX", value: 4294967295, description: " " };
        WebGlConstants.TIMEOUT_IGNORED = { name: "TIMEOUT_IGNORED", value: -1, description: " " };
        WebGlConstants.MAX_CLIENT_WAIT_TIMEOUT_WEBGL = { name: "MAX_CLIENT_WAIT_TIMEOUT_WEBGL", value: 37447, description: " " };
        // extensions
        WebGlConstants.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE = { name: "VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE", value: 35070, description: "Describes the frequency divisor used for instanced rendering.", extensionName: "ANGLE_instanced_arrays" };
        WebGlConstants.UNMASKED_VENDOR_WEBGL = { name: "UNMASKED_VENDOR_WEBGL", value: 37445, description: "Passed to getParameter to get the vendor string of the graphics driver.", extensionName: "ANGLE_instanced_arrays" };
        WebGlConstants.UNMASKED_RENDERER_WEBGL = { name: "UNMASKED_RENDERER_WEBGL", value: 37446, description: "Passed to getParameter to get the renderer string of the graphics driver.", extensionName: "WEBGL_debug_renderer_info" };
        WebGlConstants.MAX_TEXTURE_MAX_ANISOTROPY_EXT = { name: "MAX_TEXTURE_MAX_ANISOTROPY_EXT", value: 34047, description: "Returns the maximum available anisotropy.", extensionName: "EXT_texture_filter_anisotropic" };
        WebGlConstants.TEXTURE_MAX_ANISOTROPY_EXT = { name: "TEXTURE_MAX_ANISOTROPY_EXT", value: 34046, description: "Passed to texParameter to set the desired maximum anisotropy for a texture.", extensionName: "EXT_texture_filter_anisotropic" };
        WebGlConstants.COMPRESSED_RGB_S3TC_DXT1_EXT = { name: "COMPRESSED_RGB_S3TC_DXT1_EXT", value: 33776, description: "A DXT1-compressed image in an RGB image format.", extensionName: "WEBGL_compressed_texture_s3tc" };
        WebGlConstants.COMPRESSED_RGBA_S3TC_DXT1_EXT = { name: "COMPRESSED_RGBA_S3TC_DXT1_EXT", value: 33777, description: "A DXT1-compressed image in an RGB image format with a simple on/off alpha value.", extensionName: "WEBGL_compressed_texture_s3tc" };
        WebGlConstants.COMPRESSED_RGBA_S3TC_DXT3_EXT = { name: "COMPRESSED_RGBA_S3TC_DXT3_EXT", value: 33778, description: "A DXT3-compressed image in an RGBA image format. Compared to a 32-bit RGBA texture, it offers 4:1 compression.", extensionName: "WEBGL_compressed_texture_s3tc" };
        WebGlConstants.COMPRESSED_RGBA_S3TC_DXT5_EXT = { name: "COMPRESSED_RGBA_S3TC_DXT5_EXT", value: 33779, description: "A DXT5-compressed image in an RGBA image format. It also provides a 4:1 compression, but differs to the DXT3 compression in how the alpha compression is done.", extensionName: "WEBGL_compressed_texture_s3tc" };
        WebGlConstants.COMPRESSED_R11_EAC = { name: "COMPRESSED_R11_EAC", value: 37488, description: "One-channel (red) unsigned format compression.", extensionName: "WEBGL_compressed_texture_etc" };
        WebGlConstants.COMPRESSED_SIGNED_R11_EAC = { name: "COMPRESSED_SIGNED_R11_EAC", value: 37489, description: "One-channel (red) signed format compression.", extensionName: "WEBGL_compressed_texture_etc" };
        WebGlConstants.COMPRESSED_RG11_EAC = { name: "COMPRESSED_RG11_EAC", value: 37490, description: "Two-channel (red and green) unsigned format compression.", extensionName: "WEBGL_compressed_texture_etc" };
        WebGlConstants.COMPRESSED_SIGNED_RG11_EAC = { name: "COMPRESSED_SIGNED_RG11_EAC", value: 37491, description: "Two-channel (red and green) signed format compression.", extensionName: "WEBGL_compressed_texture_etc" };
        WebGlConstants.COMPRESSED_RGB8_ETC2 = { name: "COMPRESSED_RGB8_ETC2", value: 37492, description: "Compresses RBG8 data with no alpha channel.", extensionName: "WEBGL_compressed_texture_etc" };
        WebGlConstants.COMPRESSED_RGBA8_ETC2_EAC = { name: "COMPRESSED_RGBA8_ETC2_EAC", value: 37493, description: "Compresses RGBA8 data. The RGB part is encoded the same as RGB_ETC2, but the alpha part is encoded separately.", extensionName: "WEBGL_compressed_texture_etc" };
        WebGlConstants.COMPRESSED_SRGB8_ETC2 = { name: "COMPRESSED_SRGB8_ETC2", value: 37494, description: "Compresses sRBG8 data with no alpha channel.", extensionName: "WEBGL_compressed_texture_etc" };
        WebGlConstants.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC = { name: "COMPRESSED_SRGB8_ALPHA8_ETC2_EAC", value: 37495, description: "Compresses sRGBA8 data. The sRGB part is encoded the same as SRGB_ETC2, but the alpha part is encoded separately.", extensionName: "WEBGL_compressed_texture_etc" };
        WebGlConstants.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2 = { name: "COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2", value: 37496, description: "Similar to RGB8_ETC, but with ability to punch through the alpha channel, which means to make it completely opaque or transparent.", extensionName: "WEBGL_compressed_texture_etc" };
        WebGlConstants.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 = { name: "COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2", value: 37497, description: "Similar to SRGB8_ETC, but with ability to punch through the alpha channel, which means to make it completely opaque or transparent.", extensionName: "WEBGL_compressed_texture_etc" };
        WebGlConstants.COMPRESSED_RGB_PVRTC_4BPPV1_IMG = { name: "COMPRESSED_RGB_PVRTC_4BPPV1_IMG", value: 35840, description: "RGB compression in 4-bit mode. One block for each 4×4 pixels.", extensionName: "WEBGL_compressed_texture_pvrtc" };
        WebGlConstants.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = { name: "COMPRESSED_RGBA_PVRTC_4BPPV1_IMG", value: 35842, description: "RGBA compression in 4-bit mode. One block for each 4×4 pixels.", extensionName: "WEBGL_compressed_texture_pvrtc" };
        WebGlConstants.COMPRESSED_RGB_PVRTC_2BPPV1_IMG = { name: "COMPRESSED_RGB_PVRTC_2BPPV1_IMG", value: 35841, description: "RGB compression in 2-bit mode. One block for each 8×4 pixels.", extensionName: "WEBGL_compressed_texture_pvrtc" };
        WebGlConstants.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = { name: "COMPRESSED_RGBA_PVRTC_2BPPV1_IMG", value: 35843, description: "RGBA compression in 2-bit mode. One block for each 8×4 pixe", extensionName: "WEBGL_compressed_texture_pvrtc" };
        WebGlConstants.COMPRESSED_RGB_ETC1_WEBGL = { name: "COMPRESSED_RGB_ETC1_WEBGL", value: 36196, description: "Compresses 24-bit RGB data with no alpha channel.", extensionName: "WEBGL_compressed_texture_etc1" };
        WebGlConstants.COMPRESSED_RGB_ATC_WEBGL = { name: "COMPRESSED_RGB_ATC_WEBGL", value: 35986, description: "Compresses RGB textures with no alpha channel.", extensionName: "WEBGL_compressed_texture_atc" };
        WebGlConstants.COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL = { name: "COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL", value: 35986, description: "Compresses RGBA textures using explicit alpha encoding (useful when alpha transitions are sharp).", extensionName: "WEBGL_compressed_texture_atc" };
        WebGlConstants.COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL = { name: "COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL", value: 34798, description: "Compresses RGBA textures using interpolated alpha encoding (useful when alpha transitions are gradient).", extensionName: "WEBGL_compressed_texture_atc" };
        WebGlConstants.UNSIGNED_INT_24_8_WEBGL = { name: "UNSIGNED_INT_24_8_WEBGL", value: 34042, description: "Unsigned integer type for 24-bit depth texture data.", extensionName: "WEBGL_depth_texture" };
        WebGlConstants.HALF_FLOAT_OES = { name: "HALF_FLOAT_OES", value: 36193, description: "Half floating-point type (16-bit).", extensionName: "OES_texture_half_float" };
        // public static readonly RGBA32F_EXT: WebGlConstant = { name: "RGBA32F_EXT", value: 34836, description: "RGBA 32-bit floating-point color-renderable format.", extensionName: "WEBGL_color_buffer_float" };
        // public static readonly RGB32F_EXT: WebGlConstant = { name: "RGB32F_EXT", value: 34837, description: "RGB 32-bit floating-point color-renderable format.", extensionName: "WEBGL_color_buffer_float" };
        WebGlConstants.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT = { name: "FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE_EXT", value: 33297, description: " ", extensionName: "WEBGL_color_buffer_float" };
        WebGlConstants.UNSIGNED_NORMALIZED_EXT = { name: "UNSIGNED_NORMALIZED_EXT", value: 35863, description: " ", extensionName: "WEBGL_color_buffer_float" };
        WebGlConstants.MIN_EXT = { name: "MIN_EXT", value: 32775, description: "Produces the minimum color components of the source and destination colors.", extensionName: "EXT_blend_minmax" };
        WebGlConstants.MAX_EXT = { name: "MAX_EXT", value: 32776, description: "Produces the maximum color components of the source and destination colors.", extensionName: "EXT_blend_minmax" };
        WebGlConstants.SRGB_EXT = { name: "SRGB_EXT", value: 35904, description: "Unsized sRGB format that leaves the precision up to the driver.", extensionName: "EXT_sRGB" };
        WebGlConstants.SRGB_ALPHA_EXT = { name: "SRGB_ALPHA_EXT", value: 35906, description: "Unsized sRGB format with unsized alpha component.", extensionName: "EXT_sRGB" };
        WebGlConstants.SRGB8_ALPHA8_EXT = { name: "SRGB8_ALPHA8_EXT", value: 35907, description: "Sized (8-bit) sRGB and alpha formats.", extensionName: "EXT_sRGB" };
        WebGlConstants.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT = { name: "FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT", value: 33296, description: "Returns the framebuffer color encoding.", extensionName: "EXT_sRGB" };
        WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT_OES = { name: "FRAGMENT_SHADER_DERIVATIVE_HINT_OES", value: 35723, description: "Indicates the accuracy of the derivative calculation for the GLSL built-in functions: dFdx, dFdy, and fwidth.", extensionName: "OES_standard_derivatives" };
        WebGlConstants.COLOR_ATTACHMENT0_WEBGL = { name: "COLOR_ATTACHMENT0_WEBGL", value: 36064, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.COLOR_ATTACHMENT1_WEBGL = { name: "COLOR_ATTACHMENT1_WEBGL", value: 36065, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.COLOR_ATTACHMENT2_WEBGL = { name: "COLOR_ATTACHMENT2_WEBGL", value: 36066, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.COLOR_ATTACHMENT3_WEBGL = { name: "COLOR_ATTACHMENT3_WEBGL", value: 36067, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.COLOR_ATTACHMENT4_WEBGL = { name: "COLOR_ATTACHMENT4_WEBGL", value: 36068, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.COLOR_ATTACHMENT5_WEBGL = { name: "COLOR_ATTACHMENT5_WEBGL", value: 36069, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.COLOR_ATTACHMENT6_WEBGL = { name: "COLOR_ATTACHMENT6_WEBGL", value: 36070, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.COLOR_ATTACHMENT7_WEBGL = { name: "COLOR_ATTACHMENT7_WEBGL", value: 36071, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.COLOR_ATTACHMENT8_WEBGL = { name: "COLOR_ATTACHMENT8_WEBGL", value: 36072, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.COLOR_ATTACHMENT9_WEBGL = { name: "COLOR_ATTACHMENT9_WEBGL", value: 36073, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.COLOR_ATTACHMENT10_WEBGL = { name: "COLOR_ATTACHMENT10_WEBGL", value: 36074, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.COLOR_ATTACHMENT11_WEBGL = { name: "COLOR_ATTACHMENT11_WEBGL", value: 36075, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.COLOR_ATTACHMENT12_WEBGL = { name: "COLOR_ATTACHMENT12_WEBGL", value: 36076, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.COLOR_ATTACHMENT13_WEBGL = { name: "COLOR_ATTACHMENT13_WEBGL", value: 36077, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.COLOR_ATTACHMENT14_WEBGL = { name: "COLOR_ATTACHMENT14_WEBGL", value: 36078, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.COLOR_ATTACHMENT15_WEBGL = { name: "COLOR_ATTACHMENT15_WEBGL", value: 36079, description: "Framebuffer color attachment point", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.DRAW_BUFFER0_WEBGL = { name: "DRAW_BUFFER0_WEBGL", value: 34853, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.DRAW_BUFFER1_WEBGL = { name: "DRAW_BUFFER1_WEBGL", value: 34854, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.DRAW_BUFFER2_WEBGL = { name: "DRAW_BUFFER2_WEBGL", value: 34855, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.DRAW_BUFFER3_WEBGL = { name: "DRAW_BUFFER3_WEBGL", value: 34856, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.DRAW_BUFFER4_WEBGL = { name: "DRAW_BUFFER4_WEBGL", value: 34857, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.DRAW_BUFFER5_WEBGL = { name: "DRAW_BUFFER5_WEBGL", value: 34858, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.DRAW_BUFFER6_WEBGL = { name: "DRAW_BUFFER6_WEBGL", value: 34859, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.DRAW_BUFFER7_WEBGL = { name: "DRAW_BUFFER7_WEBGL", value: 34860, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.DRAW_BUFFER8_WEBGL = { name: "DRAW_BUFFER8_WEBGL", value: 34861, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.DRAW_BUFFER9_WEBGL = { name: "DRAW_BUFFER9_WEBGL", value: 34862, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.DRAW_BUFFER10_WEBGL = { name: "DRAW_BUFFER10_WEBGL", value: 34863, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.DRAW_BUFFER11_WEBGL = { name: "DRAW_BUFFER11_WEBGL", value: 34864, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.DRAW_BUFFER12_WEBGL = { name: "DRAW_BUFFER12_WEBGL", value: 34865, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.DRAW_BUFFER13_WEBGL = { name: "DRAW_BUFFER13_WEBGL", value: 34866, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.DRAW_BUFFER14_WEBGL = { name: "DRAW_BUFFER14_WEBGL", value: 34867, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.DRAW_BUFFER15_WEBGL = { name: "DRAW_BUFFER15_WEBGL", value: 34868, description: "Draw buffer", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.MAX_COLOR_ATTACHMENTS_WEBGL = { name: "MAX_COLOR_ATTACHMENTS_WEBGL", value: 36063, description: "Maximum number of framebuffer color attachment points", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.MAX_DRAW_BUFFERS_WEBGL = { name: "MAX_DRAW_BUFFERS_WEBGL", value: 34852, description: "Maximum number of draw buffers", extensionName: "WEBGL_draw_buffers" };
        WebGlConstants.VERTEX_ARRAY_BINDING_OES = { name: "VERTEX_ARRAY_BINDING_OES", value: 34229, description: "The bound vertex array object (VAO).", extensionName: "VERTEX_ARRAY_BINDING_OES" };
        WebGlConstants.QUERY_COUNTER_BITS_EXT = { name: "QUERY_COUNTER_BITS_EXT", value: 34916, description: "The number of bits used to hold the query result for the given target.", extensionName: "EXT_disjoint_timer_query" };
        WebGlConstants.CURRENT_QUERY_EXT = { name: "CURRENT_QUERY_EXT", value: 34917, description: "The currently active query.", extensionName: "EXT_disjoint_timer_query" };
        WebGlConstants.QUERY_RESULT_EXT = { name: "QUERY_RESULT_EXT", value: 34918, description: "The query result.", extensionName: "EXT_disjoint_timer_query" };
        WebGlConstants.QUERY_RESULT_AVAILABLE_EXT = { name: "QUERY_RESULT_AVAILABLE_EXT", value: 34919, description: "A Boolean indicating whether or not a query result is available.", extensionName: "EXT_disjoint_timer_query" };
        WebGlConstants.TIME_ELAPSED_EXT = { name: "TIME_ELAPSED_EXT", value: 35007, description: "Elapsed time (in nanoseconds).", extensionName: "EXT_disjoint_timer_query" };
        WebGlConstants.TIMESTAMP_EXT = { name: "TIMESTAMP_EXT", value: 36392, description: "The current time.", extensionName: "EXT_disjoint_timer_query" };
        WebGlConstants.GPU_DISJOINT_EXT = { name: "GPU_DISJOINT_EXT", value: 36795, description: "A Boolean indicating whether or not the GPU performed any disjoint operation.", extensionName: "EXT_disjoint_timer_query" };
        WebGlConstants.zeroMeaningByCommand = {
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
            drawBuffers: "POINTS",
            drawElementsInstanced: "POINTS",
            drawRangeElements: "POINTS",
        };
        WebGlConstants.oneMeaningByCommand = {
            blendFunc: "ONE",
            blendFuncSeparate: "ONE",
            drawArrays: "LINES",
            drawElements: "LINES",
            drawArraysInstanced: "LINES",
            drawBuffers: "LINES",
            drawElementsInstanced: "LINES",
            drawRangeElements: "LINES",
        };
        return WebGlConstants;
    }());
    SPECTOR.WebGlConstants = WebGlConstants;
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    SPECTOR.WebGlConstantsByName = {};
    (function init() {
        for (var name_1 in SPECTOR.WebGlConstants) {
            if (SPECTOR.WebGlConstants.hasOwnProperty(name_1)) {
                var constant = SPECTOR.WebGlConstants[name_1];
                SPECTOR.WebGlConstantsByName[constant.name] = constant;
            }
        }
    })();
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    SPECTOR.WebGlConstantsByValue = {};
    (function init() {
        for (var name_2 in SPECTOR.WebGlConstants) {
            if (SPECTOR.WebGlConstants.hasOwnProperty(name_2)) {
                var constant = SPECTOR.WebGlConstants[name_2];
                SPECTOR.WebGlConstantsByValue[constant.value] = constant;
            }
        }
    })();
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Decorators;
    (function (Decorators) {
        // tslint:disable:only-arrow-functions
        var COMMANDNAMEKEY = "__CommandName";
        function command(commandName) {
            return function (target) {
                target[COMMANDNAMEKEY] = commandName;
            };
        }
        Decorators.command = command;
        function getCommandName(target) {
            return target[COMMANDNAMEKEY];
        }
        Decorators.getCommandName = getCommandName;
        var STATENAMEKEY = "__StateName";
        function state(stateName) {
            return function (target) {
                target[STATENAMEKEY] = stateName;
            };
        }
        Decorators.state = state;
        function getStateName(target) {
            return target[STATENAMEKEY];
        }
        Decorators.getStateName = getStateName;
        var RECORDEROBJECTNAMEKEY = "___RecorderObjectName";
        function recorder(objectName) {
            return function (target) {
                target[RECORDEROBJECTNAMEKEY] = objectName;
            };
        }
        Decorators.recorder = recorder;
        function getRecorderName(target) {
            return target[RECORDEROBJECTNAMEKEY];
        }
        Decorators.getRecorderName = getRecorderName;
        Decorators.OBJECTNAMEKEY = "___ObjectName";
        Decorators.OBJECTTYPEKEY = "___ObjectType";
        function webGlObject(objectName) {
            return function (target) {
                target[Decorators.OBJECTNAMEKEY] = objectName;
                target[Decorators.OBJECTTYPEKEY] = window[objectName] || null;
            };
        }
        Decorators.webGlObject = webGlObject;
        function getWebGlObjectName(target) {
            return target[Decorators.OBJECTNAMEKEY];
        }
        Decorators.getWebGlObjectName = getWebGlObjectName;
        // tslint:disable-next-line:ban-types
        function getWebGlObjectType(target) {
            return target[Decorators.OBJECTTYPEKEY];
        }
        Decorators.getWebGlObjectType = getWebGlObjectType;
        var ANLYSEROBJECTNAMEKEY = "___AnalyserObjectName";
        function analyser(analyerName) {
            return function (target) {
                target[ANLYSEROBJECTNAMEKEY] = analyerName;
            };
        }
        Decorators.analyser = analyser;
        function getAnalyserName(target) {
            return target[ANLYSEROBJECTNAMEKEY];
        }
        Decorators.getAnalyserName = getAnalyserName;
    })(Decorators = SPECTOR.Decorators || (SPECTOR.Decorators = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var ReadPixelsHelper = /** @class */ (function () {
        function ReadPixelsHelper() {
        }
        ReadPixelsHelper.isSupportedCombination = function (type, format, internalFormat) {
            // In case of texStorage.
            type = type || SPECTOR.WebGlConstants.UNSIGNED_BYTE.value;
            format = format || SPECTOR.WebGlConstants.RGBA.value;
            // Only reads RGB RGBA.
            if (format !== SPECTOR.WebGlConstants.RGB.value &&
                format !== SPECTOR.WebGlConstants.RGBA.value) {
                return false;
            }
            // Only reads 8 16 32.
            if (internalFormat !== SPECTOR.WebGlConstants.RGB.value &&
                internalFormat !== SPECTOR.WebGlConstants.RGBA.value &&
                internalFormat !== SPECTOR.WebGlConstants.RGBA8.value &&
                internalFormat !== SPECTOR.WebGlConstants.RGBA16F.value &&
                internalFormat !== SPECTOR.WebGlConstants.RGBA32F.value &&
                internalFormat !== SPECTOR.WebGlConstants.RGB16F.value &&
                internalFormat !== SPECTOR.WebGlConstants.RGB32F.value &&
                internalFormat !== SPECTOR.WebGlConstants.R11F_G11F_B10F.value) {
                return false;
            }
            return this.isSupportedComponentType(type);
        };
        ReadPixelsHelper.readPixels = function (gl, x, y, width, height, type) {
            // Empty error list.
            gl.getError();
            // prepare destination storage.
            var size = width * height * 4;
            var pixels;
            if (type === SPECTOR.WebGlConstants.UNSIGNED_BYTE.value) {
                pixels = new Uint8Array(size);
            }
            else {
                type = SPECTOR.WebGlConstants.FLOAT.value;
                pixels = new Float32Array(size);
            }
            // Read the pixels from the frame buffer.
            gl.readPixels(x, y, width, height, gl.RGBA, type, pixels);
            if (gl.getError()) {
                return undefined;
            }
            // In case of unsigned bytes, return directly.
            if (type === SPECTOR.WebGlConstants.UNSIGNED_BYTE.value) {
                return pixels;
            }
            // Else, attempt to convert.
            var newPixels = new Uint8Array(width * height * 4);
            for (var i = 0; i < height; i++) {
                for (var j = 0; j < width; j++) {
                    newPixels[i * width * 4 + j * 4 + 0] = Math.min(Math.max(pixels[i * width * 4 + j * 4 + 0], 0), 1) * 255;
                    newPixels[i * width * 4 + j * 4 + 1] = Math.min(Math.max(pixels[i * width * 4 + j * 4 + 1], 0), 1) * 255;
                    newPixels[i * width * 4 + j * 4 + 2] = Math.min(Math.max(pixels[i * width * 4 + j * 4 + 2], 0), 1) * 255;
                    newPixels[i * width * 4 + j * 4 + 3] = Math.min(Math.max(pixels[i * width * 4 + j * 4 + 3], 0), 1) * 255;
                }
            }
            return newPixels;
        };
        ReadPixelsHelper.isSupportedComponentType = function (type) {
            // Only reads https://www.khronos.org/registry/webgl/specs/latest/2.0/ texImage2D supported combination.
            if (type !== SPECTOR.WebGlConstants.UNSIGNED_BYTE.value &&
                type !== SPECTOR.WebGlConstants.UNSIGNED_SHORT_4_4_4_4.value &&
                type !== SPECTOR.WebGlConstants.UNSIGNED_SHORT_5_5_5_1.value &&
                type !== SPECTOR.WebGlConstants.UNSIGNED_SHORT_5_6_5.value &&
                type !== SPECTOR.WebGlConstants.HALF_FLOAT.value &&
                type !== SPECTOR.WebGlConstants.HALF_FLOAT_OES.value &&
                type !== SPECTOR.WebGlConstants.FLOAT.value) {
                return false;
            }
            return true;
        };
        return ReadPixelsHelper;
    }());
    SPECTOR.ReadPixelsHelper = ReadPixelsHelper;
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var OriginFunctionHelper = /** @class */ (function () {
        function OriginFunctionHelper() {
        }
        OriginFunctionHelper.storeOriginFunction = function (object, functionName) {
            if (!object) {
                return;
            }
            if (!object[functionName]) {
                return;
            }
            var originFunctionName = this.getOriginFunctionName(functionName);
            if (object[originFunctionName]) {
                return;
            }
            object[originFunctionName] = object[functionName];
        };
        OriginFunctionHelper.storePrototypeOriginFunction = function (object, functionName) {
            if (!object) {
                return;
            }
            if (!object.prototype[functionName]) {
                return;
            }
            var originFunctionName = this.getOriginFunctionName(functionName);
            if (object.prototype[originFunctionName]) {
                return;
            }
            object.prototype[originFunctionName] = object.prototype[functionName];
        };
        OriginFunctionHelper.executePrototypeOriginFunction = function (object, objectType, functionName, args) {
            if (!object) {
                return;
            }
            var originFunctionName = this.getOriginFunctionName(functionName);
            if (!objectType.prototype[originFunctionName]) {
                return;
            }
            if (!object[originFunctionName]) {
                object[originFunctionName] = objectType.prototype[originFunctionName];
            }
            return this.executeFunction(object, originFunctionName, args);
        };
        OriginFunctionHelper.executeOriginFunction = function (object, functionName, args) {
            if (!object) {
                return;
            }
            var originFunctionName = this.getOriginFunctionName(functionName);
            if (!object[originFunctionName]) {
                return;
            }
            return this.executeFunction(object, originFunctionName, args);
        };
        // tslint:disable
        OriginFunctionHelper.executeFunction = function (object, functionName, args) {
            var a = args;
            if (a === undefined || a.length === 0) {
                return object[functionName]();
            }
            var length = a.length;
            switch (length) {
                case 1:
                    return object[functionName](a[0]);
                case 2:
                    return object[functionName](a[0], a[1]);
                case 3:
                    return object[functionName](a[0], a[1], a[2]);
                case 4:
                    return object[functionName](a[0], a[1], a[2], a[3]);
                case 5:
                    return object[functionName](a[0], a[1], a[2], a[3], a[4]);
                case 6:
                    return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5]);
                case 7:
                    return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6]);
                case 8:
                    return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7]);
                case 9:
                    return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8]);
                case 10:
                    return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9]);
                case 11:
                    return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10]);
                case 12:
                    return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11]);
                case 13:
                    return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12]);
                case 14:
                    return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13]);
                case 15:
                    return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14]);
                case 16:
                    return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15]);
                case 17:
                    return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15], a[16]);
                case 18:
                    return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15], a[16], a[17]);
                case 19:
                    return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15], a[16], a[17], a[18]);
                case 20:
                    return object[functionName](a[0], a[1], a[2], a[3], a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11], a[12], a[13], a[14], a[15], a[16], a[17], a[18], a[19]);
                default:
                    return object[functionName].apply(object, a);
            }
        };
        OriginFunctionHelper.getOriginFunctionName = function (functionName) {
            return this.originFunctionPrefix + functionName;
        };
        OriginFunctionHelper.originFunctionPrefix = "__SPECTOR_Origin_";
        return OriginFunctionHelper;
    }());
    SPECTOR.OriginFunctionHelper = OriginFunctionHelper;
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var ProgramRecompilerHelper = /** @class */ (function () {
        function ProgramRecompilerHelper() {
        }
        ProgramRecompilerHelper.isBuildableProgram = function (program) {
            if (!program) {
                return false;
            }
            if (!program[this.rebuildProgramFunctionName]) {
                return false;
            }
            return true;
        };
        ProgramRecompilerHelper.rebuildProgram = function (program, vertexSourceCode, fragmentSourceCode, onCompiled, onError) {
            if (!this.isBuildableProgram(program)) {
                return;
            }
            // Recompile the shader sources.
            program[this.rebuildProgramFunctionName](vertexSourceCode, fragmentSourceCode, onCompiled, onError);
        };
        ProgramRecompilerHelper.rebuildProgramFunctionName = "__SPECTOR_rebuildProgram";
        return ProgramRecompilerHelper;
    }());
    SPECTOR.ProgramRecompilerHelper = ProgramRecompilerHelper;
})(SPECTOR || (SPECTOR = {}));
// tslint:disable:ban-types
// tslint:disable:only-arrow-functions
var SPECTOR;
(function (SPECTOR) {
    var Spies;
    (function (Spies) {
        var TimeSpy = /** @class */ (function () {
            function TimeSpy(options, logger) {
                this.options = options;
                this.logger = logger;
                this.spiedWindow = options.spiedWindow || window;
                this.lastFrame = 0;
                this.speedRatio = 1;
                this.willPlayNextFrame = false;
                this.onFrameStart = new options.eventConstructor();
                this.onFrameEnd = new options.eventConstructor();
                this.onError = new options.eventConstructor();
                this.time = new this.options.timeConstructor();
                this.lastSixtyFramesDuration = [];
                this.lastSixtyFramesCurrentIndex = 0;
                this.lastSixtyFramesPreviousStart = 0;
                for (var i = 0; i < TimeSpy.fpsWindowSize; i++) {
                    this.lastSixtyFramesDuration[i] = 0;
                }
                this.init();
            }
            TimeSpy.prototype.playNextFrame = function () {
                this.willPlayNextFrame = true;
            };
            TimeSpy.prototype.changeSpeedRatio = function (ratio) {
                this.speedRatio = ratio;
            };
            TimeSpy.prototype.getFps = function () {
                var accumulator = 0;
                for (var i = 0; i < TimeSpy.fpsWindowSize; i++) {
                    accumulator += this.lastSixtyFramesDuration[i];
                }
                if (accumulator === 0) {
                    return 0;
                }
                return 1000 * 60 / accumulator;
            };
            TimeSpy.prototype.init = function () {
                var _this = this;
                for (var _i = 0, _a = TimeSpy.requestAnimationFrameFunctions; _i < _a.length; _i++) {
                    var Spy = _a[_i];
                    this.spyRequestAnimationFrame(Spy, this.spiedWindow);
                }
                for (var _b = 0, _c = TimeSpy.setTimerFunctions; _b < _c.length; _b++) {
                    var Spy = _c[_b];
                    this.spySetTimer(Spy);
                }
                if (this.spiedWindow["VRDisplay"]) {
                    this.spiedWindow.addEventListener("vrdisplaypresentchange", function (event) {
                        _this.spyRequestAnimationFrame("requestAnimationFrame", event.display);
                    });
                }
            };
            TimeSpy.prototype.spyRequestAnimationFrame = function (functionName, owner) {
                // Needs both this.
                // tslint:disable-next-line
                var self = this;
                SPECTOR.OriginFunctionHelper.storeOriginFunction(owner, functionName);
                owner[functionName] = function () {
                    var callback = arguments[0];
                    var onCallback = self.getCallback(self, callback, function () { self.spiedWindow[functionName](callback); });
                    var result = SPECTOR.OriginFunctionHelper.executeOriginFunction(owner, functionName, [onCallback]);
                    return result;
                };
            };
            TimeSpy.prototype.spySetTimer = function (functionName) {
                // Needs both this.
                // tslint:disable-next-line
                var self = this;
                var oldSetTimer = this.spiedWindow[functionName];
                var needsReplay = (functionName === "setTimeout");
                var spiedWindow = this.spiedWindow;
                // tslint:disable-next-line:only-arrow-functions
                spiedWindow[functionName] = function () {
                    var callback = arguments[0];
                    var time = arguments[1];
                    if (TimeSpy.setTimerCommonValues.indexOf(time) > -1) {
                        callback = self.getCallback(self, callback, needsReplay ?
                            function () { spiedWindow[functionName](callback); } : null);
                    }
                    return oldSetTimer.apply(self.spiedWindow, [callback, time]);
                };
            };
            TimeSpy.prototype.getCallback = function (self, callback, skippedCalback) {
                if (skippedCalback === void 0) { skippedCalback = null; }
                return function () {
                    var now = self.time.now;
                    self.lastFrame = ++self.lastFrame % self.speedRatio;
                    if (self.willPlayNextFrame || (self.speedRatio && !self.lastFrame)) {
                        self.onFrameStart.trigger(self);
                        try {
                            callback.apply(self.spiedWindow, arguments);
                        }
                        catch (e) {
                            self.onError.trigger(e);
                        }
                        self.lastSixtyFramesCurrentIndex = (self.lastSixtyFramesCurrentIndex + 1) % TimeSpy.fpsWindowSize;
                        self.lastSixtyFramesDuration[self.lastSixtyFramesCurrentIndex] =
                            now - self.lastSixtyFramesPreviousStart;
                        self.onFrameEnd.trigger(self);
                        self.willPlayNextFrame = false;
                    }
                    else {
                        if (skippedCalback) {
                            skippedCalback();
                        }
                    }
                    self.lastSixtyFramesPreviousStart = now;
                };
            };
            TimeSpy.requestAnimationFrameFunctions = ["requestAnimationFrame",
                "msRequestAnimationFrame",
                "webkitRequestAnimationFrame",
                "mozRequestAnimationFrame",
                "oRequestAnimationFrame",
            ];
            TimeSpy.setTimerFunctions = ["setTimeout",
                "setInterval",
            ];
            TimeSpy.setTimerCommonValues = [0, 15, 16, 33, 32, 40];
            TimeSpy.fpsWindowSize = 60;
            return TimeSpy;
        }());
        Spies.TimeSpy = TimeSpy;
    })(Spies = SPECTOR.Spies || (SPECTOR.Spies = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Spies;
    (function (Spies) {
        var CanvasSpy = /** @class */ (function () {
            function CanvasSpy(options, logger) {
                this.options = options;
                this.logger = logger;
                this.onContextRequested = new options.eventConstructor();
                this.canvas = options.canvas;
                this.init();
            }
            CanvasSpy.prototype.init = function () {
                // Needs both this.
                // tslint:disable-next-line
                var self = this;
                var getContextSpied = function () {
                    var context = (self.canvas) ?
                        SPECTOR.OriginFunctionHelper.executeOriginFunction(this, "getContext", arguments) :
                        SPECTOR.OriginFunctionHelper.executePrototypeOriginFunction(this, HTMLCanvasElement, "getContext", arguments);
                    if (arguments.length > 0 && arguments[0] === "2d") {
                        return context;
                    }
                    if (context) {
                        var contextAttributes = Array.prototype.slice.call(arguments);
                        var isWebgl2 = (contextAttributes[0] === "webgl2" ||
                            contextAttributes[0] === "experimental-webgl2");
                        var version = isWebgl2 ? 2 : 1;
                        self.onContextRequested.trigger({
                            context: context,
                            contextVersion: version,
                        });
                    }
                    return context;
                };
                if (this.canvas) {
                    SPECTOR.OriginFunctionHelper.storeOriginFunction(this.canvas, "getContext");
                    this.canvas.getContext = getContextSpied;
                }
                else {
                    SPECTOR.OriginFunctionHelper.storePrototypeOriginFunction(HTMLCanvasElement, "getContext");
                    HTMLCanvasElement.prototype.getContext = getContextSpied;
                }
            };
            return CanvasSpy;
        }());
        Spies.CanvasSpy = CanvasSpy;
    })(Spies = SPECTOR.Spies || (SPECTOR.Spies = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Spies;
    (function (Spies) {
        var ContextSpy = /** @class */ (function () {
            function ContextSpy(options, time, logger) {
                this.options = options;
                this.time = time;
                this.logger = logger;
                this.commandId = 0;
                this.context = options.context;
                this.version = options.version;
                this.onMaxCommand = new options.injection.EventCtor();
                this.capturing = false;
                this.globalCapturing = true;
                this.injection = options.injection;
                this.contextInformation = {
                    context: this.context,
                    contextVersion: this.version,
                    toggleCapture: this.toggleGlobalCapturing.bind(this),
                    tagWebGlObject: this.tagWebGlObject.bind(this),
                    extensions: {},
                };
                this.commandSpies = {};
                this.stateSpy = new this.injection.StateSpyCtor({
                    contextInformation: this.contextInformation,
                    stateNamespace: this.injection.StateNamespace,
                }, logger);
                this.recorderSpy = new this.injection.RecorderSpyCtor({
                    contextInformation: this.contextInformation,
                    recorderNamespace: this.injection.RecorderNamespace,
                    timeConstructor: this.injection.TimeCtor,
                }, logger);
                this.webGlObjectSpy = new this.injection.WebGlObjectSpyCtor({
                    contextInformation: this.contextInformation,
                    webGlObjectNamespace: this.injection.WebGlObjectNamespace,
                }, logger);
                this.analyser = new this.injection.CaptureAnalyserCtor({
                    contextInformation: this.contextInformation,
                    analyserNamespace: this.injection.AnalyserNamespace,
                }, logger);
                this.initStaticCapture();
                if (options.recordAlways) {
                    this.spy();
                }
            }
            ContextSpy.prototype.spy = function () {
                this.spyContext(this.context);
                var extensions = this.contextInformation.extensions;
                for (var extensionName in extensions) {
                    if (extensions.hasOwnProperty(extensionName)) {
                        this.spyContext(extensions[extensionName]);
                    }
                }
            };
            ContextSpy.prototype.unSpy = function () {
                for (var member in this.commandSpies) {
                    if (this.commandSpies.hasOwnProperty(member)) {
                        this.commandSpies[member].unSpy();
                    }
                }
            };
            ContextSpy.prototype.startCapture = function (maxCommands, quickCapture) {
                if (maxCommands === void 0) { maxCommands = 0; }
                if (quickCapture === void 0) { quickCapture = false; }
                var startTime = this.time.now;
                this.maxCommands = maxCommands;
                if (!this.options.recordAlways) {
                    this.spy();
                }
                this.capturing = true;
                this.commandId = 0;
                this.currentCapture = {
                    canvas: this.canvasCapture,
                    context: this.contextCapture,
                    commands: [],
                    initState: {},
                    endState: {},
                    startTime: startTime,
                    listenCommandsStartTime: 0,
                    listenCommandsEndTime: 0,
                    endTime: 0,
                    analyses: [],
                    frameMemory: {},
                    memory: {},
                };
                // Refreshes canvas info in case it changed beffore the capture.
                this.currentCapture.canvas.width = this.context.canvas.width;
                this.currentCapture.canvas.height = this.context.canvas.height;
                this.currentCapture.canvas.clientWidth = this.context.canvas.clientWidth;
                this.currentCapture.canvas.clientHeight = this.context.canvas.clientHeight;
                this.stateSpy.startCapture(this.currentCapture, quickCapture);
                this.recorderSpy.startCapture();
                this.currentCapture.listenCommandsStartTime = this.time.now;
            };
            ContextSpy.prototype.stopCapture = function () {
                var listenCommandsEndTime = this.time.now;
                if (!this.options.recordAlways) {
                    this.unSpy();
                }
                this.capturing = false;
                this.stateSpy.stopCapture(this.currentCapture);
                this.recorderSpy.stopCapture();
                this.currentCapture.listenCommandsEndTime = listenCommandsEndTime;
                this.currentCapture.endTime = this.time.now;
                this.recorderSpy.appendRecordedInformation(this.currentCapture);
                this.analyser.appendAnalyses(this.currentCapture);
                return this.currentCapture;
            };
            ContextSpy.prototype.isCapturing = function () {
                return this.globalCapturing && this.capturing;
            };
            ContextSpy.prototype.setMarker = function (marker) {
                this.marker = marker;
            };
            ContextSpy.prototype.clearMarker = function () {
                this.marker = null;
            };
            ContextSpy.prototype.getNextCommandCaptureId = function () {
                return this.commandId++;
            };
            ContextSpy.prototype.onCommand = function (commandSpy, functionInformation) {
                if (!this.globalCapturing) {
                    return;
                }
                this.webGlObjectSpy.tagWebGlObjects(functionInformation);
                this.recorderSpy.recordCommand(functionInformation);
                if (this.isCapturing()) {
                    var commandCapture = commandSpy.createCapture(functionInformation, this.getNextCommandCaptureId(), this.marker);
                    this.stateSpy.captureState(commandCapture);
                    this.currentCapture.commands.push(commandCapture);
                    commandCapture.endTime = this.time.now;
                    if (this.maxCommands > 0 && this.currentCapture.commands.length === this.maxCommands) {
                        this.onMaxCommand.trigger(this);
                    }
                }
            };
            ContextSpy.prototype.spyContext = function (bindingContext) {
                var members = [];
                for (var member in bindingContext) {
                    if (member) {
                        members.push(member);
                    }
                }
                for (var i = 0; i < members.length; i++) {
                    var member = members[i];
                    if (~ContextSpy.unSpyableMembers.indexOf(member)) {
                        continue;
                    }
                    try {
                        var isFunction = typeof bindingContext[member] !== "number";
                        if (isFunction) {
                            this.spyFunction(member, bindingContext);
                        }
                    }
                    catch (e) {
                        this.logger.error("Cant Spy member: " + member);
                        this.logger.error(e);
                    }
                }
            };
            ContextSpy.prototype.initStaticCapture = function () {
                var extensionsState = new this.injection.ExtensionsCtor(this.contextInformation, this.logger);
                var extensions = extensionsState.getExtensions();
                for (var extensionName in extensions) {
                    if (extensions.hasOwnProperty(extensionName)) {
                        this.contextInformation.extensions[extensionName] = extensions[extensionName];
                    }
                }
                var capabilitiesState = new this.injection.CapabilitiesCtor(this.contextInformation, this.logger);
                var compressedTextures = new this.injection.CompressedTexturesCtor(this.contextInformation, this.logger);
                this.contextCapture = {
                    version: this.version,
                    contextAttributes: this.context.getContextAttributes(),
                    capabilities: capabilitiesState.getStateData(),
                    extensions: extensionsState.getStateData(),
                    compressedTextures: compressedTextures.getStateData(),
                };
                this.canvasCapture = {
                    width: this.context.canvas.width,
                    height: this.context.canvas.height,
                    clientWidth: this.context.canvas.clientWidth,
                    clientHeight: this.context.canvas.clientHeight,
                    browserAgent: navigator ? navigator.userAgent : "",
                };
            };
            ContextSpy.prototype.spyFunction = function (member, bindingContext) {
                if (member.indexOf("__SPECTOR_Origin_") === 0) {
                    return;
                }
                if (!this.commandSpies[member]) {
                    var options = SPECTOR.merge(this.contextInformation, {
                        spiedCommandName: member,
                        spiedCommandRunningContext: bindingContext,
                        callback: this.onCommand.bind(this),
                        commandNamespace: this.injection.CommandNamespace,
                        stackTraceCtor: this.injection.StackTraceCtor,
                        defaultCommandCtor: this.injection.DefaultCommandCtor,
                    });
                    this.commandSpies[member] = new this.injection.CommandSpyCtor(options, this.time, this.logger);
                }
                this.commandSpies[member].spy();
            };
            ContextSpy.prototype.toggleGlobalCapturing = function (capture) {
                this.globalCapturing = capture;
            };
            ContextSpy.prototype.tagWebGlObject = function (object) {
                return this.webGlObjectSpy.tagWebGlObject(object);
            };
            ContextSpy.unSpyableMembers = ["canvas",
                "drawingBufferWidth",
                "drawingBufferHeight",
                "glp",
            ];
            return ContextSpy;
        }());
        Spies.ContextSpy = ContextSpy;
    })(Spies = SPECTOR.Spies || (SPECTOR.Spies = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Spies;
    (function (Spies) {
        var CommandSpy = /** @class */ (function () {
            function CommandSpy(options, time, logger) {
                this.time = time;
                this.logger = logger;
                this.stackTrace = new options.stackTraceCtor();
                this.spiedCommandName = options.spiedCommandName;
                this.spiedCommandRunningContext = options.spiedCommandRunningContext;
                this.spiedCommand = this.spiedCommandRunningContext[this.spiedCommandName];
                SPECTOR.OriginFunctionHelper.storeOriginFunction(this.spiedCommandRunningContext, this.spiedCommandName);
                this.callback = options.callback;
                this.commandOptions = {
                    context: options.context,
                    contextVersion: options.contextVersion,
                    extensions: options.extensions,
                    toggleCapture: options.toggleCapture,
                    spiedCommandName: options.spiedCommandName,
                };
                this.initCustomCommands(options.commandNamespace);
                this.initCommand(options.defaultCommandCtor);
            }
            CommandSpy.prototype.spy = function () {
                this.spiedCommandRunningContext[this.spiedCommandName] = this.overloadedCommand;
            };
            CommandSpy.prototype.unSpy = function () {
                this.spiedCommandRunningContext[this.spiedCommandName] = this.spiedCommand;
            };
            CommandSpy.prototype.createCapture = function (functionInformation, commandCaptureId, marker) {
                return this.command.createCapture(functionInformation, commandCaptureId, marker);
            };
            CommandSpy.prototype.initCustomCommands = function (commandNamespace) {
                if (CommandSpy.customCommandsConstructors) {
                    return;
                }
                CommandSpy.customCommandsConstructors = {};
                for (var spy in commandNamespace) {
                    if (commandNamespace.hasOwnProperty(spy)) {
                        var commandCtor = commandNamespace[spy];
                        var commandName = SPECTOR.Decorators.getCommandName(commandCtor);
                        if (commandName) {
                            CommandSpy.customCommandsConstructors[commandName] = commandCtor;
                        }
                    }
                }
            };
            CommandSpy.prototype.initCommand = function (defaultCommandCtor) {
                if (CommandSpy.customCommandsConstructors[this.spiedCommandName]) {
                    this.command = new CommandSpy.customCommandsConstructors[this.spiedCommandName](this.commandOptions, this.stackTrace, this.logger);
                }
                else {
                    this.command = new defaultCommandCtor(this.commandOptions, this.stackTrace, this.logger);
                }
                this.overloadedCommand = this.getSpy();
            };
            CommandSpy.prototype.getSpy = function () {
                // Needs both this.
                // tslint:disable-next-line
                var self = this;
                // Needs arguments access.
                // tslint:disable-next-line:only-arrow-functions
                return function () {
                    var before = self.time.now;
                    var result = SPECTOR.OriginFunctionHelper.executeOriginFunction(self.spiedCommandRunningContext, self.spiedCommandName, arguments);
                    var after = self.time.now;
                    var functionInformation = {
                        name: self.spiedCommandName,
                        arguments: arguments,
                        result: result,
                        startTime: before,
                        endTime: after,
                    };
                    self.callback(self, functionInformation);
                    return result;
                };
            };
            return CommandSpy;
        }());
        Spies.CommandSpy = CommandSpy;
    })(Spies = SPECTOR.Spies || (SPECTOR.Spies = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var BaseCommand = /** @class */ (function () {
            function BaseCommand(options, stackTrace, logger) {
                this.options = options;
                this.stackTrace = stackTrace;
                this.logger = logger;
                this.spiedCommandName = options.spiedCommandName;
            }
            BaseCommand.prototype.createCapture = function (functionInformation, commandCaptureId, marker) {
                // Removes the spector internal calls to leave only th relevant part.
                var stackTrace = this.stackTrace.getStackTrace(4, 1);
                // Includes uniform functions special cases to prevent lots of inheritence.
                var text = (functionInformation.name.indexOf("uniform") === 0) ?
                    this.stringifyUniform(functionInformation.arguments) :
                    this.stringify(functionInformation.arguments, functionInformation.result);
                var commandCapture = {
                    id: commandCaptureId,
                    startTime: functionInformation.startTime,
                    commandEndTime: functionInformation.endTime,
                    endTime: 0,
                    name: functionInformation.name,
                    commandArguments: functionInformation.arguments,
                    result: functionInformation.result,
                    stackTrace: stackTrace,
                    status: 0 /* Unknown */,
                    marker: marker,
                    text: text,
                };
                this.transformCapture(commandCapture);
                for (var i = 0; i < commandCapture.commandArguments.length; i++) {
                    var argument = commandCapture.commandArguments[i];
                    if (argument && argument.length && argument.length > 50) {
                        commandCapture.commandArguments[i] = "Array Length: " + argument.length;
                    }
                }
                if (commandCapture.commandArguments) {
                    var argumentsArray = [];
                    for (var i = 0; i < commandCapture.commandArguments.length; i++) {
                        var commandArgument = commandCapture.commandArguments[i];
                        if (commandArgument === undefined) {
                            argumentsArray.push(undefined);
                        }
                        else if (commandArgument === null) {
                            argumentsArray.push(null);
                        }
                        else {
                            argumentsArray.push(JSON.parse(this.stringifyJSON(commandArgument)));
                        }
                    }
                    commandCapture.commandArguments = argumentsArray;
                }
                if (commandCapture.result) {
                    commandCapture.result = JSON.parse(this.stringifyJSON(commandCapture.result));
                }
                return commandCapture;
            };
            BaseCommand.prototype.stringifyJSON = function (value) {
                try {
                    var str = JSON.stringify(value);
                    return str;
                }
                catch (e) {
                    return null;
                }
            };
            BaseCommand.prototype.transformCapture = function (commandCapture) {
                // Nothing by default.
            };
            BaseCommand.prototype.stringify = function (args, result) {
                var stringified = this.options.spiedCommandName;
                if (args && args.length > 0) {
                    stringified += ": " + this.stringifyArgs(args).join(", ");
                }
                if (result) {
                    stringified += " -> " + this.stringifyResult(result);
                }
                return stringified;
            };
            BaseCommand.prototype.stringifyUniform = function (args) {
                var stringified = this.options.spiedCommandName;
                if (args && args.length > 0) {
                    var stringifiedArgs = [];
                    stringifiedArgs.push(this.stringifyValue(args[0]));
                    for (var i = 1; i < args.length; i++) {
                        if (typeof args[i] === "number") {
                            var arg = args[i] + "";
                            stringifiedArgs.push(arg);
                        }
                        else {
                            var arg = this.stringifyValue(args[i]);
                            stringifiedArgs.push(arg);
                        }
                    }
                    stringified += ": " + stringifiedArgs.join(", ");
                }
                return stringified;
            };
            BaseCommand.prototype.stringifyArgs = function (args) {
                var stringified = [];
                for (var i = 0; i < args.length; i++) {
                    var arg = args[i];
                    var stringifiedValue = this.stringifyValue(arg);
                    stringified.push(stringifiedValue);
                }
                return stringified;
            };
            BaseCommand.prototype.stringifyResult = function (result) {
                if (!result) {
                    return undefined;
                }
                return this.stringifyValue(result);
            };
            BaseCommand.prototype.stringifyValue = function (value) {
                if (value === null) {
                    return "null";
                }
                if (value === undefined) {
                    return "undefined";
                }
                var tag = SPECTOR.WebGlObjects.getWebGlObjectTag(value);
                if (tag) {
                    return tag.displayText;
                }
                if (typeof value === "number" && SPECTOR.WebGlConstants.isWebGlConstant(value)) {
                    return SPECTOR.WebGlConstants.stringifyWebGlConstant(value, this.spiedCommandName);
                }
                if (typeof value === "string") {
                    return value;
                }
                if (value instanceof HTMLImageElement) {
                    return value.src;
                }
                if (value instanceof ArrayBuffer) {
                    return "[--(" + value.byteLength + ")--]";
                }
                if (value.length) {
                    return "[..(" + value.length + ")..]";
                }
                return value;
            };
            return BaseCommand;
        }());
        Commands.BaseCommand = BaseCommand;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var deprecatedCommands = [
            "lineWidth",
        ];
        var DefaultCommand = /** @class */ (function (_super) {
            __extends(DefaultCommand, _super);
            function DefaultCommand(options, stackTrace, logger) {
                var _this = _super.call(this, options, stackTrace, logger) || this;
                _this.isDeprecated = (deprecatedCommands.indexOf(_this.spiedCommandName) > -1);
                return _this;
            }
            DefaultCommand.prototype.transformCapture = function (commandCapture) {
                if (this.isDeprecated) {
                    commandCapture.status = 50 /* Deprecated */;
                }
            };
            return DefaultCommand;
        }(Commands.BaseCommand));
        Commands.DefaultCommand = DefaultCommand;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var Clear = /** @class */ (function (_super) {
            __extends(Clear, _super);
            function Clear() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Clear.prototype.stringifyArgs = function (args) {
                var stringified = [];
                if ((args[0] & SPECTOR.WebGlConstants.DEPTH_BUFFER_BIT.value) === SPECTOR.WebGlConstants.DEPTH_BUFFER_BIT.value) {
                    stringified.push(SPECTOR.WebGlConstants.DEPTH_BUFFER_BIT.name);
                }
                if ((args[0] & SPECTOR.WebGlConstants.STENCIL_BUFFER_BIT.value) === SPECTOR.WebGlConstants.STENCIL_BUFFER_BIT.value) {
                    stringified.push(SPECTOR.WebGlConstants.STENCIL_BUFFER_BIT.name);
                }
                if ((args[0] & SPECTOR.WebGlConstants.COLOR_BUFFER_BIT.value) === SPECTOR.WebGlConstants.COLOR_BUFFER_BIT.value) {
                    stringified.push(SPECTOR.WebGlConstants.COLOR_BUFFER_BIT.name);
                }
                return stringified;
            };
            Clear = __decorate([
                SPECTOR.Decorators.command("clear")
            ], Clear);
            return Clear;
        }(Commands.BaseCommand));
        Commands.Clear = Clear;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var BlitFrameBuffer = /** @class */ (function (_super) {
            __extends(BlitFrameBuffer, _super);
            function BlitFrameBuffer() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            BlitFrameBuffer.prototype.stringifyArgs = function (args) {
                var stringified = [];
                var readFrameBuffer = this.options.context.getParameter(SPECTOR.WebGlConstants.READ_FRAMEBUFFER_BINDING.value);
                var readFrameBufferTag = this.options.tagWebGlObject(readFrameBuffer);
                stringified.push("READ FROM: " + this.stringifyValue(readFrameBufferTag));
                var drawFrameBuffer = this.options.context.getParameter(SPECTOR.WebGlConstants.DRAW_FRAMEBUFFER_BINDING.value);
                var drawFrameBufferTag = this.options.tagWebGlObject(drawFrameBuffer);
                stringified.push("WRITE TO: " + this.stringifyValue(drawFrameBufferTag));
                for (var i = 0; i < 8; i++) {
                    stringified.push(args[i]);
                }
                if ((args[8] & SPECTOR.WebGlConstants.DEPTH_BUFFER_BIT.value) === SPECTOR.WebGlConstants.DEPTH_BUFFER_BIT.value) {
                    stringified.push(SPECTOR.WebGlConstants.DEPTH_BUFFER_BIT.name);
                }
                if ((args[8] & SPECTOR.WebGlConstants.STENCIL_BUFFER_BIT.value) === SPECTOR.WebGlConstants.STENCIL_BUFFER_BIT.value) {
                    stringified.push(SPECTOR.WebGlConstants.STENCIL_BUFFER_BIT.name);
                }
                if ((args[8] & SPECTOR.WebGlConstants.COLOR_BUFFER_BIT.value) === SPECTOR.WebGlConstants.COLOR_BUFFER_BIT.value) {
                    stringified.push(SPECTOR.WebGlConstants.COLOR_BUFFER_BIT.name);
                }
                stringified.push(SPECTOR.WebGlConstants.stringifyWebGlConstant(args[9], "blitFrameBuffer"));
                return stringified;
            };
            BlitFrameBuffer = __decorate([
                SPECTOR.Decorators.command("blitFrameBuffer")
            ], BlitFrameBuffer);
            return BlitFrameBuffer;
        }(Commands.BaseCommand));
        Commands.BlitFrameBuffer = BlitFrameBuffer;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var VertexAttribPointer = /** @class */ (function (_super) {
            __extends(VertexAttribPointer, _super);
            function VertexAttribPointer() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            VertexAttribPointer.prototype.stringifyArgs = function (args) {
                var stringified = [];
                stringified.push(args[0]);
                stringified.push(args[1]);
                stringified.push(SPECTOR.WebGlConstants.stringifyWebGlConstant(args[2], "vertexAttribPointer"));
                stringified.push(args[3]);
                stringified.push(args[4]);
                stringified.push(args[5]);
                return stringified;
            };
            VertexAttribPointer = __decorate([
                SPECTOR.Decorators.command("vertexAttribPointer")
            ], VertexAttribPointer);
            return VertexAttribPointer;
        }(Commands.BaseCommand));
        Commands.VertexAttribPointer = VertexAttribPointer;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var GetActiveAttrib = /** @class */ (function (_super) {
            __extends(GetActiveAttrib, _super);
            function GetActiveAttrib() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            GetActiveAttrib.prototype.stringifyResult = function (result) {
                if (!result) {
                    return undefined;
                }
                return "name: " + result.name + ", size: " + result.size + ", type: " + result.type;
            };
            GetActiveAttrib = __decorate([
                SPECTOR.Decorators.command("getActiveAttrib")
            ], GetActiveAttrib);
            return GetActiveAttrib;
        }(Commands.BaseCommand));
        Commands.GetActiveAttrib = GetActiveAttrib;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var GetActiveUniform = /** @class */ (function (_super) {
            __extends(GetActiveUniform, _super);
            function GetActiveUniform() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            GetActiveUniform.prototype.stringifyResult = function (result) {
                if (!result) {
                    return undefined;
                }
                return "name: " + result.name + ", size: " + result.size + ", type: " + result.type;
            };
            GetActiveUniform = __decorate([
                SPECTOR.Decorators.command("getActiveUniform")
            ], GetActiveUniform);
            return GetActiveUniform;
        }(Commands.BaseCommand));
        Commands.GetActiveUniform = GetActiveUniform;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var GetTransformFeedbackVarying = /** @class */ (function (_super) {
            __extends(GetTransformFeedbackVarying, _super);
            function GetTransformFeedbackVarying() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            GetTransformFeedbackVarying.prototype.stringifyResult = function (result) {
                if (!result) {
                    return undefined;
                }
                return "name: " + result.name + ", size: " + result.size + ", type: " + result.type;
            };
            GetTransformFeedbackVarying = __decorate([
                SPECTOR.Decorators.command("getTransformFeedbackVarying")
            ], GetTransformFeedbackVarying);
            return GetTransformFeedbackVarying;
        }(Commands.BaseCommand));
        Commands.GetTransformFeedbackVarying = GetTransformFeedbackVarying;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var GetExtension = /** @class */ (function (_super) {
            __extends(GetExtension, _super);
            function GetExtension() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            GetExtension.prototype.stringifyResult = function (result) {
                return result ? "true" : "false";
            };
            GetExtension = __decorate([
                SPECTOR.Decorators.command("getExtension")
            ], GetExtension);
            return GetExtension;
        }(Commands.BaseCommand));
        Commands.GetExtension = GetExtension;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var GetShaderPrecisionFormat = /** @class */ (function (_super) {
            __extends(GetShaderPrecisionFormat, _super);
            function GetShaderPrecisionFormat() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            GetShaderPrecisionFormat.prototype.stringifyResult = function (result) {
                if (!result) {
                    return undefined;
                }
                return "min: " + result.rangeMin + ", max: " + result.rangeMax + ", precision: " + result.precision;
            };
            GetShaderPrecisionFormat = __decorate([
                SPECTOR.Decorators.command("getShaderPrecisionFormat")
            ], GetShaderPrecisionFormat);
            return GetShaderPrecisionFormat;
        }(Commands.BaseCommand));
        Commands.GetShaderPrecisionFormat = GetShaderPrecisionFormat;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var GetParameter = /** @class */ (function (_super) {
            __extends(GetParameter, _super);
            function GetParameter() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            GetParameter.prototype.stringifyResult = function (result) {
                if (!result) {
                    return "null";
                }
                var tag = SPECTOR.WebGlObjects.getWebGlObjectTag(result);
                if (tag) {
                    return tag.displayText;
                }
                return result;
            };
            GetParameter = __decorate([
                SPECTOR.Decorators.command("getParameter")
            ], GetParameter);
            return GetParameter;
        }(Commands.BaseCommand));
        Commands.GetParameter = GetParameter;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var DrawArrays = /** @class */ (function (_super) {
            __extends(DrawArrays, _super);
            function DrawArrays() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            DrawArrays.prototype.stringifyArgs = function (args) {
                var stringified = [];
                stringified.push(SPECTOR.WebGlConstants.stringifyWebGlConstant(args[0], "drawArrays"));
                stringified.push(args[1]);
                stringified.push(args[2]);
                return stringified;
            };
            DrawArrays = __decorate([
                SPECTOR.Decorators.command("drawArrays")
            ], DrawArrays);
            return DrawArrays;
        }(Commands.BaseCommand));
        Commands.DrawArrays = DrawArrays;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var DrawArraysInstanced = /** @class */ (function (_super) {
            __extends(DrawArraysInstanced, _super);
            function DrawArraysInstanced() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            DrawArraysInstanced.prototype.stringifyArgs = function (args) {
                var stringified = [];
                stringified.push(SPECTOR.WebGlConstants.stringifyWebGlConstant(args[0], "drawArraysInstanced"));
                stringified.push(args[1]);
                stringified.push(args[2]);
                stringified.push(args[3]);
                return stringified;
            };
            DrawArraysInstanced = __decorate([
                SPECTOR.Decorators.command("drawArraysInstanced")
            ], DrawArraysInstanced);
            return DrawArraysInstanced;
        }(Commands.BaseCommand));
        Commands.DrawArraysInstanced = DrawArraysInstanced;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var DrawBuffers = /** @class */ (function (_super) {
            __extends(DrawBuffers, _super);
            function DrawBuffers() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            DrawBuffers.prototype.stringifyArgs = function (args) {
                var stringified = [];
                for (var i = 0; i < args.length; i++) {
                    stringified.push(SPECTOR.WebGlConstants.stringifyWebGlConstant(args[i], "drawBuffers"));
                }
                return stringified;
            };
            DrawBuffers = __decorate([
                SPECTOR.Decorators.command("drawBuffers")
            ], DrawBuffers);
            return DrawBuffers;
        }(Commands.BaseCommand));
        Commands.DrawBuffers = DrawBuffers;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var DrawElements = /** @class */ (function (_super) {
            __extends(DrawElements, _super);
            function DrawElements() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            DrawElements.prototype.stringifyArgs = function (args) {
                var stringified = [];
                stringified.push(SPECTOR.WebGlConstants.stringifyWebGlConstant(args[0], "drawElements"));
                stringified.push(args[1]);
                stringified.push(SPECTOR.WebGlConstants.stringifyWebGlConstant(args[2], "drawElements"));
                stringified.push(args[3]);
                return stringified;
            };
            DrawElements = __decorate([
                SPECTOR.Decorators.command("drawElements")
            ], DrawElements);
            return DrawElements;
        }(Commands.BaseCommand));
        Commands.DrawElements = DrawElements;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var DrawElementsInstanced = /** @class */ (function (_super) {
            __extends(DrawElementsInstanced, _super);
            function DrawElementsInstanced() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            DrawElementsInstanced.prototype.stringifyArgs = function (args) {
                var stringified = [];
                stringified.push(SPECTOR.WebGlConstants.stringifyWebGlConstant(args[0], "drawElementsInstanced"));
                stringified.push(args[1]);
                stringified.push(SPECTOR.WebGlConstants.stringifyWebGlConstant(args[2], "drawElementsInstanced"));
                stringified.push(args[3]);
                stringified.push(args[4]);
                return stringified;
            };
            DrawElementsInstanced = __decorate([
                SPECTOR.Decorators.command("drawElementsInstanced")
            ], DrawElementsInstanced);
            return DrawElementsInstanced;
        }(Commands.BaseCommand));
        Commands.DrawElementsInstanced = DrawElementsInstanced;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var DrawElementsInstancedAngle = /** @class */ (function (_super) {
            __extends(DrawElementsInstancedAngle, _super);
            function DrawElementsInstancedAngle() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            DrawElementsInstancedAngle.prototype.stringifyArgs = function (args) {
                var stringified = [];
                stringified.push(SPECTOR.WebGlConstants.stringifyWebGlConstant(args[0], "drawElementsInstancedANGLE"));
                stringified.push(args[1]);
                stringified.push(SPECTOR.WebGlConstants.stringifyWebGlConstant(args[2], "drawElementsInstancedANGLE"));
                stringified.push(args[3]);
                stringified.push(args[4]);
                return stringified;
            };
            DrawElementsInstancedAngle = __decorate([
                SPECTOR.Decorators.command("drawElementsInstancedANGLE")
            ], DrawElementsInstancedAngle);
            return DrawElementsInstancedAngle;
        }(Commands.BaseCommand));
        Commands.DrawElementsInstancedAngle = DrawElementsInstancedAngle;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var DrawRangeElements = /** @class */ (function (_super) {
            __extends(DrawRangeElements, _super);
            function DrawRangeElements() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            DrawRangeElements.prototype.stringifyArgs = function (args) {
                var stringified = [];
                stringified.push(SPECTOR.WebGlConstants.stringifyWebGlConstant(args[0], "drawRangeElements"));
                stringified.push(args[1]);
                stringified.push(args[2]);
                stringified.push(args[3]);
                stringified.push(SPECTOR.WebGlConstants.stringifyWebGlConstant(args[4], "drawRangeElements"));
                stringified.push(args[5]);
                return stringified;
            };
            DrawRangeElements = __decorate([
                SPECTOR.Decorators.command("drawRangeElements")
            ], DrawRangeElements);
            return DrawRangeElements;
        }(Commands.BaseCommand));
        Commands.DrawRangeElements = DrawRangeElements;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var Scissor = /** @class */ (function (_super) {
            __extends(Scissor, _super);
            function Scissor() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Scissor.prototype.stringifyArgs = function (args) {
                var stringified = [];
                for (var i = 0; i < 4; i++) {
                    stringified.push(args[i].toFixed(0));
                }
                return stringified;
            };
            Scissor = __decorate([
                SPECTOR.Decorators.command("scissor")
            ], Scissor);
            return Scissor;
        }(Commands.BaseCommand));
        Commands.Scissor = Scissor;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var Viewport = /** @class */ (function (_super) {
            __extends(Viewport, _super);
            function Viewport() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Viewport.prototype.stringifyArgs = function (args) {
                var stringified = [];
                for (var i = 0; i < 4; i++) {
                    stringified.push(args[i].toFixed(0));
                }
                return stringified;
            };
            Viewport = __decorate([
                SPECTOR.Decorators.command("viewport")
            ], Viewport);
            return Viewport;
        }(Commands.BaseCommand));
        Commands.Viewport = Viewport;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var DisableVertexAttribArray = /** @class */ (function (_super) {
            __extends(DisableVertexAttribArray, _super);
            function DisableVertexAttribArray() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            DisableVertexAttribArray.prototype.stringifyArgs = function (args) {
                var stringified = [];
                stringified.push(args[0]);
                return stringified;
            };
            DisableVertexAttribArray = __decorate([
                SPECTOR.Decorators.command("disableVertexAttribArray")
            ], DisableVertexAttribArray);
            return DisableVertexAttribArray;
        }(Commands.BaseCommand));
        Commands.DisableVertexAttribArray = DisableVertexAttribArray;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Commands;
    (function (Commands) {
        var EnableVertexAttribArray = /** @class */ (function (_super) {
            __extends(EnableVertexAttribArray, _super);
            function EnableVertexAttribArray() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            EnableVertexAttribArray.prototype.stringifyArgs = function (args) {
                var stringified = [];
                stringified.push(args[0]);
                return stringified;
            };
            EnableVertexAttribArray = __decorate([
                SPECTOR.Decorators.command("enableVertexAttribArray")
            ], EnableVertexAttribArray);
            return EnableVertexAttribArray;
        }(Commands.BaseCommand));
        Commands.EnableVertexAttribArray = EnableVertexAttribArray;
    })(Commands = SPECTOR.Commands || (SPECTOR.Commands = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Recorders;
    (function (Recorders) {
        var BaseRecorder = /** @class */ (function () {
            function BaseRecorder(options, logger) {
                this.options = options;
                this.logger = logger;
                this.objectName = options.objectName;
                this.createCommandNames = this.getCreateCommandNames();
                this.updateCommandNames = this.getUpdateCommandNames();
                this.deleteCommandNames = this.getDeleteCommandNames();
                this.startTime = this.options.time.now;
                this.memoryPerSecond = {};
                this.totalMemory = 0;
                this.frameMemory = 0;
                this.capturing = false;
                BaseRecorder.initializeByteSizeFormat();
            }
            BaseRecorder.initializeByteSizeFormat = function () {
                if (this.byteSizePerInternalFormat) {
                    return;
                }
                this.byteSizePerInternalFormat = (_a = {},
                    _a[SPECTOR.WebGlConstants.R8.value] = 1,
                    _a[SPECTOR.WebGlConstants.R16F.value] = 2,
                    _a[SPECTOR.WebGlConstants.R32F.value] = 4,
                    _a[SPECTOR.WebGlConstants.R8UI.value] = 1,
                    _a[SPECTOR.WebGlConstants.RG8.value] = 2,
                    _a[SPECTOR.WebGlConstants.RG16F.value] = 4,
                    _a[SPECTOR.WebGlConstants.RG32F.value] = 8,
                    _a[SPECTOR.WebGlConstants.ALPHA.value] = 1,
                    _a[SPECTOR.WebGlConstants.RGB.value] = 3,
                    _a[SPECTOR.WebGlConstants.RGBA.value] = 4,
                    _a[SPECTOR.WebGlConstants.LUMINANCE.value] = 1,
                    _a[SPECTOR.WebGlConstants.LUMINANCE_ALPHA.value] = 2,
                    _a[SPECTOR.WebGlConstants.DEPTH_COMPONENT.value] = 1,
                    _a[SPECTOR.WebGlConstants.DEPTH_STENCIL.value] = 2,
                    _a[SPECTOR.WebGlConstants.SRGB_EXT.value] = 3,
                    _a[SPECTOR.WebGlConstants.SRGB_ALPHA_EXT.value] = 4,
                    // [WebGlConstants.RGUI.value]: 2,
                    _a[SPECTOR.WebGlConstants.RGB8.value] = 3,
                    _a[SPECTOR.WebGlConstants.SRGB8.value] = 3,
                    _a[SPECTOR.WebGlConstants.RGB565.value] = 2,
                    _a[SPECTOR.WebGlConstants.R11F_G11F_B10F.value] = 4,
                    _a[SPECTOR.WebGlConstants.RGB9_E5.value] = 2,
                    _a[SPECTOR.WebGlConstants.RGB16F.value] = 6,
                    _a[SPECTOR.WebGlConstants.RGB32F.value] = 12,
                    _a[SPECTOR.WebGlConstants.RGB8UI.value] = 3,
                    _a[SPECTOR.WebGlConstants.RGBA8.value] = 4,
                    // [WebGlConstants.SRGB_APLHA8.value]: 4,
                    _a[SPECTOR.WebGlConstants.RGB5_A1.value] = 2,
                    // [WebGlConstants.RGBA4444.value]: 2,
                    _a[SPECTOR.WebGlConstants.RGBA16F.value] = 8,
                    _a[SPECTOR.WebGlConstants.RGBA32F.value] = 16,
                    _a[SPECTOR.WebGlConstants.RGBA8UI.value] = 4,
                    _a[SPECTOR.WebGlConstants.COMPRESSED_R11_EAC.value] = 4,
                    _a[SPECTOR.WebGlConstants.COMPRESSED_SIGNED_R11_EAC.value] = 4,
                    _a[SPECTOR.WebGlConstants.COMPRESSED_RG11_EAC.value] = 4,
                    _a[SPECTOR.WebGlConstants.COMPRESSED_SIGNED_RG11_EAC.value] = 4,
                    _a[SPECTOR.WebGlConstants.COMPRESSED_RGB8_ETC2.value] = 4,
                    _a[SPECTOR.WebGlConstants.COMPRESSED_RGBA8_ETC2_EAC.value] = 4,
                    _a[SPECTOR.WebGlConstants.COMPRESSED_SRGB8_ETC2.value] = 4,
                    _a[SPECTOR.WebGlConstants.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC.value] = 4,
                    _a[SPECTOR.WebGlConstants.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2.value] = 4,
                    _a[SPECTOR.WebGlConstants.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2.value] = 4,
                    _a);
                var _a;
            };
            BaseRecorder.prototype.registerCallbacks = function (onFunctionCallbacks) {
                for (var _i = 0, _a = this.createCommandNames; _i < _a.length; _i++) {
                    var command = _a[_i];
                    onFunctionCallbacks[command] = onFunctionCallbacks[command] || [];
                    onFunctionCallbacks[command].push(this.createWithoutSideEffects.bind(this));
                }
                for (var _b = 0, _c = this.updateCommandNames; _b < _c.length; _b++) {
                    var command = _c[_b];
                    onFunctionCallbacks[command] = onFunctionCallbacks[command] || [];
                    onFunctionCallbacks[command].push(this.updateWithoutSideEffects.bind(this));
                }
                for (var _d = 0, _e = this.deleteCommandNames; _d < _e.length; _d++) {
                    var command = _e[_d];
                    onFunctionCallbacks[command] = onFunctionCallbacks[command] || [];
                    onFunctionCallbacks[command].push(this.deleteWithoutSideEffects.bind(this));
                }
            };
            BaseRecorder.prototype.startCapture = function () {
                this.frameMemory = 0;
                this.capturing = true;
            };
            BaseRecorder.prototype.stopCapture = function () {
                this.frameMemory = 0;
                this.capturing = false;
            };
            BaseRecorder.prototype.appendRecordedInformation = function (capture) {
                capture.frameMemory[this.objectName] = this.frameMemory;
                capture.memory[this.objectName] = this.memoryPerSecond;
            };
            BaseRecorder.prototype.create = function (functionInformation) {
                // Nothing tracked currently on create.
            };
            BaseRecorder.prototype.createWithoutSideEffects = function (functionInformation) {
                this.options.toggleCapture(false);
                this.create(functionInformation);
                this.options.toggleCapture(true);
            };
            BaseRecorder.prototype.updateWithoutSideEffects = function (functionInformation) {
                if (!functionInformation || functionInformation.arguments.length === 0) {
                    return;
                }
                this.options.toggleCapture(false);
                var target = functionInformation.arguments[0];
                var instance = this.getBoundInstance(target);
                if (!instance) {
                    this.options.toggleCapture(true);
                    return;
                }
                var tag = SPECTOR.WebGlObjects.getWebGlObjectTag(instance);
                if (!tag) {
                    this.options.toggleCapture(true);
                    return;
                }
                var targetString = this.getWebGlConstant(target);
                var size = this.update(functionInformation, targetString, instance);
                this.changeMemorySize(size);
                this.options.toggleCapture(true);
            };
            BaseRecorder.prototype.deleteWithoutSideEffects = function (functionInformation) {
                if (!functionInformation || !functionInformation.arguments || functionInformation.arguments.length < 1) {
                    return;
                }
                var instance = functionInformation.arguments[0];
                if (!instance) {
                    return;
                }
                this.options.toggleCapture(false);
                var size = this.delete(instance);
                this.changeMemorySize(-size);
                this.options.toggleCapture(true);
            };
            BaseRecorder.prototype.changeMemorySize = function (size) {
                this.totalMemory += size;
                if (this.capturing) {
                    this.frameMemory += size;
                }
                var timeInMilliseconds = this.options.time.now - this.startTime;
                var timeInSeconds = Math.round(timeInMilliseconds / 1000);
                this.memoryPerSecond[timeInSeconds] = this.totalMemory;
            };
            BaseRecorder.prototype.getWebGlConstant = function (value) {
                var constant = SPECTOR.WebGlConstantsByValue[value];
                return constant ? constant.name : value + "";
            };
            BaseRecorder.prototype.getByteSizeForInternalFormat = function (internalFormat) {
                var bytesPerElements = BaseRecorder.byteSizePerInternalFormat[internalFormat];
                return bytesPerElements || 4;
            };
            return BaseRecorder;
        }());
        Recorders.BaseRecorder = BaseRecorder;
    })(Recorders = SPECTOR.Recorders || (SPECTOR.Recorders = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Recorders;
    (function (Recorders) {
        var Texture2DRecorder = /** @class */ (function (_super) {
            __extends(Texture2DRecorder, _super);
            function Texture2DRecorder() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Texture2DRecorder.prototype.getCreateCommandNames = function () {
                return ["createTexture"];
            };
            Texture2DRecorder.prototype.getUpdateCommandNames = function () {
                return ["texImage2D", "compressedTexImage2D", "texStorage2D"];
            };
            Texture2DRecorder.prototype.getDeleteCommandNames = function () {
                return ["deleteTexture"];
            };
            Texture2DRecorder.prototype.getBoundInstance = function (target) {
                var gl = this.options.context;
                if (target === SPECTOR.WebGlConstants.TEXTURE_2D.value) {
                    return gl.getParameter(SPECTOR.WebGlConstants.TEXTURE_BINDING_2D.value);
                }
                else if (target === SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_X.value ||
                    target === SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_Y.value ||
                    target === SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_Z.value ||
                    target === SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_X.value ||
                    target === SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_Y.value ||
                    target === SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_Z.value) {
                    return gl.getParameter(SPECTOR.WebGlConstants.TEXTURE_BINDING_CUBE_MAP.value);
                }
                return undefined;
            };
            Texture2DRecorder.prototype.delete = function (instance) {
                var customData = instance.__SPECTOR_Object_CustomData;
                if (!customData) {
                    return 0;
                }
                if (customData.target === SPECTOR.WebGlConstants.TEXTURE_2D_ARRAY.name || customData.target === SPECTOR.WebGlConstants.TEXTURE_3D.name) {
                    return 0;
                }
                return customData.length;
            };
            Texture2DRecorder.prototype.update = function (functionInformation, target, instance) {
                if (functionInformation.arguments.length >= 2 && functionInformation.arguments[1] !== 0) {
                    return 0;
                }
                var customData = this.getCustomData(functionInformation, target, instance);
                if (!customData) {
                    return 0;
                }
                var previousLength = instance.__SPECTOR_Object_CustomData ? instance.__SPECTOR_Object_CustomData.length : 0;
                var cubeMapMultiplier = target === "TEXTURE_2D" ? 1 : 6;
                customData.length = customData.width * customData.height * cubeMapMultiplier * this.getByteSizeForInternalFormat(customData.internalFormat);
                instance.__SPECTOR_Object_CustomData = customData;
                return customData.length - previousLength;
            };
            Texture2DRecorder.prototype.getCustomData = function (functionInformation, target, instance) {
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
            };
            Texture2DRecorder.prototype.getTexStorage2DCustomData = function (functionInformation, target, instance) {
                var customData;
                if (functionInformation.arguments.length === 5) {
                    // Custom data required to display the texture.
                    customData = {
                        target: target,
                        // level: functionInformation.arguments[1],
                        internalFormat: functionInformation.arguments[2],
                        width: functionInformation.arguments[3],
                        height: functionInformation.arguments[4],
                        length: 0,
                    };
                }
                // else NO DATA.
                return customData;
            };
            Texture2DRecorder.prototype.getCompressedTexImage2DCustomData = function (functionInformation, target, instance) {
                if (functionInformation.arguments[1] !== 0) {
                    // Only manage main lod... so far.
                    return undefined;
                }
                var customData;
                if (functionInformation.arguments.length >= 7) {
                    // Custom data required to display the texture.
                    customData = {
                        target: target,
                        // level: functionInformation.arguments[1],
                        internalFormat: functionInformation.arguments[2],
                        width: functionInformation.arguments[3],
                        height: functionInformation.arguments[4],
                        length: 0,
                    };
                }
                // else NO DATA.
                return customData;
            };
            Texture2DRecorder.prototype.getTexImage2DCustomData = function (functionInformation, target, instance) {
                if (functionInformation.arguments[1] !== 0) {
                    // Only manage main lod... so far.
                    return undefined;
                }
                var customData;
                if (functionInformation.arguments.length >= 8) {
                    // Custom data required to display the texture.
                    customData = {
                        target: target,
                        // level: functionInformation.arguments[1],
                        internalFormat: functionInformation.arguments[2],
                        width: functionInformation.arguments[3],
                        height: functionInformation.arguments[4],
                        format: functionInformation.arguments[6],
                        type: functionInformation.arguments[7],
                        length: 0,
                    };
                }
                else if (functionInformation.arguments.length === 6) {
                    // Custom data required to display the texture.
                    customData = {
                        target: target,
                        // level: functionInformation.arguments[1],
                        internalFormat: functionInformation.arguments[2],
                        width: functionInformation.arguments[5].width,
                        height: functionInformation.arguments[5].height,
                        format: functionInformation.arguments[3],
                        type: functionInformation.arguments[4],
                        length: 0,
                    };
                }
                // else NO DATA.
                return customData;
            };
            Texture2DRecorder = __decorate([
                SPECTOR.Decorators.recorder("Texture2d")
            ], Texture2DRecorder);
            return Texture2DRecorder;
        }(Recorders.BaseRecorder));
        Recorders.Texture2DRecorder = Texture2DRecorder;
    })(Recorders = SPECTOR.Recorders || (SPECTOR.Recorders = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Recorders;
    (function (Recorders) {
        var Texture3DRecorder = /** @class */ (function (_super) {
            __extends(Texture3DRecorder, _super);
            function Texture3DRecorder() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Texture3DRecorder.prototype.getCreateCommandNames = function () {
                return ["createTexture"];
            };
            Texture3DRecorder.prototype.getUpdateCommandNames = function () {
                return ["texImage3D", "compressedTexImage3D", "texStorage3D"];
            };
            Texture3DRecorder.prototype.getDeleteCommandNames = function () {
                return ["deleteTexture"];
            };
            Texture3DRecorder.prototype.getBoundInstance = function (target) {
                var gl = this.options.context;
                if (target === SPECTOR.WebGlConstants.TEXTURE_2D_ARRAY.value) {
                    return gl.getParameter(SPECTOR.WebGlConstants.TEXTURE_BINDING_2D_ARRAY.value);
                }
                else if (target === SPECTOR.WebGlConstants.TEXTURE_3D.value) {
                    return gl.getParameter(SPECTOR.WebGlConstants.TEXTURE_BINDING_3D.value);
                }
                return undefined;
            };
            Texture3DRecorder.prototype.delete = function (instance) {
                var customData = instance.__SPECTOR_Object_CustomData;
                if (!customData) {
                    return 0;
                }
                if (customData.target !== SPECTOR.WebGlConstants.TEXTURE_2D_ARRAY.name && customData.target !== SPECTOR.WebGlConstants.TEXTURE_3D.name) {
                    return 0;
                }
                return customData.length;
            };
            Texture3DRecorder.prototype.update = function (functionInformation, target, instance) {
                if (functionInformation.arguments.length >= 2 && functionInformation.arguments[1] !== 0) {
                    return 0;
                }
                var customData = this.getCustomData(functionInformation, target, instance);
                if (!customData) {
                    return 0;
                }
                var previousLength = instance.__SPECTOR_Object_CustomData ? instance.__SPECTOR_Object_CustomData.length : 0;
                customData.length = customData.width * customData.height * customData.depth
                    * this.getByteSizeForInternalFormat(customData.internalFormat);
                if (customData) {
                    instance.__SPECTOR_Object_CustomData = customData;
                }
                return customData.length - previousLength;
            };
            Texture3DRecorder.prototype.getCustomData = function (functionInformation, target, instance) {
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
            };
            Texture3DRecorder.prototype.getTexStorage3DCustomData = function (functionInformation, target, instance) {
                var customData;
                if (functionInformation.arguments.length === 6) {
                    // Custom data required to display the texture.
                    customData = {
                        target: target,
                        // level: functionInformation.arguments[1],
                        internalFormat: functionInformation.arguments[2],
                        width: functionInformation.arguments[3],
                        height: functionInformation.arguments[4],
                        depth: functionInformation.arguments[5],
                        length: 0,
                    };
                }
                // else NO DATA.
                return customData;
            };
            Texture3DRecorder.prototype.getCompressedTexImage3DCustomData = function (functionInformation, target, instance) {
                if (functionInformation.arguments[1] !== 0) {
                    // Only manage main lod... so far.
                    return undefined;
                }
                var customData;
                if (functionInformation.arguments.length >= 8) {
                    // Custom data required to display the texture.
                    customData = {
                        target: target,
                        // level: functionInformation.arguments[1],
                        internalFormat: functionInformation.arguments[2],
                        width: functionInformation.arguments[3],
                        height: functionInformation.arguments[4],
                        depth: functionInformation.arguments[5],
                        length: 0,
                    };
                }
                // else NO DATA.
                return customData;
            };
            Texture3DRecorder.prototype.getTexImage3DCustomData = function (functionInformation, target, instance) {
                if (functionInformation.arguments[1] !== 0) {
                    // Only manage main lod... so far.
                    return undefined;
                }
                var customData;
                if (functionInformation.arguments.length >= 9) {
                    // Custom data required to display the texture.
                    customData = {
                        target: target,
                        // level: functionInformation.arguments[1],
                        internalFormat: functionInformation.arguments[2],
                        width: functionInformation.arguments[3],
                        height: functionInformation.arguments[4],
                        depth: functionInformation.arguments[5],
                        format: functionInformation.arguments[7],
                        type: functionInformation.arguments[8],
                        length: 0,
                    };
                }
                // else NO DATA.
                return customData;
            };
            Texture3DRecorder = __decorate([
                SPECTOR.Decorators.recorder("Texture3d")
            ], Texture3DRecorder);
            return Texture3DRecorder;
        }(Recorders.BaseRecorder));
        Recorders.Texture3DRecorder = Texture3DRecorder;
    })(Recorders = SPECTOR.Recorders || (SPECTOR.Recorders = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Recorders;
    (function (Recorders) {
        var BufferRecorder = /** @class */ (function (_super) {
            __extends(BufferRecorder, _super);
            function BufferRecorder() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            BufferRecorder.prototype.getCreateCommandNames = function () {
                return ["createBuffer"];
            };
            BufferRecorder.prototype.getUpdateCommandNames = function () {
                return ["bufferData"];
            };
            BufferRecorder.prototype.getDeleteCommandNames = function () {
                return ["deleteBuffer"];
            };
            BufferRecorder.prototype.getBoundInstance = function (target) {
                var gl = this.options.context;
                if (target === SPECTOR.WebGlConstants.ARRAY_BUFFER.value) {
                    return gl.getParameter(SPECTOR.WebGlConstants.ARRAY_BUFFER_BINDING.value);
                }
                else if (target === SPECTOR.WebGlConstants.ELEMENT_ARRAY_BUFFER.value) {
                    return gl.getParameter(SPECTOR.WebGlConstants.ELEMENT_ARRAY_BUFFER_BINDING.value);
                }
                else if (target === SPECTOR.WebGlConstants.COPY_READ_BUFFER.value) {
                    return gl.getParameter(SPECTOR.WebGlConstants.COPY_READ_BUFFER_BINDING.value);
                }
                else if (target === SPECTOR.WebGlConstants.COPY_WRITE_BUFFER.value) {
                    return gl.getParameter(SPECTOR.WebGlConstants.COPY_WRITE_BUFFER_BINDING.value);
                }
                else if (target === SPECTOR.WebGlConstants.TRANSFORM_FEEDBACK_BUFFER.value) {
                    return gl.getParameter(SPECTOR.WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_BINDING.value);
                }
                else if (target === SPECTOR.WebGlConstants.UNIFORM_BUFFER.value) {
                    return gl.getParameter(SPECTOR.WebGlConstants.UNIFORM_BUFFER_BINDING.value);
                }
                else if (target === SPECTOR.WebGlConstants.PIXEL_PACK_BUFFER.value) {
                    return gl.getParameter(SPECTOR.WebGlConstants.PIXEL_PACK_BUFFER_BINDING.value);
                }
                else if (target === SPECTOR.WebGlConstants.PIXEL_UNPACK_BUFFER.value) {
                    return gl.getParameter(SPECTOR.WebGlConstants.PIXEL_UNPACK_BUFFER_BINDING.value);
                }
                return undefined;
            };
            BufferRecorder.prototype.delete = function (instance) {
                var customData = instance.__SPECTOR_Object_CustomData;
                if (!customData) {
                    return 0;
                }
                return customData.length;
            };
            BufferRecorder.prototype.update = function (functionInformation, target, instance) {
                var customData = this.getCustomData(target, functionInformation);
                if (!customData) {
                    return 0;
                }
                var previousLength = instance.__SPECTOR_Object_CustomData ? instance.__SPECTOR_Object_CustomData.length : 0;
                instance.__SPECTOR_Object_CustomData = customData;
                return customData.length - previousLength;
            };
            BufferRecorder.prototype.getCustomData = function (target, functionInformation) {
                var length = this.getLength(functionInformation);
                if (functionInformation.arguments.length >= 4) {
                    return {
                        target: target,
                        length: length,
                        usage: functionInformation.arguments[2],
                        offset: functionInformation.arguments[3],
                        sourceLength: functionInformation.arguments[1] ? functionInformation.arguments[1].length : -1,
                    };
                }
                if (functionInformation.arguments.length === 3) {
                    return {
                        target: target,
                        length: length,
                        usage: functionInformation.arguments[2],
                    };
                }
                return undefined;
            };
            BufferRecorder.prototype.getLength = function (functionInformation) {
                /* tslint:disable */
                var length = -1;
                var offset = 0;
                if (functionInformation.arguments.length === 5) {
                    length = functionInformation.arguments[4];
                    offset = functionInformation.arguments[3];
                }
                if (length <= 0) {
                    if (typeof functionInformation.arguments[1] === "number") {
                        length = functionInformation.arguments[1];
                    }
                    else if (functionInformation.arguments[1]) {
                        length = functionInformation.arguments[1].byteLength || functionInformation.arguments[1].length || 0;
                    }
                    else {
                        length = 0;
                    }
                }
                return length - offset;
            };
            BufferRecorder = __decorate([
                SPECTOR.Decorators.recorder("Buffer")
            ], BufferRecorder);
            return BufferRecorder;
        }(Recorders.BaseRecorder));
        Recorders.BufferRecorder = BufferRecorder;
    })(Recorders = SPECTOR.Recorders || (SPECTOR.Recorders = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Recorders;
    (function (Recorders) {
        var RenderBufferRecorder = /** @class */ (function (_super) {
            __extends(RenderBufferRecorder, _super);
            function RenderBufferRecorder() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            RenderBufferRecorder.prototype.getCreateCommandNames = function () {
                return ["createRenderbuffer"];
            };
            RenderBufferRecorder.prototype.getUpdateCommandNames = function () {
                return ["renderbufferStorage", "renderbufferStorageMultisample"];
            };
            RenderBufferRecorder.prototype.getDeleteCommandNames = function () {
                return ["deleteRenderbuffer"];
            };
            RenderBufferRecorder.prototype.getBoundInstance = function (target) {
                var gl = this.options.context;
                if (target === SPECTOR.WebGlConstants.RENDERBUFFER.value) {
                    return gl.getParameter(SPECTOR.WebGlConstants.RENDERBUFFER_BINDING.value);
                }
                return undefined;
            };
            RenderBufferRecorder.prototype.delete = function (instance) {
                var customData = instance.__SPECTOR_Object_CustomData;
                if (!customData) {
                    return 0;
                }
                return customData.length;
            };
            RenderBufferRecorder.prototype.update = function (functionInformation, target, instance) {
                var customData = this.getCustomData(functionInformation, target);
                if (!customData) {
                    return 0;
                }
                var previousLength = instance.__SPECTOR_Object_CustomData ? instance.__SPECTOR_Object_CustomData.length : 0;
                customData.length = customData.width * customData.height * this.getByteSizeForInternalFormat(customData.internalFormat);
                instance.__SPECTOR_Object_CustomData = customData;
                return customData.length - previousLength;
            };
            RenderBufferRecorder.prototype.getCustomData = function (functionInformation, target) {
                // renderbufferStorage
                if (functionInformation.arguments.length === 4) {
                    return {
                        target: target,
                        internalFormat: functionInformation.arguments[1],
                        width: functionInformation.arguments[2],
                        height: functionInformation.arguments[3],
                        length: 0,
                        samples: 0,
                    };
                }
                return {
                    target: target,
                    internalFormat: functionInformation.arguments[2],
                    width: functionInformation.arguments[3],
                    height: functionInformation.arguments[4],
                    length: 0,
                    samples: functionInformation.arguments[1],
                };
            };
            RenderBufferRecorder = __decorate([
                SPECTOR.Decorators.recorder("Renderbuffer")
            ], RenderBufferRecorder);
            return RenderBufferRecorder;
        }(Recorders.BaseRecorder));
        Recorders.RenderBufferRecorder = RenderBufferRecorder;
    })(Recorders = SPECTOR.Recorders || (SPECTOR.Recorders = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Spies;
    (function (Spies) {
        var RecorderSpy = /** @class */ (function () {
            function RecorderSpy(options, logger) {
                this.options = options;
                this.logger = logger;
                this.recorders = {};
                this.recorderConstructors = {};
                this.onCommandCallbacks = {};
                this.contextInformation = options.contextInformation;
                this.time = new options.timeConstructor();
                this.initAvailableRecorders();
                this.initRecorders();
            }
            RecorderSpy.prototype.recordCommand = function (functionInformation) {
                var callbacks = this.onCommandCallbacks[functionInformation.name];
                if (callbacks) {
                    for (var _i = 0, callbacks_1 = callbacks; _i < callbacks_1.length; _i++) {
                        var callback = callbacks_1[_i];
                        callback(functionInformation);
                    }
                }
            };
            RecorderSpy.prototype.startCapture = function () {
                for (var objectName in this.recorders) {
                    if (this.recorders.hasOwnProperty(objectName)) {
                        var recorder = this.recorders[objectName];
                        recorder.startCapture();
                    }
                }
            };
            RecorderSpy.prototype.stopCapture = function () {
                for (var objectName in this.recorders) {
                    if (this.recorders.hasOwnProperty(objectName)) {
                        var recorder = this.recorders[objectName];
                        recorder.stopCapture();
                    }
                }
            };
            RecorderSpy.prototype.appendRecordedInformation = function (capture) {
                for (var objectName in this.recorders) {
                    if (this.recorders.hasOwnProperty(objectName)) {
                        var recorder = this.recorders[objectName];
                        recorder.appendRecordedInformation(capture);
                    }
                }
            };
            RecorderSpy.prototype.initAvailableRecorders = function () {
                for (var recorder in this.options.recorderNamespace) {
                    if (this.options.recorderNamespace.hasOwnProperty(recorder)) {
                        var recorderCtor = this.options.recorderNamespace[recorder];
                        var objectName = SPECTOR.Decorators.getRecorderName(recorderCtor);
                        if (objectName) {
                            this.recorderConstructors[objectName] = recorderCtor;
                        }
                    }
                }
            };
            RecorderSpy.prototype.initRecorders = function () {
                for (var objectName in this.recorderConstructors) {
                    if (this.recorderConstructors.hasOwnProperty(objectName)) {
                        var options = SPECTOR.merge({
                            objectName: objectName,
                            time: this.time,
                        }, this.contextInformation);
                        var recorder = new this.recorderConstructors[objectName](options, this.logger);
                        this.recorders[objectName] = recorder;
                        recorder.registerCallbacks(this.onCommandCallbacks);
                    }
                }
            };
            return RecorderSpy;
        }());
        Spies.RecorderSpy = RecorderSpy;
    })(Spies = SPECTOR.Spies || (SPECTOR.Spies = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Spies;
    (function (Spies) {
        var StateSpy = /** @class */ (function () {
            function StateSpy(options, logger) {
                this.options = options;
                this.logger = logger;
                this.stateTrackers = {};
                this.onCommandCapturedCallbacks = {};
                this.stateConstructors = {};
                this.contextInformation = options.contextInformation;
                this.initAvailableStateTrackers();
                this.initStateTrackers();
            }
            StateSpy.prototype.startCapture = function (currentCapture, quickCapture) {
                for (var stateTrackerName in this.stateTrackers) {
                    if (this.stateTrackers.hasOwnProperty(stateTrackerName)) {
                        var stateTracker = this.stateTrackers[stateTrackerName];
                        var state = stateTracker.startCapture(true, quickCapture);
                        if (stateTracker.requireStartAndStopStates) {
                            currentCapture.initState[stateTrackerName] = state;
                        }
                    }
                }
            };
            StateSpy.prototype.stopCapture = function (currentCapture) {
                for (var stateTrackerName in this.stateTrackers) {
                    if (this.stateTrackers.hasOwnProperty(stateTrackerName)) {
                        var stateTracker = this.stateTrackers[stateTrackerName];
                        var state = stateTracker.stopCapture();
                        if (stateTracker.requireStartAndStopStates) {
                            currentCapture.endState[stateTrackerName] = state;
                        }
                    }
                }
            };
            StateSpy.prototype.captureState = function (commandCapture) {
                var callbacks = this.onCommandCapturedCallbacks[commandCapture.name];
                if (callbacks) {
                    for (var _i = 0, callbacks_2 = callbacks; _i < callbacks_2.length; _i++) {
                        var callback = callbacks_2[_i];
                        callback(commandCapture);
                    }
                }
            };
            StateSpy.prototype.initAvailableStateTrackers = function () {
                for (var state in this.options.stateNamespace) {
                    if (this.options.stateNamespace.hasOwnProperty(state)) {
                        var stateCtor = this.options.stateNamespace[state];
                        var stateName = SPECTOR.Decorators.getStateName(stateCtor);
                        if (stateName) {
                            this.stateConstructors[stateName] = stateCtor;
                        }
                    }
                }
            };
            StateSpy.prototype.initStateTrackers = function () {
                for (var stateName in this.stateConstructors) {
                    if (this.stateConstructors.hasOwnProperty(stateName)) {
                        var options = SPECTOR.merge({ stateName: stateName }, this.contextInformation);
                        var stateTracker = new this.stateConstructors[stateName](options, this.logger);
                        this.stateTrackers[stateName] = stateTracker;
                        stateTracker.registerCallbacks(this.onCommandCapturedCallbacks);
                    }
                }
            };
            return StateSpy;
        }());
        Spies.StateSpy = StateSpy;
    })(Spies = SPECTOR.Spies || (SPECTOR.Spies = {}));
})(SPECTOR || (SPECTOR = {}));
// tslint:disable:ban-types
// tslint:disable:only-arrow-functions
var SPECTOR;
(function (SPECTOR) {
    var Spies;
    (function (Spies) {
        var WebGlObjectSpy = /** @class */ (function () {
            function WebGlObjectSpy(options, logger) {
                this.options = options;
                this.logger = logger;
                this.webGlObjectConstructors = {};
                this.webGlObjects = {};
                this.contextInformation = options.contextInformation;
                this.initAvailableWebglObjects();
                this.initWebglObjects();
            }
            WebGlObjectSpy.prototype.tagWebGlObjects = function (functionInformation) {
                for (var typeName in this.webGlObjects) {
                    if (this.webGlObjects.hasOwnProperty(typeName)) {
                        var webGlObject = this.webGlObjects[typeName];
                        for (var i = 0; i < functionInformation.arguments.length; i++) {
                            var arg = functionInformation.arguments[i];
                            if (webGlObject.tagWebGlObject(arg)) {
                                break;
                            }
                        }
                        if (webGlObject.tagWebGlObject(functionInformation.result)) {
                            break;
                        }
                    }
                }
            };
            WebGlObjectSpy.prototype.tagWebGlObject = function (object) {
                for (var typeName in this.webGlObjects) {
                    if (this.webGlObjects.hasOwnProperty(typeName)) {
                        var webGlObject = this.webGlObjects[typeName];
                        var tag = webGlObject.tagWebGlObject(object);
                        if (tag) {
                            return tag;
                        }
                    }
                }
                return undefined;
            };
            WebGlObjectSpy.prototype.initAvailableWebglObjects = function () {
                for (var webGlObject in this.options.webGlObjectNamespace) {
                    if (this.options.webGlObjectNamespace.hasOwnProperty(webGlObject)) {
                        var webGlObjectCtor = this.options.webGlObjectNamespace[webGlObject];
                        var typeName = SPECTOR.Decorators.getWebGlObjectName(webGlObjectCtor);
                        var type = SPECTOR.Decorators.getWebGlObjectType(webGlObjectCtor);
                        if (typeName && type) {
                            this.webGlObjectConstructors[typeName] = {
                                ctor: webGlObjectCtor,
                                type: type,
                            };
                        }
                    }
                }
            };
            WebGlObjectSpy.prototype.initWebglObjects = function () {
                for (var typeName in this.webGlObjectConstructors) {
                    if (this.webGlObjectConstructors.hasOwnProperty(typeName)) {
                        var options = SPECTOR.merge({
                            typeName: typeName,
                            type: this.webGlObjectConstructors[typeName].type,
                        }, this.contextInformation);
                        var webglObject = new this.webGlObjectConstructors[typeName].ctor(options, this.logger);
                        this.webGlObjects[typeName] = webglObject;
                    }
                }
            };
            return WebGlObjectSpy;
        }());
        Spies.WebGlObjectSpy = WebGlObjectSpy;
    })(Spies = SPECTOR.Spies || (SPECTOR.Spies = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        States.drawCommands = [
            "drawArrays",
            "drawElements",
            "drawArraysInstanced",
            "drawElementsInstanced",
            "drawElementsInstancedANGLE",
            "drawRangeElements",
        ];
        var BaseState = /** @class */ (function () {
            function BaseState(options, logger) {
                this.options = options;
                this.logger = logger;
                this.context = options.context;
                this.contextVersion = options.contextVersion;
                this.extensions = options.extensions;
                this.toggleCapture = options.toggleCapture;
                this.stateName = options.stateName;
                this.consumeCommands = this.getConsumeCommands();
                this.changeCommandsByState = this.getChangeCommandsByState();
                this.commandNameToStates = this.getCommandNameToStates();
            }
            Object.defineProperty(BaseState.prototype, "requireStartAndStopStates", {
                get: function () {
                    return true;
                },
                enumerable: true,
                configurable: true
            });
            BaseState.prototype.startCapture = function (loadFromContext, quickCapture) {
                this.quickCapture = quickCapture;
                this.capturedCommandsByState = {};
                if (loadFromContext && this.requireStartAndStopStates) {
                    this.currentState = {};
                    this.readFromContextNoSideEffects();
                }
                this.copyCurrentStateToPrevious();
                this.currentState = {};
                return this.previousState;
            };
            BaseState.prototype.stopCapture = function () {
                if (this.requireStartAndStopStates) {
                    this.readFromContextNoSideEffects();
                }
                this.analyse(undefined);
                return this.currentState;
            };
            BaseState.prototype.registerCallbacks = function (callbacks) {
                for (var stateName in this.changeCommandsByState) {
                    if (this.changeCommandsByState.hasOwnProperty(stateName)) {
                        for (var _i = 0, _a = this.changeCommandsByState[stateName]; _i < _a.length; _i++) {
                            var changeCommand = _a[_i];
                            callbacks[changeCommand] = callbacks[changeCommand] || [];
                            callbacks[changeCommand].push(this.onChangeCommand.bind(this));
                        }
                    }
                }
                for (var _b = 0, _c = this.consumeCommands; _b < _c.length; _b++) {
                    var commandName = _c[_b];
                    callbacks[commandName] = callbacks[commandName] || [];
                    callbacks[commandName].push(this.onConsumeCommand.bind(this));
                }
            };
            BaseState.prototype.getStateData = function () {
                return this.currentState;
            };
            BaseState.prototype.getConsumeCommands = function () {
                return [];
            };
            BaseState.prototype.getChangeCommandsByState = function () {
                return {};
            };
            BaseState.prototype.copyCurrentStateToPrevious = function () {
                if (!this.currentState) {
                    return;
                }
                this.previousState = this.currentState;
            };
            BaseState.prototype.onChangeCommand = function (command) {
                var stateNames = this.commandNameToStates[command.name];
                for (var _i = 0, stateNames_1 = stateNames; _i < stateNames_1.length; _i++) {
                    var stateName = stateNames_1[_i];
                    if (!this.isValidChangeCommand(command, stateName)) {
                        return;
                    }
                    this.capturedCommandsByState[stateName] = this.capturedCommandsByState[stateName] || [];
                    this.capturedCommandsByState[stateName].push(command);
                }
            };
            BaseState.prototype.isValidChangeCommand = function (command, stateName) {
                return true;
            };
            BaseState.prototype.onConsumeCommand = function (command) {
                if (!this.isValidConsumeCommand(command)) {
                    return;
                }
                this.readFromContextNoSideEffects();
                this.analyse(command);
                this.storeCommandIds();
                command[this.stateName] = this.currentState;
                this.startCapture(false, this.quickCapture);
            };
            BaseState.prototype.isValidConsumeCommand = function (command) {
                return true;
            };
            BaseState.prototype.analyse = function (consumeCommand) {
                for (var stateName in this.capturedCommandsByState) {
                    if (this.capturedCommandsByState.hasOwnProperty(stateName)) {
                        var commands = this.capturedCommandsByState[stateName];
                        var lengthM1 = commands.length - 1;
                        if (lengthM1 >= 0) {
                            if (consumeCommand) {
                                for (var i = 0; i < lengthM1; i++) {
                                    var redundantCommand = commands[i];
                                    redundantCommand.consumeCommandId = consumeCommand.id;
                                    this.changeCommandCaptureStatus(redundantCommand, 30 /* Redundant */);
                                }
                                var isStateEnabled = this.isStateEnableNoSideEffects(stateName, consumeCommand.commandArguments);
                                var command = commands[lengthM1];
                                command.consumeCommandId = consumeCommand.id;
                                if (!this.areStatesEquals(this.currentState[stateName], this.previousState[stateName])) {
                                    if (isStateEnabled) {
                                        this.changeCommandCaptureStatus(command, 40 /* Valid */);
                                    }
                                    else {
                                        this.changeCommandCaptureStatus(command, 20 /* Disabled */);
                                    }
                                }
                                else {
                                    this.changeCommandCaptureStatus(command, 30 /* Redundant */);
                                }
                            }
                            else {
                                for (var i = 0; i < commands.length; i++) {
                                    var command = commands[i];
                                    this.changeCommandCaptureStatus(command, 10 /* Unused */);
                                }
                            }
                        }
                    }
                }
            };
            BaseState.prototype.storeCommandIds = function () {
                var commandIdsStates = ["unusedCommandIds", "disabledCommandIds", "redundantCommandIds", "validCommandIds"];
                for (var _i = 0, commandIdsStates_1 = commandIdsStates; _i < commandIdsStates_1.length; _i++) {
                    var commandIdsStatus = commandIdsStates_1[_i];
                    this.currentState[commandIdsStatus] = [];
                }
                for (var stateName in this.capturedCommandsByState) {
                    if (this.capturedCommandsByState.hasOwnProperty(stateName)) {
                        var commands = this.capturedCommandsByState[stateName];
                        for (var _a = 0, commands_1 = commands; _a < commands_1.length; _a++) {
                            var command = commands_1[_a];
                            switch (command.status) {
                                case 10 /* Unused */:
                                    this.currentState["unusedCommandIds"].push(command.id);
                                    break;
                                case 20 /* Disabled */:
                                    this.currentState["disabledCommandIds"].push(command.id);
                                    break;
                                case 30 /* Redundant */:
                                    this.currentState["redundantCommandIds"].push(command.id);
                                    break;
                                case 40 /* Valid */:
                                    this.currentState["validCommandIds"].push(command.id);
                                    break;
                            }
                        }
                    }
                }
                for (var _b = 0, commandIdsStates_2 = commandIdsStates; _b < commandIdsStates_2.length; _b++) {
                    var commandIdsStatus = commandIdsStates_2[_b];
                    if (!this.currentState[commandIdsStatus].length) {
                        delete this.currentState[commandIdsStatus];
                    }
                }
            };
            BaseState.prototype.changeCommandCaptureStatus = function (capture, status) {
                if (capture.status < status) {
                    capture.status = status;
                    return true;
                }
                return false;
            };
            BaseState.prototype.areStatesEquals = function (a, b) {
                if (typeof a !== typeof b) {
                    return false;
                }
                if (a && !b) {
                    return false;
                }
                if (b && !a) {
                    return false;
                }
                if (a === undefined || a === null) {
                    return true;
                }
                if (a.length && b.length && typeof a !== "string") {
                    if (a.length !== b.length) {
                        return false;
                    }
                    for (var i = 0; i < a.length; i++) {
                        if (a[i] !== b[i]) {
                            return false;
                        }
                    }
                    return true;
                }
                return a === b;
            };
            BaseState.prototype.isStateEnable = function (stateName, args) {
                return true;
            };
            BaseState.prototype.getSpectorData = function (object) {
                if (!object) {
                    return undefined;
                }
                return {
                    __SPECTOR_Object_TAG: SPECTOR.WebGlObjects.getWebGlObjectTag(object) || this.options.tagWebGlObject(object),
                    __SPECTOR_Object_CustomData: object.__SPECTOR_Object_CustomData,
                    __SPECTOR_Metadata: object.__SPECTOR_Metadata,
                };
            };
            BaseState.prototype.readFromContextNoSideEffects = function () {
                this.toggleCapture(false);
                this.readFromContext();
                this.toggleCapture(true);
            };
            BaseState.prototype.isStateEnableNoSideEffects = function (stateName, args) {
                this.toggleCapture(false);
                var enable = this.isStateEnable(stateName, args);
                this.toggleCapture(true);
                return enable;
            };
            BaseState.prototype.getCommandNameToStates = function () {
                var result = {};
                for (var stateName in this.changeCommandsByState) {
                    if (this.changeCommandsByState.hasOwnProperty(stateName)) {
                        for (var _i = 0, _a = this.changeCommandsByState[stateName]; _i < _a.length; _i++) {
                            var changeCommand = _a[_i];
                            result[changeCommand] = result[changeCommand] || [];
                            result[changeCommand].push(stateName);
                        }
                    }
                }
                return result;
            };
            return BaseState;
        }());
        States.BaseState = BaseState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var ParameterState = /** @class */ (function (_super) {
            __extends(ParameterState, _super);
            function ParameterState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ParameterState.prototype.getWebgl1Parameters = function () {
                return [];
            };
            ParameterState.prototype.getWebgl2Parameters = function () {
                return [];
            };
            ParameterState.prototype.getChangeCommandsByState = function () {
                this.parameters = [];
                this.parameters.push(this.getWebgl1Parameters());
                if (this.contextVersion > 1) {
                    this.parameters.push(this.getWebgl2Parameters());
                }
                var changeCommandsByState = {};
                for (var version = 1; version <= this.contextVersion; version++) {
                    if (version > this.parameters.length) {
                        break;
                    }
                    if (!this.parameters[version - 1]) {
                        continue;
                    }
                    for (var _i = 0, _a = this.parameters[version - 1]; _i < _a.length; _i++) {
                        var parameter = _a[_i];
                        if (parameter.changeCommands) {
                            for (var _b = 0, _c = parameter.changeCommands; _b < _c.length; _b++) {
                                var command = _c[_b];
                                changeCommandsByState[parameter.constant.name] = changeCommandsByState[parameter.constant.name] || [];
                                changeCommandsByState[parameter.constant.name].push(command);
                            }
                        }
                    }
                }
                return changeCommandsByState;
            };
            ParameterState.prototype.readFromContext = function () {
                for (var version = 1; version <= this.contextVersion; version++) {
                    if (version > this.parameters.length) {
                        break;
                    }
                    for (var _i = 0, _a = this.parameters[version - 1]; _i < _a.length; _i++) {
                        var parameter = _a[_i];
                        var value = this.readParameterFromContext(parameter);
                        var tag = SPECTOR.WebGlObjects.getWebGlObjectTag(value);
                        if (tag) {
                            this.currentState[parameter.constant.name] = tag;
                        }
                        else {
                            var stringValue = this.stringifyParameterValue(value, parameter);
                            this.currentState[parameter.constant.name] = stringValue;
                        }
                    }
                }
            };
            ParameterState.prototype.readParameterFromContext = function (parameter) {
                if (parameter.constant.extensionName && !this.extensions[parameter.constant.extensionName]) {
                    return "Extension " + parameter.constant.extensionName + " is unavailble.";
                }
                var value = this.context.getParameter(parameter.constant.value);
                return value;
            };
            ParameterState.prototype.stringifyParameterValue = function (value, parameter) {
                if (value === null) {
                    return "null";
                }
                if (value === undefined) {
                    return "undefined";
                }
                if (parameter.returnType === 30 /* GlUint */) {
                    value = value.toString(2);
                    value = "00000000000000000000000000000000".substr(value.length) + value;
                    return value;
                }
                if (typeof value === "number" && SPECTOR.WebGlConstants.isWebGlConstant(value)) {
                    if (parameter.returnType === 20 /* GlEnum */) {
                        var commandName = parameter.changeCommands ? parameter.changeCommands[0] || "" : "";
                        value = SPECTOR.WebGlConstants.stringifyWebGlConstant(value, commandName);
                        return value;
                    }
                    else {
                        return value;
                    }
                }
                else if (value.length && typeof value !== "string") {
                    var newValue = [];
                    for (var i = 0; i < value.length; i++) {
                        newValue.push(value[i]);
                    }
                    return newValue;
                }
                return value;
            };
            return ParameterState;
        }(States.BaseState));
        States.ParameterState = ParameterState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var Information;
        (function (Information) {
            var Capabilities = /** @class */ (function (_super) {
                __extends(Capabilities, _super);
                function Capabilities(options, logger) {
                    var _this = _super.call(this, options, logger) || this;
                    _this.currentState = _this.startCapture(true, _this.quickCapture);
                    return _this;
                }
                Capabilities.prototype.getWebgl1Parameters = function () {
                    return [{ constant: SPECTOR.WebGlConstants.RENDERER },
                        { constant: SPECTOR.WebGlConstants.VENDOR },
                        { constant: SPECTOR.WebGlConstants.VERSION },
                        { constant: SPECTOR.WebGlConstants.SHADING_LANGUAGE_VERSION },
                        { constant: SPECTOR.WebGlConstants.SAMPLES },
                        { constant: SPECTOR.WebGlConstants.SAMPLE_BUFFERS },
                        { constant: SPECTOR.WebGlConstants.RED_BITS },
                        { constant: SPECTOR.WebGlConstants.GREEN_BITS },
                        { constant: SPECTOR.WebGlConstants.BLUE_BITS },
                        { constant: SPECTOR.WebGlConstants.ALPHA_BITS },
                        { constant: SPECTOR.WebGlConstants.DEPTH_BITS },
                        { constant: SPECTOR.WebGlConstants.STENCIL_BITS },
                        { constant: SPECTOR.WebGlConstants.SUBPIXEL_BITS },
                        { constant: SPECTOR.WebGlConstants.LINE_WIDTH },
                        { constant: SPECTOR.WebGlConstants.ALIASED_LINE_WIDTH_RANGE },
                        { constant: SPECTOR.WebGlConstants.ALIASED_POINT_SIZE_RANGE },
                        { constant: SPECTOR.WebGlConstants.IMPLEMENTATION_COLOR_READ_FORMAT, returnType: 20 /* GlEnum */ },
                        { constant: SPECTOR.WebGlConstants.IMPLEMENTATION_COLOR_READ_TYPE, returnType: 20 /* GlEnum */ },
                        // { constant: WebGlConstants.UNIFORM_BUFFER_OFFSET_ALIGNMENT },
                        { constant: SPECTOR.WebGlConstants.MAX_COMBINED_TEXTURE_IMAGE_UNITS },
                        { constant: SPECTOR.WebGlConstants.MAX_CUBE_MAP_TEXTURE_SIZE },
                        { constant: SPECTOR.WebGlConstants.MAX_FRAGMENT_UNIFORM_VECTORS },
                        { constant: SPECTOR.WebGlConstants.MAX_RENDERBUFFER_SIZE },
                        { constant: SPECTOR.WebGlConstants.MAX_TEXTURE_IMAGE_UNITS },
                        { constant: SPECTOR.WebGlConstants.MAX_TEXTURE_SIZE },
                        { constant: SPECTOR.WebGlConstants.MAX_VARYING_VECTORS },
                        { constant: SPECTOR.WebGlConstants.MAX_VERTEX_ATTRIBS },
                        { constant: SPECTOR.WebGlConstants.MAX_VERTEX_TEXTURE_IMAGE_UNITS },
                        { constant: SPECTOR.WebGlConstants.MAX_VERTEX_UNIFORM_VECTORS },
                        { constant: SPECTOR.WebGlConstants.MAX_VIEWPORT_DIMS },
                        { constant: SPECTOR.WebGlConstants.MAX_TEXTURE_MAX_ANISOTROPY_EXT },
                        { constant: SPECTOR.WebGlConstants.MAX_COLOR_ATTACHMENTS_WEBGL },
                        { constant: SPECTOR.WebGlConstants.MAX_DRAW_BUFFERS_WEBGL }];
                };
                Capabilities.prototype.getWebgl2Parameters = function () {
                    return [{ constant: SPECTOR.WebGlConstants.MAX_3D_TEXTURE_SIZE },
                        { constant: SPECTOR.WebGlConstants.MAX_ARRAY_TEXTURE_LAYERS },
                        { constant: SPECTOR.WebGlConstants.MAX_CLIENT_WAIT_TIMEOUT_WEBGL },
                        { constant: SPECTOR.WebGlConstants.MAX_COLOR_ATTACHMENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_COMBINED_FRAGMENT_UNIFORM_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_COMBINED_UNIFORM_BLOCKS },
                        { constant: SPECTOR.WebGlConstants.MAX_COMBINED_VERTEX_UNIFORM_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_DRAW_BUFFERS },
                        { constant: SPECTOR.WebGlConstants.MAX_ELEMENT_INDEX },
                        { constant: SPECTOR.WebGlConstants.MAX_ELEMENTS_INDICES },
                        { constant: SPECTOR.WebGlConstants.MAX_ELEMENTS_VERTICES },
                        { constant: SPECTOR.WebGlConstants.MAX_FRAGMENT_INPUT_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_FRAGMENT_UNIFORM_BLOCKS },
                        { constant: SPECTOR.WebGlConstants.MAX_FRAGMENT_UNIFORM_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_PROGRAM_TEXEL_OFFSET },
                        { constant: SPECTOR.WebGlConstants.MAX_SAMPLES },
                        { constant: SPECTOR.WebGlConstants.MAX_SERVER_WAIT_TIMEOUT },
                        { constant: SPECTOR.WebGlConstants.MAX_TEXTURE_LOD_BIAS },
                        { constant: SPECTOR.WebGlConstants.MAX_TRANSFORM_FEEDBACK_INTERLEAVED_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_TRANSFORM_FEEDBACK_SEPARATE_ATTRIBS },
                        { constant: SPECTOR.WebGlConstants.MAX_TRANSFORM_FEEDBACK_SEPARATE_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_UNIFORM_BLOCK_SIZE },
                        { constant: SPECTOR.WebGlConstants.MAX_UNIFORM_BUFFER_BINDINGS },
                        { constant: SPECTOR.WebGlConstants.MAX_VARYING_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_VERTEX_OUTPUT_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MAX_VERTEX_UNIFORM_BLOCKS },
                        { constant: SPECTOR.WebGlConstants.MAX_VERTEX_UNIFORM_COMPONENTS },
                        { constant: SPECTOR.WebGlConstants.MIN_PROGRAM_TEXEL_OFFSET }];
                };
                return Capabilities;
            }(States.ParameterState));
            Information.Capabilities = Capabilities;
        })(Information = States.Information || (States.Information = {}));
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var Information;
        (function (Information) {
            var CompressedTextures = /** @class */ (function (_super) {
                __extends(CompressedTextures, _super);
                function CompressedTextures(options, logger) {
                    var _this = _super.call(this, options, logger) || this;
                    _this.currentState = _this.startCapture(true, _this.quickCapture);
                    return _this;
                }
                CompressedTextures.prototype.getWebgl1Parameters = function () {
                    return [{ constant: SPECTOR.WebGlConstants.COMPRESSED_TEXTURE_FORMATS }];
                };
                CompressedTextures.prototype.stringifyParameterValue = function (value, parameter) {
                    var formats = [];
                    for (var _i = 0, value_1 = value; _i < value_1.length; _i++) {
                        var format = value_1[_i];
                        formats.push(SPECTOR.WebGlConstants.stringifyWebGlConstant(format, "getParameter"));
                    }
                    return formats;
                };
                return CompressedTextures;
            }(States.ParameterState));
            Information.CompressedTextures = CompressedTextures;
        })(Information = States.Information || (States.Information = {}));
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var Information;
        (function (Information) {
            var Extensions = /** @class */ (function (_super) {
                __extends(Extensions, _super);
                function Extensions(options, logger) {
                    var _this = _super.call(this, options, logger) || this;
                    _this.extensionDefinition = [
                        [{ name: "ANGLE_instanced_arrays", description: "" },
                            { name: "EXT_blend_minmax", description: "" },
                            { name: "EXT_color_buffer_float", description: "" },
                            { name: "EXT_color_buffer_half_float", description: "" },
                            { name: "EXT_disjoint_timer_query", description: "" },
                            { name: "EXT_frag_depth", description: "" },
                            { name: "EXT_sRGB", description: "" },
                            { name: "EXT_shader_texture_lod", description: "" },
                            { name: "EXT_texture_filter_anisotropic", description: "" },
                            { name: "OES_element_index_uint", description: "" },
                            { name: "OES_standard_derivatives", description: "" },
                            { name: "OES_texture_float", description: "" },
                            { name: "OES_texture_float_linear", description: "" },
                            { name: "OES_texture_half_float", description: "" },
                            { name: "OES_texture_half_float_linear", description: "" },
                            { name: "OES_vertex_array_object", description: "" },
                            { name: "WEBGL_color_buffer_float", description: "" },
                            { name: "WEBGL_compressed_texture_astc", description: "" },
                            { name: "WEBGL_compressed_texture_atc", description: "" },
                            { name: "WEBGL_compressed_texture_etc", description: "" },
                            { name: "WEBGL_compressed_texture_etc1", description: "" },
                            { name: "WEBGL_compressed_texture_s3tc", description: "" },
                            // { name: "WEBGL_debug_renderer_info", description: "" },
                            // { name: "WEBGL_debug_shaders", description: "" },
                            { name: "WEBGL_depth_texture", description: "" },
                            { name: "WEBGL_draw_buffers", description: "" }],
                    ];
                    _this.currentState = _this.startCapture(true, _this.quickCapture);
                    return _this;
                }
                Extensions.prototype.getExtensions = function () {
                    return this.extensions;
                };
                Extensions.prototype.readFromContext = function () {
                    for (var version = 1; version <= this.contextVersion; version++) {
                        if (version > this.extensionDefinition.length) {
                            break;
                        }
                        for (var _i = 0, _a = this.extensionDefinition[version - 1]; _i < _a.length; _i++) {
                            var parameter = _a[_i];
                            var value = this.context.getExtension(parameter.name);
                            if (value) {
                                this.currentState[parameter.name] = true;
                                this.extensions[parameter.name] = value;
                            }
                            else {
                                this.currentState[parameter.name] = false;
                            }
                        }
                    }
                };
                return Extensions;
            }(States.BaseState));
            Information.Extensions = Extensions;
        })(Information = States.Information || (States.Information = {}));
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
// tslint:disable:max-line-length
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var AlignmentState = /** @class */ (function (_super) {
            __extends(AlignmentState, _super);
            function AlignmentState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            AlignmentState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.PACK_ALIGNMENT, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.UNPACK_ALIGNMENT, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.UNPACK_COLORSPACE_CONVERSION_WEBGL, returnType: 20 /* GlEnum */, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.UNPACK_FLIP_Y_WEBGL, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.UNPACK_PREMULTIPLY_ALPHA_WEBGL, changeCommands: ["pixelStorei"] }];
            };
            AlignmentState.prototype.getWebgl2Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.PACK_ROW_LENGTH, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.PACK_SKIP_PIXELS, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.PACK_SKIP_ROWS, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.UNPACK_IMAGE_HEIGHT, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.UNPACK_SKIP_PIXELS, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.UNPACK_SKIP_ROWS, changeCommands: ["pixelStorei"] },
                    { constant: SPECTOR.WebGlConstants.UNPACK_SKIP_IMAGES, changeCommands: ["pixelStorei"] }];
            };
            AlignmentState.prototype.getConsumeCommands = function () {
                return ["readPixels", "texImage2D", "texSubImage2D"];
            };
            AlignmentState.prototype.isValidChangeCommand = function (command, stateName) {
                return SPECTOR.WebGlConstantsByName[stateName].value === command.commandArguments[0];
            };
            AlignmentState = __decorate([
                SPECTOR.Decorators.state("AlignmentState")
            ], AlignmentState);
            return AlignmentState;
        }(States.ParameterState));
        States.AlignmentState = AlignmentState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
// tslint:disable:max-line-length
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var BlendState = /** @class */ (function (_super) {
            __extends(BlendState, _super);
            function BlendState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            BlendState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.BLEND, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.BLEND_COLOR, changeCommands: ["blendColor"] },
                    { constant: SPECTOR.WebGlConstants.BLEND_DST_ALPHA, returnType: 20 /* GlEnum */, changeCommands: ["blendFunc", "blendFuncSeparate"] },
                    { constant: SPECTOR.WebGlConstants.BLEND_DST_RGB, returnType: 20 /* GlEnum */, changeCommands: ["blendFunc", "blendFuncSeparate"] },
                    // { constant: WebGlConstants.BLEND_EQUATION, returnType: ParameterReturnType.GlEnum, changeCommands: ["blendEquation", "blendEquationSeparate"] },
                    { constant: SPECTOR.WebGlConstants.BLEND_EQUATION_ALPHA, returnType: 20 /* GlEnum */, changeCommands: ["blendEquation", "blendEquationSeparate"] },
                    { constant: SPECTOR.WebGlConstants.BLEND_EQUATION_RGB, returnType: 20 /* GlEnum */, changeCommands: ["blendEquation", "blendEquationSeparate"] },
                    { constant: SPECTOR.WebGlConstants.BLEND_SRC_ALPHA, returnType: 20 /* GlEnum */, changeCommands: ["blendFunc", "blendFuncSeparate"] },
                    { constant: SPECTOR.WebGlConstants.BLEND_SRC_RGB, returnType: 20 /* GlEnum */, changeCommands: ["blendFunc", "blendFuncSeparate"] }];
            };
            BlendState.prototype.isValidChangeCommand = function (command, stateName) {
                if (command.name === "enable" || command.name === "disable") {
                    return command.commandArguments[0] === SPECTOR.WebGlConstants.BLEND.value;
                }
                return true;
            };
            BlendState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            BlendState.prototype.isStateEnable = function (stateName, args) {
                return this.context.isEnabled(SPECTOR.WebGlConstants.BLEND.value);
            };
            BlendState = __decorate([
                SPECTOR.Decorators.state("BlendState")
            ], BlendState);
            return BlendState;
        }(States.ParameterState));
        States.BlendState = BlendState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var ClearState = /** @class */ (function (_super) {
            __extends(ClearState, _super);
            function ClearState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ClearState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.COLOR_CLEAR_VALUE, changeCommands: ["clearColor"] },
                    { constant: SPECTOR.WebGlConstants.DEPTH_CLEAR_VALUE, changeCommands: ["clearDepth"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_CLEAR_VALUE, changeCommands: ["clearStencil"] }];
            };
            ClearState.prototype.getConsumeCommands = function () {
                return ["clear"];
            };
            ClearState.prototype.isStateEnable = function (stateName, args) {
                switch (stateName) {
                    case SPECTOR.WebGlConstants.COLOR_CLEAR_VALUE.name:
                        return SPECTOR.WebGlConstants.COLOR_BUFFER_BIT.value === (args[0] & SPECTOR.WebGlConstants.COLOR_BUFFER_BIT.value);
                    case SPECTOR.WebGlConstants.DEPTH_CLEAR_VALUE.name:
                        return SPECTOR.WebGlConstants.DEPTH_BUFFER_BIT.value === (args[0] & SPECTOR.WebGlConstants.DEPTH_BUFFER_BIT.value);
                    case SPECTOR.WebGlConstants.STENCIL_CLEAR_VALUE.name:
                        return SPECTOR.WebGlConstants.STENCIL_BUFFER_BIT.value ===
                            (args[0] & SPECTOR.WebGlConstants.STENCIL_BUFFER_BIT.value);
                }
                return false;
            };
            ClearState = __decorate([
                SPECTOR.Decorators.state("ClearState")
            ], ClearState);
            return ClearState;
        }(States.ParameterState));
        States.ClearState = ClearState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var ColorState = /** @class */ (function (_super) {
            __extends(ColorState, _super);
            function ColorState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ColorState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.COLOR_WRITEMASK, changeCommands: ["colorMask"] }];
            };
            ColorState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            ColorState = __decorate([
                SPECTOR.Decorators.state("ColorState")
            ], ColorState);
            return ColorState;
        }(States.ParameterState));
        States.ColorState = ColorState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var CoverageState = /** @class */ (function (_super) {
            __extends(CoverageState, _super);
            function CoverageState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            CoverageState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.SAMPLE_COVERAGE_VALUE, changeCommands: ["sampleCoverage"] },
                    { constant: SPECTOR.WebGlConstants.SAMPLE_COVERAGE_INVERT, changeCommands: ["sampleCoverage"] }];
            };
            CoverageState.prototype.getWebgl2Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.SAMPLE_COVERAGE, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.SAMPLE_ALPHA_TO_COVERAGE, changeCommands: ["enable", "disable"] }];
            };
            CoverageState.prototype.isValidChangeCommand = function (command, stateName) {
                if (command.name === "enable" || command.name === "disable") {
                    if (command.commandArguments[0] === SPECTOR.WebGlConstants.SAMPLE_COVERAGE.value) {
                        return stateName === SPECTOR.WebGlConstants.SAMPLE_COVERAGE.name;
                    }
                    if (command.commandArguments[0] === SPECTOR.WebGlConstants.SAMPLE_ALPHA_TO_COVERAGE.value) {
                        return stateName === SPECTOR.WebGlConstants.SAMPLE_ALPHA_TO_COVERAGE.name;
                    }
                    return false;
                }
                return true;
            };
            CoverageState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            CoverageState.prototype.isStateEnable = function (stateName, args) {
                if (this.contextVersion === 2) {
                    return this.context.isEnabled(SPECTOR.WebGlConstants.SAMPLE_COVERAGE.value);
                }
                return false;
            };
            CoverageState = __decorate([
                SPECTOR.Decorators.state("CoverageState")
            ], CoverageState);
            return CoverageState;
        }(States.ParameterState));
        States.CoverageState = CoverageState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
// tslint:disable:max-line-length
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var CullState = /** @class */ (function (_super) {
            __extends(CullState, _super);
            function CullState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            CullState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.CULL_FACE, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.CULL_FACE_MODE, returnType: 20 /* GlEnum */, changeCommands: ["cullFace"] }];
            };
            CullState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            CullState.prototype.isValidChangeCommand = function (command, stateName) {
                if (command.name === "enable" || command.name === "disable") {
                    return command.commandArguments[0] === SPECTOR.WebGlConstants.CULL_FACE.value;
                }
                return true;
            };
            CullState.prototype.isStateEnable = function (stateName, args) {
                return this.context.isEnabled(SPECTOR.WebGlConstants.CULL_FACE.value);
            };
            CullState = __decorate([
                SPECTOR.Decorators.state("CullState")
            ], CullState);
            return CullState;
        }(States.ParameterState));
        States.CullState = CullState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
// tslint:disable:max-line-length
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var DepthState = /** @class */ (function (_super) {
            __extends(DepthState, _super);
            function DepthState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            DepthState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.DEPTH_TEST, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.DEPTH_FUNC, returnType: 20 /* GlEnum */, changeCommands: ["depthFunc"] },
                    { constant: SPECTOR.WebGlConstants.DEPTH_RANGE, changeCommands: ["depthRange"] },
                    { constant: SPECTOR.WebGlConstants.DEPTH_WRITEMASK, changeCommands: ["depthMask"] }];
            };
            DepthState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            DepthState.prototype.isValidChangeCommand = function (command, stateName) {
                if (command.name === "enable" || command.name === "disable") {
                    return command.commandArguments[0] === SPECTOR.WebGlConstants.DEPTH_TEST.value;
                }
                return true;
            };
            DepthState.prototype.isStateEnable = function (stateName, args) {
                return this.context.isEnabled(SPECTOR.WebGlConstants.DEPTH_TEST.value);
            };
            DepthState = __decorate([
                SPECTOR.Decorators.state("DepthState")
            ], DepthState);
            return DepthState;
        }(States.ParameterState));
        States.DepthState = DepthState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
// tslint:disable:max-line-length
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var DrawState = /** @class */ (function (_super) {
            __extends(DrawState, _super);
            function DrawState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            DrawState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.DITHER, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.VIEWPORT, changeCommands: ["viewPort"] },
                    { constant: SPECTOR.WebGlConstants.FRONT_FACE, returnType: 20 /* GlEnum */, changeCommands: ["frontFace"] },
                    { constant: SPECTOR.WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT_OES, changeCommands: ["hint"] }];
            };
            DrawState.prototype.getWebgl2Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.RASTERIZER_DISCARD, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT, changeCommands: ["hint"] }];
            };
            DrawState.prototype.isValidChangeCommand = function (command, stateName) {
                if (command.name === "enable" || command.name === "disable") {
                    if (command.commandArguments[0] === SPECTOR.WebGlConstants.DITHER.value) {
                        return stateName === SPECTOR.WebGlConstants.DITHER.name;
                    }
                    if (command.commandArguments[0] === SPECTOR.WebGlConstants.RASTERIZER_DISCARD.value) {
                        return stateName === SPECTOR.WebGlConstants.RASTERIZER_DISCARD.name;
                    }
                    return false;
                }
                if (command.name === "hint") {
                    if (command.commandArguments[0] === SPECTOR.WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT_OES.value) {
                        return stateName === SPECTOR.WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT_OES.name;
                    }
                    if (command.commandArguments[0] === SPECTOR.WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT.value) {
                        return stateName === SPECTOR.WebGlConstants.FRAGMENT_SHADER_DERIVATIVE_HINT.name;
                    }
                    return false;
                }
                return true;
            };
            DrawState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            DrawState.prototype.isStateEnable = function (stateName, args) {
                switch (stateName) {
                    case SPECTOR.WebGlConstants.DITHER.name:
                        return this.context.isEnabled(SPECTOR.WebGlConstants.DITHER.value);
                    case SPECTOR.WebGlConstants.RASTERIZER_DISCARD.name:
                        return this.context.isEnabled(SPECTOR.WebGlConstants.RASTERIZER_DISCARD.value);
                }
                return true;
            };
            DrawState = __decorate([
                SPECTOR.Decorators.state("DrawState")
            ], DrawState);
            return DrawState;
        }(States.ParameterState));
        States.DrawState = DrawState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var MipmapHintState = /** @class */ (function (_super) {
            __extends(MipmapHintState, _super);
            function MipmapHintState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            MipmapHintState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.GENERATE_MIPMAP_HINT, changeCommands: ["hint"] }];
            };
            MipmapHintState.prototype.getConsumeCommands = function () {
                return ["generateMipmap"];
            };
            MipmapHintState = __decorate([
                SPECTOR.Decorators.state("MipmapHintState")
            ], MipmapHintState);
            return MipmapHintState;
        }(States.ParameterState));
        States.MipmapHintState = MipmapHintState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var PolygonOffsetState = /** @class */ (function (_super) {
            __extends(PolygonOffsetState, _super);
            function PolygonOffsetState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            PolygonOffsetState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.POLYGON_OFFSET_FILL, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.POLYGON_OFFSET_FACTOR, changeCommands: ["polygonOffset"] },
                    { constant: SPECTOR.WebGlConstants.POLYGON_OFFSET_UNITS, changeCommands: ["polygonOffset"] }];
            };
            PolygonOffsetState.prototype.isValidChangeCommand = function (command, stateName) {
                if (command.name === "enable" || command.name === "disable") {
                    return command.commandArguments[0] === SPECTOR.WebGlConstants.POLYGON_OFFSET_FILL.value;
                }
                return true;
            };
            PolygonOffsetState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            PolygonOffsetState.prototype.isStateEnable = function (stateName, args) {
                return this.context.isEnabled(SPECTOR.WebGlConstants.POLYGON_OFFSET_FILL.value);
            };
            PolygonOffsetState = __decorate([
                SPECTOR.Decorators.state("PolygonOffsetState")
            ], PolygonOffsetState);
            return PolygonOffsetState;
        }(States.ParameterState));
        States.PolygonOffsetState = PolygonOffsetState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var ScissorState = /** @class */ (function (_super) {
            __extends(ScissorState, _super);
            function ScissorState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ScissorState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.SCISSOR_TEST, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.SCISSOR_BOX, changeCommands: ["scissor"] }];
            };
            ScissorState.prototype.isValidChangeCommand = function (command, stateName) {
                if (command.name === "enable" || command.name === "disable") {
                    return command.commandArguments[0] === SPECTOR.WebGlConstants.SCISSOR_TEST.value;
                }
                return true;
            };
            ScissorState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            ScissorState.prototype.isStateEnable = function (stateName, args) {
                return this.context.isEnabled(SPECTOR.WebGlConstants.SCISSOR_TEST.value);
            };
            ScissorState = __decorate([
                SPECTOR.Decorators.state("ScissorState")
            ], ScissorState);
            return ScissorState;
        }(States.ParameterState));
        States.ScissorState = ScissorState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var StencilState = /** @class */ (function (_super) {
            __extends(StencilState, _super);
            function StencilState() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            StencilState_1 = StencilState;
            StencilState.prototype.getWebgl1Parameters = function () {
                return [{ constant: SPECTOR.WebGlConstants.STENCIL_TEST, changeCommands: ["enable", "disable"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_BACK_FAIL, returnType: 20 /* GlEnum */, changeCommands: ["stencilOp", "stencilOpSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_BACK_FUNC, returnType: 20 /* GlEnum */, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_BACK_PASS_DEPTH_FAIL, returnType: 20 /* GlEnum */, changeCommands: ["stencilOp", "stencilOpSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_BACK_PASS_DEPTH_PASS, returnType: 20 /* GlEnum */, changeCommands: ["stencilOp", "stencilOpSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_BACK_REF, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_BACK_VALUE_MASK, returnType: 30 /* GlUint */, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_BACK_WRITEMASK, returnType: 30 /* GlUint */, changeCommands: ["stencilMask", "stencilMaskSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_FAIL, returnType: 20 /* GlEnum */, changeCommands: ["stencilOp", "stencilOpSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_FUNC, returnType: 20 /* GlEnum */, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_PASS_DEPTH_FAIL, returnType: 20 /* GlEnum */, changeCommands: ["stencilOp", "stencilOpSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_PASS_DEPTH_PASS, returnType: 20 /* GlEnum */, changeCommands: ["stencilOp", "stencilOpSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_REF, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_VALUE_MASK, returnType: 30 /* GlUint */, changeCommands: ["stencilFunc", "stencilFuncSeparate"] },
                    { constant: SPECTOR.WebGlConstants.STENCIL_WRITEMASK, returnType: 30 /* GlUint */, changeCommands: ["stencilMask", "stencilMaskSeparate"] }];
            };
            StencilState.prototype.isValidChangeCommand = function (command, stateName) {
                if (command.name === "enable" || command.name === "disable") {
                    return command.commandArguments[0] === SPECTOR.WebGlConstants.STENCIL_TEST.value;
                }
                if (command.name === "stencilOp" || command.name === "stencilOpSeparate") {
                    return StencilState_1.stencilOpStates.indexOf(command.commandArguments[0]) > 0;
                }
                if (command.name === "stencilFunc" || command.name === "stencilFuncSeparate") {
                    return StencilState_1.stencilFuncStates.indexOf(command.commandArguments[0]) > 0;
                }
                if (command.name === "stencilMask" || command.name === "stencilMaskSeparate") {
                    return StencilState_1.stencilMaskStates.indexOf(command.commandArguments[0]) > 0;
                }
                return true;
            };
            StencilState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            StencilState.prototype.isStateEnable = function (stateName, args) {
                return this.context.isEnabled(SPECTOR.WebGlConstants.STENCIL_TEST.value);
            };
            StencilState.stencilOpStates = [SPECTOR.WebGlConstants.STENCIL_BACK_FAIL.value,
                SPECTOR.WebGlConstants.STENCIL_BACK_PASS_DEPTH_FAIL.value,
                SPECTOR.WebGlConstants.STENCIL_BACK_PASS_DEPTH_PASS.value,
                SPECTOR.WebGlConstants.STENCIL_FAIL.value,
                SPECTOR.WebGlConstants.STENCIL_PASS_DEPTH_FAIL.value,
                SPECTOR.WebGlConstants.STENCIL_PASS_DEPTH_PASS.value];
            StencilState.stencilFuncStates = [SPECTOR.WebGlConstants.STENCIL_BACK_FUNC.value,
                SPECTOR.WebGlConstants.STENCIL_BACK_REF.value,
                SPECTOR.WebGlConstants.STENCIL_BACK_VALUE_MASK.value,
                SPECTOR.WebGlConstants.STENCIL_FUNC.value,
                SPECTOR.WebGlConstants.STENCIL_REF.value,
                SPECTOR.WebGlConstants.STENCIL_VALUE_MASK.value];
            StencilState.stencilMaskStates = [SPECTOR.WebGlConstants.STENCIL_BACK_WRITEMASK.value,
                SPECTOR.WebGlConstants.STENCIL_WRITEMASK.value];
            StencilState = StencilState_1 = __decorate([
                SPECTOR.Decorators.state("StencilState")
            ], StencilState);
            return StencilState;
            var StencilState_1;
        }(States.ParameterState));
        States.StencilState = StencilState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var VisualState = /** @class */ (function (_super) {
            __extends(VisualState, _super);
            function VisualState(options, logger) {
                var _this = _super.call(this, options, logger) || this;
                _this.captureFrameBuffer = options.context.createFramebuffer();
                _this.workingCanvas = document.createElement("canvas");
                _this.workingContext2D = _this.workingCanvas.getContext("2d");
                _this.captureCanvas = document.createElement("canvas");
                _this.captureContext2D = _this.captureCanvas.getContext("2d");
                _this.captureContext2D.imageSmoothingEnabled = true;
                _this.captureContext2D.mozImageSmoothingEnabled = true;
                _this.captureContext2D.oImageSmoothingEnabled = true;
                _this.captureContext2D.webkitImageSmoothingEnabled = true;
                _this.captureContext2D.msImageSmoothingEnabled = true;
                return _this;
            }
            VisualState_1 = VisualState;
            VisualState.prototype.getConsumeCommands = function () {
                return ["clear", "clearBufferfv", "clearBufferiv", "clearBufferuiv", "clearBufferfi"].concat(States.drawCommands);
            };
            VisualState.prototype.readFromContext = function () {
                var gl = this.context;
                this.currentState["Attachments"] = [];
                // Check the framebuffer status.
                var frameBuffer = this.context.getParameter(SPECTOR.WebGlConstants.FRAMEBUFFER_BINDING.value);
                if (!frameBuffer) {
                    this.currentState["FrameBuffer"] = null;
                    // In case of the main canvas, we draw the entire screen instead of the viewport only.
                    // This will help for instance in VR use cases.
                    this.getCapture(gl, "Canvas COLOR_ATTACHMENT", 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, 0, 0, SPECTOR.WebGlConstants.UNSIGNED_BYTE.value);
                    return;
                }
                // Get FrameBuffer Viewport size to adapt the created screenshot.
                var viewport = gl.getParameter(gl.VIEWPORT);
                var x = viewport[0];
                var y = viewport[1];
                var width = viewport[2];
                var height = viewport[3];
                this.currentState["FrameBuffer"] = this.getSpectorData(frameBuffer);
                // Check FBO status.
                var status = this.context.checkFramebufferStatus(SPECTOR.WebGlConstants.FRAMEBUFFER.value);
                this.currentState["FrameBufferStatus"] = SPECTOR.WebGlConstantsByValue[status].name;
                if (status !== SPECTOR.WebGlConstants.FRAMEBUFFER_COMPLETE.value) {
                    return;
                }
                // Capture all the attachments.
                var drawBuffersExtension = this.extensions[SPECTOR.WebGlConstants.MAX_DRAW_BUFFERS_WEBGL.extensionName];
                if (drawBuffersExtension) {
                    var maxDrawBuffers = this.context.getParameter(SPECTOR.WebGlConstants.MAX_DRAW_BUFFERS_WEBGL.value);
                    for (var i = 0; i < maxDrawBuffers; i++) {
                        this.readFrameBufferAttachmentFromContext(this.context, frameBuffer, SPECTOR.WebGlConstantsByName["COLOR_ATTACHMENT" + i + "_WEBGL"], x, y, width, height);
                    }
                }
                else if (this.contextVersion > 1) {
                    var context2 = this.context;
                    var maxDrawBuffers = context2.getParameter(SPECTOR.WebGlConstants.MAX_DRAW_BUFFERS.value);
                    for (var i = 0; i < maxDrawBuffers; i++) {
                        this.readFrameBufferAttachmentFromContext(this.context, frameBuffer, SPECTOR.WebGlConstantsByName["COLOR_ATTACHMENT" + i], x, y, width, height);
                    }
                }
                else {
                    this.readFrameBufferAttachmentFromContext(this.context, frameBuffer, SPECTOR.WebGlConstantsByName["COLOR_ATTACHMENT0"], x, y, width, height);
                }
            };
            VisualState.prototype.readFrameBufferAttachmentFromContext = function (gl, frameBuffer, webglConstant, x, y, width, height) {
                var target = SPECTOR.WebGlConstants.FRAMEBUFFER.value;
                var type = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE.value);
                if (type === SPECTOR.WebGlConstants.NONE.value) {
                    return;
                }
                var storage = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME.value);
                if (!storage) {
                    return;
                }
                var componentType = this.contextVersion > 1 ?
                    this.context.getFramebufferAttachmentParameter(target, webglConstant.value, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE.value) :
                    SPECTOR.WebGlConstants.UNSIGNED_BYTE.value;
                if (type === SPECTOR.WebGlConstants.RENDERBUFFER.value) {
                    this.readFrameBufferAttachmentFromRenderBuffer(gl, frameBuffer, webglConstant, x, y, width, height, target, componentType, storage);
                }
                else if (type === SPECTOR.WebGlConstants.TEXTURE.value) {
                    this.readFrameBufferAttachmentFromTexture(gl, frameBuffer, webglConstant, x, y, width, height, target, componentType, storage);
                }
            };
            VisualState.prototype.readFrameBufferAttachmentFromRenderBuffer = function (gl, frameBuffer, webglConstant, x, y, width, height, target, componentType, storage) {
                var samples = 0;
                var internalFormat = 0;
                if (storage.__SPECTOR_Object_CustomData) {
                    var info = storage.__SPECTOR_Object_CustomData;
                    width = info.width;
                    height = info.height;
                    samples = info.samples;
                    internalFormat = info.internalFormat;
                    if (!samples && !SPECTOR.ReadPixelsHelper.isSupportedCombination(componentType, SPECTOR.WebGlConstants.RGBA.value, internalFormat)) {
                        return;
                    }
                }
                if (samples) {
                    var gl2 = gl; // Samples only available in WebGL 2.
                    var renderBuffer = gl.createRenderbuffer();
                    var boundRenderBuffer = gl.getParameter(gl.RENDERBUFFER_BINDING);
                    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);
                    gl.renderbufferStorage(gl.RENDERBUFFER, internalFormat, width, height);
                    gl.bindRenderbuffer(gl.RENDERBUFFER, boundRenderBuffer);
                    gl.bindFramebuffer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, this.captureFrameBuffer);
                    gl.framebufferRenderbuffer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, SPECTOR.WebGlConstants.COLOR_ATTACHMENT0.value, SPECTOR.WebGlConstants.RENDERBUFFER.value, renderBuffer);
                    var readFrameBuffer = gl2.getParameter(gl2.READ_FRAMEBUFFER_BINDING);
                    var drawFrameBuffer = gl2.getParameter(gl2.DRAW_FRAMEBUFFER_BINDING);
                    gl2.bindFramebuffer(gl2.READ_FRAMEBUFFER, frameBuffer);
                    gl2.bindFramebuffer(gl2.DRAW_FRAMEBUFFER, this.captureFrameBuffer);
                    gl2.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
                    gl2.bindFramebuffer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, this.captureFrameBuffer);
                    gl2.bindFramebuffer(gl2.READ_FRAMEBUFFER, readFrameBuffer);
                    gl2.bindFramebuffer(gl2.DRAW_FRAMEBUFFER, drawFrameBuffer);
                    var status_1 = this.context.checkFramebufferStatus(SPECTOR.WebGlConstants.FRAMEBUFFER.value);
                    if (status_1 === SPECTOR.WebGlConstants.FRAMEBUFFER_COMPLETE.value) {
                        this.getCapture(gl, webglConstant.name, x, y, width, height, 0, 0, SPECTOR.WebGlConstants.UNSIGNED_BYTE.value);
                    }
                    gl.bindFramebuffer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, frameBuffer);
                    gl.deleteRenderbuffer(renderBuffer);
                }
                else {
                    gl.bindFramebuffer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, this.captureFrameBuffer);
                    gl.framebufferRenderbuffer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, SPECTOR.WebGlConstants.COLOR_ATTACHMENT0.value, SPECTOR.WebGlConstants.RENDERBUFFER.value, storage);
                    var status_2 = this.context.checkFramebufferStatus(SPECTOR.WebGlConstants.FRAMEBUFFER.value);
                    if (status_2 === SPECTOR.WebGlConstants.FRAMEBUFFER_COMPLETE.value) {
                        this.getCapture(gl, webglConstant.name, x, y, width, height, 0, 0, componentType);
                    }
                    gl.bindFramebuffer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, frameBuffer);
                }
            };
            VisualState.prototype.readFrameBufferAttachmentFromTexture = function (gl, frameBuffer, webglConstant, x, y, width, height, target, componentType, storage) {
                var textureLayer = 0;
                if (this.contextVersion > 1) {
                    textureLayer = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER.value);
                }
                var textureLevel = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL.value);
                var textureCubeMapFace = this.context.getFramebufferAttachmentParameter(target, webglConstant.value, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE.value);
                var textureCubeMapFaceName = textureCubeMapFace > 0 ? SPECTOR.WebGlConstantsByValue[textureCubeMapFace].name : SPECTOR.WebGlConstants.TEXTURE_2D.name;
                // Adapt to constraints defines in the custom data if any.
                var textureType = componentType;
                if (storage.__SPECTOR_Object_CustomData) {
                    var info = storage.__SPECTOR_Object_CustomData;
                    width = info.width;
                    height = info.height;
                    textureType = info.type;
                    if (!SPECTOR.ReadPixelsHelper.isSupportedCombination(info.type, info.format, info.internalFormat)) {
                        return;
                    }
                }
                gl.bindFramebuffer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, this.captureFrameBuffer);
                if (textureLayer === 0) {
                    gl.framebufferTexture2D(SPECTOR.WebGlConstants.FRAMEBUFFER.value, SPECTOR.WebGlConstants.COLOR_ATTACHMENT0.value, textureCubeMapFace ? textureCubeMapFace : SPECTOR.WebGlConstants.TEXTURE_2D.value, storage, textureLevel);
                }
                else {
                    gl.framebufferTextureLayer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, SPECTOR.WebGlConstants.COLOR_ATTACHMENT0.value, storage, textureLevel, textureLayer);
                }
                var status = this.context.checkFramebufferStatus(SPECTOR.WebGlConstants.FRAMEBUFFER.value);
                if (status === SPECTOR.WebGlConstants.FRAMEBUFFER_COMPLETE.value) {
                    this.getCapture(gl, webglConstant.name, x, y, width, height, textureCubeMapFace, textureLayer, textureType);
                }
                gl.bindFramebuffer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, frameBuffer);
            };
            VisualState.prototype.getCapture = function (gl, name, x, y, width, height, textureCubeMapFace, textureLayer, type) {
                var attachmentVisualState = {
                    attachmentName: name,
                    src: null,
                    textureCubeMapFace: textureCubeMapFace ? SPECTOR.WebGlConstantsByValue[textureCubeMapFace].name : null,
                    textureLayer: textureLayer,
                };
                if (!this.quickCapture) {
                    try {
                        // Read the pixels from the context.
                        var pixels = SPECTOR.ReadPixelsHelper.readPixels(gl, x, y, width, height, type);
                        if (pixels) {
                            // Copy the pixels to a working 2D canvas same size.
                            this.workingCanvas.width = width;
                            this.workingCanvas.height = height;
                            var imageData = this.workingContext2D.createImageData(Math.ceil(width), Math.ceil(height));
                            imageData.data.set(pixels);
                            this.workingContext2D.putImageData(imageData, 0, 0);
                            // Copy the pixels to a resized capture 2D canvas.
                            var imageAspectRatio = width / height;
                            if (imageAspectRatio < 1) {
                                this.captureCanvas.width = VisualState_1.captureBaseSize * imageAspectRatio;
                                this.captureCanvas.height = VisualState_1.captureBaseSize;
                            }
                            else if (imageAspectRatio > 1) {
                                this.captureCanvas.width = VisualState_1.captureBaseSize;
                                this.captureCanvas.height = VisualState_1.captureBaseSize / imageAspectRatio;
                            }
                            else {
                                this.captureCanvas.width = VisualState_1.captureBaseSize;
                                this.captureCanvas.height = VisualState_1.captureBaseSize;
                            }
                            this.captureCanvas.width = Math.max(this.captureCanvas.width, 1);
                            this.captureCanvas.height = Math.max(this.captureCanvas.height, 1);
                            // Scale and draw to flip Y to reorient readPixels.
                            this.captureContext2D.globalCompositeOperation = "copy";
                            this.captureContext2D.scale(1, -1); // Y flip
                            this.captureContext2D.translate(0, -this.captureCanvas.height); // so we can draw at 0,0
                            this.captureContext2D.drawImage(this.workingCanvas, 0, 0, width, height, 0, 0, this.captureCanvas.width, this.captureCanvas.height);
                            this.captureContext2D.setTransform(1, 0, 0, 1, 0, 0);
                            this.captureContext2D.globalCompositeOperation = "source-over";
                            // get the screen capture
                            attachmentVisualState.src = this.captureCanvas.toDataURL();
                        }
                    }
                    catch (e) {
                        // Do nothing in case of error at this level.
                        this.logger.warn("Spector can not capture the visual state: " + e);
                    }
                }
                this.currentState["Attachments"].push(attachmentVisualState);
            };
            VisualState.prototype.analyse = function (consumeCommand) {
                // Nothing to analyse on visual state.
            };
            VisualState.captureBaseSize = 256;
            VisualState = VisualState_1 = __decorate([
                SPECTOR.Decorators.state("VisualState")
            ], VisualState);
            return VisualState;
            var VisualState_1;
        }(States.BaseState));
        States.VisualState = VisualState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var DrawCallState = /** @class */ (function (_super) {
            __extends(DrawCallState, _super);
            function DrawCallState(options, logger) {
                var _this = _super.call(this, options, logger) || this;
                _this.drawCallTextureInputState = new States.DrawCallTextureInputState(options, logger);
                _this.drawCallUboInputState = new States.DrawCallUboInputState(options, logger);
                return _this;
            }
            DrawCallState_1 = DrawCallState;
            Object.defineProperty(DrawCallState.prototype, "requireStartAndStopStates", {
                get: function () {
                    return false;
                },
                enumerable: true,
                configurable: true
            });
            DrawCallState.prototype.getConsumeCommands = function () {
                return States.drawCommands;
            };
            DrawCallState.prototype.getChangeCommandsByState = function () {
                return {};
            };
            DrawCallState.prototype.readFromContext = function () {
                var program = this.context.getParameter(SPECTOR.WebGlConstants.CURRENT_PROGRAM.value);
                if (!program) {
                    return;
                }
                this.currentState.frameBuffer = this.readFrameBufferFromContext();
                this.currentState.programStatus = {
                    program: this.getSpectorData(program),
                    DELETE_STATUS: this.context.getProgramParameter(program, SPECTOR.WebGlConstants.DELETE_STATUS.value),
                    LINK_STATUS: this.context.getProgramParameter(program, SPECTOR.WebGlConstants.LINK_STATUS.value),
                    VALIDATE_STATUS: this.context.getProgramParameter(program, SPECTOR.WebGlConstants.VALIDATE_STATUS.value),
                    RECOMPILABLE: SPECTOR.ProgramRecompilerHelper.isBuildableProgram(program),
                };
                if (this.currentState.programStatus.RECOMPILABLE) {
                    SPECTOR.WebGlObjects.Program.saveInGlobalStore(program);
                }
                var shaders = this.context.getAttachedShaders(program);
                this.currentState.shaders = [];
                for (var _i = 0, shaders_1 = shaders; _i < shaders_1.length; _i++) {
                    var shader = shaders_1[_i];
                    var shaderState = this.readShaderFromContext(shader);
                    this.currentState.shaders.push(shaderState);
                }
                var attributes = this.context.getProgramParameter(program, SPECTOR.WebGlConstants.ACTIVE_ATTRIBUTES.value);
                this.currentState.attributes = [];
                for (var i = 0; i < attributes; i++) {
                    var attributeState = this.readAttributeFromContext(program, i);
                    this.currentState.attributes.push(attributeState);
                }
                var uniforms = this.context.getProgramParameter(program, SPECTOR.WebGlConstants.ACTIVE_UNIFORMS.value);
                this.currentState.uniforms = [];
                var uniformIndices = [];
                for (var i = 0; i < uniforms; i++) {
                    uniformIndices.push(i);
                    var uniformState = this.readUniformFromContext(program, i);
                    this.currentState.uniforms.push(uniformState);
                }
                if (this.contextVersion > 1) {
                    this.readUniformsFromContextIntoState(program, uniformIndices, this.currentState.uniforms);
                    var uniformBlocks = this.context.getProgramParameter(program, SPECTOR.WebGlConstants.ACTIVE_UNIFORM_BLOCKS.value);
                    this.currentState.uniformBlocks = [];
                    for (var i = 0; i < uniformBlocks; i++) {
                        var uniformBlockState = this.readUniformBlockFromContext(program, i);
                        this.currentState.uniformBlocks.push(uniformBlockState);
                    }
                    var transformFeedbackActive = this.context.getParameter(SPECTOR.WebGlConstants.TRANSFORM_FEEDBACK_ACTIVE.value);
                    if (transformFeedbackActive) {
                        var transformFeedbackModeValue = this.context.getProgramParameter(program, SPECTOR.WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_MODE.value);
                        this.currentState.transformFeedbackMode = this.getWebGlConstant(transformFeedbackModeValue);
                        this.currentState.transformFeedbacks = [];
                        var transformFeedbacks = this.context.getProgramParameter(program, SPECTOR.WebGlConstants.TRANSFORM_FEEDBACK_VARYINGS.value);
                        for (var i = 0; i < transformFeedbacks; i++) {
                            var transformFeedbackState = this.readTransformFeedbackFromContext(program, i);
                            this.currentState.transformFeedbacks.push(transformFeedbackState);
                        }
                    }
                }
                // Insert texture state at the end of the uniform datas.
                for (var i = 0; i < uniformIndices.length; i++) {
                    var uniformState = this.currentState.uniforms[i];
                    if (uniformState.value !== null && uniformState.value !== undefined) {
                        var textureTarget = DrawCallState_1.samplerTypes[uniformState.typeValue];
                        if (textureTarget) {
                            if (uniformState.value.length) {
                                uniformState.textures = [];
                                for (var j = 0; j < uniformState.value.length; j++) {
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
            };
            DrawCallState.prototype.readFrameBufferFromContext = function () {
                var frameBuffer = this.context.getParameter(SPECTOR.WebGlConstants.FRAMEBUFFER_BINDING.value);
                if (!frameBuffer) {
                    return null;
                }
                var frameBufferState = {};
                frameBufferState.frameBuffer = this.getSpectorData(frameBuffer);
                var depthAttachment = this.readFrameBufferAttachmentFromContext(SPECTOR.WebGlConstants.DEPTH_ATTACHMENT.value);
                if (depthAttachment) {
                    frameBufferState.depthAttachment = this.readFrameBufferAttachmentFromContext(SPECTOR.WebGlConstants.DEPTH_ATTACHMENT.value);
                }
                var stencilAttachment = this.readFrameBufferAttachmentFromContext(SPECTOR.WebGlConstants.STENCIL_ATTACHMENT.value);
                if (stencilAttachment) {
                    frameBufferState.stencilAttachment = this.readFrameBufferAttachmentFromContext(SPECTOR.WebGlConstants.STENCIL_ATTACHMENT.value);
                }
                var drawBuffersExtension = this.extensions[SPECTOR.WebGlConstants.MAX_DRAW_BUFFERS_WEBGL.extensionName];
                if (drawBuffersExtension) {
                    frameBufferState.colorAttachments = [];
                    var maxDrawBuffers = this.context.getParameter(SPECTOR.WebGlConstants.MAX_DRAW_BUFFERS_WEBGL.value);
                    for (var i = 0; i < maxDrawBuffers; i++) {
                        var attachment = this.readFrameBufferAttachmentFromContext(SPECTOR.WebGlConstantsByName["COLOR_ATTACHMENT" + i + "_WEBGL"].value);
                        if (attachment) {
                            frameBufferState.colorAttachments.push(attachment);
                        }
                    }
                }
                else if (this.contextVersion > 1) {
                    var context2 = this.context;
                    // Already covered ny the introspection of depth and stencil.
                    // frameBufferState.depthStencilAttachment = this.readFrameBufferAttachmentFromContext(WebGlConstants.DEPTH_STENCIL_ATTACHMENT.value);
                    frameBufferState.colorAttachments = [];
                    var maxDrawBuffers = context2.getParameter(SPECTOR.WebGlConstants.MAX_DRAW_BUFFERS.value);
                    for (var i = 0; i < maxDrawBuffers; i++) {
                        var attachment = this.readFrameBufferAttachmentFromContext(SPECTOR.WebGlConstantsByName["COLOR_ATTACHMENT" + i].value);
                        if (attachment) {
                            frameBufferState.colorAttachments.push(attachment);
                        }
                    }
                }
                else {
                    var attachment = this.readFrameBufferAttachmentFromContext(SPECTOR.WebGlConstantsByName["COLOR_ATTACHMENT0"].value);
                    if (attachment) {
                        frameBufferState.colorAttachments = [attachment];
                    }
                }
                return frameBufferState;
            };
            DrawCallState.prototype.readFrameBufferAttachmentFromContext = function (attachment) {
                var target = SPECTOR.WebGlConstants.FRAMEBUFFER.value;
                var type = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE.value);
                if (type === SPECTOR.WebGlConstants.NONE.value) {
                    return undefined;
                }
                var attachmentState = {};
                var storage = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME.value);
                if (type === SPECTOR.WebGlConstants.RENDERBUFFER.value) {
                    attachmentState.type = "RENDERBUFFER";
                    attachmentState.buffer = this.getSpectorData(storage);
                    // Check for custom data.
                    if (storage) {
                        var customData = storage.__SPECTOR_Object_CustomData;
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
                else if (type === SPECTOR.WebGlConstants.TEXTURE.value) {
                    attachmentState.type = "TEXTURE";
                    attachmentState.texture = this.getSpectorData(storage);
                    attachmentState.textureLevel = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL.value);
                    var cubeMapFace = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE.value);
                    attachmentState.textureCubeMapFace = this.getWebGlConstant(cubeMapFace);
                    this.drawCallTextureInputState.appendTextureState(attachmentState, storage);
                }
                if (this.extensions["EXT_sRGB"]) {
                    attachmentState.encoding = this.getWebGlConstant(this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING_EXT.value));
                }
                if (this.contextVersion > 1) {
                    attachmentState.alphaSize = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_ALPHA_SIZE.value);
                    attachmentState.blueSize = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_BLUE_SIZE.value);
                    attachmentState.encoding = this.getWebGlConstant(this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING.value));
                    attachmentState.componentType = this.getWebGlConstant(this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_COMPONENT_TYPE.value));
                    attachmentState.depthSize = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_DEPTH_SIZE.value);
                    attachmentState.greenSize = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_GREEN_SIZE.value);
                    attachmentState.redSize = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_RED_SIZE.value);
                    attachmentState.stencilSize = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_STENCIL_SIZE.value);
                    if (type === SPECTOR.WebGlConstants.TEXTURE.value) {
                        attachmentState.textureLayer = this.context.getFramebufferAttachmentParameter(target, attachment, SPECTOR.WebGlConstants.FRAMEBUFFER_ATTACHMENT_TEXTURE_LAYER.value);
                    }
                }
                return attachmentState;
            };
            DrawCallState.prototype.readShaderFromContext = function (shader) {
                var source = this.context.getShaderSource(shader);
                var spectorData = this.getSpectorData(shader);
                var nameInMetadata = (shader && shader.__SPECTOR_Metadata && shader.__SPECTOR_Metadata.name);
                var name = nameInMetadata ? shader.__SPECTOR_Metadata.name :
                    this.readNameFromShaderSource(source);
                if (!name) {
                    name = (this.context.getShaderParameter(shader, SPECTOR.WebGlConstants.SHADER_TYPE.value) === SPECTOR.WebGlConstants.FRAGMENT_SHADER.value) ?
                        "Fragment" : "Vertex";
                }
                return {
                    shader: spectorData,
                    COMPILE_STATUS: this.context.getShaderParameter(shader, SPECTOR.WebGlConstants.COMPILE_STATUS.value),
                    DELETE_STATUS: this.context.getShaderParameter(shader, SPECTOR.WebGlConstants.DELETE_STATUS.value),
                    SHADER_TYPE: this.getWebGlConstant(this.context.getShaderParameter(shader, SPECTOR.WebGlConstants.SHADER_TYPE.value)),
                    source: source,
                    name: name,
                };
            };
            DrawCallState.prototype.readAttributeFromContext = function (program, activeAttributeIndex) {
                var info = this.context.getActiveAttrib(program, activeAttributeIndex);
                var location = this.context.getAttribLocation(program, info.name);
                if (location === -1) {
                    return {
                        name: info.name,
                        size: info.size,
                        type: this.getWebGlConstant(info.type),
                        location: -1,
                    };
                }
                var unbufferedValue = this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.CURRENT_VERTEX_ATTRIB.value);
                var boundBuffer = this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING.value);
                var attributeState = {
                    name: info.name,
                    size: info.size,
                    type: this.getWebGlConstant(info.type),
                    location: location,
                    offsetPointer: this.context.getVertexAttribOffset(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_POINTER.value),
                    bufferBinding: this.getSpectorData(boundBuffer),
                    enabled: this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_ENABLED.value),
                    arraySize: this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_SIZE.value),
                    stride: this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_STRIDE.value),
                    arrayType: this.getWebGlConstant(this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_TYPE.value)),
                    normalized: this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_NORMALIZED.value),
                    vertexAttrib: Array.prototype.slice.call(unbufferedValue),
                };
                if (this.extensions[SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE.extensionName]) {
                    attributeState.divisor = this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE.value);
                }
                else if (this.contextVersion > 1) {
                    attributeState.integer = this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_INTEGER.value);
                    attributeState.divisor = this.context.getVertexAttrib(location, SPECTOR.WebGlConstants.VERTEX_ATTRIB_ARRAY_DIVISOR.value);
                }
                this.appendBufferCustomData(attributeState, boundBuffer);
                return attributeState;
            };
            DrawCallState.prototype.readUniformFromContext = function (program, activeUniformIndex) {
                var info = this.context.getActiveUniform(program, activeUniformIndex);
                var location = this.context.getUniformLocation(program, info.name);
                if (location) {
                    if (info.size > 1 && info.name && info.name.indexOf("[0]") === info.name.length - 3) {
                        var values = [];
                        for (var i = 0; i < info.size; i++) {
                            var locationInArray = this.context.getUniformLocation(program, info.name.replace("[0]", "[" + i + "]"));
                            if (locationInArray) {
                                var value = this.context.getUniform(program, locationInArray);
                                if (value.length) {
                                    value = Array.prototype.slice.call(value);
                                }
                                values.push({ value: value });
                            }
                        }
                        var uniformState = {
                            name: info.name.replace("[0]", ""),
                            size: info.size,
                            type: this.getWebGlConstant(info.type),
                            typeValue: info.type,
                            location: this.getSpectorData(location),
                            values: values,
                        };
                        return uniformState;
                    }
                    else {
                        var value = this.context.getUniform(program, location);
                        if (value.length) {
                            value = Array.prototype.slice.call(value);
                        }
                        var uniformState = {
                            name: info.name,
                            size: info.size,
                            type: this.getWebGlConstant(info.type),
                            typeValue: info.type,
                            location: this.getSpectorData(location),
                            value: value,
                        };
                        return uniformState;
                    }
                }
                else {
                    var uniformState = {
                        name: info.name,
                        size: info.size,
                        type: this.getWebGlConstant(info.type),
                        typeValue: info.type,
                    };
                    return uniformState;
                }
            };
            DrawCallState.prototype.readTextureFromContext = function (textureUnit, target) {
                var activeTexture = this.context.getParameter(SPECTOR.WebGlConstants.ACTIVE_TEXTURE.value);
                this.context.activeTexture(SPECTOR.WebGlConstants.TEXTURE0.value + textureUnit);
                var textureState = {
                    magFilter: this.getWebGlConstant(this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_MAG_FILTER.value)),
                    minFilter: this.getWebGlConstant(this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_MIN_FILTER.value)),
                    wrapS: this.getWebGlConstant(this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_WRAP_S.value)),
                    wrapT: this.getWebGlConstant(this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_WRAP_T.value)),
                };
                if (this.extensions[SPECTOR.WebGlConstants.TEXTURE_MAX_ANISOTROPY_EXT.extensionName]) {
                    textureState.anisotropy = this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_MAX_ANISOTROPY_EXT.value);
                }
                if (this.contextVersion > 1) {
                    textureState.baseLevel = this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_BASE_LEVEL.value);
                    textureState.immutable = this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_FORMAT.value);
                    textureState.immutableLevels = this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
                    textureState.maxLevel = this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
                    var sampler = this.context.getParameter(SPECTOR.WebGlConstants.SAMPLER_BINDING.value);
                    if (sampler) {
                        textureState.sampler = this.getSpectorData(sampler);
                        var context2 = this.context;
                        textureState.samplerMaxLod = context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
                        textureState.samplerMinLod = context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
                        textureState.samplerCompareFunc = this.getWebGlConstant(context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_COMPARE_FUNC.value));
                        textureState.samplerCompareMode = this.getWebGlConstant(context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_COMPARE_MODE.value));
                        textureState.samplerWrapS = this.getWebGlConstant(context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_WRAP_S.value));
                        textureState.samplerWrapT = this.getWebGlConstant(context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_WRAP_T.value));
                        textureState.samplerWrapR = this.getWebGlConstant(context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value));
                        textureState.samplerMagFilter = this.getWebGlConstant(context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_MAG_FILTER.value));
                        textureState.samplerMinFilter = this.getWebGlConstant(context2.getSamplerParameter(sampler, SPECTOR.WebGlConstants.TEXTURE_MIN_FILTER.value));
                    }
                    else {
                        textureState.maxLod = this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
                        textureState.minLod = this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value);
                        textureState.compareFunc = this.getWebGlConstant(this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_COMPARE_FUNC.value));
                        textureState.compareMode = this.getWebGlConstant(this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_COMPARE_MODE.value));
                        textureState.wrapR = this.getWebGlConstant(this.context.getTexParameter(target.value, SPECTOR.WebGlConstants.TEXTURE_IMMUTABLE_LEVELS.value));
                    }
                }
                var storage = this.getTextureStorage(target);
                if (storage) {
                    // Null will prevent the visual target to be captured.
                    var textureStateTarget = this.quickCapture ? null : target;
                    this.drawCallTextureInputState.appendTextureState(textureState, storage, textureStateTarget);
                }
                this.context.activeTexture(activeTexture);
                return textureState;
            };
            DrawCallState.prototype.getTextureStorage = function (target) {
                if (target === SPECTOR.WebGlConstants.TEXTURE_2D) {
                    return this.context.getParameter(SPECTOR.WebGlConstants.TEXTURE_BINDING_2D.value);
                }
                else if (target === SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP) {
                    return this.context.getParameter(SPECTOR.WebGlConstants.TEXTURE_BINDING_CUBE_MAP.value);
                }
                else if (target === SPECTOR.WebGlConstants.TEXTURE_3D) {
                    return this.context.getParameter(SPECTOR.WebGlConstants.TEXTURE_BINDING_3D.value);
                }
                else if (target === SPECTOR.WebGlConstants.TEXTURE_2D_ARRAY) {
                    return this.context.getParameter(SPECTOR.WebGlConstants.TEXTURE_BINDING_2D_ARRAY.value);
                }
                return undefined;
            };
            DrawCallState.prototype.readUniformsFromContextIntoState = function (program, uniformIndices, uniformsState) {
                var context2 = this.context;
                var typeValues = context2.getActiveUniforms(program, uniformIndices, SPECTOR.WebGlConstants.UNIFORM_TYPE.value);
                var sizes = context2.getActiveUniforms(program, uniformIndices, SPECTOR.WebGlConstants.UNIFORM_SIZE.value);
                var blockIndices = context2.getActiveUniforms(program, uniformIndices, SPECTOR.WebGlConstants.UNIFORM_BLOCK_INDEX.value);
                var offsets = context2.getActiveUniforms(program, uniformIndices, SPECTOR.WebGlConstants.UNIFORM_OFFSET.value);
                var arrayStrides = context2.getActiveUniforms(program, uniformIndices, SPECTOR.WebGlConstants.UNIFORM_ARRAY_STRIDE.value);
                var matrixStrides = context2.getActiveUniforms(program, uniformIndices, SPECTOR.WebGlConstants.UNIFORM_MATRIX_STRIDE.value);
                var rowMajors = context2.getActiveUniforms(program, uniformIndices, SPECTOR.WebGlConstants.UNIFORM_IS_ROW_MAJOR.value);
                for (var i = 0; i < uniformIndices.length; i++) {
                    var uniformState = uniformsState[i];
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
                        uniformState.value = this.drawCallUboInputState.getUboValue(blockIndices[i], uniformState.offset, uniformState.size, typeValues[i]);
                    }
                }
            };
            DrawCallState.prototype.readTransformFeedbackFromContext = function (program, index) {
                var context2 = this.context;
                var info = context2.getTransformFeedbackVarying(program, index);
                var boundBuffer = context2.getIndexedParameter(SPECTOR.WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_BINDING.value, index);
                var transformFeedbackState = {
                    name: info.name,
                    size: info.size,
                    type: this.getWebGlConstant(info.type),
                    buffer: this.getSpectorData(boundBuffer),
                    bufferSize: context2.getIndexedParameter(SPECTOR.WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_SIZE.value, index),
                    bufferStart: context2.getIndexedParameter(SPECTOR.WebGlConstants.TRANSFORM_FEEDBACK_BUFFER_START.value, index),
                };
                this.appendBufferCustomData(transformFeedbackState, boundBuffer);
                return transformFeedbackState;
            };
            DrawCallState.prototype.readUniformBlockFromContext = function (program, index) {
                var context2 = this.context;
                var bindingPoint = context2.getActiveUniformBlockParameter(program, index, SPECTOR.WebGlConstants.UNIFORM_BLOCK_BINDING.value);
                var boundBuffer = context2.getIndexedParameter(SPECTOR.WebGlConstants.UNIFORM_BUFFER_BINDING.value, bindingPoint);
                var uniformBlockState = {
                    name: context2.getActiveUniformBlockName(program, index),
                    bindingPoint: bindingPoint,
                    size: context2.getActiveUniformBlockParameter(program, index, SPECTOR.WebGlConstants.UNIFORM_BLOCK_DATA_SIZE.value),
                    activeUniformCount: context2.getActiveUniformBlockParameter(program, index, SPECTOR.WebGlConstants.UNIFORM_BLOCK_ACTIVE_UNIFORMS.value),
                    vertex: context2.getActiveUniformBlockParameter(program, index, SPECTOR.WebGlConstants.UNIFORM_BLOCK_REFERENCED_BY_VERTEX_SHADER.value),
                    fragment: context2.getActiveUniformBlockParameter(program, index, SPECTOR.WebGlConstants.UNIFORM_BLOCK_REFERENCED_BY_FRAGMENT_SHADER.value),
                    buffer: this.getSpectorData(boundBuffer),
                };
                this.appendBufferCustomData(uniformBlockState, boundBuffer);
                return uniformBlockState;
            };
            DrawCallState.prototype.appendBufferCustomData = function (state, buffer) {
                if (buffer) {
                    // Check for custom data.
                    var customData = buffer.__SPECTOR_Object_CustomData;
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
            };
            DrawCallState.prototype.getWebGlConstant = function (value) {
                var constant = SPECTOR.WebGlConstantsByValue[value];
                return constant ? constant.name : value;
            };
            // Thx to https://github.com/spite/ShaderEditorExtension/blob/7b9483fdf5c417573906bae4139ca8bc7b8a49ca/src/panel.js#L689
            // This helps displaying SHADER_NAME used in the extension.
            DrawCallState.prototype.readNameFromShaderSource = function (source) {
                try {
                    var name_3 = "";
                    var match = void 0;
                    var shaderNameRegex = /#define[\s]+SHADER_NAME[\s]+([\S]+)(\n|$)/gi;
                    match = shaderNameRegex.exec(source);
                    if (match !== null) {
                        if (match.index === shaderNameRegex.lastIndex) {
                            shaderNameRegex.lastIndex++;
                        }
                        name_3 = match[1];
                    }
                    if (name_3 === "") {
                        // #define SHADER_NAME_B64 44K344Kn44O844OA44O8
                        // #define SHADER_NAME_B64 8J+YjvCfmIE=
                        var shaderName64Regex = /#define[\s]+SHADER_NAME_B64[\s]+([\S]+)(\n|$)/gi;
                        match = shaderName64Regex.exec(source);
                        if (match !== null) {
                            if (match.index === shaderName64Regex.lastIndex) {
                                shaderName64Regex.lastIndex++;
                            }
                            name_3 = match[1];
                        }
                        if (name_3) {
                            name_3 = decodeURIComponent(atob(name_3));
                        }
                    }
                    return name_3;
                }
                catch (e) {
                    return null;
                }
            };
            DrawCallState.samplerTypes = (_a = {},
                _a[SPECTOR.WebGlConstants.SAMPLER_2D.value] = SPECTOR.WebGlConstants.TEXTURE_2D,
                _a[SPECTOR.WebGlConstants.SAMPLER_CUBE.value] = SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP,
                _a[SPECTOR.WebGlConstants.SAMPLER_3D.value] = SPECTOR.WebGlConstants.TEXTURE_3D,
                _a[SPECTOR.WebGlConstants.SAMPLER_2D_SHADOW.value] = SPECTOR.WebGlConstants.TEXTURE_2D,
                _a[SPECTOR.WebGlConstants.SAMPLER_2D_ARRAY.value] = SPECTOR.WebGlConstants.TEXTURE_2D_ARRAY,
                _a[SPECTOR.WebGlConstants.SAMPLER_2D_ARRAY_SHADOW.value] = SPECTOR.WebGlConstants.TEXTURE_2D_ARRAY,
                _a[SPECTOR.WebGlConstants.SAMPLER_CUBE_SHADOW.value] = SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP,
                _a[SPECTOR.WebGlConstants.INT_SAMPLER_2D.value] = SPECTOR.WebGlConstants.TEXTURE_2D,
                _a[SPECTOR.WebGlConstants.INT_SAMPLER_3D.value] = SPECTOR.WebGlConstants.TEXTURE_3D,
                _a[SPECTOR.WebGlConstants.INT_SAMPLER_CUBE.value] = SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP,
                _a[SPECTOR.WebGlConstants.INT_SAMPLER_2D_ARRAY.value] = SPECTOR.WebGlConstants.TEXTURE_2D_ARRAY,
                _a[SPECTOR.WebGlConstants.UNSIGNED_INT_SAMPLER_2D.value] = SPECTOR.WebGlConstants.TEXTURE_2D,
                _a[SPECTOR.WebGlConstants.UNSIGNED_INT_SAMPLER_3D.value] = SPECTOR.WebGlConstants.TEXTURE_3D,
                _a[SPECTOR.WebGlConstants.UNSIGNED_INT_SAMPLER_CUBE.value] = SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP,
                _a[SPECTOR.WebGlConstants.UNSIGNED_INT_SAMPLER_2D_ARRAY.value] = SPECTOR.WebGlConstants.TEXTURE_2D_ARRAY,
                _a);
            DrawCallState = DrawCallState_1 = __decorate([
                SPECTOR.Decorators.state("DrawCall")
            ], DrawCallState);
            return DrawCallState;
            var DrawCallState_1;
        }(States.BaseState));
        States.DrawCallState = DrawCallState;
        var _a;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var DrawCallTextureInputState = /** @class */ (function () {
            function DrawCallTextureInputState(options, logger) {
                this.logger = logger;
                this.context = options.context;
                this.captureFrameBuffer = options.context.createFramebuffer();
                this.workingCanvas = document.createElement("canvas");
                this.workingContext2D = this.workingCanvas.getContext("2d");
                this.captureCanvas = document.createElement("canvas");
                this.captureContext2D = this.captureCanvas.getContext("2d");
                this.captureContext2D.imageSmoothingEnabled = true;
                this.captureContext2D.mozImageSmoothingEnabled = true;
                this.captureContext2D.oImageSmoothingEnabled = true;
                this.captureContext2D.webkitImageSmoothingEnabled = true;
                this.captureContext2D.msImageSmoothingEnabled = true;
            }
            DrawCallTextureInputState.prototype.appendTextureState = function (state, storage, target) {
                if (target === void 0) { target = null; }
                if (!storage) {
                    return;
                }
                // Check for custom data.
                var customData = storage.__SPECTOR_Object_CustomData;
                if (!customData) {
                    return;
                }
                if (customData.type) {
                    state.textureType = this.getWebGlConstant(customData.type);
                }
                if (customData.format) {
                    state.format = this.getWebGlConstant(customData.format);
                }
                if (customData.internalFormat) {
                    state.internalFormat = this.getWebGlConstant(customData.internalFormat);
                }
                state.width = customData.width;
                state.height = customData.height;
                if (customData.depth) {
                    state.depth = customData.depth;
                }
                if (target) {
                    state.visual = this.getTextureVisualState(target, storage, customData);
                }
            };
            DrawCallTextureInputState.prototype.getTextureVisualState = function (target, storage, info) {
                try {
                    var gl = this.context;
                    var visual = {};
                    if (!SPECTOR.ReadPixelsHelper.isSupportedCombination(info.type, info.format, info.internalFormat)) {
                        return visual;
                    }
                    // Check the framebuffer status.
                    var currentFrameBuffer = this.context.getParameter(SPECTOR.WebGlConstants.FRAMEBUFFER_BINDING.value);
                    gl.bindFramebuffer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, this.captureFrameBuffer);
                    try {
                        var textureLevel = 0;
                        var width = info.width;
                        var height = info.height;
                        if (target === SPECTOR.WebGlConstants.TEXTURE_3D && info.depth) {
                            var gl2 = gl;
                            for (var i = 0; i < info.depth; i++) {
                                // Limit to 6 the visible texture...
                                if (i > 2 && i < (info.depth - 3)) {
                                    continue;
                                }
                                gl2.framebufferTextureLayer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, SPECTOR.WebGlConstants.COLOR_ATTACHMENT0.value, storage, textureLevel, i);
                                visual["3D Layer " + i] = this.getCapture(gl, 0, 0, width, height, info.type);
                            }
                        }
                        else if (target === SPECTOR.WebGlConstants.TEXTURE_2D_ARRAY && info.depth) {
                            var gl2 = gl;
                            // Limit to 6 the visible texture...
                            for (var i = 0; i < info.depth; i++) {
                                if (i > 2 && i < (info.depth - 3)) {
                                    continue;
                                }
                                gl2.framebufferTextureLayer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, SPECTOR.WebGlConstants.COLOR_ATTACHMENT0.value, storage, textureLevel, i);
                                visual["Layer " + i] = this.getCapture(gl, 0, 0, width, height, info.type);
                            }
                        }
                        else if (target === SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP) {
                            for (var _i = 0, _a = DrawCallTextureInputState.cubeMapFaces; _i < _a.length; _i++) {
                                var face = _a[_i];
                                gl.framebufferTexture2D(SPECTOR.WebGlConstants.FRAMEBUFFER.value, SPECTOR.WebGlConstants.COLOR_ATTACHMENT0.value, face.value, storage, textureLevel);
                                visual[face.name] = this.getCapture(gl, 0, 0, width, height, info.type);
                            }
                        }
                        else {
                            gl.framebufferTexture2D(SPECTOR.WebGlConstants.FRAMEBUFFER.value, SPECTOR.WebGlConstants.COLOR_ATTACHMENT0.value, SPECTOR.WebGlConstants.TEXTURE_2D.value, storage, textureLevel);
                            visual[SPECTOR.WebGlConstants.TEXTURE_2D.name] = this.getCapture(gl, 0, 0, width, height, info.type);
                        }
                    }
                    catch (e) {
                        // Something went wrong during the capture.
                    }
                    gl.bindFramebuffer(SPECTOR.WebGlConstants.FRAMEBUFFER.value, currentFrameBuffer);
                    return visual;
                }
                catch (e) {
                    // Do nothing, probably an incompatible format, should add more combinaison check upfront.
                }
                return undefined;
            };
            DrawCallTextureInputState.prototype.getCapture = function (gl, x, y, width, height, type) {
                try {
                    // Check FBO status.
                    var status_3 = this.context.checkFramebufferStatus(SPECTOR.WebGlConstants.FRAMEBUFFER.value);
                    if (status_3 !== SPECTOR.WebGlConstants.FRAMEBUFFER_COMPLETE.value) {
                        return undefined;
                    }
                    // In case of texStorage.
                    type = type || SPECTOR.WebGlConstants.UNSIGNED_BYTE.value;
                    // Read the pixels from the context.
                    var pixels = SPECTOR.ReadPixelsHelper.readPixels(gl, x, y, width, height, type);
                    if (!pixels) {
                        return undefined;
                    }
                    // Copy the pixels to a working 2D canvas same size.
                    this.workingCanvas.width = width;
                    this.workingCanvas.height = height;
                    var imageData = this.workingContext2D.createImageData(width, height);
                    imageData.data.set(pixels);
                    this.workingContext2D.putImageData(imageData, 0, 0);
                    // Copy the pixels to a resized capture 2D canvas.
                    var imageAspectRatio = width / height;
                    if (imageAspectRatio < 1) {
                        this.captureCanvas.width = States.VisualState.captureBaseSize * imageAspectRatio;
                        this.captureCanvas.height = States.VisualState.captureBaseSize;
                    }
                    else if (imageAspectRatio > 1) {
                        this.captureCanvas.width = States.VisualState.captureBaseSize;
                        this.captureCanvas.height = States.VisualState.captureBaseSize / imageAspectRatio;
                    }
                    else {
                        this.captureCanvas.width = States.VisualState.captureBaseSize;
                        this.captureCanvas.height = States.VisualState.captureBaseSize;
                    }
                    this.captureCanvas.width = Math.max(this.captureCanvas.width, 1);
                    this.captureCanvas.height = Math.max(this.captureCanvas.height, 1);
                    // Scale and draw to flip Y to reorient readPixels.
                    this.captureContext2D.globalCompositeOperation = "copy";
                    this.captureContext2D.scale(1, -1); // Y flip
                    this.captureContext2D.translate(0, -this.captureCanvas.height); // so we can draw at 0,0
                    this.captureContext2D.drawImage(this.workingCanvas, 0, 0, width, height, 0, 0, this.captureCanvas.width, this.captureCanvas.height);
                    this.captureContext2D.setTransform(1, 0, 0, 1, 0, 0);
                    this.captureContext2D.globalCompositeOperation = "source-over";
                    // get the screen capture
                    var src = this.captureCanvas.toDataURL();
                    return src;
                }
                catch (e) {
                    // TODO. Nothing to do here... so far.
                }
                return undefined;
            };
            DrawCallTextureInputState.prototype.getWebGlConstant = function (value) {
                var constant = SPECTOR.WebGlConstantsByValue[value];
                return constant ? constant.name : value + "";
            };
            DrawCallTextureInputState.captureBaseSize = 64;
            DrawCallTextureInputState.cubeMapFaces = [
                SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_X,
                SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_Y,
                SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP_POSITIVE_Z,
                SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_X,
                SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_Y,
                SPECTOR.WebGlConstants.TEXTURE_CUBE_MAP_NEGATIVE_Z,
            ];
            return DrawCallTextureInputState;
        }());
        States.DrawCallTextureInputState = DrawCallTextureInputState;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var States;
    (function (States) {
        var DrawCallUboInputState = /** @class */ (function () {
            function DrawCallUboInputState(options, logger) {
                this.logger = logger;
                this.context = options.context;
            }
            DrawCallUboInputState.prototype.getUboValue = function (indice, offset, size, type) {
                var uboType = DrawCallUboInputState.uboTypes[type];
                if (!uboType) {
                    return undefined;
                }
                var destination = new uboType.arrayBufferView(size * uboType.lengthMultiplier);
                var context2 = this.context;
                var ownerbuffer = context2.getIndexedParameter(SPECTOR.WebGlConstants.UNIFORM_BUFFER_BINDING.value, indice);
                if (ownerbuffer) {
                    var boundBuffer = context2.getParameter(SPECTOR.WebGlConstants.UNIFORM_BUFFER_BINDING.value);
                    try {
                        context2.bindBuffer(SPECTOR.WebGlConstants.UNIFORM_BUFFER.value, ownerbuffer);
                        context2.getBufferSubData(SPECTOR.WebGlConstants.UNIFORM_BUFFER.value, offset, destination);
                    }
                    catch (e) {
                        // Prevent back fromats to break the capture.
                        return undefined;
                    }
                    if (boundBuffer) {
                        context2.bindBuffer(SPECTOR.WebGlConstants.UNIFORM_BUFFER.value, boundBuffer);
                    }
                }
                return Array.prototype.slice.call(destination);
            };
            DrawCallUboInputState.uboTypes = (_a = {},
                _a[SPECTOR.WebGlConstants.BOOL.value] = { arrayBufferView: Uint8Array, lengthMultiplier: 1 },
                _a[SPECTOR.WebGlConstants.BOOL_VEC2.value] = { arrayBufferView: Uint8Array, lengthMultiplier: 2 },
                _a[SPECTOR.WebGlConstants.BOOL_VEC3.value] = { arrayBufferView: Uint8Array, lengthMultiplier: 3 },
                _a[SPECTOR.WebGlConstants.BOOL_VEC4.value] = { arrayBufferView: Uint8Array, lengthMultiplier: 4 },
                _a[SPECTOR.WebGlConstants.INT.value] = { arrayBufferView: Int32Array, lengthMultiplier: 1 },
                _a[SPECTOR.WebGlConstants.INT_VEC2.value] = { arrayBufferView: Int32Array, lengthMultiplier: 2 },
                _a[SPECTOR.WebGlConstants.INT_VEC3.value] = { arrayBufferView: Int32Array, lengthMultiplier: 3 },
                _a[SPECTOR.WebGlConstants.INT_VEC4.value] = { arrayBufferView: Int32Array, lengthMultiplier: 4 },
                _a[SPECTOR.WebGlConstants.UNSIGNED_INT.value] = { arrayBufferView: Uint32Array, lengthMultiplier: 1 },
                _a[SPECTOR.WebGlConstants.UNSIGNED_INT_VEC2.value] = { arrayBufferView: Uint32Array, lengthMultiplier: 2 },
                _a[SPECTOR.WebGlConstants.UNSIGNED_INT_VEC3.value] = { arrayBufferView: Uint32Array, lengthMultiplier: 3 },
                _a[SPECTOR.WebGlConstants.UNSIGNED_INT_VEC4.value] = { arrayBufferView: Uint32Array, lengthMultiplier: 4 },
                _a[SPECTOR.WebGlConstants.FLOAT.value] = { arrayBufferView: Float32Array, lengthMultiplier: 1 },
                _a[SPECTOR.WebGlConstants.FLOAT_VEC2.value] = { arrayBufferView: Float32Array, lengthMultiplier: 2 },
                _a[SPECTOR.WebGlConstants.FLOAT_VEC3.value] = { arrayBufferView: Float32Array, lengthMultiplier: 3 },
                _a[SPECTOR.WebGlConstants.FLOAT_VEC4.value] = { arrayBufferView: Float32Array, lengthMultiplier: 4 },
                _a[SPECTOR.WebGlConstants.FLOAT_MAT2.value] = { arrayBufferView: Float32Array, lengthMultiplier: 4 },
                _a[SPECTOR.WebGlConstants.FLOAT_MAT2x3.value] = { arrayBufferView: Float32Array, lengthMultiplier: 6 },
                _a[SPECTOR.WebGlConstants.FLOAT_MAT2x4.value] = { arrayBufferView: Float32Array, lengthMultiplier: 8 },
                _a[SPECTOR.WebGlConstants.FLOAT_MAT3.value] = { arrayBufferView: Float32Array, lengthMultiplier: 9 },
                _a[SPECTOR.WebGlConstants.FLOAT_MAT3x2.value] = { arrayBufferView: Float32Array, lengthMultiplier: 6 },
                _a[SPECTOR.WebGlConstants.FLOAT_MAT3x4.value] = { arrayBufferView: Float32Array, lengthMultiplier: 12 },
                _a[SPECTOR.WebGlConstants.FLOAT_MAT4.value] = { arrayBufferView: Float32Array, lengthMultiplier: 16 },
                _a[SPECTOR.WebGlConstants.FLOAT_MAT4x2.value] = { arrayBufferView: Float32Array, lengthMultiplier: 8 },
                _a[SPECTOR.WebGlConstants.FLOAT_MAT4x3.value] = { arrayBufferView: Float32Array, lengthMultiplier: 12 },
                _a[SPECTOR.WebGlConstants.SAMPLER_2D.value] = { arrayBufferView: Uint8Array, lengthMultiplier: 1 },
                _a[SPECTOR.WebGlConstants.SAMPLER_CUBE.value] = { arrayBufferView: Uint8Array, lengthMultiplier: 1 },
                _a);
            return DrawCallUboInputState;
        }());
        States.DrawCallUboInputState = DrawCallUboInputState;
        var _a;
    })(States = SPECTOR.States || (SPECTOR.States = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var WebGlObjects;
    (function (WebGlObjects) {
        var SPECTOROBJECTTAGKEY = "__SPECTOR_Object_TAG";
        function getWebGlObjectTag(object) {
            return object[SPECTOROBJECTTAGKEY];
        }
        WebGlObjects.getWebGlObjectTag = getWebGlObjectTag;
        function attachWebGlObjectTag(object, tag) {
            tag.displayText = stringifyWebGlObjectTag(tag);
            object[SPECTOROBJECTTAGKEY] = tag;
        }
        WebGlObjects.attachWebGlObjectTag = attachWebGlObjectTag;
        function stringifyWebGlObjectTag(tag) {
            if (!tag) {
                return "No tag available.";
            }
            return tag.typeName + " - ID: " + tag.id;
        }
        WebGlObjects.stringifyWebGlObjectTag = stringifyWebGlObjectTag;
    })(WebGlObjects = SPECTOR.WebGlObjects || (SPECTOR.WebGlObjects = {}));
})(SPECTOR || (SPECTOR = {}));
(function (SPECTOR) {
    var WebGlObjects;
    (function (WebGlObjects) {
        var BaseWebGlObject = /** @class */ (function () {
            function BaseWebGlObject(options, logger) {
                this.options = options;
                this.typeName = options.typeName;
                this.type = options.type;
                this.id = 0;
            }
            BaseWebGlObject.prototype.tagWebGlObject = function (webGlObject) {
                if (!this.type) {
                    return undefined;
                }
                var tag;
                if (!webGlObject) {
                    return tag;
                }
                tag = WebGlObjects.getWebGlObjectTag(webGlObject);
                if (tag) {
                    return tag;
                }
                if (webGlObject instanceof this.type) {
                    var id = this.getNextId();
                    tag = {
                        typeName: this.typeName,
                        id: id,
                    };
                    WebGlObjects.attachWebGlObjectTag(webGlObject, tag);
                    return tag;
                }
                return tag;
            };
            BaseWebGlObject.prototype.getNextId = function () {
                return this.id++;
            };
            return BaseWebGlObject;
        }());
        WebGlObjects.BaseWebGlObject = BaseWebGlObject;
    })(WebGlObjects = SPECTOR.WebGlObjects || (SPECTOR.WebGlObjects = {}));
})(SPECTOR || (SPECTOR = {}));
// tslint:disable:max-classes-per-file
var SPECTOR;
(function (SPECTOR) {
    var WebGlObjects;
    (function (WebGlObjects) {
        var Buffer = /** @class */ (function (_super) {
            __extends(Buffer, _super);
            function Buffer() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Buffer = __decorate([
                SPECTOR.Decorators.webGlObject("WebGLBuffer")
            ], Buffer);
            return Buffer;
        }(WebGlObjects.BaseWebGlObject));
        WebGlObjects.Buffer = Buffer;
        var FrameBuffer = /** @class */ (function (_super) {
            __extends(FrameBuffer, _super);
            function FrameBuffer() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            FrameBuffer = __decorate([
                SPECTOR.Decorators.webGlObject("WebGLFramebuffer")
            ], FrameBuffer);
            return FrameBuffer;
        }(WebGlObjects.BaseWebGlObject));
        WebGlObjects.FrameBuffer = FrameBuffer;
        var Program = /** @class */ (function (_super) {
            __extends(Program, _super);
            function Program(options, logger) {
                return _super.call(this, options, logger) || this;
            }
            Program.saveInGlobalStore = function (object) {
                var tag = WebGlObjects.getWebGlObjectTag(object);
                if (!tag) {
                    return;
                }
                this.store[tag.id] = object;
            };
            Program.getFromGlobalStore = function (id) {
                return this.store[id];
            };
            Program.updateInGlobalStore = function (id, newProgram) {
                if (!newProgram) {
                    return;
                }
                var program = this.getFromGlobalStore(id);
                if (!program) {
                    return;
                }
                var tag = WebGlObjects.getWebGlObjectTag(program);
                if (!tag) {
                    return;
                }
                WebGlObjects.attachWebGlObjectTag(newProgram, tag);
                this.store[tag.id] = newProgram;
            };
            Program.store = {};
            Program = __decorate([
                SPECTOR.Decorators.webGlObject("WebGLProgram")
            ], Program);
            return Program;
        }(WebGlObjects.BaseWebGlObject));
        WebGlObjects.Program = Program;
        var Query = /** @class */ (function (_super) {
            __extends(Query, _super);
            function Query() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Query = __decorate([
                SPECTOR.Decorators.webGlObject("WebGLQuery")
            ], Query);
            return Query;
        }(WebGlObjects.BaseWebGlObject));
        WebGlObjects.Query = Query;
        var Renderbuffer = /** @class */ (function (_super) {
            __extends(Renderbuffer, _super);
            function Renderbuffer() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Renderbuffer = __decorate([
                SPECTOR.Decorators.webGlObject("WebGLRenderbuffer")
            ], Renderbuffer);
            return Renderbuffer;
        }(WebGlObjects.BaseWebGlObject));
        WebGlObjects.Renderbuffer = Renderbuffer;
        var Sampler = /** @class */ (function (_super) {
            __extends(Sampler, _super);
            function Sampler() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Sampler = __decorate([
                SPECTOR.Decorators.webGlObject("WebGLSampler")
            ], Sampler);
            return Sampler;
        }(WebGlObjects.BaseWebGlObject));
        WebGlObjects.Sampler = Sampler;
        var Shader = /** @class */ (function (_super) {
            __extends(Shader, _super);
            function Shader() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Shader = __decorate([
                SPECTOR.Decorators.webGlObject("WebGLShader")
            ], Shader);
            return Shader;
        }(WebGlObjects.BaseWebGlObject));
        WebGlObjects.Shader = Shader;
        var Sync = /** @class */ (function (_super) {
            __extends(Sync, _super);
            function Sync() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Sync = __decorate([
                SPECTOR.Decorators.webGlObject("WebGLSync")
            ], Sync);
            return Sync;
        }(WebGlObjects.BaseWebGlObject));
        WebGlObjects.Sync = Sync;
        var Texture = /** @class */ (function (_super) {
            __extends(Texture, _super);
            function Texture() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            Texture = __decorate([
                SPECTOR.Decorators.webGlObject("WebGLTexture")
            ], Texture);
            return Texture;
        }(WebGlObjects.BaseWebGlObject));
        WebGlObjects.Texture = Texture;
        var TransformFeedback = /** @class */ (function (_super) {
            __extends(TransformFeedback, _super);
            function TransformFeedback() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            TransformFeedback = __decorate([
                SPECTOR.Decorators.webGlObject("WebGLTransformFeedback")
            ], TransformFeedback);
            return TransformFeedback;
        }(WebGlObjects.BaseWebGlObject));
        WebGlObjects.TransformFeedback = TransformFeedback;
        var UniformLocation = /** @class */ (function (_super) {
            __extends(UniformLocation, _super);
            function UniformLocation() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            UniformLocation = __decorate([
                SPECTOR.Decorators.webGlObject("WebGLUniformLocation")
            ], UniformLocation);
            return UniformLocation;
        }(WebGlObjects.BaseWebGlObject));
        WebGlObjects.UniformLocation = UniformLocation;
        var VertexArrayObject = /** @class */ (function (_super) {
            __extends(VertexArrayObject, _super);
            function VertexArrayObject() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            VertexArrayObject = __decorate([
                SPECTOR.Decorators.webGlObject("WebGLVertexArrayObject")
            ], VertexArrayObject);
            return VertexArrayObject;
        }(WebGlObjects.BaseWebGlObject));
        WebGlObjects.VertexArrayObject = VertexArrayObject;
    })(WebGlObjects = SPECTOR.WebGlObjects || (SPECTOR.WebGlObjects = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Analysers;
    (function (Analysers) {
        var BaseAnalyser = /** @class */ (function () {
            function BaseAnalyser(options, logger) {
                this.options = options;
                this.logger = logger;
                this.analyserName = options.analyserName;
            }
            BaseAnalyser.prototype.appendAnalysis = function (capture) {
                capture.analyses = capture.analyses || [];
                var analysis = this.getAnalysis(capture);
                capture.analyses.push(analysis);
            };
            BaseAnalyser.prototype.getAnalysis = function (capture) {
                var analysis = {
                    analyserName: this.analyserName,
                };
                this.appendToAnalysis(capture, analysis);
                return analysis;
            };
            return BaseAnalyser;
        }());
        Analysers.BaseAnalyser = BaseAnalyser;
    })(Analysers = SPECTOR.Analysers || (SPECTOR.Analysers = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Analysers;
    (function (Analysers) {
        var CaptureAnalyser = /** @class */ (function () {
            function CaptureAnalyser(options, logger) {
                this.options = options;
                this.logger = logger;
                this.analysers = {};
                this.analyserConstructors = {};
                this.contextInformation = options.contextInformation;
                this.initAvailableAnalysers();
                this.initAnalysers();
            }
            CaptureAnalyser.prototype.appendAnalyses = function (capture) {
                for (var analyserName in this.analysers) {
                    if (this.analysers.hasOwnProperty(analyserName)) {
                        var analyser = this.analysers[analyserName];
                        analyser.appendAnalysis(capture);
                    }
                }
            };
            CaptureAnalyser.prototype.initAvailableAnalysers = function () {
                for (var analyser in this.options.analyserNamespace) {
                    if (this.options.analyserNamespace.hasOwnProperty(analyser)) {
                        var analyserCtor = this.options.analyserNamespace[analyser];
                        var analyserName = SPECTOR.Decorators.getAnalyserName(analyserCtor);
                        if (analyserName) {
                            this.analyserConstructors[analyserName] = analyserCtor;
                        }
                    }
                }
            };
            CaptureAnalyser.prototype.initAnalysers = function () {
                for (var analyserName in this.analyserConstructors) {
                    if (this.analyserConstructors.hasOwnProperty(analyserName)) {
                        var options = SPECTOR.merge({ analyserName: analyserName }, this.contextInformation);
                        var recorder = new this.analyserConstructors[analyserName](options, this.logger);
                        this.analysers[analyserName] = recorder;
                    }
                }
            };
            return CaptureAnalyser;
        }());
        Analysers.CaptureAnalyser = CaptureAnalyser;
    })(Analysers = SPECTOR.Analysers || (SPECTOR.Analysers = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Analysers;
    (function (Analysers) {
        var CommandsSummaryAnalyser = /** @class */ (function (_super) {
            __extends(CommandsSummaryAnalyser, _super);
            function CommandsSummaryAnalyser() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            CommandsSummaryAnalyser_1 = CommandsSummaryAnalyser;
            CommandsSummaryAnalyser.prototype.appendToAnalysis = function (capture, analysis) {
                if (!capture.commands) {
                    return;
                }
                analysis.total = capture.commands.length;
                analysis.draw = 0;
                analysis.clear = 0;
                for (var _i = 0, _a = capture.commands; _i < _a.length; _i++) {
                    var command = _a[_i];
                    if (command.name === "clear") {
                        analysis.clear++;
                    }
                    else if (CommandsSummaryAnalyser_1.drawCommands.indexOf(command.name) > -1) {
                        analysis.draw++;
                    }
                }
            };
            CommandsSummaryAnalyser.drawCommands = [
                "drawArrays",
                "drawElements",
                "drawArraysInstanced",
                "drawElementsInstanced",
                "drawElementsInstancedANGLE",
                "drawRangeElements",
            ];
            CommandsSummaryAnalyser = CommandsSummaryAnalyser_1 = __decorate([
                SPECTOR.Decorators.analyser("CommandsSummary")
            ], CommandsSummaryAnalyser);
            return CommandsSummaryAnalyser;
            var CommandsSummaryAnalyser_1;
        }(Analysers.BaseAnalyser));
        Analysers.CommandsSummaryAnalyser = CommandsSummaryAnalyser;
    })(Analysers = SPECTOR.Analysers || (SPECTOR.Analysers = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Analysers;
    (function (Analysers) {
        var CommandsAnalyser = /** @class */ (function (_super) {
            __extends(CommandsAnalyser, _super);
            function CommandsAnalyser() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            CommandsAnalyser.prototype.appendToAnalysis = function (capture, analysis) {
                if (!capture.commands) {
                    return;
                }
                var unorderedItems = {};
                for (var _i = 0, _a = capture.commands; _i < _a.length; _i++) {
                    var command = _a[_i];
                    unorderedItems[command.name] = unorderedItems[command.name] || 0;
                    unorderedItems[command.name]++;
                }
                // Create items array
                var items = Object.keys(unorderedItems).map(function (key) {
                    return [key, unorderedItems[key]];
                });
                // Sort the array based on the second element
                items.sort(function (first, second) {
                    var difference = second[1] - first[1];
                    // Alpha order in case of equality
                    if (difference === 0) {
                        return first[0].localeCompare(second[0]);
                    }
                    return difference;
                });
                // Appends to state
                for (var _b = 0, items_1 = items; _b < items_1.length; _b++) {
                    var item = items_1[_b];
                    var commandName = item[0];
                    analysis[commandName] = item[1];
                }
            };
            CommandsAnalyser = __decorate([
                SPECTOR.Decorators.analyser("Commands")
            ], CommandsAnalyser);
            return CommandsAnalyser;
        }(Analysers.BaseAnalyser));
        Analysers.CommandsAnalyser = CommandsAnalyser;
    })(Analysers = SPECTOR.Analysers || (SPECTOR.Analysers = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Analysers;
    (function (Analysers) {
        var PrimitivesAnalyser = /** @class */ (function (_super) {
            __extends(PrimitivesAnalyser, _super);
            function PrimitivesAnalyser() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            PrimitivesAnalyser.prototype.appendToAnalysis = function (capture, analysis) {
                if (!capture.commands) {
                    return;
                }
                var primitives = {
                    total: 0,
                    totalTriangles: 0,
                    totalTriangleStrip: 0,
                    totalTriangleFan: 0,
                    totalLines: 0,
                    totalLineStrip: 0,
                    totalLineLoop: 0,
                    totalPoints: 0,
                };
                for (var _i = 0, _a = capture.commands; _i < _a.length; _i++) {
                    var command = _a[_i];
                    if (command.name === "drawArrays" && command.commandArguments.length >= 3) {
                        this.appendToPrimitives(primitives, command.commandArguments[0], command.commandArguments[2]);
                    }
                    else if (command.name === "drawArraysInstanced" && command.commandArguments.length >= 3) {
                        this.appendToPrimitives(primitives, command.commandArguments[0], command.commandArguments[2]);
                    }
                    else if (command.name === "drawArraysInstancedANGLE" && command.commandArguments.length >= 3) {
                        this.appendToPrimitives(primitives, command.commandArguments[0], command.commandArguments[2]);
                    }
                    else if (command.name === "drawElements" && command.commandArguments.length >= 2) {
                        this.appendToPrimitives(primitives, command.commandArguments[0], command.commandArguments[1]);
                    }
                    else if (command.name === "drawElementsInstanced" && command.commandArguments.length >= 2) {
                        this.appendToPrimitives(primitives, command.commandArguments[0], command.commandArguments[1]);
                    }
                    else if (command.name === "drawElementsInstancedANGLE" && command.commandArguments.length >= 2) {
                        this.appendToPrimitives(primitives, command.commandArguments[0], command.commandArguments[1]);
                    }
                    else if (command.name === "drawRangeElements" && command.commandArguments.length >= 4) {
                        this.appendToPrimitives(primitives, command.commandArguments[0], command.commandArguments[3]);
                    }
                }
                analysis["total"] = primitives.total;
                analysis["triangles"] = primitives.totalTriangles;
                analysis["triangleStrip"] = primitives.totalTriangleStrip;
                analysis["triangleFan"] = primitives.totalTriangleFan;
                analysis["lines"] = primitives.totalLines;
                analysis["lineStrip"] = primitives.totalLineStrip;
                analysis["lineLoop"] = primitives.totalLineLoop;
                analysis["points"] = primitives.totalPoints;
            };
            PrimitivesAnalyser.prototype.appendToPrimitives = function (primitives, mode, count) {
                if (mode === SPECTOR.WebGlConstants.POINTS.value) {
                    primitives.totalPoints += count;
                }
                else if (mode === SPECTOR.WebGlConstants.LINES.value) {
                    primitives.totalLines += count;
                }
                else if (mode === SPECTOR.WebGlConstants.LINE_STRIP.value) {
                    primitives.totalLineStrip += count;
                }
                else if (mode === SPECTOR.WebGlConstants.LINE_LOOP.value) {
                    primitives.totalLineLoop += count;
                }
                else if (mode === SPECTOR.WebGlConstants.TRIANGLES.value) {
                    primitives.totalTriangles += count;
                }
                else if (mode === SPECTOR.WebGlConstants.TRIANGLE_STRIP.value) {
                    primitives.totalTriangleStrip += count;
                }
                else if (mode === SPECTOR.WebGlConstants.TRIANGLE_FAN.value) {
                    primitives.totalTriangleFan += count;
                }
                primitives.total += count;
            };
            PrimitivesAnalyser = __decorate([
                SPECTOR.Decorators.analyser("Primitives")
            ], PrimitivesAnalyser);
            return PrimitivesAnalyser;
        }(Analysers.BaseAnalyser));
        Analysers.PrimitivesAnalyser = PrimitivesAnalyser;
    })(Analysers = SPECTOR.Analysers || (SPECTOR.Analysers = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Comparators;
    (function (Comparators) {
        var CommandComparator = /** @class */ (function () {
            function CommandComparator(logger) {
                this.logger = logger;
            }
            CommandComparator.prototype.compare = function (commandA, commandB) {
                var result = {
                    groups: [],
                    properties: [],
                };
                var comparison = this.compareGroups("Command", commandA, commandB);
                var mainGroup = comparison.groups[0];
                result.groups = mainGroup.groups;
                result.properties = mainGroup.properties;
                return result;
            };
            CommandComparator.prototype.compareGroups = function (name, groupA, groupB) {
                // Prepare cache and result.
                var processed = {};
                var groupResult = {
                    name: name,
                    groups: [],
                    properties: [],
                    status: SPECTOR.CaptureComparisonStatus.Equal,
                };
                // Check A against B.
                for (var keyA in groupA) {
                    if (groupA.hasOwnProperty(keyA)) {
                        var valueA = groupA[keyA];
                        if (groupB.hasOwnProperty(keyA)) {
                            var valueB = groupB[keyA];
                            if (typeof valueA === "object") {
                                var comparison = this.compareGroups(keyA, valueA, valueB);
                                if (comparison.status !== SPECTOR.CaptureComparisonStatus.Equal) {
                                    groupResult.status = SPECTOR.CaptureComparisonStatus.Different;
                                }
                                groupResult.groups.push(comparison);
                            }
                            else {
                                var comparison = this.compareProperties(keyA, valueA, valueB);
                                if (comparison.status !== SPECTOR.CaptureComparisonStatus.Equal) {
                                    groupResult.status = SPECTOR.CaptureComparisonStatus.Different;
                                }
                                groupResult.properties.push(comparison);
                            }
                        }
                        else {
                            groupResult.status = SPECTOR.CaptureComparisonStatus.Different;
                            if (typeof valueA === "object") {
                                var comparison = {
                                    name: name,
                                    status: SPECTOR.CaptureComparisonStatus.OnlyInA,
                                    groups: [],
                                    properties: [],
                                };
                                groupResult.groups.push(comparison);
                            }
                            else {
                                var comparison = {
                                    name: name,
                                    status: SPECTOR.CaptureComparisonStatus.OnlyInA,
                                    valueA: valueA,
                                    valueB: null,
                                };
                                groupResult.properties.push(comparison);
                            }
                        }
                        processed[keyA] = true;
                    }
                }
                // Checks the B leftOver.
                for (var keyB in groupB) {
                    if (groupB.hasOwnProperty(keyB)) {
                        if (!processed[keyB]) {
                            groupResult.status = SPECTOR.CaptureComparisonStatus.Different;
                            var valueB = groupB[keyB];
                            if (typeof valueB === "object") {
                                var comparison = {
                                    name: name,
                                    status: SPECTOR.CaptureComparisonStatus.OnlyInB,
                                    groups: [],
                                    properties: [],
                                };
                                groupResult.groups.push(comparison);
                            }
                            else {
                                var comparison = {
                                    name: name,
                                    status: SPECTOR.CaptureComparisonStatus.OnlyInB,
                                    valueA: null,
                                    valueB: valueB,
                                };
                                groupResult.properties.push(comparison);
                            }
                        }
                    }
                }
                return groupResult;
            };
            CommandComparator.prototype.compareProperties = function (name, valueA, valueB) {
                return {
                    name: name,
                    status: (valueA === valueB) ? SPECTOR.CaptureComparisonStatus.Equal : SPECTOR.CaptureComparisonStatus.Different,
                    valueA: valueA,
                    valueB: valueB,
                };
            };
            return CommandComparator;
        }());
        Comparators.CommandComparator = CommandComparator;
    })(Comparators = SPECTOR.Comparators || (SPECTOR.Comparators = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var ScrollIntoViewHelper = /** @class */ (function () {
            function ScrollIntoViewHelper() {
            }
            ScrollIntoViewHelper.scrollIntoView = function (element) {
                var elementRect = element.getBoundingClientRect();
                var parentElement = element.parentElement;
                while (parentElement) {
                    if (parentElement.clientHeight !== parentElement.offsetHeight) {
                        break;
                    }
                    parentElement = parentElement.parentElement;
                }
                if (!parentElement) {
                    return;
                }
                var parentRect = parentElement.getBoundingClientRect();
                if (elementRect.top < parentRect.top) {
                    element.scrollIntoView(true);
                }
                else if (elementRect.bottom > parentRect.bottom) {
                    element.scrollIntoView(false);
                }
            };
            return ScrollIntoViewHelper;
        }());
        EmbeddedFrontend.ScrollIntoViewHelper = ScrollIntoViewHelper;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var BaseNoneGenericComponent = /** @class */ (function () {
            function BaseNoneGenericComponent(eventConstructor, logger) {
                this.eventConstructor = eventConstructor;
                this.logger = logger;
                this.dummyTextGeneratorElement = document.createElement("div");
            }
            BaseNoneGenericComponent.prototype.createFromHtml = function (html) {
                // IE 11 Compatibility prevents to reuse the div.
                var dummyElement = document.createElement("div");
                dummyElement.innerHTML = html;
                return dummyElement.firstElementChild;
            };
            // THX to http://2ality.com/2015/01/template-strings-html.html
            BaseNoneGenericComponent.prototype.htmlTemplate = function (literalSections) {
                var _this = this;
                var substs = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    substs[_i - 1] = arguments[_i];
                }
                // Use raw literal sections: we don’t want
                // backslashes (\n etc.) to be interpreted
                var raw = literalSections.raw;
                var result = "";
                substs.forEach(function (subst, i) {
                    // Retrieve the literal section preceding
                    // the current substitution
                    var lit = raw[i];
                    // In the example, map() returns an array:
                    // If substitution is an array (and not a string),
                    // we turn it into a string
                    if (Array.isArray(subst)) {
                        subst = subst.join("");
                    }
                    // If the substitution is preceded by a dollar sign,
                    // we do not escape special characters in it
                    if (lit && lit.length > 0 && lit[lit.length - 1] === "$") {
                        lit = lit.slice(0, -1);
                    }
                    else {
                        subst = _this.htmlEscape(subst);
                    }
                    result += lit;
                    result += subst;
                });
                // Take care of last literal section
                // (Never fails, because an empty template string
                // produces one literal section, an empty string)
                result += raw[raw.length - 1]; // (A)
                return result;
            };
            BaseNoneGenericComponent.prototype.htmlEscape = function (str) {
                if (str === null || str === undefined || str.length === 0) {
                    return str;
                }
                this.dummyTextGeneratorElement.innerText = str;
                return this.dummyTextGeneratorElement.innerHTML;
                // Keep as a ref:
                // http://stackoverflow.com/questions/1219860/html-encoding-lost-when-attribute-read-from-input-field
                // THX to http://2ality.com/2015/01/template-strings-html.html
                // return str.replace(/&/g, '&amp;') // first!
                //         .replace(/>/g, '&gt;')
                //         .replace(/</g, '&lt;')
                //         .replace(/"/g, '&quot;')
                //         .replace(/'/g, '&#39;')
                //         .replace(/`/g, '&#96;');
            };
            return BaseNoneGenericComponent;
        }());
        EmbeddedFrontend.BaseNoneGenericComponent = BaseNoneGenericComponent;
        // tslint:disable-next-line:max-classes-per-file
        var BaseComponent = /** @class */ (function (_super) {
            __extends(BaseComponent, _super);
            function BaseComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.events = {};
                return _this;
            }
            BaseComponent.prototype.addEventListener = function (command, callback, context) {
                if (context === void 0) { context = null; }
                if (this.events[command]) {
                    return this.events[command].add(callback, context);
                }
                return -1;
            };
            BaseComponent.prototype.removeEventListener = function (command, listenerId) {
                if (this.events[command]) {
                    this.events[command].remove(listenerId);
                }
            };
            BaseComponent.prototype.renderElementFromTemplate = function (template, state, stateId) {
                var element = this.createFromHtml(template);
                this.bindCommands(element, state, stateId);
                return element;
            };
            BaseComponent.prototype.bindCommands = function (domNode, state, stateId) {
                var commandName = domNode.getAttribute("commandname");
                if (commandName) {
                    this.bindCommand(domNode, state, stateId);
                }
                var commandContainers = domNode.querySelectorAll("[commandName]");
                for (var i = 0; i < commandContainers.length; i++) {
                    var commandContainer = commandContainers[i];
                    this.bindCommand(commandContainer, state, stateId);
                }
            };
            BaseComponent.prototype.bindCommand = function (commandContainer, state, stateId) {
                var commandName = commandContainer.getAttribute("commandname");
                var commandEventBinding = commandContainer.getAttribute("commandeventbinding") || "";
                if (commandEventBinding.length === 0) {
                    commandEventBinding = "click";
                }
                var commandCapture = commandContainer.getAttribute("usecapture") === "true";
                this.createEvent(commandName);
                this.mapEventListener(commandContainer, commandEventBinding, commandName, state, stateId, commandCapture);
            };
            BaseComponent.prototype.mapEventListener = function (domElement, domEvent, eventName, state, stateId, commandCapture, stopPropagation) {
                if (commandCapture === void 0) { commandCapture = false; }
                if (stopPropagation === void 0) { stopPropagation = false; }
                // Really need to keep both this in the next command.
                // tslint:disable-next-line
                var self = this;
                if (stopPropagation) {
                    domElement.addEventListener(domEvent, function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        self.triggerEvent(eventName, this, state, stateId);
                    }, commandCapture);
                }
                else {
                    domElement.addEventListener(domEvent, function () {
                        self.triggerEvent(eventName, this, state, stateId);
                    }, commandCapture);
                }
            };
            BaseComponent.prototype.createEvent = function (commandName) {
                if (!this.events[commandName]) {
                    var event_1 = new this.eventConstructor();
                    this.events[commandName] = event_1;
                }
                return this.events[commandName];
            };
            BaseComponent.prototype.triggerEvent = function (commandName, element, state, stateId) {
                this.events[commandName].trigger({
                    sender: element,
                    stateId: stateId,
                    state: state,
                });
            };
            return BaseComponent;
        }(BaseNoneGenericComponent));
        EmbeddedFrontend.BaseComponent = BaseComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var Compositor = /** @class */ (function () {
            function Compositor(placeHolder, stateStore, logger) {
                this.logger = logger;
                this.placeHolder = placeHolder;
                this.stateStore = stateStore;
            }
            Compositor.prototype.compose = function (rootStateId) {
                // First pass to render each dirty node.
                var dirtyStates = this.stateStore.getStatesToProcess();
                var render = false;
                for (var dirtyStateKey in dirtyStates) {
                    if (dirtyStates.hasOwnProperty(dirtyStateKey)) {
                        var dirtyStateId = dirtyStates[dirtyStateKey];
                        var lastOperationForDirtyState = this.stateStore.getLastOperation(dirtyStateId);
                        var componentInstance = this.stateStore.getComponentInstance(dirtyStateId);
                        var state = this.stateStore.getData(dirtyStateId);
                        componentInstance.render(state, dirtyStateId, lastOperationForDirtyState);
                        render = true;
                    }
                }
                // early exist if nothing was touched.
                if (!render) {
                    return;
                }
                // Recursively apply the new rendered nodes to the dom.
                var lastOperation = this.stateStore.getLastOperation(rootStateId);
                this.composeInContainer(this.placeHolder, Number.MAX_VALUE, rootStateId, lastOperation);
            };
            Compositor.prototype.composeChildren = function (stateId, container) {
                if (!container) {
                    return;
                }
                var children = this.stateStore.getChildrenIds(stateId);
                var currentChildIndexInDom = 0;
                for (var i = 0; i < children.length; i++) {
                    var childId = children[i];
                    var lastOperation = this.stateStore.getLastOperation(childId);
                    // Recurse.
                    this.composeInContainer(container, currentChildIndexInDom, childId, lastOperation);
                    // Reindex in case of deleted nodes.
                    if (lastOperation !== 50 /* Delete */) {
                        currentChildIndexInDom++;
                    }
                }
            };
            Compositor.prototype.composeInContainer = function (parentContainer, indexInContainer, stateId, lastOperation) {
                var componentInstance = this.stateStore.getComponentInstance(stateId);
                var childrenContainer = componentInstance.composeInContainer(parentContainer, indexInContainer, lastOperation);
                // Recursion path.
                this.composeChildren(stateId, childrenContainer);
            };
            return Compositor;
        }());
        EmbeddedFrontend.Compositor = Compositor;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var MVX = /** @class */ (function () {
            function MVX(placeHolder, logger) {
                this.logger = logger;
                this.stateStore = new EmbeddedFrontend.StateStore(logger);
                this.compositor = new EmbeddedFrontend.Compositor(placeHolder, this.stateStore, logger);
                this.willRender = false;
                this.rootStateId = -1;
            }
            MVX.prototype.addRootState = function (data, component, immediate) {
                if (immediate === void 0) { immediate = false; }
                var componentInstance = new EmbeddedFrontend.ComponentInstance(component, this.logger);
                var stateId = this.stateStore.add(data, componentInstance);
                this.rootStateId = stateId;
                this.setForRender(immediate);
                return stateId;
            };
            MVX.prototype.addChildState = function (parentId, data, component, immediate) {
                if (immediate === void 0) { immediate = false; }
                var id = this.insertChildState(parentId, data, Number.MAX_VALUE, component);
                this.setForRender(immediate);
                return id;
            };
            MVX.prototype.insertChildState = function (parentId, data, index, component, immediate) {
                if (immediate === void 0) { immediate = false; }
                var componentInstance = new EmbeddedFrontend.ComponentInstance(component, this.logger);
                var id = this.stateStore.insertChildAt(parentId, index, data, componentInstance);
                this.setForRender(immediate);
                return id;
            };
            MVX.prototype.updateState = function (id, data, immediate) {
                if (immediate === void 0) { immediate = false; }
                this.stateStore.update(id, data);
                this.setForRender(immediate);
            };
            MVX.prototype.removeState = function (id, immediate) {
                if (immediate === void 0) { immediate = false; }
                this.stateStore.remove(id);
                this.setForRender(immediate);
            };
            MVX.prototype.removeChildrenStates = function (id, immediate) {
                if (immediate === void 0) { immediate = false; }
                this.stateStore.removeChildren(id);
                this.setForRender(immediate);
            };
            MVX.prototype.getState = function (id) {
                return this.stateStore.getData(id);
            };
            MVX.prototype.getGenericState = function (id) {
                return this.getState(id);
            };
            MVX.prototype.getChildrenState = function (id) {
                var _this = this;
                return this.stateStore.getChildrenIds(id).map(function (childId) { return _this.stateStore.getData(id); });
            };
            MVX.prototype.getChildrenGenericState = function (id) {
                return this.getChildrenState(id);
            };
            MVX.prototype.hasChildren = function (id) {
                return this.stateStore.hasChildren(id);
            };
            MVX.prototype.updateAllChildrenState = function (id, updateCallback) {
                var childrenIds = this.stateStore.getChildrenIds(id);
                for (var _i = 0, childrenIds_1 = childrenIds; _i < childrenIds_1.length; _i++) {
                    var childId = childrenIds_1[_i];
                    var state = this.getGenericState(childId);
                    updateCallback(state);
                    this.updateState(childId, state);
                }
            };
            MVX.prototype.updateAllChildrenGenericState = function (id, updateCallback) {
                this.updateAllChildrenState(id, updateCallback);
            };
            MVX.prototype.setForRender = function (immediate) {
                if (!this.willRender) {
                    this.willRender = true;
                    if (immediate) {
                        this.compose();
                    }
                    else {
                        setTimeout(this.compose.bind(this), MVX.REFRESHRATEINMILLISECONDS);
                    }
                }
            };
            MVX.prototype.compose = function () {
                // Render once.
                this.willRender = false;
                // Render and compose.
                this.compositor.compose(this.rootStateId);
                // Clean up the pending list of processed states.
                this.stateStore.flushPendingOperations();
            };
            MVX.REFRESHRATEINMILLISECONDS = 100;
            return MVX;
        }());
        EmbeddedFrontend.MVX = MVX;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var ComponentInstance = /** @class */ (function () {
            function ComponentInstance(component, logger) {
                this.logger = logger;
                this.component = component;
            }
            ComponentInstance.prototype.render = function (state, stateId, lastOperation) {
                if (lastOperation === 0 /* Processed */) {
                    return;
                }
                if (lastOperation === 50 /* Delete */) {
                    this.removeNode();
                    return;
                }
                this.domNode = this.component.render(state, stateId);
            };
            ComponentInstance.prototype.composeInContainer = function (parentContainer, indexInContainer, lastOperation) {
                if (lastOperation === 50 /* Delete */) {
                    this.removeNode();
                    return null;
                }
                var currentChildrenContainer = this.cachedCurrentChildrenContainer;
                if (lastOperation === 0 /* Processed */) {
                    return currentChildrenContainer;
                }
                var element = this.domNode;
                var newChildrenContainer = element.getAttribute("childrencontainer") ? element : element.querySelector("[childrenContainer]");
                if (newChildrenContainer && currentChildrenContainer) {
                    var children = currentChildrenContainer.children;
                    while (children.length > 0) {
                        newChildrenContainer.appendChild(children[0]);
                    }
                }
                this.cachedCurrentChildrenContainer = newChildrenContainer;
                if (indexInContainer >= parentContainer.children.length) {
                    parentContainer.appendChild(element);
                    if (this.cachedCurrentDomNode && lastOperation === 40 /* Update */) {
                        if (this.cachedCurrentDomNode.remove) {
                            this.cachedCurrentDomNode.remove();
                        }
                        else if (this.cachedCurrentDomNode.parentNode) {
                            this.cachedCurrentDomNode.parentNode.removeChild(this.cachedCurrentDomNode);
                        }
                    }
                }
                else {
                    var currentElement = parentContainer.children[indexInContainer];
                    parentContainer.insertBefore(element, currentElement);
                    if (lastOperation === 40 /* Update */) {
                        parentContainer.removeChild(currentElement);
                    }
                }
                this.cachedCurrentDomNode = this.domNode;
                return newChildrenContainer;
            };
            ComponentInstance.prototype.removeNode = function () {
                if (this.domNode && this.domNode.parentElement) {
                    if (this.domNode.remove) {
                        this.domNode.remove();
                    }
                    else if (this.domNode.parentNode) {
                        this.domNode.parentNode.removeChild(this.domNode);
                    }
                }
                if (this.cachedCurrentDomNode && this.cachedCurrentDomNode.parentElement) {
                    if (this.cachedCurrentDomNode.remove) {
                        this.cachedCurrentDomNode.remove();
                    }
                    else if (this.cachedCurrentDomNode.parentNode) {
                        this.cachedCurrentDomNode.parentNode.removeChild(this.cachedCurrentDomNode);
                    }
                }
            };
            ComponentInstance.idGenerator = 0;
            return ComponentInstance;
        }());
        EmbeddedFrontend.ComponentInstance = ComponentInstance;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var StateStore = /** @class */ (function () {
            function StateStore(logger) {
                this.logger = logger;
                this.store = {};
                this.idGenerator = 0;
                this.pendingOperation = {};
            }
            StateStore.prototype.getLastOperation = function (id) {
                return this.store[id].lastOperation;
            };
            StateStore.prototype.getData = function (id) {
                return this.store[id].data;
            };
            StateStore.prototype.getComponentInstance = function (id) {
                return this.store[id].componentInstance;
            };
            StateStore.prototype.getParentId = function (id) {
                if (this.store[id].parent) {
                    return this.store[id].parent.id;
                }
                return -1;
            };
            StateStore.prototype.getChildrenIds = function (id) {
                var result = [];
                for (var _i = 0, _a = this.store[id].children; _i < _a.length; _i++) {
                    var child = _a[_i];
                    result.push(child.id);
                }
                return result;
            };
            StateStore.prototype.hasChildren = function (id) {
                return this.store[id].children.length > 0;
            };
            StateStore.prototype.add = function (data, componentInstance) {
                var id = this.getNewId();
                this.pendingOperation[id] = id;
                this.store[id] = {
                    data: data,
                    id: id,
                    parent: null,
                    children: [],
                    componentInstance: componentInstance,
                    lastOperation: 20 /* Add */,
                };
                return id;
            };
            StateStore.prototype.update = function (id, data) {
                var currentState = this.store[id];
                this.pendingOperation[id] = id;
                // Update the state to not lose references.
                this.store[id].data = data;
                this.store[id].lastOperation = 40 /* Update */;
            };
            StateStore.prototype.addChild = function (parentId, data, componentInstance) {
                var parent = this.store[parentId];
                var id = this.add(data, componentInstance);
                this.pendingOperation[id] = id;
                var child = this.store[id];
                child.parent = parent;
                parent.children.push(child);
                return id;
            };
            StateStore.prototype.insertChildAt = function (parentId, index, data, componentInstance) {
                var parent = this.store[parentId];
                var id = this.add(data, componentInstance);
                this.pendingOperation[id] = id;
                var child = this.store[id];
                child.parent = parent;
                if (index >= parent.children.length) {
                    parent.children.push(child);
                }
                else if (index >= 0) {
                    parent.children.splice(index, 0, child);
                }
                else {
                    parent.children.unshift(child);
                }
                return id;
            };
            StateStore.prototype.removeChildById = function (parentId, id) {
                var parent = this.store[parentId];
                for (var i = parent.children.length - 1; i >= 0; i--) {
                    var state = parent.children[i];
                    if (state.id === id) {
                        this.removeChildAt(parentId, i);
                        break;
                    }
                }
            };
            StateStore.prototype.removeChildAt = function (parentId, index) {
                var parent = this.store[parentId];
                var child;
                if (index > (parent.children.length - 1)) {
                    child = parent.children[parent.children.length - 1];
                    parent.children[parent.children.length - 1].parent = null;
                    parent.children.splice(parent.children.length - 1, 1);
                }
                else if (index >= 0) {
                    child = parent.children[index];
                    parent.children[index].parent = null;
                    parent.children.splice(index, 1);
                }
                else {
                    child = parent.children[0];
                    parent.children[0].parent = null;
                    parent.children.splice(0, 1);
                }
                child.parent = null;
                this.remove(child.id);
            };
            StateStore.prototype.remove = function (id) {
                var child = this.store[id];
                if (child.parent) {
                    var parent_1 = this.store[child.parent.id];
                    this.removeChildById(child.parent.id, id);
                }
                else {
                    this.removeChildren(id);
                    this.store[id].lastOperation = 50 /* Delete */;
                    this.pendingOperation[id] = id;
                }
            };
            StateStore.prototype.removeChildren = function (id) {
                var state = this.store[id];
                while (state.children.length) {
                    this.remove(state.children[0].id);
                }
            };
            StateStore.prototype.getStatesToProcess = function () {
                return this.pendingOperation;
            };
            StateStore.prototype.flushPendingOperations = function () {
                for (var id in this.pendingOperation) {
                    if (this.pendingOperation[id]) {
                        if (this.store[id].lastOperation === 50 /* Delete */) {
                            delete this.store[id];
                        }
                        else {
                            this.store[id].lastOperation = 0 /* Processed */;
                        }
                    }
                }
                this.pendingOperation = {};
            };
            StateStore.prototype.getNewId = function () {
                return ++this.idGenerator;
            };
            return StateStore;
        }());
        EmbeddedFrontend.StateStore = StateStore;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CaptureMenuComponent = /** @class */ (function (_super) {
            __extends(CaptureMenuComponent, _super);
            function CaptureMenuComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            CaptureMenuComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["<div>\n                <div childrenContainer=\"true\" class=\"captureMenuComponent ", "\">\n                </div>\n                <div class=\"captureMenuLogComponent ", "\">\n                    <span class=\"", "\">", "<span>\n                </div>\n            </div>"], _a.raw = ["<div>\n                <div childrenContainer=\"true\" class=\"captureMenuComponent ", "\">\n                </div>\n                <div class=\"captureMenuLogComponent ", "\">\n                    <span class=\"", "\">", "<span>\n                </div>\n            </div>"], this.htmlTemplate(_a, state ? "active" : "", state.logVisible ? "active" : "", state.logLevel === SPECTOR.LogLevel.error ? "error" : "", state.logText));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return CaptureMenuComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CaptureMenuComponent = CaptureMenuComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CaptureMenuActionsComponent = /** @class */ (function (_super) {
            __extends(CaptureMenuActionsComponent, _super);
            function CaptureMenuActionsComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.onCaptureRequested = _this.createEvent("onCaptureRequested");
                _this.onPlayRequested = _this.createEvent("onPlayRequested");
                _this.onPauseRequested = _this.createEvent("onPauseRequested");
                _this.onPlayNextFrameRequested = _this.createEvent("onPlayNextFrameRequested");
                return _this;
            }
            CaptureMenuActionsComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <div class=\"captureMenuActionsComponent\">\n                <div commandName=\"onCaptureRequested\">\n                </div>\n                $", "\n            </div>"], _a.raw = ["\n            <div class=\"captureMenuActionsComponent\">\n                <div commandName=\"onCaptureRequested\">\n                </div>\n                $",
                    "\n            </div>"], this.htmlTemplate(_a, !state ?
                    "<div commandName=\"onPlayRequested\">\n                    </div>\n                    <div commandName=\"onPlayNextFrameRequested\">\n                    </div>"
                    :
                        "<div commandName=\"onPauseRequested\">\n                    </div>"));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return CaptureMenuActionsComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CaptureMenuActionsComponent = CaptureMenuActionsComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CanvasListComponent = /** @class */ (function (_super) {
            __extends(CanvasListComponent, _super);
            function CanvasListComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.onCanvasSelection = _this.createEvent("onCanvasSelection");
                return _this;
            }
            CanvasListComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <div class=\"canvasListComponent\">\n                <span commandName=\"onCanvasSelection\">\n                    ", "\n                </span>\n                <ul childrenContainer=\"true\" style=\"", "\"></ul>\n            </div>"], _a.raw = ["\n            <div class=\"canvasListComponent\">\n                <span commandName=\"onCanvasSelection\">\n                    ", "\n                </span>\n                <ul childrenContainer=\"true\" style=\"", "\"></ul>\n            </div>"], this.htmlTemplate(_a, state.currentCanvasInformation ? state.currentCanvasInformation.id + " (" + state.currentCanvasInformation.width + "*" + state.currentCanvasInformation.height + ")" : "Choose Canvas...", state.showList ? "display:block;visibility:visible" : "display:none;visibility:hidden"));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return CanvasListComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CanvasListComponent = CanvasListComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CanvasListItemComponent = /** @class */ (function (_super) {
            __extends(CanvasListItemComponent, _super);
            function CanvasListItemComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.onCanvasSelected = _this.createEvent("onCanvasSelected");
                return _this;
            }
            CanvasListItemComponent.prototype.render = function (state, stateId) {
                var liHolder = document.createElement("li");
                var textHolder = document.createElement("span");
                textHolder.innerText = "Id: " + state.id + " - Size: " + state.width + "*" + state.height;
                liHolder.appendChild(textHolder);
                this.mapEventListener(liHolder, "click", "onCanvasSelected", state, stateId);
                return liHolder;
            };
            return CanvasListItemComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CanvasListItemComponent = CanvasListItemComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var FpsCounterComponent = /** @class */ (function (_super) {
            __extends(FpsCounterComponent, _super);
            function FpsCounterComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            FpsCounterComponent.prototype.render = function (state, stateId) {
                var textHolder = document.createElement("span");
                textHolder.className = "fpsCounterComponent";
                textHolder.innerText = state.toFixed(2) + " Fps";
                return textHolder;
            };
            return FpsCounterComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.FpsCounterComponent = FpsCounterComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CaptureMenu = /** @class */ (function () {
            function CaptureMenu(options, logger) {
                var _this = this;
                this.options = options;
                this.logger = logger;
                this.rootPlaceHolder = options.rootPlaceHolder || document.body;
                this.mvx = new EmbeddedFrontend.MVX(this.rootPlaceHolder, logger);
                this.isTrackingCanvas = false;
                this.onCanvasSelected = new options.eventConstructor();
                this.onCaptureRequested = new options.eventConstructor();
                this.onPauseRequested = new options.eventConstructor();
                this.onPlayRequested = new options.eventConstructor();
                this.onPlayNextFrameRequested = new options.eventConstructor();
                this.captureMenuComponent = new EmbeddedFrontend.CaptureMenuComponent(options.eventConstructor, logger);
                this.canvasListComponent = new EmbeddedFrontend.CanvasListComponent(options.eventConstructor, logger);
                this.canvasListItemComponent = new EmbeddedFrontend.CanvasListItemComponent(this.options.eventConstructor, this.logger);
                this.actionsComponent = new EmbeddedFrontend.CaptureMenuActionsComponent(options.eventConstructor, logger);
                this.fpsCounterComponent = new EmbeddedFrontend.FpsCounterComponent(options.eventConstructor, logger);
                this.rootStateId = this.mvx.addRootState({
                    visible: true,
                    logLevel: SPECTOR.LogLevel.info,
                    logText: CaptureMenu.SelectCanvasHelpText,
                    logVisible: !this.options.hideLog,
                }, this.captureMenuComponent);
                this.canvasListStateId = this.mvx.addChildState(this.rootStateId, { currentCanvasInformation: null, showList: false }, this.canvasListComponent);
                this.actionsStateId = this.mvx.addChildState(this.rootStateId, true, this.actionsComponent);
                this.fpsStateId = this.mvx.addChildState(this.rootStateId, 0, this.fpsCounterComponent);
                this.actionsComponent.onCaptureRequested.add(function () {
                    var currentCanvasInformation = _this.getSelectedCanvasInformation();
                    if (currentCanvasInformation) {
                        _this.updateMenuStateLog(SPECTOR.LogLevel.info, CaptureMenu.PleaseWaitHelpText, true);
                    }
                    // Defer to ensure the log displays.
                    setTimeout(function () {
                        _this.onCaptureRequested.trigger(currentCanvasInformation);
                    }, 200);
                });
                this.actionsComponent.onPauseRequested.add(function () {
                    _this.onPauseRequested.trigger(_this.getSelectedCanvasInformation());
                    _this.mvx.updateState(_this.actionsStateId, false);
                });
                this.actionsComponent.onPlayRequested.add(function () {
                    _this.onPlayRequested.trigger(_this.getSelectedCanvasInformation());
                    _this.mvx.updateState(_this.actionsStateId, true);
                });
                this.actionsComponent.onPlayNextFrameRequested.add(function () {
                    _this.onPlayNextFrameRequested.trigger(_this.getSelectedCanvasInformation());
                });
                this.canvasListComponent.onCanvasSelection.add(function (eventArgs) {
                    _this.mvx.updateState(_this.canvasListStateId, {
                        currentCanvasInformation: null,
                        showList: !eventArgs.state.showList,
                    });
                    _this.updateMenuStateLog(SPECTOR.LogLevel.info, CaptureMenu.SelectCanvasHelpText);
                    _this.onCanvasSelected.trigger(null);
                    if (_this.isTrackingCanvas) {
                        _this.trackPageCanvases();
                    }
                    if (eventArgs.state.showList) {
                        _this.showMenuStateLog();
                    }
                    else {
                        _this.hideMenuStateLog();
                    }
                });
                this.canvasListItemComponent.onCanvasSelected.add(function (eventArgs) {
                    _this.mvx.updateState(_this.canvasListStateId, {
                        currentCanvasInformation: eventArgs.state,
                        showList: false,
                    });
                    _this.onCanvasSelected.trigger(eventArgs.state);
                    _this.updateMenuStateLog(SPECTOR.LogLevel.info, CaptureMenu.ActionsHelpText);
                    _this.showMenuStateLog();
                });
            }
            CaptureMenu.prototype.getSelectedCanvasInformation = function () {
                var canvasListState = this.mvx.getGenericState(this.canvasListStateId);
                return canvasListState.currentCanvasInformation;
            };
            CaptureMenu.prototype.trackPageCanvases = function () {
                this.isTrackingCanvas = true;
                if (document.body) {
                    var canvases = document.body.querySelectorAll("canvas");
                    this.updateCanvasesList(canvases);
                }
            };
            CaptureMenu.prototype.updateCanvasesList = function (canvases) {
                this.updateCanvasesListInformationInternal(canvases, function (info) {
                    return {
                        id: info.id,
                        width: info.width,
                        height: info.height,
                        ref: info,
                    };
                });
            };
            CaptureMenu.prototype.updateCanvasesListInformation = function (canvasesInformation) {
                this.updateCanvasesListInformationInternal(canvasesInformation, function (info) {
                    return {
                        id: info.id,
                        width: info.width,
                        height: info.height,
                        ref: info.ref,
                    };
                });
            };
            CaptureMenu.prototype.display = function () {
                this.updateMenuStateVisibility(true);
            };
            CaptureMenu.prototype.hide = function () {
                this.updateMenuStateVisibility(false);
            };
            CaptureMenu.prototype.captureComplete = function (errorText) {
                if (errorText) {
                    this.updateMenuStateLog(SPECTOR.LogLevel.error, errorText);
                }
                else {
                    this.updateMenuStateLog(SPECTOR.LogLevel.info, CaptureMenu.ActionsHelpText);
                }
            };
            CaptureMenu.prototype.setFPS = function (fps) {
                this.mvx.updateState(this.fpsStateId, fps);
            };
            CaptureMenu.prototype.updateCanvasesListInformationInternal = function (canvasesInformation, convertToListInfo) {
                // Create a consumable information list for the view.
                this.mvx.removeChildrenStates(this.canvasListStateId);
                var canvasesInformationClone = [];
                for (var i = 0; i < canvasesInformation.length; i++) {
                    var canvas = canvasesInformation[i];
                    var canvasInformationClone = convertToListInfo(canvas);
                    canvasesInformationClone.push(canvasInformationClone);
                    this.mvx.addChildState(this.canvasListStateId, canvasInformationClone, this.canvasListItemComponent);
                }
                // Auto Select in the list if only one canvas.
                var canvasesCount = canvasesInformationClone.length;
                var canvasListState = this.mvx.getGenericState(this.canvasListStateId);
                var visible = canvasListState.showList;
                if (!visible) {
                    if (canvasesCount === 1) {
                        var canvasToSelect = canvasesInformationClone[0];
                        this.mvx.updateState(this.canvasListStateId, {
                            currentCanvasInformation: canvasToSelect,
                            showList: visible,
                        });
                        this.updateMenuStateLog(SPECTOR.LogLevel.info, CaptureMenu.ActionsHelpText);
                        this.onCanvasSelected.trigger(canvasToSelect);
                    }
                    else {
                        this.updateMenuStateLog(SPECTOR.LogLevel.info, CaptureMenu.SelectCanvasHelpText);
                        this.onCanvasSelected.trigger(null);
                    }
                }
            };
            CaptureMenu.prototype.hideMenuStateLog = function () {
                var menuState = this.mvx.getGenericState(this.rootStateId);
                this.mvx.updateState(this.rootStateId, {
                    visible: menuState.visible,
                    logLevel: menuState.logLevel,
                    logText: menuState.logText,
                    logVisible: false,
                });
            };
            CaptureMenu.prototype.showMenuStateLog = function () {
                var menuState = this.mvx.getGenericState(this.rootStateId);
                this.mvx.updateState(this.rootStateId, {
                    visible: menuState.visible,
                    logLevel: menuState.logLevel,
                    logText: menuState.logText,
                    logVisible: !this.options.hideLog,
                });
            };
            CaptureMenu.prototype.updateMenuStateLog = function (logLevel, logText, immediate) {
                if (immediate === void 0) { immediate = false; }
                var menuState = this.mvx.getGenericState(this.rootStateId);
                this.mvx.updateState(this.rootStateId, {
                    visible: menuState.visible,
                    logLevel: logLevel,
                    logText: logText,
                    logVisible: !this.options.hideLog,
                }, immediate);
            };
            CaptureMenu.prototype.updateMenuStateVisibility = function (visible) {
                var menuState = this.mvx.getGenericState(this.rootStateId);
                this.mvx.updateState(this.rootStateId, {
                    visible: visible,
                    logLevel: menuState.logLevel,
                    logText: menuState.logText,
                    logVisible: menuState.logVisible,
                });
            };
            CaptureMenu.SelectCanvasHelpText = "Please, select a canvas in the list above.";
            CaptureMenu.ActionsHelpText = "Record with the red button, you can also pause or continue playing the current scene.";
            CaptureMenu.PleaseWaitHelpText = "Capturing, be patient (this can take up to 3 minutes)...";
            return CaptureMenu;
        }());
        EmbeddedFrontend.CaptureMenu = CaptureMenu;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CaptureListComponent = /** @class */ (function (_super) {
            __extends(CaptureListComponent, _super);
            function CaptureListComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.onCaptureLoaded = new _this.eventConstructor();
                return _this;
            }
            CaptureListComponent.prototype.render = function (state, stateId) {
                var _this = this;
                var htmlString = (_a = ["\n            <div class=\"captureListComponent ", "\">\n                <div class=\"openCaptureFile\">\n                    <Span>Drag files here to open a previously saved capture.</span>\n                </div>\n                <ul childrenContainer=\"true\"></ul>\n            </div>"], _a.raw = ["\n            <div class=\"captureListComponent ", "\">\n                <div class=\"openCaptureFile\">\n                    <Span>Drag files here to open a previously saved capture.</span>\n                </div>\n                <ul childrenContainer=\"true\"></ul>\n            </div>"], this.htmlTemplate(_a, state ? "active" : ""));
                var element = this.renderElementFromTemplate(htmlString, state, stateId);
                var openCaptureFileElement = element.querySelector(".openCaptureFile");
                openCaptureFileElement.addEventListener("dragenter", function (e) { _this.drag(e); return false; }, false);
                openCaptureFileElement.addEventListener("dragover", function (e) { _this.drag(e); return false; }, false);
                openCaptureFileElement.addEventListener("drop", function (e) { _this.drop(e); }, false);
                return element;
                var _a;
            };
            CaptureListComponent.prototype.drag = function (e) {
                e.stopPropagation();
                e.preventDefault();
            };
            CaptureListComponent.prototype.drop = function (eventDrop) {
                eventDrop.stopPropagation();
                eventDrop.preventDefault();
                this.loadFiles(eventDrop);
            };
            CaptureListComponent.prototype.loadFiles = function (event) {
                var _this = this;
                var filesToLoad = null;
                // Handling data transfer via drag'n'drop
                if (event && event.dataTransfer && event.dataTransfer.files) {
                    filesToLoad = event.dataTransfer.files;
                }
                // Handling files from input files
                if (event && event.target && event.target.files) {
                    filesToLoad = event.target.files;
                }
                // Load the files.
                if (filesToLoad && filesToLoad.length > 0) {
                    var _loop_1 = function (i) {
                        var name_4 = filesToLoad[i].name.toLowerCase();
                        var extension = name_4.split(".").pop();
                        var type = filesToLoad[i].type;
                        if (extension === "json") {
                            var fileToLoad_1 = filesToLoad[i];
                            var reader = new FileReader();
                            reader.onerror = function (e) {
                                _this.logger.error("Error while reading file: " + fileToLoad_1.name + e);
                            };
                            reader.onload = function (e) {
                                // target doesn't have result from ts 1.3
                                try {
                                    var capture = JSON.parse(e.target["result"]);
                                    _this.onCaptureLoaded.trigger(capture);
                                }
                                catch (exception) {
                                    _this.logger.error("Error while reading file: " + fileToLoad_1.name + exception);
                                }
                            };
                            reader.readAsText(fileToLoad_1);
                        }
                    };
                    for (var i = 0; i < filesToLoad.length; i++) {
                        _loop_1(i);
                    }
                }
            };
            return CaptureListComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CaptureListComponent = CaptureListComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CaptureListItemComponent = /** @class */ (function (_super) {
            __extends(CaptureListItemComponent, _super);
            function CaptureListItemComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.onCaptureSelected = _this.createEvent("onCaptureSelected");
                _this.onSaveRequested = _this.createEvent("onSaveRequested");
                return _this;
            }
            CaptureListItemComponent.prototype.render = function (state, stateId) {
                var liHolder = document.createElement("li");
                if (state.active) {
                    liHolder.className = "active";
                }
                if (state.capture.endState.VisualState.Attachments) {
                    for (var _i = 0, _a = state.capture.endState.VisualState.Attachments; _i < _a.length; _i++) {
                        var imageState = _a[_i];
                        var img = document.createElement("img");
                        img.src = encodeURI(imageState.src);
                        liHolder.appendChild(img);
                    }
                }
                else {
                    var status_4 = document.createElement("span");
                    status_4.innerText = state.capture.endState.VisualState.FrameBufferStatus;
                    liHolder.appendChild(status_4);
                }
                var text = document.createElement("span");
                text.innerText = new Date(state.capture.startTime).toTimeString().split(" ")[0];
                liHolder.appendChild(text);
                var save = document.createElement("a");
                save.href = "#";
                save.className = "captureListItemSave";
                this.mapEventListener(save, "click", "onSaveRequested", state, stateId, false, true);
                text.appendChild(save);
                this.mapEventListener(liHolder, "click", "onCaptureSelected", state, stateId);
                return liHolder;
            };
            return CaptureListItemComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CaptureListItemComponent = CaptureListItemComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var VisualStateListComponent = /** @class */ (function (_super) {
            __extends(VisualStateListComponent, _super);
            function VisualStateListComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            VisualStateListComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <div class=\"visualStateListComponent\">\n                <ul childrenContainer=\"true\"></ul>\n            </div>"], _a.raw = ["\n            <div class=\"visualStateListComponent\">\n                <ul childrenContainer=\"true\"></ul>\n            </div>"], this.htmlTemplate(_a));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return VisualStateListComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.VisualStateListComponent = VisualStateListComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var VisualStateListItemComponent = /** @class */ (function (_super) {
            __extends(VisualStateListItemComponent, _super);
            function VisualStateListItemComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.onVisualStateSelected = _this.createEvent("onVisualStateSelected");
                return _this;
            }
            VisualStateListItemComponent.prototype.render = function (state, stateId) {
                var liHolder = document.createElement("li");
                if (state.active) {
                    liHolder.className = "active";
                    setTimeout(function () {
                        EmbeddedFrontend.ScrollIntoViewHelper.scrollIntoView(liHolder);
                    }, 1);
                }
                if (state.VisualState.Attachments) {
                    for (var _i = 0, _a = state.VisualState.Attachments; _i < _a.length; _i++) {
                        var imageState = _a[_i];
                        if (!imageState.src) {
                            continue;
                        }
                        var img = document.createElement("img");
                        img.src = encodeURI(imageState.src);
                        liHolder.appendChild(img);
                        if (state.VisualState.Attachments.length > 1) {
                            var attachment = document.createElement("span");
                            attachment.innerText = imageState.attachmentName;
                            liHolder.appendChild(attachment);
                        }
                        if (imageState.textureLayer) {
                            var layer = document.createElement("span");
                            layer.innerText = "Layer: " + imageState.textureLayer;
                            liHolder.appendChild(layer);
                        }
                        if (imageState.textureCubeMapFace) {
                            var face = document.createElement("span");
                            face.innerText = imageState.textureCubeMapFace;
                            liHolder.appendChild(face);
                        }
                    }
                }
                else {
                    var status_5 = document.createElement("span");
                    status_5.innerText = state.VisualState.FrameBufferStatus;
                    liHolder.appendChild(status_5);
                }
                var fbo = document.createElement("span");
                fbo.innerText = (state.VisualState.FrameBuffer) ?
                    "Frame buffer: " + state.VisualState.FrameBuffer.__SPECTOR_Object_TAG.id :
                    "Canvas frame buffer";
                liHolder.appendChild(fbo);
                this.mapEventListener(liHolder, "click", "onVisualStateSelected", state, stateId);
                return liHolder;
            };
            return VisualStateListItemComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.VisualStateListItemComponent = VisualStateListItemComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CommandListComponent = /** @class */ (function (_super) {
            __extends(CommandListComponent, _super);
            function CommandListComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            CommandListComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <div class=\"commandListComponent\">\n                <ul childrenContainer=\"true\"></ul>\n            </div>"], _a.raw = ["\n            <div class=\"commandListComponent\">\n                <ul childrenContainer=\"true\"></ul>\n            </div>"], this.htmlTemplate(_a));
                var element = this.renderElementFromTemplate(htmlString, state, stateId);
                return element;
                var _a;
            };
            return CommandListComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CommandListComponent = CommandListComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CommandListItemComponent = /** @class */ (function (_super) {
            __extends(CommandListItemComponent, _super);
            function CommandListItemComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.onCommandSelected = _this.createEvent("onCommandSelected");
                _this.onVertexSelected = _this.createEvent("onVertexSelected");
                _this.onFragmentSelected = _this.createEvent("onFragmentSelected");
                return _this;
            }
            CommandListItemComponent.prototype.render = function (state, stateId) {
                var liHolder = document.createElement("li");
                var status = "unknown";
                switch (state.capture.status) {
                    case 50 /* Deprecated */:
                        status = "deprecated";
                        break;
                    case 10 /* Unused */:
                        status = "unused";
                        break;
                    case 20 /* Disabled */:
                        status = "disabled";
                        break;
                    case 30 /* Redundant */:
                        status = "redundant";
                        break;
                    case 40 /* Valid */:
                        status = "valid";
                        break;
                }
                if (state.capture.VisualState) {
                    liHolder.className = " drawCall";
                }
                if (state.active) {
                    liHolder.className = " active";
                    setTimeout(function () {
                        EmbeddedFrontend.ScrollIntoViewHelper.scrollIntoView(liHolder);
                    }, 1);
                }
                if (state.capture.marker) {
                    var markerElement = document.createElement("span");
                    markerElement.className = status + " marker important";
                    markerElement.innerText = state.capture.marker + " ";
                    markerElement.style.fontWeight = "1000";
                    liHolder.appendChild(markerElement);
                }
                var textElement = document.createElement("span");
                var text = state.capture.text;
                text = text.replace(state.capture.name, "<span class=\" " + status + " important\">" + state.capture.name + "</span>");
                textElement.innerHTML = text;
                liHolder.appendChild(textElement);
                if (state.capture.VisualState && state.capture.name !== "clear") {
                    try {
                        var vertexShader = state.capture.DrawCall.shaders[0];
                        var fragmentShader = state.capture.DrawCall.shaders[1];
                        var vertexElement = document.createElement("a");
                        vertexElement.innerText = vertexShader.name;
                        vertexElement.href = "#";
                        liHolder.appendChild(vertexElement);
                        this.mapEventListener(vertexElement, "click", "onVertexSelected", state, stateId);
                        var fragmentElement = document.createElement("a");
                        fragmentElement.innerText = fragmentShader.name;
                        fragmentElement.href = "#";
                        liHolder.appendChild(fragmentElement);
                        this.mapEventListener(fragmentElement, "click", "onFragmentSelected", state, stateId);
                    }
                    catch (e) {
                        // Do nothing but prevent crashing.
                    }
                }
                this.mapEventListener(liHolder, "click", "onCommandSelected", state, stateId);
                return liHolder;
            };
            return CommandListItemComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CommandListItemComponent = CommandListItemComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var CommandDetailComponent = /** @class */ (function (_super) {
            __extends(CommandDetailComponent, _super);
            function CommandDetailComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            CommandDetailComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <div class=\"commandDetailComponent\" childrenContainer=\"true\">\n            </div>"], _a.raw = ["\n            <div class=\"commandDetailComponent\" childrenContainer=\"true\">\n            </div>"], this.htmlTemplate(_a));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return CommandDetailComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.CommandDetailComponent = CommandDetailComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var MDNCommandLinkHelper = /** @class */ (function () {
            function MDNCommandLinkHelper() {
            }
            MDNCommandLinkHelper.getMDNLink = function (commandName) {
                var webgl2Name = MDNCommandLinkHelper.WebGL2Functions[commandName];
                if (webgl2Name) {
                    return MDNCommandLinkHelper.WebGL2RootUrl + webgl2Name;
                }
                var webglName = MDNCommandLinkHelper.WebGLFunctions[commandName];
                if (webglName) {
                    return MDNCommandLinkHelper.WebGLRootUrl + webglName;
                }
                return MDNCommandLinkHelper.WebGLRootUrl + commandName;
            };
            MDNCommandLinkHelper.WebGL2RootUrl = "https://developer.mozilla.org/en-US/docs/Web/API/WebGL2RenderingContext/";
            MDNCommandLinkHelper.WebGLRootUrl = "https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/";
            MDNCommandLinkHelper.WebGL2Functions = {
                beginQuery: "beginQuery",
                beginTransformFeedback: "beginTransformFeedback",
                bindBufferBase: "bindBufferBase",
                bindBufferRange: "bindBufferRange",
                bindSampler: "bindSampler",
                bindTransformFeedback: "bindTransformFeedback",
                bindVertexArray: "bindVertexArray",
                blitFramebuffer: "blitFramebuffer",
                clearBufferfv: "clearBuffer",
                clearBufferiv: "clearBuffer",
                clearBufferuiv: "clearBuffer",
                clearBufferfi: "clearBuffer",
                clientWaitSync: "clientWaitSync",
                compressedTexImage3D: "compressedTexImage3D",
                compressedTexSubImage3D: "compressedTexSubImage3D",
                copyBufferSubData: "copyBufferSubData",
                copyTexSubImage3D: "copyTexSubImage3D",
                createQuery: "createQuery",
                createSampler: "createSampler",
                createTransformFeedback: "createTransformFeedback",
                createVertexArray: "createVertexArray",
                deleteQuery: "deleteQuery",
                deleteSampler: "deleteSampler",
                deleteSync: "deleteSync",
                deleteTransformFeedback: "deleteTransformFeedback",
                deleteVertexArray: "deleteVertexArray",
                drawArraysInstanced: "drawArraysInstanced",
                drawBuffers: "drawBuffers",
                drawElementsInstanced: "drawElementsInstanced",
                drawRangeElements: "drawRangeElements",
                endQuery: "endQuery",
                endTransformFeedback: "endTransformFeedback",
                fenceSync: "fenceSync",
                framebufferTextureLayer: "framebufferTextureLayer",
                getActiveUniformBlockName: "getActiveUniformBlockName",
                getActiveUniformBlockParameter: "getActiveUniformBlockParameter",
                getActiveUniforms: "getActiveUniforms",
                getBufferSubData: "getBufferSubData",
                getFragDataLocation: "getFragDataLocation",
                getIndexedParameter: "getIndexedParameter",
                getInternalformatParameter: "getInternalformatParameter",
                getQuery: "getQuery",
                getQueryParameter: "getQueryParameter",
                getSamplerParameter: "getSamplerParameter",
                getSyncParameter: "getSyncParameter",
                getTransformFeedbackVarying: "getTransformFeedbackVarying",
                getUniformBlockIndex: "getUniformBlockIndex",
                getUniformIndices: "getUniformIndices",
                invalidateFramebuffer: "invalidateFramebuffer",
                invalidateSubFramebuffer: "invalidateSubFramebuffer",
                isQuery: "isQuery",
                isSampler: "isSampler",
                isSync: "isSync",
                isTransformFeedback: "isTransformFeedback",
                isVertexArray: "isVertexArray",
                pauseTransformFeedback: "pauseTransformFeedback",
                readBuffer: "readBuffer",
                renderbufferStorageMultisample: "renderbufferStorageMultisample",
                resumeTransformFeedback: "resumeTransformFeedback",
                samplerParameteri: "samplerParameter",
                samplerParameterf: "samplerParameter",
                texImage3D: "texImage3D",
                texStorage2D: "texStorage2D",
                texStorage3D: "texStorage3D",
                texSubImage3D: "texSubImage3D",
                transformFeedbackVaryings: "transformFeedbackVaryings",
                uniform1ui: "uniform",
                uniform2ui: "uniform",
                uniform3ui: "uniform",
                uniform4ui: "uniform",
                uniform1fv: "uniform",
                uniform2fv: "uniform",
                uniform3fv: "uniform",
                uniform4fv: "uniform",
                uniform1iv: "uniform",
                uniform2iv: "uniform",
                uniform3iv: "uniform",
                uniform4iv: "uniform",
                uniform1uiv: "uniform",
                uniform2uiv: "uniform",
                uniform3uiv: "uniform",
                uniform4uiv: "uniform",
                uniformBlockBinding: "uniformBlockBinding",
                uniformMatrix2fv: "uniformMatrix",
                uniformMatrix3x2fv: "uniformMatrix",
                uniformMatrix4x2fv: "uniformMatrix",
                uniformMatrix2x3fv: "uniformMatrix",
                uniformMatrix3fv: "uniformMatrix",
                uniformMatrix4x3fv: "uniformMatrix",
                uniformMatrix2x4fv: "uniformMatrix",
                uniformMatrix3x4fv: "uniformMatrix",
                uniformMatrix4fv: "uniformMatrix",
                vertexAttribDivisor: "vertexAttribDivisor",
                vertexAttribI4i: "vertexAttribI",
                vertexAttribI4ui: "vertexAttribI",
                vertexAttribI4iv: "vertexAttribI",
                vertexAttribI4uiv: "vertexAttribI",
                vertexAttribIPointer: "vertexAttribIPointer",
                waitSync: "waitSync",
            };
            MDNCommandLinkHelper.WebGLFunctions = {
                uniform1f: "uniform",
                uniform1fv: "uniform",
                uniform1i: "uniform",
                uniform1iv: "uniform",
                uniform2f: "uniform",
                uniform2fv: "uniform",
                uniform2i: "uniform",
                uniform2iv: "uniform",
                uniform3f: "uniform",
                uniform3i: "uniform",
                uniform3iv: "uniform",
                uniform4f: "uniform",
                uniform4fv: "uniform",
                uniform4i: "uniform",
                uniform4iv: "uniform",
                uniformMatrix2fv: "uniformMatrix",
                uniformMatrix3fv: "uniformMatrix",
                uniformMatrix4fv: "uniformMatrix",
                vertexAttrib1f: "vertexAttrib",
                vertexAttrib2f: "vertexAttrib",
                vertexAttrib3f: "vertexAttrib",
                vertexAttrib4f: "vertexAttrib",
                vertexAttrib1fv: "vertexAttrib",
                vertexAttrib2fv: "vertexAttrib",
                vertexAttrib3fv: "vertexAttrib",
                vertexAttrib4fv: "vertexAttrib",
            };
            return MDNCommandLinkHelper;
        }());
        EmbeddedFrontend.MDNCommandLinkHelper = MDNCommandLinkHelper;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var JSONContentComponent = /** @class */ (function (_super) {
            __extends(JSONContentComponent, _super);
            function JSONContentComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            JSONContentComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <div class=\"jsonContentComponent\" childrenContainer=\"true\">\n            </div>"], _a.raw = ["\n            <div class=\"jsonContentComponent\" childrenContainer=\"true\">\n            </div>"], this.htmlTemplate(_a));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return JSONContentComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.JSONContentComponent = JSONContentComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var JSONGroupComponent = /** @class */ (function (_super) {
            __extends(JSONGroupComponent, _super);
            function JSONGroupComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            JSONGroupComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <div class=\"jsonGroupComponent\">\n                <div class=\"jsonGroupComponentTitle\">", "</div>\n                <ul childrenContainer=\"true\"></ul>\n            </div>"], _a.raw = ["\n            <div class=\"jsonGroupComponent\">\n                <div class=\"jsonGroupComponentTitle\">", "</div>\n                <ul childrenContainer=\"true\"></ul>\n            </div>"], this.htmlTemplate(_a, state ? state.replace(/([A-Z])/g, " $1").trim() : ""));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return JSONGroupComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.JSONGroupComponent = JSONGroupComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var JSONItemComponent = /** @class */ (function (_super) {
            __extends(JSONItemComponent, _super);
            function JSONItemComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            JSONItemComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <li><span class=\"jsonItemComponentKey\">", ": </span><span class=\"jsonItemComponentValue\">", "</span><li>"], _a.raw = ["\n            <li><span class=\"jsonItemComponentKey\">", ": </span><span class=\"jsonItemComponentValue\">", "</span><li>"], this.htmlTemplate(_a, state.key, state.value));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return JSONItemComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.JSONItemComponent = JSONItemComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var JSONImageItemComponent = /** @class */ (function (_super) {
            __extends(JSONImageItemComponent, _super);
            function JSONImageItemComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            JSONImageItemComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <li class=\"jsonItemImageHolder\"><div class=\"jsonItemImage\"><img src=\"", "\"/><span>", "</span></div></li>"], _a.raw = ["\n            <li class=\"jsonItemImageHolder\"><div class=\"jsonItemImage\"><img src=\"", "\"/><span>", "</span></div></li>"], this.htmlTemplate(_a, state.value, state.key));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return JSONImageItemComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.JSONImageItemComponent = JSONImageItemComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var JSONSourceItemComponent = /** @class */ (function (_super) {
            __extends(JSONSourceItemComponent, _super);
            function JSONSourceItemComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.onOpenSourceClicked = _this.createEvent("onOpenSourceClicked");
                return _this;
            }
            JSONSourceItemComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <li commandName=\"onOpenSourceClicked\"><span class=\"jsonItemComponentKey\">", ": </span><span class=\"jsonSourceItemComponentOpen\">Click to Open.</span><li>"], _a.raw = ["\n            <li commandName=\"onOpenSourceClicked\"><span class=\"jsonItemComponentKey\">", ": </span><span class=\"jsonSourceItemComponentOpen\">Click to Open.</span><li>"], this.htmlTemplate(_a, state.key));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return JSONSourceItemComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.JSONSourceItemComponent = JSONSourceItemComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var JSONHelpItemComponent = /** @class */ (function (_super) {
            __extends(JSONHelpItemComponent, _super);
            function JSONHelpItemComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            JSONHelpItemComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <li><span class=\"jsonItemComponentKey\">", ": </span>\n                <span class=\"jsonItemComponentValue\">", " (<a href=\"", "\" target=\"_blank\" class=\"jsonSourceItemComponentOpen\">Open help page</a>)\n                </span>\n            <li>"], _a.raw = ["\n            <li><span class=\"jsonItemComponentKey\">", ": </span>\n                <span class=\"jsonItemComponentValue\">", " (<a href=\"", "\" target=\"_blank\" class=\"jsonSourceItemComponentOpen\">Open help page</a>)\n                </span>\n            <li>"], this.htmlTemplate(_a, state.key, state.value, state.help));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return JSONHelpItemComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.JSONHelpItemComponent = JSONHelpItemComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var JSONVisualStateItemComponent = /** @class */ (function (_super) {
            __extends(JSONVisualStateItemComponent, _super);
            function JSONVisualStateItemComponent() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            JSONVisualStateItemComponent.prototype.render = function (state, stateId) {
                var divHolder = document.createElement("div");
                divHolder.className = "jsonVisualStateItemComponent";
                if (state.Attachments) {
                    for (var _i = 0, _a = state.Attachments; _i < _a.length; _i++) {
                        var imageState = _a[_i];
                        if (!imageState.src) {
                            continue;
                        }
                        var img = document.createElement("img");
                        img.src = encodeURI(imageState.src);
                        divHolder.appendChild(img);
                        if (state.Attachments.length > 1) {
                            var attachment = document.createElement("span");
                            attachment.innerText = imageState.attachmentName;
                            divHolder.appendChild(attachment);
                        }
                    }
                }
                else {
                    var status_6 = document.createElement("span");
                    status_6.innerText = state.FrameBufferStatus;
                    divHolder.appendChild(status_6);
                }
                var fbo = document.createElement("span");
                fbo.innerText = state.FrameBuffer ? state.FrameBuffer.__SPECTOR_Object_TAG.displayText : "Canvas frame buffer";
                divHolder.appendChild(fbo);
                return divHolder;
            };
            return JSONVisualStateItemComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.JSONVisualStateItemComponent = JSONVisualStateItemComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var ResultViewMenuComponent = /** @class */ (function (_super) {
            __extends(ResultViewMenuComponent, _super);
            function ResultViewMenuComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.onCapturesClicked = _this.createEvent("onCapturesClicked");
                _this.onCommandsClicked = _this.createEvent("onCommandsClicked");
                _this.onInformationClicked = _this.createEvent("onInformationClicked");
                _this.onInitStateClicked = _this.createEvent("onInitStateClicked");
                _this.onEndStateClicked = _this.createEvent("onEndStateClicked");
                _this.onCloseClicked = _this.createEvent("onCloseClicked");
                _this.onSearchTextChanged = _this.createEvent("onSearchTextChanged");
                _this.onSearchTextCleared = _this.createEvent("onSearchTextCleared");
                return _this;
            }
            ResultViewMenuComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["<ul class=\"resultViewMenuComponent\">\n                <li class=\"resultViewMenuOpen resultViewMenuSmall\"><a href=\"#\" role=\"button\">Menu</a></li>\n\n                <li class=\"searchContainer\">\n                    <input type=\"text\" placeHolder=\"Search...\" value=\"", "\" commandName=\"onSearchTextChanged\" commandEventBinding=\"change\">\n                    <a class=\"clearSearch\" href=\"#\" CommandName=\"onSearchTextCleared\">X</a>\n                </li>\n                <li><a class=\"", " href=\"#\" role=\"button\" commandName=\"onCapturesClicked\">Captures</a></li>\n                <li><a class=\"", " href=\"#\" role=\"button\" commandName=\"onInformationClicked\">Information</a></li>\n                <li><a class=\"", " href=\"#\" role=\"button\" commandName=\"onInitStateClicked\">Init State</a></li>\n                <li>\n                    <a class=\"", " href=\"#\" role=\"button\" commandName=\"onCommandsClicked\">\n                        Commands", "\n                    </a>\n                </li>\n                <li><a class=\"", " href=\"#\" role=\"button\" commandName=\"onEndStateClicked\">End State</a></li>\n                <li><a href=\"#\" role=\"button\" commandName=\"onCloseClicked\">Close</a></li>\n            </ul>"], _a.raw = ["<ul class=\"resultViewMenuComponent\">\n                <li class=\"resultViewMenuOpen resultViewMenuSmall\"><a href=\"#\" role=\"button\">Menu</a></li>\n\n                <li class=\"searchContainer\">\n                    <input type=\"text\" placeHolder=\"Search...\" value=\"", "\" commandName=\"onSearchTextChanged\" commandEventBinding=\"change\">\n                    <a class=\"clearSearch\" href=\"#\" CommandName=\"onSearchTextCleared\">X</a>\n                </li>\n                <li><a class=\"", " href=\"#\" role=\"button\" commandName=\"onCapturesClicked\">Captures</a></li>\n                <li><a class=\"", " href=\"#\" role=\"button\" commandName=\"onInformationClicked\">Information</a></li>\n                <li><a class=\"", " href=\"#\" role=\"button\" commandName=\"onInitStateClicked\">Init State</a></li>\n                <li>\n                    <a class=\"", " href=\"#\" role=\"button\" commandName=\"onCommandsClicked\">\n                        Commands", "\n                    </a>\n                </li>\n                <li><a class=\"", " href=\"#\" role=\"button\" commandName=\"onEndStateClicked\">End State</a></li>\n                <li><a href=\"#\" role=\"button\" commandName=\"onCloseClicked\">Close</a></li>\n            </ul>"], this.htmlTemplate(_a, state.searchText, state.status === 0 /* Captures */ ? "active" : "", state.status === 10 /* Information */ ? "active" : "", state.status === 20 /* InitState */ ? "active" : "", state.status === 40 /* Commands */ ? "active" : "", state.commandCount > 0 ? " (" + state.commandCount + ")" : "", state.status === 30 /* EndState */ ? "active" : ""));
                var element = this.renderElementFromTemplate(htmlString, state, stateId);
                var openButton = element.querySelector(".resultViewMenuOpen");
                var lis = element.querySelectorAll("li:not(.resultViewMenuSmall)");
                openButton.addEventListener("click", function (_) {
                    if (openButton.getAttribute("open") === "true") {
                        openButton.setAttribute("open", "false");
                        for (var i = 0; i < lis.length; i++) {
                            lis[i].style.display = "none";
                            lis[i].style.visibility = "hidden";
                        }
                    }
                    else {
                        openButton.setAttribute("open", "true");
                        for (var i = 0; i < lis.length; i++) {
                            lis[i].style.display = "block";
                            lis[i].style.visibility = "visible";
                        }
                    }
                });
                return element;
                var _a;
            };
            return ResultViewMenuComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.ResultViewMenuComponent = ResultViewMenuComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var ResultViewContentComponent = /** @class */ (function (_super) {
            __extends(ResultViewContentComponent, _super);
            function ResultViewContentComponent(eventConstructor, logger) {
                return _super.call(this, eventConstructor, logger) || this;
            }
            ResultViewContentComponent.prototype.render = function (state, stateId) {
                var htmlString = '<div childrenContainer="true" class="resultViewContentComponent"></div>';
                return this.renderElementFromTemplate(htmlString, state, stateId);
            };
            return ResultViewContentComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.ResultViewContentComponent = ResultViewContentComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var InformationColumnComponent = /** @class */ (function (_super) {
            __extends(InformationColumnComponent, _super);
            function InformationColumnComponent(eventConstructor, logger) {
                return _super.call(this, eventConstructor, logger) || this;
            }
            InformationColumnComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n                <div childrenContainer=\"true\" class=\"", "\"></div>"], _a.raw = ["\n                <div childrenContainer=\"true\" class=\"", "\"></div>"], this.htmlTemplate(_a, state ? "informationColumnLeftComponent" : "informationColumnRightComponent"));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return InformationColumnComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.InformationColumnComponent = InformationColumnComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var ResultViewComponent = /** @class */ (function (_super) {
            __extends(ResultViewComponent, _super);
            function ResultViewComponent(eventConstructor, logger) {
                return _super.call(this, eventConstructor, logger) || this;
            }
            ResultViewComponent.prototype.render = function (state, stateId) {
                var htmlString = (_a = ["\n            <div childrenContainer=\"true\" class=\"resultViewComponent ", "\">\n            </div>"], _a.raw = ["\n            <div childrenContainer=\"true\" class=\"resultViewComponent ", "\">\n            </div>"], this.htmlTemplate(_a, state ? "active" : ""));
                return this.renderElementFromTemplate(htmlString, state, stateId);
                var _a;
            };
            return ResultViewComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.ResultViewComponent = ResultViewComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var SourceCodeComponent = /** @class */ (function (_super) {
            __extends(SourceCodeComponent, _super);
            function SourceCodeComponent(eventConstructor, logger) {
                var _this = _super.call(this, eventConstructor, logger) || this;
                _this.onVertexSourceClicked = _this.createEvent("onVertexSourceClicked");
                _this.onFragmentSourceClicked = _this.createEvent("onFragmentSourceClicked");
                _this.onSourceCodeCloseClicked = _this.createEvent("onSourceCodeCloseClicked");
                _this.onSourceCodeChanged = _this.createEvent("onSourceCodeChanged");
                return _this;
            }
            SourceCodeComponent.prototype.showError = function (errorMessage) {
                if (!this.editor) {
                    return;
                }
                errorMessage = errorMessage || "";
                var annotations = [];
                if (errorMessage) {
                    var errorChecker = /^.*ERROR:\W([0-9]+):([0-9]+):(.*)$/gm;
                    var errors = errorChecker.exec(errorMessage);
                    while (errors != null) {
                        annotations.push({
                            row: +errors[2] - 1,
                            column: errors[1],
                            text: errors[3] || "Error",
                            type: "error",
                        });
                        errors = errorChecker.exec(errorMessage);
                    }
                }
                this.editor.getSession().setAnnotations(annotations);
            };
            SourceCodeComponent.prototype.render = function (state, stateId) {
                var _this = this;
                var source = state.fragment ? state.sourceFragment : state.sourceVertex;
                var formattedShader = source ? this._indentIfdef(this._beautify(source)) : "";
                var htmlString = (_a = ["\n            <div class=\"sourceCodeComponentContainer\">\n                <div class=\"sourceCodeMenuComponentContainer\">\n                    <ul class=\"sourceCodeMenuComponent\">\n                        <li><a class=\"", "\" href=\"#\" role=\"button\" commandName=\"onVertexSourceClicked\">Vertex</a></li>\n                        <li><a class=\"", "\" href=\"#\" role=\"button\" commandName=\"onFragmentSourceClicked\">Fragment</a></li>\n                        <li><a href=\"#\" role=\"button\" commandName=\"onSourceCodeCloseClicked\">Close</a></li>\n                    </ul>\n                </div>\n                $", "\n            </div>"], _a.raw = ["\n            <div class=\"sourceCodeComponentContainer\">\n                <div class=\"sourceCodeMenuComponentContainer\">\n                    <ul class=\"sourceCodeMenuComponent\">\n                        <li><a class=\"", "\" href=\"#\" role=\"button\" commandName=\"onVertexSourceClicked\">Vertex</a></li>\n                        <li><a class=\"", "\" href=\"#\" role=\"button\" commandName=\"onFragmentSourceClicked\">Fragment</a></li>\n                        <li><a href=\"#\" role=\"button\" commandName=\"onSourceCodeCloseClicked\">Close</a></li>\n                    </ul>\n                </div>\n                $",
                    "\n            </div>"], this.htmlTemplate(_a, state.fragment ? "" : "active", state.fragment ? "active" : "", state.editable ? (_b = ["<div class=\"sourceCodeComponentEditable\">", "</div>"], _b.raw = ["<div class=\"sourceCodeComponentEditable\">", "</div>"], this.htmlTemplate(_b, formattedShader)) : (_c = ["<div class=\"sourceCodeComponent\">\n                        <pre class=\"language-glsl\"><code>", "</code></pre>\n                    </div>"], _c.raw = ["<div class=\"sourceCodeComponent\">\n                        <pre class=\"language-glsl\"><code>", "</code></pre>\n                    </div>"], this.htmlTemplate(_c, formattedShader))));
                var element = this.renderElementFromTemplate(htmlString.replace(/<br>/g, "\n"), state, stateId);
                if (state.editable) {
                    this.editor = ace.edit(element.querySelector(".sourceCodeComponentEditable"));
                    this.editor.setTheme("ace/theme/monokai");
                    this.editor.getSession().setMode("ace/mode/glsl");
                    this.editor.setShowPrintMargin(false);
                    var timeoutId_1 = -1;
                    this.editor.getSession().on("change", function (e) {
                        if (timeoutId_1 !== -1) {
                            clearTimeout(timeoutId_1);
                        }
                        timeoutId_1 = setTimeout(function () {
                            _this._triggerCompilation(_this.editor, state, element, stateId);
                        }, 1500);
                    });
                }
                else {
                    // Pre and Prism work on the normal carriage return.
                    Prism.highlightElement(element.querySelector("pre"));
                }
                return element;
                var _a, _b, _c;
            };
            SourceCodeComponent.prototype._triggerCompilation = function (editor, state, element, stateId) {
                if (state.fragment) {
                    state.sourceFragment = editor.getValue();
                }
                else {
                    state.sourceVertex = editor.getValue();
                }
                this.triggerEvent("onSourceCodeChanged", element, state, stateId);
            };
            /**
             * Beautify the given string : correct indentation according to brackets
             */
            SourceCodeComponent.prototype._beautify = function (glsl, level) {
                if (level === void 0) { level = 0; }
                // return condition : no brackets at all
                glsl = glsl.trim();
                glsl = this._removeReturnInComments(glsl);
                var brackets = this._getBracket(glsl);
                var firstBracket = brackets.firstIteration;
                var lastBracket = brackets.lastIteration;
                var spaces = "";
                for (var i = 0; i < level; i++) {
                    spaces += "    "; // 4 spaces
                }
                var result;
                // If no brackets, return the indented string
                if (firstBracket === -1) {
                    glsl = spaces + glsl; // indent first line
                    glsl = glsl.replace(/;(?![^\(]*\))\s*/g, ";\n");
                    glsl = glsl.replace(/\s*([*+-/=><\s]*=)\s*/g, function (x) { return " " + x.trim() + " "; }); // space around =, *=, +=, -=, /=, ==, >=, <=
                    glsl = glsl.replace(/\s*(,)\s*/g, function (x) { return x.trim() + " "; }); // space after ,
                    glsl = glsl.replace(/\n[ \t]+/g, "\n"); // trim Start
                    glsl = glsl.replace(/\n/g, "\n" + spaces); // indentation
                    glsl = glsl.replace(/\s+$/g, "");
                    glsl = glsl.replace(/\n+$/g, "");
                    result = glsl;
                }
                else {
                    // if brackets, beautify the inside
                    // let insideWithBrackets = glsl.substr(firstBracket, lastBracket-firstBracket+1);
                    var left = glsl.substr(0, firstBracket);
                    var right = glsl.substr(lastBracket + 1, glsl.length);
                    var inside = glsl.substr(firstBracket + 1, lastBracket - firstBracket - 1).trim();
                    var prettyInside = this._beautify(inside, level + 1);
                    result = this._beautify(left, level) + " {\n" + prettyInside + "\n" + spaces + "}\n" + this._beautify(right, level);
                    result = result.replace(/\s*\n+\s*;/g, ";"); // Orphan ;
                    result = result.replace(/#endif[\t \f\v]*{/g, "\n {"); // Curly after #Endig
                }
                result = result.replace(SourceCodeComponent.semicolonReplacementKey, ";");
                return result;
            };
            SourceCodeComponent.prototype._removeReturnInComments = function (str) {
                var singleLineComment = false;
                var multiLineComment = false;
                for (var index = 0; index < str.length; index++) {
                    var char = str[index];
                    if (char === "/") {
                        if (str[index - 1] === "*") {
                            multiLineComment = false;
                        }
                        else if (str[index + 1] === "*") {
                            if (!singleLineComment) {
                                multiLineComment = true;
                                index++;
                            }
                        }
                        else if (str[index + 1] === "/") {
                            if (!multiLineComment) {
                                singleLineComment = true;
                                index++;
                            }
                        }
                    }
                    else if (char === "\n") {
                        singleLineComment = false;
                    }
                    else if (char === ";") {
                        if (singleLineComment || multiLineComment) {
                            str = str.substr(0, index) + SourceCodeComponent.semicolonReplacementKey + str.substr(index + 1);
                        }
                    }
                }
                return str;
            };
            /**
             * Returns the position of the first "{" and the corresponding "}"
             * @param str the Shader source code as a string
             * @param searchFrom Search open brackets from this position
             */
            SourceCodeComponent.prototype._getBracket = function (str, searchFrom) {
                if (searchFrom === void 0) { searchFrom = -1; }
                var fb = str.indexOf("{", searchFrom);
                var arr = str.substr(fb + 1).split("");
                var counter = 1;
                var currentPosInString = fb;
                var lastBracketIndex = 0;
                for (var _i = 0, arr_1 = arr; _i < arr_1.length; _i++) {
                    var char = arr_1[_i];
                    currentPosInString++;
                    if (char === "{") {
                        counter++;
                    }
                    if (char === "}") {
                        counter--;
                    }
                    if (counter === 0) {
                        lastBracketIndex = currentPosInString;
                        break;
                    }
                }
                // More open than close.
                if (fb > -1 && lastBracketIndex === 0) {
                    return this._getBracket(str, fb + 1);
                }
                return { firstIteration: fb, lastIteration: lastBracketIndex };
            };
            SourceCodeComponent.prototype._indentIfdef = function (str) {
                var level = 0;
                var arr2 = str.split("\n");
                for (var index = 0; index < arr2.length; index++) {
                    var line = arr2[index];
                    if (line.indexOf("#endif") !== -1) {
                        level--;
                    }
                    if (line.indexOf("#else") !== -1) {
                        level--;
                    }
                    var spaces = "";
                    for (var i = 0; i < level; i++) {
                        spaces += "    "; // 4 spaces
                    }
                    arr2[index] = spaces + line;
                    if (line.indexOf("#if") !== -1 || line.indexOf("#else") !== -1) {
                        level++;
                    }
                }
                return arr2.join("\n");
            };
            SourceCodeComponent.semicolonReplacementKey = "[[[semicolonReplacementKey]]]";
            return SourceCodeComponent;
        }(EmbeddedFrontend.BaseComponent));
        EmbeddedFrontend.SourceCodeComponent = SourceCodeComponent;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var EmbeddedFrontend;
    (function (EmbeddedFrontend) {
        var ResultView = /** @class */ (function () {
            function ResultView(options, logger) {
                var _this = this;
                this.options = options;
                this.logger = logger;
                this.onSourceCodeChanged = new options.eventConstructor();
                this.rootPlaceHolder = options.rootPlaceHolder || document.body;
                this.mvx = new EmbeddedFrontend.MVX(this.rootPlaceHolder, logger);
                this.searchText = "";
                this.currentCommandId = -1;
                this.visible = false;
                this.commandCount = 0;
                this.commandListStateId = -1;
                this.commandDetailStateId = -1;
                this.currentCaptureStateId = -1;
                this.currentCommandStateId = -1;
                this.currentVisualStateId = -1;
                this.visualStateListStateId = -1;
                this.initVisualStateId = -1;
                this.sourceCodeComponentStateId = -1;
                this.captureListComponent = new EmbeddedFrontend.CaptureListComponent(options.eventConstructor, logger);
                this.captureListItemComponent = new EmbeddedFrontend.CaptureListItemComponent(options.eventConstructor, logger);
                this.visualStateListComponent = new EmbeddedFrontend.VisualStateListComponent(options.eventConstructor, logger);
                this.visualStateListItemComponent = new EmbeddedFrontend.VisualStateListItemComponent(options.eventConstructor, logger);
                this.commandListComponent = new EmbeddedFrontend.CommandListComponent(options.eventConstructor, logger);
                this.commandListItemComponent = new EmbeddedFrontend.CommandListItemComponent(options.eventConstructor, logger);
                this.commandDetailComponent = new EmbeddedFrontend.CommandDetailComponent(options.eventConstructor, logger);
                this.jsonContentComponent = new EmbeddedFrontend.JSONContentComponent(options.eventConstructor, logger);
                this.jsonGroupComponent = new EmbeddedFrontend.JSONGroupComponent(options.eventConstructor, logger);
                this.jsonItemComponent = new EmbeddedFrontend.JSONItemComponent(options.eventConstructor, logger);
                this.jsonImageItemComponent = new EmbeddedFrontend.JSONImageItemComponent(options.eventConstructor, logger);
                this.jsonSourceItemComponent = new EmbeddedFrontend.JSONSourceItemComponent(options.eventConstructor, logger);
                this.jsonHelpItemComponent = new EmbeddedFrontend.JSONHelpItemComponent(options.eventConstructor, logger);
                this.jsonVisualStateItemComponent = new EmbeddedFrontend.JSONVisualStateItemComponent(options.eventConstructor, logger);
                this.resultViewMenuComponent = new EmbeddedFrontend.ResultViewMenuComponent(options.eventConstructor, logger);
                this.resultViewContentComponent = new EmbeddedFrontend.ResultViewContentComponent(options.eventConstructor, logger);
                this.resultViewComponent = new EmbeddedFrontend.ResultViewComponent(options.eventConstructor, logger);
                this.sourceCodeComponent = new EmbeddedFrontend.SourceCodeComponent(options.eventConstructor, logger);
                this.informationColumnComponent = new EmbeddedFrontend.InformationColumnComponent(options.eventConstructor, logger);
                this.rootStateId = this.mvx.addRootState(null, this.resultViewComponent);
                this.menuStateId = this.mvx.addChildState(this.rootStateId, null, this.resultViewMenuComponent);
                this.contentStateId = this.mvx.addChildState(this.rootStateId, null, this.resultViewContentComponent);
                this.captureListStateId = this.mvx.addChildState(this.rootStateId, false, this.captureListComponent);
                this.initKeyboardEvents();
                this.initMenuComponent();
                this.captureListComponent.onCaptureLoaded.add(function (capture) {
                    _this.addCapture(capture);
                });
                this.captureListItemComponent.onCaptureSelected.add(function (captureEventArgs) {
                    _this.selectCapture(captureEventArgs.stateId);
                });
                this.captureListItemComponent.onSaveRequested.add(function (captureEventArgs) {
                    _this.saveCapture(captureEventArgs.state.capture);
                });
                this.visualStateListItemComponent.onVisualStateSelected.add(function (visualStateEventArgs) {
                    _this.selectVisualState(visualStateEventArgs.stateId);
                });
                this.commandListItemComponent.onCommandSelected.add(function (commandEventArgs) {
                    _this.selectCommand(commandEventArgs.stateId);
                });
                this.commandListItemComponent.onVertexSelected.add(function (commandEventArgs) {
                    _this.selectCommand(commandEventArgs.stateId);
                    _this.openShader(false);
                });
                this.commandListItemComponent.onFragmentSelected.add(function (commandEventArgs) {
                    _this.selectCommand(commandEventArgs.stateId);
                    _this.openShader(true);
                });
                this.sourceCodeComponent.onSourceCodeCloseClicked.add(function () {
                    _this.displayCurrentCapture();
                });
                this.sourceCodeComponent.onVertexSourceClicked.add(function (sourceCodeState) {
                    var state = _this.mvx.getGenericState(_this.sourceCodeComponentStateId);
                    state.fragment = false;
                    _this.mvx.updateState(_this.sourceCodeComponentStateId, state);
                });
                this.sourceCodeComponent.onFragmentSourceClicked.add(function (sourceCodeState) {
                    var state = _this.mvx.getGenericState(_this.sourceCodeComponentStateId);
                    state.fragment = true;
                    _this.mvx.updateState(_this.sourceCodeComponentStateId, state);
                });
                this.sourceCodeComponent.onSourceCodeChanged.add(function (sourceCodeState) {
                    _this.onSourceCodeChanged.trigger({
                        programId: sourceCodeState.state.programId,
                        sourceFragment: sourceCodeState.state.sourceFragment,
                        sourceVertex: sourceCodeState.state.sourceVertex,
                    });
                });
                this.jsonSourceItemComponent.onOpenSourceClicked.add(function (sourceEventArg) {
                    _this.openShader(sourceEventArg.state.value === "FRAGMENT_SHADER");
                });
                this.updateViewState();
            }
            ResultView.prototype.saveCapture = function (capture) {
                var captureInString = JSON.stringify(capture, null, 4);
                var blob = new Blob([captureInString], { type: "octet/stream" });
                var fileName = "capture " + new Date(capture.startTime).toTimeString().split(" ")[0] + ".json";
                if (navigator.msSaveBlob) {
                    navigator.msSaveBlob(blob, fileName);
                }
                else {
                    var a = document.createElement("a");
                    var url = window.URL.createObjectURL(blob);
                    a.setAttribute("href", url);
                    a.setAttribute("download", fileName);
                    a.click();
                }
            };
            ResultView.prototype.selectCapture = function (captureStateId) {
                this.currentCommandId = -1;
                this.currentCaptureStateId = captureStateId;
                this.displayCurrentCapture();
            };
            ResultView.prototype.selectCommand = function (commandStateId) {
                this.currentCommandStateId = commandStateId;
                this.currentVisualStateId = this.displayCurrentCommand();
                this.displayCurrentVisualState();
            };
            ResultView.prototype.selectVisualState = function (visualStateId) {
                this.currentVisualStateId = visualStateId;
                this.currentCommandStateId = this.displayCurrentVisualState();
                this.displayCurrentCommand();
            };
            ResultView.prototype.display = function () {
                this.visible = true;
                this.updateViewState();
            };
            ResultView.prototype.hide = function () {
                this.visible = false;
                this.updateViewState();
            };
            ResultView.prototype.addCapture = function (capture) {
                var captureSateId = this.mvx.insertChildState(this.captureListStateId, {
                    capture: capture,
                    active: false,
                }, 0, this.captureListItemComponent);
                this.selectCapture(captureSateId);
                return captureSateId;
            };
            ResultView.prototype.showSourceCodeError = function (error) {
                this.sourceCodeComponent.showError(error);
            };
            ResultView.prototype.initKeyboardEvents = function () {
                var _this = this;
                this.rootPlaceHolder.addEventListener("keydown", function (event) {
                    if (_this.mvx.getGenericState(_this.menuStateId).status !== 40 /* Commands */) {
                        return;
                    }
                    if (event.keyCode === 38) {
                        event.preventDefault();
                        event.stopPropagation();
                        _this.selectPreviousCommand();
                    }
                    else if (event.keyCode === 40) {
                        event.preventDefault();
                        event.stopPropagation();
                        _this.selectNextCommand();
                    }
                    else if (event.keyCode === 33) {
                        event.preventDefault();
                        event.stopPropagation();
                        _this.selectPreviousVisualState();
                    }
                    else if (event.keyCode === 34) {
                        event.preventDefault();
                        event.stopPropagation();
                        _this.selectNextVisualState();
                    }
                });
            };
            ResultView.prototype.openShader = function (fragment) {
                this.mvx.removeChildrenStates(this.contentStateId);
                var commandState = this.mvx.getGenericState(this.currentCommandStateId);
                this.sourceCodeComponentStateId = this.mvx.addChildState(this.contentStateId, {
                    programId: commandState.capture.DrawCall.programStatus.program.__SPECTOR_Object_TAG.id,
                    nameVertex: commandState.capture.DrawCall.shaders[0].name,
                    nameFragment: commandState.capture.DrawCall.shaders[1].name,
                    sourceVertex: commandState.capture.DrawCall.shaders[0].source,
                    sourceFragment: commandState.capture.DrawCall.shaders[1].source,
                    fragment: fragment,
                    editable: commandState.capture.DrawCall.programStatus.RECOMPILABLE,
                }, this.sourceCodeComponent);
                this.commandDetailStateId = this.mvx.addChildState(this.contentStateId, null, this.commandDetailComponent);
                this.displayCurrentCommandDetail(commandState);
            };
            ResultView.prototype.selectPreviousCommand = function () {
                var commandState = this.mvx.getGenericState(this.currentCommandStateId);
                if (commandState.previousCommandStateId < 0) {
                    return;
                }
                this.selectCommand(commandState.previousCommandStateId);
            };
            ResultView.prototype.selectNextCommand = function () {
                var commandState = this.mvx.getGenericState(this.currentCommandStateId);
                if (commandState.nextCommandStateId < 0) {
                    return;
                }
                this.selectCommand(commandState.nextCommandStateId);
            };
            ResultView.prototype.selectPreviousVisualState = function () {
                var visualState = this.mvx.getGenericState(this.currentVisualStateId);
                if (visualState.previousVisualStateId < 0) {
                    return;
                }
                this.selectVisualState(visualState.previousVisualStateId);
            };
            ResultView.prototype.selectNextVisualState = function () {
                var visualState = this.mvx.getGenericState(this.currentVisualStateId);
                if (visualState.nextVisualStateId < 0) {
                    return;
                }
                this.selectVisualState(visualState.nextVisualStateId);
            };
            ResultView.prototype.initMenuComponent = function () {
                var _this = this;
                this.mvx.updateState(this.menuStateId, {
                    status: 0 /* Captures */,
                    searchText: this.searchText,
                    commandCount: 0,
                });
                this.resultViewMenuComponent.onCloseClicked.add(function (_) {
                    _this.hide();
                });
                this.resultViewMenuComponent.onCapturesClicked.add(function (_) {
                    _this.displayCaptures();
                });
                this.resultViewMenuComponent.onCommandsClicked.add(function (_) {
                    _this.displayCurrentCapture();
                });
                this.resultViewMenuComponent.onInformationClicked.add(function (_) {
                    _this.displayInformation();
                });
                this.resultViewMenuComponent.onInitStateClicked.add(function (_) {
                    _this.displayInitState();
                });
                this.resultViewMenuComponent.onEndStateClicked.add(function (_) {
                    _this.displayEndState();
                });
                this.resultViewMenuComponent.onSearchTextChanged.add(function (menu) {
                    _this.search(menu.sender.value);
                });
                this.resultViewMenuComponent.onSearchTextCleared.add(function (menu) {
                    _this.mvx.updateState(_this.menuStateId, {
                        status: menu.state.status,
                        searchText: "",
                        commandCount: menu.state.commandCount,
                    });
                    _this.search("");
                });
            };
            ResultView.prototype.onCaptureRelatedAction = function (menuStatus) {
                var captureState = this.mvx.getGenericState(this.currentCaptureStateId);
                this.commandCount = captureState.capture.commands.length;
                this.mvx.removeChildrenStates(this.contentStateId);
                this.mvx.updateState(this.menuStateId, {
                    status: menuStatus,
                    searchText: this.searchText,
                    commandCount: this.commandCount,
                });
                if (this.mvx.getGenericState(this.captureListStateId)) {
                    this.mvx.updateState(this.captureListStateId, false);
                }
                return captureState.capture;
            };
            ResultView.prototype.displayCaptures = function () {
                this.mvx.updateState(this.menuStateId, {
                    status: 0 /* Captures */,
                    searchText: this.searchText,
                    commandCount: this.commandCount,
                });
                this.mvx.updateState(this.captureListStateId, true);
            };
            ResultView.prototype.displayInformation = function () {
                var capture = this.onCaptureRelatedAction(10 /* Information */);
                var leftId = this.mvx.addChildState(this.contentStateId, true, this.informationColumnComponent);
                var rightId = this.mvx.addChildState(this.contentStateId, false, this.informationColumnComponent);
                var leftJsonContentStateId = this.mvx.addChildState(leftId, null, this.jsonContentComponent);
                this.displayJSONGroup(leftJsonContentStateId, "Canvas", capture.canvas);
                this.displayJSONGroup(leftJsonContentStateId, "Context", capture.context);
                var rightJsonContentStateId = this.mvx.addChildState(rightId, null, this.jsonContentComponent);
                for (var _i = 0, _a = capture.analyses; _i < _a.length; _i++) {
                    var analysis = _a[_i];
                    this.displayJSONGroup(rightJsonContentStateId, analysis.analyserName, analysis);
                }
                this.displayJSONGroup(rightJsonContentStateId, "Frame Memory Changes", capture.frameMemory);
                this.displayJSONGroup(rightJsonContentStateId, "Total Memory (seconds since application start: bytes)", capture.memory);
            };
            ResultView.prototype.displayJSON = function (parentGroupId, json) {
                if (json.VisualState) {
                    this.mvx.addChildState(parentGroupId, json.VisualState, this.jsonVisualStateItemComponent);
                }
                for (var key in json) {
                    if (key === "VisualState" || key === "analyserName") {
                        continue;
                    }
                    var value = json[key];
                    if (key === "source") {
                        this.mvx.addChildState(parentGroupId, {
                            key: key,
                            value: json["SHADER_TYPE"],
                        }, this.jsonSourceItemComponent);
                    }
                    else if (key === "visual") {
                        for (var target in value) {
                            if (value.hasOwnProperty(target) && value[target]) {
                                this.mvx.addChildState(parentGroupId, {
                                    key: target,
                                    value: value[target],
                                }, this.jsonImageItemComponent);
                            }
                        }
                    }
                    else {
                        var result = this.getJSONAsString(parentGroupId, key, value);
                        if (result === null || result === undefined) {
                            continue;
                        }
                        else if (this.toFilter(key) && this.toFilter(value)) {
                            continue;
                        }
                        this.mvx.addChildState(parentGroupId, {
                            key: key,
                            value: result,
                        }, this.jsonItemComponent);
                    }
                    if (value && value.__SPECTOR_Metadata) {
                        this.displayJSONGroup(parentGroupId, "Metadata", value.__SPECTOR_Metadata);
                    }
                }
            };
            ResultView.prototype.getJSONAsString = function (parentGroupId, key, json) {
                if (json === null) {
                    return "null";
                }
                if (json === undefined) {
                    return "undefined";
                }
                if (typeof json === "number") {
                    // Do not consider the isFinite case yet for browser compat.
                    if (Math.floor(json) === json) {
                        return json.toFixed(0);
                    }
                    return json.toFixed(4);
                }
                if (typeof json === "string") {
                    return json;
                }
                if (typeof json === "boolean") {
                    return json ? "true" : "false";
                }
                if (json.length === 0) {
                    return "Empty Array";
                }
                if (json.length) {
                    var arrayResult = [];
                    for (var i = 0; i < json.length; i++) {
                        var resultItem = this.getJSONAsString(parentGroupId, key + "(" + i.toFixed(0) + ")", json[i]);
                        if (resultItem !== null) {
                            arrayResult.push(resultItem);
                        }
                    }
                    return arrayResult.length === 0 ? null : arrayResult.join(", ");
                }
                if (json.help) {
                    this.mvx.addChildState(parentGroupId, {
                        key: key,
                        value: json.name,
                        help: json.help,
                    }, this.jsonHelpItemComponent);
                    return null;
                }
                if (json.__SPECTOR_Object_TAG) {
                    return json.__SPECTOR_Object_TAG.displayText;
                }
                if (json.displayText) {
                    return json.displayText;
                }
                if (typeof json === "object") {
                    this.displayJSONGroup(parentGroupId, key, json);
                }
                return null;
            };
            ResultView.prototype.displayJSONGroup = function (parentGroupId, title, json) {
                if (!json) {
                    return;
                }
                var groupId = this.mvx.addChildState(parentGroupId, title, this.jsonGroupComponent);
                this.displayJSON(groupId, json);
                if (!this.mvx.hasChildren(groupId)) {
                    this.mvx.removeState(groupId);
                }
            };
            ResultView.prototype.displayInitState = function () {
                var capture = this.onCaptureRelatedAction(20 /* InitState */);
                var jsonContentStateId = this.mvx.addChildState(this.contentStateId, null, this.jsonContentComponent);
                this.displayJSON(jsonContentStateId, capture.initState);
            };
            ResultView.prototype.displayEndState = function () {
                var capture = this.onCaptureRelatedAction(30 /* EndState */);
                var jsonContentStateId = this.mvx.addChildState(this.contentStateId, null, this.jsonContentComponent);
                this.displayJSON(jsonContentStateId, capture.endState);
            };
            ResultView.prototype.displayCurrentCapture = function () {
                var capture = this.onCaptureRelatedAction(40 /* Commands */);
                this.mvx.updateAllChildrenGenericState(this.captureListStateId, function (state) { state.active = false; return state; });
                this.mvx.updateState(this.currentCaptureStateId, {
                    capture: capture,
                    active: true,
                });
                this.createVisualStates(capture);
                this.commandListStateId = this.mvx.addChildState(this.contentStateId, null, this.commandListComponent);
                this.commandDetailStateId = this.mvx.addChildState(this.contentStateId, null, this.commandDetailComponent);
                this.createCommands(capture);
            };
            ResultView.prototype.displayCurrentCommand = function () {
                if (this.mvx.getGenericState(this.menuStateId).status !== 40 /* Commands */) {
                    return -1;
                }
                var commandState = this.mvx.getGenericState(this.currentCommandStateId);
                var command = commandState.capture;
                this.currentCommandId = command.id;
                this.mvx.updateAllChildrenGenericState(this.commandListStateId, function (state) { state.active = false; return state; });
                this.mvx.updateState(this.currentCommandStateId, {
                    capture: command,
                    visualStateId: commandState.visualStateId,
                    previousCommandStateId: commandState.previousCommandStateId,
                    nextCommandStateId: commandState.nextCommandStateId,
                    active: true,
                });
                return this.displayCurrentCommandDetail(commandState);
            };
            ResultView.prototype.displayCurrentCommandDetail = function (commandState) {
                var command = commandState.capture;
                this.mvx.removeChildrenStates(this.commandDetailStateId);
                var visualState = this.mvx.getGenericState(commandState.visualStateId);
                this.mvx.addChildState(this.commandDetailStateId, visualState.VisualState, this.jsonVisualStateItemComponent);
                var status = "Unknown";
                switch (command.status) {
                    case 50 /* Deprecated */:
                        status = "Deprecated";
                        break;
                    case 10 /* Unused */:
                        status = "Unused";
                        break;
                    case 20 /* Disabled */:
                        status = "Disabled";
                        break;
                    case 30 /* Redundant */:
                        status = "Redundant";
                        break;
                    case 40 /* Valid */:
                        status = "Valid";
                        break;
                }
                var helpLink = EmbeddedFrontend.MDNCommandLinkHelper.getMDNLink(command.name);
                if (command.result) {
                    this.displayJSONGroup(this.commandDetailStateId, "Global", {
                        name: { help: helpLink, name: command.name },
                        duration: command.commandEndTime - command.startTime,
                        result: command.result,
                        status: status,
                    });
                }
                else {
                    this.displayJSONGroup(this.commandDetailStateId, "Global", {
                        name: { help: helpLink, name: command.name },
                        duration: command.commandEndTime - command.startTime,
                        status: status,
                    });
                }
                for (var key in command) {
                    if (key === "VisualState" || key === "result") {
                        continue;
                    }
                    else if (typeof command[key] === "object") {
                        this.displayJSONGroup(this.commandDetailStateId, key, command[key]);
                    }
                }
                return commandState.visualStateId;
            };
            ResultView.prototype.displayCurrentVisualState = function () {
                if (this.mvx.getGenericState(this.menuStateId).status !== 40 /* Commands */) {
                    return null;
                }
                var visualState = this.mvx.getGenericState(this.currentVisualStateId);
                if (visualState.commandStateId === Number.MIN_VALUE) {
                    this.displayInitState();
                }
                else if (visualState.commandStateId === Number.MAX_VALUE) {
                    this.displayEndState();
                }
                this.mvx.updateAllChildrenGenericState(this.visualStateListStateId, function (state) { state.active = false; return state; });
                visualState.active = true;
                this.mvx.updateState(this.currentVisualStateId, visualState);
                return visualState.commandStateId;
            };
            ResultView.prototype.createVisualStates = function (capture) {
                this.visualStateListStateId = this.mvx.addChildState(this.contentStateId, null, this.visualStateListComponent);
                this.mvx.removeChildrenStates(this.visualStateListStateId);
                this.initVisualStateId = this.mvx.addChildState(this.visualStateListStateId, {
                    VisualState: capture.initState.VisualState,
                    time: capture.startTime,
                    commandStateId: Number.MIN_VALUE,
                    active: false,
                }, this.visualStateListItemComponent);
            };
            ResultView.prototype.createCommands = function (capture) {
                this.mvx.removeChildrenStates(this.commandListStateId);
                var tempVisualStateId = this.initVisualStateId;
                var visualStateSet = false;
                var previousCommandState = null;
                var previousCommandStateId = -1;
                var previousVisualState = null;
                var previousVisualStateId = -1;
                for (var i = 0; i < capture.commands.length; i++) {
                    var commandCapture = capture.commands[i];
                    if (this.toFilter(commandCapture.marker) && this.toFilter(commandCapture.name) && commandCapture.id !== this.currentCommandId) {
                        continue;
                    }
                    var commandState = {
                        capture: commandCapture,
                        previousCommandStateId: previousCommandStateId,
                        nextCommandStateId: -1,
                        visualStateId: undefined,
                        active: false,
                    };
                    var commandStateId = this.mvx.addChildState(this.commandListStateId, commandState, this.commandListItemComponent);
                    if (previousCommandState) {
                        previousCommandState = this.mvx.getGenericState(previousCommandStateId);
                        previousCommandState.nextCommandStateId = commandStateId;
                        this.mvx.updateState(previousCommandStateId, previousCommandState);
                    }
                    previousCommandStateId = commandStateId;
                    previousCommandState = commandState;
                    if (commandCapture.VisualState) {
                        var visualState = {
                            VisualState: commandCapture.VisualState,
                            time: commandCapture.endTime,
                            commandStateId: commandStateId,
                            active: false,
                            previousVisualStateId: previousVisualStateId,
                            nextVisualStateId: -1,
                        };
                        tempVisualStateId = this.mvx.addChildState(this.visualStateListStateId, visualState, this.visualStateListItemComponent);
                        if (previousVisualState) {
                            previousVisualState = this.mvx.getGenericState(previousVisualStateId);
                            previousVisualState.nextVisualStateId = tempVisualStateId;
                            this.mvx.updateState(previousVisualStateId, previousVisualState);
                        }
                        previousVisualState = visualState;
                        previousVisualStateId = tempVisualStateId;
                        visualStateSet = true;
                    }
                    else if (!visualStateSet) {
                        var initVisualState = this.mvx.getGenericState(this.initVisualStateId);
                        initVisualState.commandStateId = commandStateId;
                        initVisualState.previousVisualStateId = -1;
                        initVisualState.nextVisualStateId = -1;
                        this.mvx.updateState(this.initVisualStateId, initVisualState);
                        previousVisualState = initVisualState;
                        previousVisualStateId = tempVisualStateId;
                        visualStateSet = true;
                    }
                    commandState.visualStateId = tempVisualStateId;
                    this.mvx.updateState(commandStateId, commandState);
                    if ((this.currentCommandId === -1 && i === 0)
                        || (this.currentCommandId === commandCapture.id)) {
                        this.currentCommandStateId = commandStateId;
                        this.displayCurrentCommand();
                        this.currentVisualStateId = tempVisualStateId;
                        this.displayCurrentVisualState();
                    }
                }
            };
            ResultView.prototype.updateViewState = function () {
                this.mvx.updateState(this.rootStateId, this.visible);
            };
            ResultView.prototype.toFilter = function (text) {
                text += "";
                text = text.toLowerCase();
                if (this.searchText && this.searchText.length > 2 && text.indexOf(this.searchText.toLowerCase()) === -1) {
                    return true;
                }
                return false;
            };
            ResultView.prototype.search = function (text) {
                this.searchText = text;
                var status = this.mvx.getGenericState(this.menuStateId).status;
                switch (status) {
                    case 0 /* Captures */:
                        this.displayCurrentCapture();
                        break;
                    case 40 /* Commands */:
                        this.displayCurrentCapture();
                        break;
                    case 30 /* EndState */:
                        this.displayEndState();
                        break;
                    case 10 /* Information */:
                        this.displayInformation();
                        break;
                    case 20 /* InitState */:
                        this.displayInitState();
                        break;
                }
                this.searchText = "";
            };
            return ResultView;
        }());
        EmbeddedFrontend.ResultView = ResultView;
    })(EmbeddedFrontend = SPECTOR.EmbeddedFrontend || (SPECTOR.EmbeddedFrontend = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var ProvidedInjection;
    (function (ProvidedInjection) {
        ProvidedInjection.DefaultInjection = {
            WebGlObjectNamespace: SPECTOR.WebGlObjects,
            RecorderNamespace: SPECTOR.Recorders,
            CommandNamespace: SPECTOR.Commands,
            StateNamespace: SPECTOR.States,
            AnalyserNamespace: SPECTOR.Analysers,
            StackTraceCtor: SPECTOR.Utils.StackTrace,
            LoggerCtor: SPECTOR.Utils.ConsoleLogger,
            EventCtor: SPECTOR.Utils.Event,
            TimeCtor: SPECTOR.Utils.Time,
            CanvasSpyCtor: SPECTOR.Spies.CanvasSpy,
            CommandSpyCtor: SPECTOR.Spies.CommandSpy,
            ContextSpyCtor: SPECTOR.Spies.ContextSpy,
            RecorderSpyCtor: SPECTOR.Spies.RecorderSpy,
            StateSpyCtor: SPECTOR.Spies.StateSpy,
            TimeSpyCtor: SPECTOR.Spies.TimeSpy,
            WebGlObjectSpyCtor: SPECTOR.Spies.WebGlObjectSpy,
            CaptureAnalyserCtor: SPECTOR.Analysers.CaptureAnalyser,
            ExtensionsCtor: SPECTOR.States.Information.Extensions,
            CapabilitiesCtor: SPECTOR.States.Information.Capabilities,
            CompressedTexturesCtor: SPECTOR.States.Information.CompressedTextures,
            DefaultCommandCtor: SPECTOR.Commands.DefaultCommand,
            CommandComparatorCtor: SPECTOR.Comparators.CommandComparator,
            CaptureMenuConstructor: SPECTOR.EmbeddedFrontend.CaptureMenu,
            ResultViewConstructor: SPECTOR.EmbeddedFrontend.ResultView,
        };
    })(ProvidedInjection = SPECTOR.ProvidedInjection || (SPECTOR.ProvidedInjection = {}));
})(SPECTOR || (SPECTOR = {}));
var SPECTOR;
(function (SPECTOR) {
    var Spector = /** @class */ (function () {
        function Spector(options) {
            if (options === void 0) { options = {}; }
            this.options = options;
            this.noFrameTimeout = -1;
            this.injection = options.injection || SPECTOR.ProvidedInjection.DefaultInjection;
            this.captureNextFrames = 0;
            this.captureNextCommands = 0;
            this.quickCapture = false;
            this.retry = 0;
            this.contexts = [];
            this.logger = new this.injection.LoggerCtor();
            this.time = new this.injection.TimeCtor();
            this.timeSpy = new this.injection.TimeSpyCtor({
                eventConstructor: this.injection.EventCtor,
                timeConstructor: this.injection.TimeCtor,
            }, this.logger);
            this.onCaptureStarted = new this.injection.EventCtor();
            this.onCapture = new this.injection.EventCtor();
            this.onError = new this.injection.EventCtor();
            this.timeSpy.onFrameStart.add(this.onFrameStart, this);
            this.timeSpy.onFrameEnd.add(this.onFrameEnd, this);
            this.timeSpy.onError.add(this.onErrorInternal, this);
        }
        Spector.getFirstAvailable3dContext = function (canvas) {
            // Custom detection to run in the extension.
            return this.tryGetContextFromHelperField(canvas) ||
                this.tryGetContextFromCanvas(canvas, "webgl") ||
                this.tryGetContextFromCanvas(canvas, "experimental-webgl") ||
                this.tryGetContextFromCanvas(canvas, "webgl2") ||
                this.tryGetContextFromCanvas(canvas, "experimental-webgl2");
        };
        Spector.tryGetContextFromHelperField = function (canvas) {
            var type = canvas.getAttribute("__spector_context_type");
            if (type) {
                return this.tryGetContextFromCanvas(canvas, type);
            }
            return undefined;
        };
        Spector.tryGetContextFromCanvas = function (canvas, type) {
            var context;
            try {
                context = canvas.getContext(type);
            }
            catch (e) {
                // Nothing to do here, canvas has not been found.;
            }
            return context;
        };
        Spector.prototype.displayUI = function () {
            var _this = this;
            if (!this.captureMenu) {
                this.getCaptureUI();
                this.captureMenu.onPauseRequested.add(this.pause, this);
                this.captureMenu.onPlayRequested.add(this.play, this);
                this.captureMenu.onPlayNextFrameRequested.add(this.playNextFrame, this);
                this.captureMenu.onCaptureRequested.add(function (info) {
                    if (info) {
                        _this.captureCanvas(info.ref);
                    }
                }, this);
                setInterval(function () { _this.captureMenu.setFPS(_this.getFps()); }, 1000);
                this.captureMenu.trackPageCanvases();
                this.captureMenu.display();
            }
            if (!this.resultView) {
                this.getResultUI();
                this.onCapture.add(function (capture) {
                    _this.resultView.display();
                    _this.resultView.addCapture(capture);
                });
            }
        };
        Spector.prototype.getResultUI = function () {
            var _this = this;
            if (!this.resultView) {
                this.resultView = new this.injection.ResultViewConstructor({
                    eventConstructor: this.injection.EventCtor,
                }, this.logger);
                this.resultView.onSourceCodeChanged.add(function (sourceCodeEvent) {
                    _this.rebuildProgramFromProgramId(sourceCodeEvent.programId, sourceCodeEvent.sourceVertex, sourceCodeEvent.sourceFragment, function (program) {
                        _this.referenceNewProgram(sourceCodeEvent.programId, program);
                        _this.resultView.showSourceCodeError(null);
                    }, function (error) {
                        _this.resultView.showSourceCodeError(error);
                    });
                });
            }
            return this.resultView;
        };
        Spector.prototype.getCaptureUI = function () {
            if (!this.captureMenu) {
                this.captureMenu = new this.injection.CaptureMenuConstructor({
                    eventConstructor: this.injection.EventCtor,
                }, this.logger);
            }
            return this.captureMenu;
        };
        Spector.prototype.rebuildProgramFromProgramId = function (programId, vertexSourceCode, fragmentSourceCode, onCompiled, onError) {
            var program = SPECTOR.WebGlObjects.Program.getFromGlobalStore(programId);
            this.rebuildProgram(program, vertexSourceCode, fragmentSourceCode, onCompiled, onError);
        };
        Spector.prototype.rebuildProgram = function (program, vertexSourceCode, fragmentSourceCode, onCompiled, onError) {
            SPECTOR.ProgramRecompilerHelper.rebuildProgram(program, vertexSourceCode, fragmentSourceCode, onCompiled, onError);
        };
        Spector.prototype.referenceNewProgram = function (programId, program) {
            SPECTOR.WebGlObjects.Program.updateInGlobalStore(programId, program);
        };
        Spector.prototype.pause = function () {
            this.timeSpy.changeSpeedRatio(0);
        };
        Spector.prototype.play = function () {
            this.timeSpy.changeSpeedRatio(1);
        };
        Spector.prototype.playNextFrame = function () {
            this.timeSpy.playNextFrame();
        };
        Spector.prototype.drawOnlyEveryXFrame = function (x) {
            this.timeSpy.changeSpeedRatio(x);
        };
        Spector.prototype.getFps = function () {
            return this.timeSpy.getFps();
        };
        Spector.prototype.spyCanvases = function () {
            if (this.canvasSpy) {
                this.onErrorInternal("Already spying canvas.");
                return;
            }
            this.canvasSpy = new this.injection.CanvasSpyCtor({ eventConstructor: this.injection.EventCtor }, this.logger);
            this.canvasSpy.onContextRequested.add(this.spyContext, this);
        };
        Spector.prototype.spyCanvas = function (canvas) {
            if (this.canvasSpy) {
                this.onErrorInternal("Already spying canvas.");
                return;
            }
            this.canvasSpy = new this.injection.CanvasSpyCtor({
                eventConstructor: this.injection.EventCtor,
                canvas: canvas,
            }, this.logger);
            this.canvasSpy.onContextRequested.add(this.spyContext, this);
        };
        Spector.prototype.getAvailableContexts = function () {
            return this.getAvailableContexts();
        };
        Spector.prototype.captureCanvas = function (canvas, commandCount, quickCapture) {
            if (commandCount === void 0) { commandCount = 0; }
            if (quickCapture === void 0) { quickCapture = false; }
            var contextSpy = this.getAvailableContextSpyByCanvas(canvas);
            if (!contextSpy) {
                var context = Spector.getFirstAvailable3dContext(canvas);
                if (context) {
                    this.captureContext(context, commandCount, quickCapture);
                }
                else {
                    this.logger.error("No webgl context available on the chosen canvas.");
                }
            }
            else {
                this.captureContextSpy(contextSpy, commandCount, quickCapture);
            }
        };
        Spector.prototype.captureContext = function (context, commandCount, quickCapture) {
            if (commandCount === void 0) { commandCount = 0; }
            if (quickCapture === void 0) { quickCapture = false; }
            var contextSpy = this.getAvailableContextSpyByCanvas(context.canvas);
            if (!contextSpy) {
                if (context.getIndexedParameter) {
                    contextSpy = new this.injection.ContextSpyCtor({
                        context: context,
                        version: 2,
                        recordAlways: false,
                        injection: this.injection,
                    }, this.time, this.logger);
                }
                else {
                    contextSpy = new this.injection.ContextSpyCtor({
                        context: context,
                        version: 1,
                        recordAlways: false,
                        injection: this.injection,
                    }, this.time, this.logger);
                }
                contextSpy.onMaxCommand.add(this.stopCapture, this);
                this.contexts.push({
                    canvas: contextSpy.context.canvas,
                    contextSpy: contextSpy,
                });
            }
            if (contextSpy) {
                this.captureContextSpy(contextSpy, commandCount, quickCapture);
            }
        };
        Spector.prototype.captureContextSpy = function (contextSpy, commandCount, quickCapture) {
            var _this = this;
            if (commandCount === void 0) { commandCount = 0; }
            if (quickCapture === void 0) { quickCapture = false; }
            this.quickCapture = quickCapture;
            if (this.capturingContext) {
                this.onErrorInternal("Already capturing a context.");
            }
            else {
                this.retry = 0;
                this.capturingContext = contextSpy;
                this.capturingContext.setMarker(this.marker);
                // Limit command count to 5000 record.
                commandCount = Math.min(commandCount, 5000);
                if (commandCount > 0) {
                    this.captureCommands(commandCount);
                }
                else {
                    // Capture only one frame.
                    this.captureFrames(1);
                }
                this.noFrameTimeout = setTimeout(function () {
                    if (commandCount > 0) {
                        _this.stopCapture();
                    }
                    else if (_this.capturingContext && _this.retry > 1) {
                        _this.onErrorInternal("No frames with gl commands detected. Try moving the camera.");
                    }
                    else {
                        _this.onErrorInternal("No frames detected. Try moving the camera or implementing requestAnimationFrame.");
                    }
                }, 10 * 1000);
            }
        };
        Spector.prototype.captureNextFrame = function (obj, quickCapture) {
            if (quickCapture === void 0) { quickCapture = false; }
            if (obj instanceof HTMLCanvasElement) {
                this.captureCanvas(obj, 0, quickCapture);
            }
            else {
                this.captureContext(obj, 0, quickCapture);
            }
        };
        Spector.prototype.startCapture = function (obj, commandCount, quickCapture) {
            if (quickCapture === void 0) { quickCapture = false; }
            if (obj instanceof HTMLCanvasElement) {
                this.captureCanvas(obj, commandCount, quickCapture);
            }
            else {
                this.captureContext(obj, commandCount, quickCapture);
            }
        };
        Spector.prototype.stopCapture = function () {
            if (this.capturingContext) {
                var capture = this.capturingContext.stopCapture();
                if (capture.commands.length > 0) {
                    if (this.noFrameTimeout > -1) {
                        clearTimeout(this.noFrameTimeout);
                    }
                    this.triggerCapture(capture);
                    this.capturingContext = undefined;
                    this.captureNextFrames = 0;
                    this.captureNextCommands = 0;
                    return capture;
                }
                else if (this.captureNextCommands === 0) {
                    this.retry++;
                    this.captureFrames(1);
                }
            }
            return undefined;
        };
        Spector.prototype.setMarker = function (marker) {
            this.marker = marker;
            if (this.capturingContext) {
                this.capturingContext.setMarker(marker);
            }
        };
        Spector.prototype.clearMarker = function () {
            this.marker = null;
            if (this.capturingContext) {
                this.capturingContext.clearMarker();
            }
        };
        Spector.prototype.captureFrames = function (frameCount) {
            this.captureNextFrames = frameCount;
            this.captureNextCommands = 0;
            this.playNextFrame();
        };
        Spector.prototype.captureCommands = function (commandCount) {
            this.captureNextFrames = 0;
            this.captureNextCommands = commandCount;
            this.play();
            if (this.capturingContext) {
                this.onCaptureStarted.trigger(undefined);
                this.capturingContext.startCapture(commandCount, this.quickCapture);
            }
            else {
                this.onErrorInternal("No context to capture from.");
                this.captureNextCommands = 0;
            }
        };
        Spector.prototype.spyContext = function (contextInformation) {
            var contextSpy = this.getAvailableContextSpyByCanvas(contextInformation.context.canvas);
            if (!contextSpy) {
                contextSpy = new this.injection.ContextSpyCtor({
                    context: contextInformation.context,
                    version: contextInformation.contextVersion,
                    recordAlways: true,
                    injection: this.injection,
                }, this.time, this.logger);
                contextSpy.onMaxCommand.add(this.stopCapture, this);
                this.contexts.push({
                    canvas: contextSpy.context.canvas,
                    contextSpy: contextSpy,
                });
            }
            contextSpy.spy();
        };
        Spector.prototype.getAvailableContextSpyByCanvas = function (canvas) {
            for (var _i = 0, _a = this.contexts; _i < _a.length; _i++) {
                var availableContext = _a[_i];
                if (availableContext.canvas === canvas) {
                    return availableContext.contextSpy;
                }
            }
            return undefined;
        };
        Spector.prototype.onFrameStart = function () {
            if (this.captureNextCommands > 0) {
                // Nothing to do here but preventing to drop the capturing context.
            }
            else if (this.captureNextFrames > 0) {
                if (this.capturingContext) {
                    this.onCaptureStarted.trigger(undefined);
                    this.capturingContext.startCapture(0, this.quickCapture);
                }
                this.captureNextFrames--;
            }
            else {
                this.capturingContext = undefined;
            }
        };
        Spector.prototype.onFrameEnd = function () {
            if (this.captureNextCommands > 0) {
                // Nothing to do here but preventing to drop the capturing context.
            }
            else if (this.captureNextFrames === 0) {
                this.stopCapture();
            }
        };
        Spector.prototype.triggerCapture = function (capture) {
            if (this.captureMenu) {
                this.captureMenu.captureComplete(null);
            }
            this.onCapture.trigger(capture);
        };
        Spector.prototype.onErrorInternal = function (error) {
            this.logger.error(error);
            if (this.noFrameTimeout > -1) {
                clearTimeout(this.noFrameTimeout);
            }
            if (this.capturingContext) {
                this.capturingContext = undefined;
                this.captureNextFrames = 0;
                this.captureNextCommands = 0;
                this.retry = 0;
                if (this.captureMenu) {
                    this.captureMenu.captureComplete(error);
                }
                this.onError.trigger(error);
            }
            else {
                throw error;
            }
        };
        return Spector;
    }());
    SPECTOR.Spector = Spector;
})(SPECTOR || (SPECTOR = {}));
//# sourceMappingURL=spector.js.map