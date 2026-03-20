self.addEventListener('message', function(e) {
    if (e.data.type === 'init') {
        var canvas = e.data.canvas;
        var gl = canvas.getContext('webgl2');
        if (!gl) { self.postMessage({ type: 'error', message: 'No WebGL2' }); return; }
        var vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, '#version 300 es\nin vec2 p;\nin vec3 c;\nout vec3 vc;\nvoid main(){gl_Position=vec4(p,0,1);vc=c;}');
        gl.compileShader(vs);
        var fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, '#version 300 es\nprecision mediump float;\nin vec3 vc;\nout vec4 fc;\nvoid main(){fc=vec4(vc,1);}');
        gl.compileShader(fs);
        var program = gl.createProgram();
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        var vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        var buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0.5,1,0,0,-0.5,-0.5,0,1,0,0.5,-0.5,0,0,1]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 20, 8);
        self.postMessage({ type: 'ready' });
        function render() {
            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0.08, 0.08, 0.15, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.useProgram(program);
            gl.bindVertexArray(vao);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            setTimeout(render, 16);
        }
        render();
    }
});