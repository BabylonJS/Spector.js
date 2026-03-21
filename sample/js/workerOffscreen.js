// Worker OffscreenCanvas sample — renders WebGL in a Worker.
// Initialize Spector directly (don't rely on injectSpector.js loading order)
if (!spector && typeof SPECTOR !== 'undefined') {
    spector = new SPECTOR.Spector();
    spector.displayUI();
    spector.spyCanvases();
}

var displayCanvas = document.getElementById("renderCanvas");
var displayOC = displayCanvas.transferControlToOffscreen();

var useDist = (document.location.href.toLowerCase().indexOf('dist=true') > 0);
var bundlePath = useDist ? '/dist/spector.worker.bundle.js' : '/.temp/spector.worker.bundle.js';
var origin = location.origin;

var workerCode = 'try { importScripts("' + origin + bundlePath + '"); } catch(e) {}\n' +
    'self.addEventListener("message", function(e) {\n' +
    '  if (e.data.type === "init") {\n' +
    '    var displayCanvas = e.data.displayCanvas;\n' +
    '    var displayCtx = displayCanvas.getContext("2d");\n' +
    '    var glCanvas = new OffscreenCanvas(displayCanvas.width, displayCanvas.height);\n' +
    '    var gl = glCanvas.getContext("webgl2");\n' +
    '    var vs = gl.createShader(gl.VERTEX_SHADER);\n' +
    '    gl.shaderSource(vs, "#version 300 es\\nin vec2 p;\\nin vec3 c;\\nout vec3 vc;\\nvoid main(){gl_Position=vec4(p,0,1);vc=c;}");\n' +
    '    gl.compileShader(vs);\n' +
    '    var fs = gl.createShader(gl.FRAGMENT_SHADER);\n' +
    '    gl.shaderSource(fs, "#version 300 es\\nprecision mediump float;\\nin vec3 vc;\\nout vec4 fc;\\nvoid main(){fc=vec4(vc,1);}");\n' +
    '    gl.compileShader(fs);\n' +
    '    var prog = gl.createProgram();\n' +
    '    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);\n' +
    '    var vao = gl.createVertexArray(); gl.bindVertexArray(vao);\n' +
    '    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);\n' +
    '    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0.5,1,0,0, -0.5,-0.5,0,1,0, 0.5,-0.5,0,0,1]), gl.STATIC_DRAW);\n' +
    '    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0);\n' +
    '    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 20, 8);\n' +
    '    self.postMessage({type:"ready"});\n' +
    '    function render() {\n' +
    '      gl.viewport(0, 0, glCanvas.width, glCanvas.height);\n' +
    '      gl.clearColor(0.1, 0.1, 0.2, 1.0);\n' +
    '      gl.clear(gl.COLOR_BUFFER_BIT);\n' +
    '      gl.useProgram(prog); gl.bindVertexArray(vao); gl.drawArrays(gl.TRIANGLES, 0, 3);\n' +
    '      displayCtx.drawImage(glCanvas, 0, 0, displayCanvas.width, displayCanvas.height);\n' +
    '      setTimeout(render, 16);\n' +
    '    }\n' +
    '    render();\n' +
    '  }\n' +
    '});';

// Worker creation must happen from an inline script context (not from an
// external <script src="..."> loaded by the SPECTORTOOLS.Loader) for reliable
// Spector capture. External scripts have a V8 compilation context that breaks
// the Worker's setTimeout-based frame detection.
var initScript = document.createElement('script');
initScript.textContent = '(function() {' +
    'var w = new Worker(URL.createObjectURL(new Blob([' + JSON.stringify(workerCode) + '], {type:"application/javascript"})));' +
    'window.worker = w;' +
    'if (typeof spector !== "undefined" && spector) { spector.spyWorker(w); }' +
    'w.postMessage({ type: "init", displayCanvas: window.__workerDisplayOC }, [window.__workerDisplayOC]);' +
    '})();';
window.__workerDisplayOC = displayOC;
document.body.appendChild(initScript);