// Minimal Worker OffscreenCanvas test — does NOT touch renderCanvas
var c = document.createElement("canvas");
c.width = 200;
c.height = 200;
var oc = c.transferControlToOffscreen();

var useDist = (document.location.href.toLowerCase().indexOf('dist=true') > 0);
var bundlePath = useDist ? '/dist/spector.worker.bundle.js' : '/.temp/spector.worker.bundle.js';
var origin = location.origin;

var code = 'importScripts("' + origin + bundlePath + '");\n' +
    'self.addEventListener("message", function(e) {\n' +
    '  if (e.data.type === "init") {\n' +
    '    var canvas = e.data.canvas;\n' +
    '    var gl = canvas.getContext("webgl2");\n' +
    '    var vs = gl.createShader(gl.VERTEX_SHADER);\n' +
    '    gl.shaderSource(vs, "#version 300 es\\nin vec2 p;\\nvoid main(){gl_Position=vec4(p,0,1);}");\n' +
    '    gl.compileShader(vs);\n' +
    '    var fs = gl.createShader(gl.FRAGMENT_SHADER);\n' +
    '    gl.shaderSource(fs, "#version 300 es\\nprecision mediump float;\\nout vec4 fc;\\nvoid main(){fc=vec4(1,0,0,1);}");\n' +
    '    gl.compileShader(fs);\n' +
    '    var prog = gl.createProgram();\n' +
    '    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);\n' +
    '    var vao = gl.createVertexArray(); gl.bindVertexArray(vao);\n' +
    '    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);\n' +
    '    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0.5,-0.5,-0.5,0.5,-0.5]), gl.STATIC_DRAW);\n' +
    '    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);\n' +
    '    self.postMessage({type:"ready"});\n' +
    '    function render() {\n' +
    '      gl.viewport(0,0,200,200);\n' +
    '      gl.clearColor(1,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);\n' +
    '      gl.useProgram(prog); gl.bindVertexArray(vao); gl.drawArrays(gl.TRIANGLES,0,3);\n' +
    '      setTimeout(render, 16);\n' +
    '    }\n' +
    '    render();\n' +
    '  }\n' +
    '});';

var w = new Worker(URL.createObjectURL(new Blob([code], {type:'application/javascript'})));
window.worker = w;
spector.spyWorker(w);
w.postMessage({ type: 'init', canvas: oc }, [oc]);

// Worker will appear in the Spector capture menu when its context is ready.
// Users can capture via the UI button — no auto-capture needed.