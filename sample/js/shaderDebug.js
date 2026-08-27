(function () {
    "use strict";

    var canvas = document.getElementById("renderCanvas");
    var panel = document.createElement("section");
    var status = document.createElement("div");
    var buttons = {};
    var resources = [];
    var sampleApi = {
        lastCapture: null,
        lastSummary: null,
        ready: false,
        runScenario: runScenario,
    };

    panel.id = "shaderDebugSample";
    panel.innerHTML =
        "<h1>Shader debugging samples</h1>" +
        "<p>Each button records a command capture. In the result view, open a " +
        "<strong>shaderSource</strong> or <strong>compileShader</strong> command, " +
        "follow its source link, and toggle <strong>Beautify</strong>.</p>" +
        "<div class=\"shaderDebugSample-buttons\"></div>";
    status.id = "shaderDebugSampleStatus";
    status.setAttribute("aria-live", "polite");
    panel.appendChild(status);
    document.body.appendChild(panel);

    addScenarioButton("valid", "Valid minified source");
    addScenarioButton("error", "Compiler error");
    addScenarioButton("replace", "Replace and recompile");
    addScenarioButton("link", "Linker error");
    addStyles();
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    var spectorInstance = window.spector;
    if (!spectorInstance || typeof spectorInstance.startCapture !== "function") {
        spectorInstance = new SPECTOR.Spector();
        window.spector = spectorInstance;
        spectorInstance.displayUI();
        spectorInstance.spyCanvases();
    }

    var gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        setStatus("WebGL is not available in this browser.", true);
        return;
    }

    window.shaderDebugSample = sampleApi;
    sampleApi.ready = true;

    setTimeout(function () {
        runScenario(getRequestedScenario());
    }, 0);

    function addScenarioButton(name, label) {
        var button = document.createElement("button");
        button.type = "button";
        button.textContent = label;
        button.setAttribute("data-scenario", name);
        button.addEventListener("click", function () {
            runScenario(name);
        });
        panel.querySelector(".shaderDebugSample-buttons").appendChild(button);
        buttons[name] = button;
    }

    function addStyles() {
        var style = document.createElement("style");
        style.textContent =
            "#shaderDebugSample{" +
            "position:fixed;left:16px;bottom:16px;z-index:1000;width:360px;" +
            "padding:16px;border:1px solid #5d6b85;border-radius:6px;" +
            "background:rgba(18,23,33,.94);color:#f4f7fb;" +
            "font:13px/1.4 Arial,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.35)}" +
            "#shaderDebugSample h1{margin:0 0 8px;font-size:18px}" +
            "#shaderDebugSample p{margin:0 0 12px;color:#d9e1ee}" +
            ".shaderDebugSample-buttons{display:flex;flex-wrap:wrap;gap:8px}" +
            "#shaderDebugSample button{padding:7px 10px;border:1px solid #8391aa;" +
            "border-radius:4px;background:#27334a;color:#fff;cursor:pointer}" +
            "#shaderDebugSample button:hover{background:#354563}" +
            "#shaderDebugSample button:disabled{cursor:wait;opacity:.55}" +
            "#shaderDebugSampleStatus{margin-top:12px;color:#a9d5ff;white-space:pre-wrap}" +
            "#shaderDebugSampleStatus[data-error=true]{color:#ffb4b4}";
        document.head.appendChild(style);
    }

    function resizeCanvas() {
        canvas.width = Math.max(window.innerWidth, 640);
        canvas.height = Math.max(window.innerHeight, 360);
    }

    function getRequestedScenario() {
        var match = /(?:\?|&)scenario=([^&]+)/.exec(window.location.search);
        var scenario = match ? decodeURIComponent(match[1]) : "valid";
        return buttons[scenario] ? scenario : "valid";
    }

    function setStatus(message, isError) {
        status.textContent = message;
        status.setAttribute("data-error", isError ? "true" : "false");
    }

    function setButtonsDisabled(disabled) {
        Object.keys(buttons).forEach(function (name) {
            buttons[name].disabled = disabled;
        });
    }

    function runScenario(name) {
        var scenarios = {
            valid: captureValidShader,
            error: captureCompilerError,
            replace: captureSourceReplacement,
            link: captureLinkerError,
        };
        var scenario = scenarios[name] || scenarios.valid;
        var capture;
        var outcome;

        cleanupResources();
        setButtonsDisabled(true);
        setStatus("Capturing " + name + " scenario...", false);

        try {
            spectorInstance.startCapture(gl, 200);
            outcome = scenario();
        }
        finally {
            capture = spectorInstance.stopCapture();
            setButtonsDisabled(false);
        }

        if (!capture) {
            setStatus("The capture did not contain any WebGL commands.", true);
            return null;
        }

        sampleApi.lastCapture = capture;
        sampleApi.lastSummary = createSummary(name, capture, outcome);
        setStatus(
            "Captured " + capture.commands.length + " commands for \"" + name + "\".\n" +
            "Close the result view to run another sample.",
            false,
        );
        return sampleApi.lastSummary;
    }

    function captureValidShader() {
        clearCanvas();
        var vertex = compileShader(gl.VERTEX_SHADER, validVertexSource());
        var fragment = compileShader(gl.FRAGMENT_SHADER, minifiedFragmentSource());
        var linked = linkProgram(vertex.shader, fragment.shader);

        if (linked.linked) {
            drawTriangle(linked.program);
        }

        return {
            vertexCompiled: vertex.compiled,
            fragmentCompiled: fragment.compiled,
            linked: linked.linked,
            programLog: linked.log,
        };
    }

    function captureCompilerError() {
        clearCanvas();
        var vertex = compileShader(gl.VERTEX_SHADER, validVertexSource());
        var fragment = compileShader(gl.FRAGMENT_SHADER, compilerErrorSource());

        return {
            vertexCompiled: vertex.compiled,
            fragmentCompiled: fragment.compiled,
            fragmentLog: fragment.log,
        };
    }

    function captureSourceReplacement() {
        clearCanvas();
        var fragmentShader = track(gl.createShader(gl.FRAGMENT_SHADER), "shader");
        var failed = compileExistingShader(fragmentShader, compilerErrorSource());
        var repaired = compileExistingShader(fragmentShader, minifiedFragmentSource());
        var vertex = compileShader(gl.VERTEX_SHADER, validVertexSource());
        var linked = linkProgram(vertex.shader, fragmentShader);

        if (linked.linked) {
            drawTriangle(linked.program);
        }

        return {
            firstCompiled: failed.compiled,
            firstLog: failed.log,
            secondCompiled: repaired.compiled,
            secondLog: repaired.log,
            linked: linked.linked,
        };
    }

    function captureLinkerError() {
        clearCanvas();
        var vertex = compileShader(gl.VERTEX_SHADER, linkerVertexSource());
        var fragment = compileShader(gl.FRAGMENT_SHADER, linkerFragmentSource());
        var linked = linkProgram(vertex.shader, fragment.shader);

        return {
            vertexCompiled: vertex.compiled,
            fragmentCompiled: fragment.compiled,
            linked: linked.linked,
            programLog: linked.log,
        };
    }

    function compileShader(type, source) {
        return compileExistingShader(track(gl.createShader(type), "shader"), source);
    }

    function compileExistingShader(shader, source) {
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        var log = gl.getShaderInfoLog(shader) || "";

        return {
            shader: shader,
            compiled: compiled,
            log: log,
        };
    }

    function linkProgram(vertexShader, fragmentShader) {
        var program = track(gl.createProgram(), "program");
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);

        return {
            program: program,
            linked: gl.getProgramParameter(program, gl.LINK_STATUS),
            log: gl.getProgramInfoLog(program) || "",
        };
    }

    function drawTriangle(program) {
        var buffer = track(gl.createBuffer(), "buffer");
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([-0.8, -0.7, 0.8, -0.7, 0.0, 0.8]),
            gl.STATIC_DRAW,
        );
        gl.useProgram(program);
        var position = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function clearCanvas() {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.035, 0.055, 0.09, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    function validVertexSource() {
        return [
            "attribute vec2 position;",
            "varying vec2 vUv;",
            "void main() {",
            "    vUv = position * 0.5 + 0.5;",
            "    gl_Position = vec4(position, 0.0, 1.0);",
            "}",
        ].join("\n");
    }

    function minifiedFragmentSource() {
        var helpers = [];
        for (var index = 0; index < 12; index++) {
            helpers.push(
                "float shade" + index + "(float value){return clamp(value+" +
                (index / 100).toFixed(2) + ",0.0,1.0);}",
            );
        }

        return "precision mediump float;\nvarying vec2 vUv;\n" +
            helpers.join("") +
            "void main(){float red=shade0(vUv.x);float green=shade1(vUv.y);" +
            "gl_FragColor=vec4(red,green,0.65,1.0);}";
    }

    function compilerErrorSource() {
        return [
            "precision mediump float;",
            "varying vec2 vUv;",
            "void main() {",
            "    vec3 color = vec3(vUv, missingBlue);",
            "    gl_FragColor = vec4(color, 1.0);",
            "}",
        ].join("\n");
    }

    function linkerVertexSource() {
        return [
            "attribute vec2 position;",
            "varying vec3 sharedColor;",
            "void main() {",
            "    sharedColor = vec3(1.0, 0.3, 0.1);",
            "    gl_Position = vec4(position, 0.0, 1.0);",
            "}",
        ].join("\n");
    }

    function linkerFragmentSource() {
        return [
            "precision mediump float;",
            "varying vec4 sharedColor;",
            "void main() {",
            "    gl_FragColor = sharedColor;",
            "}",
        ].join("\n");
    }

    function track(resource, type) {
        resources.push({ resource: resource, type: type });
        return resource;
    }

    function cleanupResources() {
        resources.forEach(function (entry) {
            if (entry.type === "shader") {
                gl.deleteShader(entry.resource);
            }
            else if (entry.type === "program") {
                gl.deleteProgram(entry.resource);
            }
            else if (entry.type === "buffer") {
                gl.deleteBuffer(entry.resource);
            }
        });
        resources.length = 0;
    }

    function createSummary(name, capture, outcome) {
        return {
            scenario: name,
            commandNames: capture.commands.map(function (command) {
                return command.name;
            }),
            shaderCommands: capture.commands
                .filter(function (command) {
                    return !!command.shader;
                })
                .map(function (command) {
                    return {
                        name: command.name,
                        text: command.text,
                        source: command.shader.source,
                        compileStatus: command.shader.COMPILE_STATUS,
                        infoLog: command.shader.infoLog,
                    };
                }),
            programCommands: capture.commands
                .filter(function (command) {
                    return !!command.program;
                })
                .map(function (command) {
                    return {
                        name: command.name,
                        text: command.text,
                        linkStatus: command.program.programStatus.LINK_STATUS,
                        infoLog: command.program.programStatus.infoLog,
                        shaderSources: command.program.shaders
                            .filter(function (shader) {
                                return !!shader;
                            })
                            .map(function (shader) {
                                return shader.source;
                            }),
                    };
                }),
            stringResults: capture.commands
                .filter(function (command) {
                    return typeof command.result === "string";
                })
                .map(function (command) {
                    return {
                        name: command.name,
                        result: command.result,
                    };
                }),
            outcome: outcome,
        };
    }
})();
