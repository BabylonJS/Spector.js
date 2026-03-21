import { test, expect } from '@playwright/test';

test.describe('Worker OffscreenCanvas Capture', () => {
    test('Worker renders visible content on the page', async ({ page }) => {
        await page.goto('/sample/index.html?sample=workerOffscreen');
        await page.waitForFunction('window.worker', { timeout: 30000 });
        await page.waitForTimeout(2000);

        const hasContent = await page.evaluate(() => {
            const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
            return canvas !== null && canvas.width > 0;
        });
        expect(hasContent).toBe(true);
    });

    test('Worker capture returns multiple GL commands', async ({ page }) => {
        await page.goto('/sample/index.html?sample=workerOffscreen');
        // Wait for spector bundle to be available
        await page.waitForFunction('typeof SPECTOR !== "undefined"', { timeout: 30000 });
        await page.waitForTimeout(2000);

        // Create a fresh Worker with Spector bundle for reliable capture testing
        const result = await page.evaluate(() => {
            return new Promise<any>((resolve, reject) => {
                const origin = location.origin;
                const bundlePath = '/.temp/spector.worker.bundle.js';
                const code = 'importScripts("' + origin + bundlePath + '");\n' +
                    'self.addEventListener("message", function(e) {\n' +
                    '  if (e.data.type === "init") {\n' +
                    '    var gl = new OffscreenCanvas(200,200).getContext("webgl2");\n' +
                    '    var vs = gl.createShader(gl.VERTEX_SHADER);\n' +
                    '    gl.shaderSource(vs, "#version 300 es\\nin vec2 p;\\nvoid main(){gl_Position=vec4(p,0,1);}");\n' +
                    '    gl.compileShader(vs);\n' +
                    '    var fs = gl.createShader(gl.FRAGMENT_SHADER);\n' +
                    '    gl.shaderSource(fs, "#version 300 es\\nprecision mediump float;\\nout vec4 c;\\nvoid main(){c=vec4(1,0,0,1);}");\n' +
                    '    gl.compileShader(fs);\n' +
                    '    var prog = gl.createProgram();\n' +
                    '    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);\n' +
                    '    var vao = gl.createVertexArray(); gl.bindVertexArray(vao);\n' +
                    '    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);\n' +
                    '    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0.5,-0.5,-0.5,0.5,-0.5]), gl.STATIC_DRAW);\n' +
                    '    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);\n' +
                    '    function render() {\n' +
                    '      gl.viewport(0,0,200,200); gl.clearColor(1,0,0,1); gl.clear(gl.COLOR_BUFFER_BIT);\n' +
                    '      gl.useProgram(prog); gl.bindVertexArray(vao); gl.drawArrays(gl.TRIANGLES,0,3);\n' +
                    '      setTimeout(render, 16);\n' +
                    '    }\n' +
                    '    render();\n' +
                    '  }\n' +
                    '});';
                const w = new Worker(URL.createObjectURL(new Blob([code], {type: 'application/javascript'})));
                w.addEventListener('message', function(e: any) {
                    if (e.data && e.data.type === 'spector:capture-complete') {
                        resolve({
                            commands: e.data.capture.commands.length,
                            names: e.data.capture.commands.map((c: any) => c.name),
                        });
                    }
                });
                w.postMessage({type: 'init'});
                setTimeout(() => {
                    w.postMessage({
                        type: 'spector:trigger-capture', version: 1, canvasIndex: 0,
                        commandCount: 0, quickCapture: false, fullCapture: false,
                    });
                }, 2000);
                setTimeout(() => reject(new Error('capture timed out')), 15000);
            });
        });

        expect(result.commands).toBeGreaterThan(3);
        expect(result.names).toContain('drawArrays');
    });

    test('workerRenderer.js does not exist as a standalone sample', async ({ page }) => {
        const response = await page.goto('/sample/js/workerRenderer.js');
        expect(response!.status()).toBe(404);
    });
});
