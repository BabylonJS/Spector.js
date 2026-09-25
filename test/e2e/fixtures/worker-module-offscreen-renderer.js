new OffscreenCanvas(1, 1).getContext("2d");

export async function startRendering(canvas) {
    await fetch("./worker-module-offscreen-data.txt");
    const gl = canvas.getContext("webgl2");
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, "#version 300 es\nin vec2 p;\nvoid main(){gl_Position=vec4(p,0,1);}");
    gl.compileShader(vertexShader);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, "#version 300 es\nprecision mediump float;\nout vec4 c;\nvoid main(){c=vec4(1,0,0,1);}");
    gl.compileShader(fragmentShader);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    const vertexArray = gl.createVertexArray();
    gl.bindVertexArray(vertexArray);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0.5, -0.5, -0.5, 0.5, -0.5]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    function render() {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(1, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.bindVertexArray(vertexArray);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        setTimeout(render, 16);
    }

    render();
}
