// Worker renderer — receives an OffscreenCanvas and renders WebGL2 content

var gl = null;
var program = null;
var vao = null;
var uTime = null;
var startTime = performance.now();
var canvas = null;

self.onmessage = function(e) {
    if (e.data.type === 'init') {
        canvas = e.data.canvas;
        initGL();
        render();
    }
};

function initGL() {
    gl = canvas.getContext('webgl2');
    if (!gl) {
        self.postMessage({ type: 'error', message: 'WebGL2 not available' });
        return;
    }

    var vsSource = [
        '#version 300 es',
        'in vec2 aPosition;',
        'in vec3 aColor;',
        'out vec3 vColor;',
        'uniform float uTime;',
        'void main() {',
        '    float angle = uTime * 0.7;',
        '    float c = cos(angle), s = sin(angle);',
        '    vec2 pos = mat2(c, s, -s, c) * aPosition;',
        '    gl_Position = vec4(pos, 0.0, 1.0);',
        '    vColor = aColor;',
        '}',
    ].join('\n');

    var fsSource = [
        '#version 300 es',
        'precision mediump float;',
        'in vec3 vColor;',
        'out vec4 fragColor;',
        'void main() {',
        '    fragColor = vec4(vColor, 1.0);',
        '}',
    ].join('\n');

    function createShader(type, source) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            self.postMessage({ type: 'error', message: gl.getShaderInfoLog(shader) });
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    var vs = createShader(gl.VERTEX_SHADER, vsSource);
    var fs = createShader(gl.FRAGMENT_SHADER, fsSource);

    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        self.postMessage({ type: 'error', message: gl.getProgramInfoLog(program) });
        return;
    }

    // Triangle vertices: position (x,y) + color (r,g,b) — interleaved, 20 bytes/vertex
    var vertices = new Float32Array([
         0.0,  0.6,   1, 0.5, 0,
        -0.6, -0.4,   0, 1, 0.5,
         0.6, -0.4,   0.5, 0, 1,
    ]);

    vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    var vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    var aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 20, 0);

    var aColor = gl.getAttribLocation(program, 'aColor');
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 20, 8);

    uTime = gl.getUniformLocation(program, 'uTime');

    self.postMessage({ type: 'ready' });
}

function render() {
    var time = (performance.now() - startTime) / 1000;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.08, 0.08, 0.15, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform1f(uTime, time);
    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Use setTimeout since requestAnimationFrame may not be available in all Workers
    setTimeout(render, 16);
}
