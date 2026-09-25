//_______________________________SCRIPT  UTILITIES_____________________________________
function insertTextScript(text) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.text = text;
    insertHeaderNode(script);

    return script;
};

function insertHeaderNode(node) {
    var targets = [document.body, document.head, document.documentElement];
    for (var n = 0; n < targets.length; n++) {
        var target = targets[n];
        if (target) {
            if (target.firstElementChild) {
                target.insertBefore(node, target.firstElementChild);
            } else {
                target.appendChild(node);
            }
            break;
        }
    }
};
//_____________________________________________________________________________________

var spectorLoadedKey = "SPECTOR_LOADED";
var spectorCaptureOnLoadKey = "SPECTOR_CAPTUREONLOAD";
var spectorCaptureOnLoadCommandCountKey = "SPECTOR_CAPTUREONLOAD_COMMANDCOUNT";
var spectorCaptureOnLoadTransientKey = "SPECTOR_CAPTUREONLOAD_TRANSIENT";
var spectorCaptureOnLoadQuickCaptureKey = "SPECTOR_CAPTUREONLOAD_QUICKCAPTURE";
var spectorCaptureOnLoadFullCaptureKey = "SPECTOR_CAPTUREONLOAD_FULLCAPTURE";
var captureOffScreenKey = "SPECTOR_CAPTUREOFFSCREEN";
var workerAutoInjectKey = "SPECTOR_WORKERAUTOINJECT";
var spectorCommunicationElementId = "SPECTOR_COMMUNICATION";
var spectorCommunicationQuickCaptureElementId = "SPECTOR_COMMUNICATION_QUICKCAPTURE";
var spectorCommunicationFullCaptureElementId = "SPECTOR_COMMUNICATION_FULLCAPTURE";
var spectorCommunicationCommandCountElementId = "SPECTOR_COMMUNICATION_COMMANDCOUNT";
var spectorCommunicationRebuildProgramElementId = "SPECTOR_COMMUNICATION_REBUILDPROGRAM";
var spectorCommunicationShaderDelayElementId = "SPECTOR_COMMUNICATION_SHADERDELAY";
var spectorShaderCompileDelayKey = "SPECTOR_SHADERCOMPILEDELAY";

var spectorContextTypeKey = "__spector_context_type";

var captureOnLoad = false;
var captureOnLoadTransient = false;
var captureOnLoadQuickCapture = false;
var captureOnLoadFullCapture = false;
var captureOnLoadCommandCount = 500;
var captureOffScreen = false;

if (sessionStorage.getItem(spectorCaptureOnLoadKey) === "true") {
    sessionStorage.setItem(spectorCaptureOnLoadKey, "false");
    captureOnLoad = true;

    captureOnLoadTransient = (sessionStorage.getItem(spectorCaptureOnLoadTransientKey) === "true");
    captureOnLoadQuickCapture = (sessionStorage.getItem(spectorCaptureOnLoadQuickCaptureKey) === "true");
    captureOnLoadFullCapture = (sessionStorage.getItem(spectorCaptureOnLoadFullCaptureKey) === "true");
    captureOnLoadCommandCount = parseInt(sessionStorage.getItem(spectorCaptureOnLoadCommandCountKey));
}

captureOffScreen = (sessionStorage.getItem(captureOffScreenKey) === "true");
// Read synchronously at document_start, before application Workers are created.
// Only an explicit opt-in enables interception; older capture settings do not.
var workerAutoInject = (sessionStorage.getItem(workerAutoInjectKey) === "true");

var spector;
window.__SPECTOR_Canvases = [];

(function() {
    var __SPECTOR_Origin_EXTENSION_GetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.__SPECTOR_Origin_EXTENSION_GetContext = __SPECTOR_Origin_EXTENSION_GetContext;

    // Intercept transferControlToOffscreen so we can track canvases that are
    // sent to Workers.  The Worker may or may not have Spector injected — this
    // ensures the canvas at least appears in the extension list.
    if (typeof HTMLCanvasElement.prototype.transferControlToOffscreen === 'function') {
        var __SPECTOR_Origin_Transfer = HTMLCanvasElement.prototype.transferControlToOffscreen;
        HTMLCanvasElement.prototype.transferControlToOffscreen = function() {
            var offscreen = __SPECTOR_Origin_Transfer.call(this);
            // Tag the source DOM canvas so we can show it later if the Worker
            // doesn't report context-ready (e.g. auto-injection is disabled).
            this.__spector_transferred = true;
            this.__spector_offscreen = offscreen;
            return offscreen;
        };
    }

    if (typeof OffscreenCanvas !== 'undefined') {
        var __SPECTOR_Origin_EXTENSION_OffscreenGetContext = OffscreenCanvas.prototype.getContext;
        OffscreenCanvas.prototype.__SPECTOR_Origin_EXTENSION_OffscreenGetContext = __SPECTOR_Origin_EXTENSION_OffscreenGetContext;

        OffscreenCanvas.prototype.getContext = function () {
            var context = null;
            if (!arguments.length) {
                return context;
            }

            if (arguments.length === 1) {
                context = this.__SPECTOR_Origin_EXTENSION_OffscreenGetContext(arguments[0]);
                if (context === null) {
                    return context;
                }
            }
            else if (arguments.length === 2) {
                context = this.__SPECTOR_Origin_EXTENSION_OffscreenGetContext(arguments[0], arguments[1]);
                if (context === null) {
                    return context;
                }
            }

            var contextNames = ["webgl", "experimental-webgl", "webgl2", "experimental-webgl2"];
            if (contextNames.indexOf(arguments[0]) !== -1) {
                // context.canvas.setAttribute(spectorContextTypeKey, arguments[0]);
                // Notify the page a canvas is available.
                var myEvent = new CustomEvent("SpectorWebGLCanvasAvailableEvent");
                document.dispatchEvent(myEvent);
                this.id = "Offscreen";
                window.__SPECTOR_Canvases.push(this);

                if (captureOnLoad) {
                    // Ensures canvas is in the dom to capture the one we are currently tracking.
                    if (captureOnLoadTransient) {
                        spector.captureContext(context, captureOnLoadCommandCount, captureOnLoadQuickCapture, captureOnLoadFullCapture);
                        captureOnLoad = false;
                    }
                }
            }

            return context;
        }
    }

    // ---- Worker Interception ----
    if (workerAutoInject && typeof Worker !== 'undefined') {
        var __SPECTOR_Origin_Worker = Worker;
        var __SPECTOR_workerAddEventListener = Worker.prototype.addEventListener;
        window.__SPECTOR_Workers = [];

        // When a Worker reports its WebGL context is ready, add it to the canvas list
        var __SPECTOR_trackWorker = function(w, urlStr) {
            __SPECTOR_workerAddEventListener.call(w, 'message', function(e) {
                if (e.data && typeof e.data.type === 'string') {
                    if (e.data.type === 'spector:context-ready') {
                        // Add Worker as a virtual canvas entry so the extension can see it
                        var workerProxy = {
                            id: "Worker (" + urlStr.split('/').pop().substring(0, 20) + ")",
                            width: 0,
                            height: 0,
                            __spector_worker: w
                        };
                        window.__SPECTOR_Canvases.push(workerProxy);

                        var canvasEvent = new CustomEvent("SpectorWebGLCanvasAvailableEvent");
                        document.dispatchEvent(canvasEvent);
                    }
                    if (e.data.type === 'spector:capture-complete') {
                        var captureEvent = new CustomEvent("SpectorOnCaptureEvent", {
                            detail: { capture: e.data.capture }
                        });
                        document.dispatchEvent(captureEvent);
                    }
                }
            });
        };

        // Best-effort bypass for recognizable URL-dependent code, not a safety
        // check: aliases, imported scripts, and other syntax can evade this.
        // Leaving auto-injection OFF is the compatibility guarantee.
        var __SPECTOR_shouldInjectWorkerSource = function(source) {
            // Reject URL-sensitive APIs rather than trying to emulate them on a
            // blob global. Token checks also cover comments between tokens and
            // ordinary aliases; computed names remain an experimental limitation.
            return !/\b(?:import|importScripts|Worker|SharedWorker|location|fetch|Request|XMLHttpRequest|WebSocket|EventSource|crossOriginIsolated|SharedArrayBuffer|Atomics|WebAssembly|eval|Function)\b|\\u|["']use strict["']|^(?:\uFEFF)?#!/.test(source);
        };

        var __SPECTOR_isJavaScriptResponse = function(xhr, requestedUrl) {
            var mime = (xhr.getResponseHeader('Content-Type') || '').split(';')[0].trim();
            return xhr.status === 200 && xhr.responseURL === requestedUrl &&
                /^(?:text|application)\/(?:x-)?(?:java|ecma)script$/i.test(mime);
        };

        var workerProxy = new Proxy(__SPECTOR_Origin_Worker, {
            construct: function(target, args, newTarget) {
                var scriptURL = args[0];
                var urlStr = typeof scriptURL === 'string' ? scriptURL : 'Worker';
                var record = function(worker, injected) {
                    window.__SPECTOR_Workers.push({ worker: worker, url: urlStr, injected: injected });
                    __SPECTOR_trackWorker(worker, urlStr);
                    return worker;
                };
                var fallback = function() {
                    return record(Reflect.construct(target, args, newTarget), false);
                };

                // Never inspect options or coerce objects: WebIDL does that in
                // a specified order, and even inspecting a Proxy has side effects.
                // Proxy forwards calls without `new`, statics and descriptors;
                // Reflect.construct preserves subclassing and original arguments.
                if (newTarget !== workerProxy || typeof scriptURL !== 'string' ||
                    args.length > 2 || args[1] !== undefined) {
                    return fallback();
                }

                // Get the bundle URL bridged from the ISOLATED world via the DOM.
                var workerBundleEl = document.getElementById('TexturesId_SpectorWorkerBundleUrl');
                var bundleUrl = workerBundleEl ? workerBundleEl.value : '';
                var blobUrl;
                try {
                    var absoluteScriptUrl = new URL(scriptURL, document.baseURI);
                    if (bundleUrl && /^https?:$/.test(absoluteScriptUrl.protocol) &&
                        absoluteScriptUrl.origin === location.origin) {
                        bundleUrl = new URL(bundleUrl, document.baseURI).href;
                        absoluteScriptUrl.hash = '';
                        var xhr = new XMLHttpRequest();
                        xhr.open('GET', absoluteScriptUrl.href, false);
                        xhr.send();
                        // Redirects and non-JavaScript responses must retain the
                        // native loader's URL, MIME, CSP and origin validation.
                        if (__SPECTOR_isJavaScriptResponse(xhr, absoluteScriptUrl.href) &&
                            !xhr.getResponseHeader('Content-Security-Policy') &&
                            !xhr.getResponseHeader('Content-Security-Policy-Report-Only') &&
                            __SPECTOR_shouldInjectWorkerSource(xhr.responseText)) {
                            var bundleXhr = new XMLHttpRequest();
                            bundleXhr.open('GET', bundleUrl, false);
                            bundleXhr.send();
                            var bundleAvailable = __SPECTOR_isJavaScriptResponse(bundleXhr, bundleUrl);
                            if (bundleAvailable) {
                                // Preflight cannot predict script-src checks or
                                // bundle execution failures inside the Worker.
                                var importLine = 'try { importScripts(' + JSON.stringify(bundleUrl) +
                                    '); } catch (e) { console.warn("[Spector.js] Worker auto-injection failed:", e); }\n';
                                blobUrl = URL.createObjectURL(new Blob([importLine, xhr.responseText],
                                    { type: 'application/javascript' }));
                            }
                        }
                    }
                } catch(e) {
                    console.warn("[Spector.js] Could not auto-inject into Worker (" + urlStr + "):", e);
                }

                if (blobUrl) {
                    var worker;
                    try {
                        worker = Reflect.construct(target, [blobUrl], newTarget);
                    } catch (e) {
                        URL.revokeObjectURL(blobUrl);
                        return fallback();
                    }
                    setTimeout(function() { URL.revokeObjectURL(blobUrl); }, 5000);
                    return record(worker, true);
                }
                return fallback();
            }
        });
        window.Worker = workerProxy;
    }

    HTMLCanvasElement.prototype.getContext = function () {
        var context = null;
        if (!arguments.length) {
            return context;
        }

        if (arguments.length === 1) {
            context = this.__SPECTOR_Origin_EXTENSION_GetContext(arguments[0]);
            if (context === null) {
                return context;
            }
        }
        else if (arguments.length === 2) {
            context = this.__SPECTOR_Origin_EXTENSION_GetContext(arguments[0], arguments[1]);
            if (context === null) {
                return context;
            }
        }

        var contextNames = ["webgl", "experimental-webgl", "webgl2", "experimental-webgl2"];
        if (contextNames.indexOf(arguments[0]) !== -1) {
            context.canvas.setAttribute(spectorContextTypeKey, arguments[0]);
            // Notify the page a canvas is available.
            var myEvent = new CustomEvent("SpectorWebGLCanvasAvailableEvent");
            document.dispatchEvent(myEvent);

            if (captureOffScreen) {
                var found = false;
                for (var i = 0; i < window.__SPECTOR_Canvases.length; i++) {
                    if (window.__SPECTOR_Canvases[i] === this) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    window.__SPECTOR_Canvases.push(this);
                }
            }

            if (captureOnLoad) {
                // Ensures canvas is in the dom to capture the one we are currently tracking.
                if (this.parentElement || captureOnLoadTransient) {
                    spector.captureContext(context, captureOnLoadCommandCount, captureOnLoadQuickCapture, captureOnLoadFullCapture);
                    captureOnLoad = false;
                }
            }
        }

        return context;
    }
})();

// In case the spector injection has been requested, inject the library in the page.
if (sessionStorage.getItem(spectorLoadedKey)) {
    insertTextScript( '(' + spectorBundleHook.toString() + ' )();');

    // Defer exec to next slot to ensure proper loading of the lib.
    setTimeout(function () {
        spector = new SPECTOR.Spector();
            spector.spyCanvases();

            // Re-apply a persisted shader-compile delay after a page reload.
            try {
                var persistedDelay = parseInt(sessionStorage.getItem(spectorShaderCompileDelayKey), 10);
                if (!isNaN(persistedDelay) && persistedDelay > 0) {
                    spector.setShaderCompileDelay(persistedDelay);
                }
            } catch (e) {
                // sessionStorage unavailable — ignore.
            }

            document.addEventListener("SpectorRequestSetShaderCompileDelayEvent", function() {
                var delayElement = document.getElementById(spectorCommunicationShaderDelayElementId);
                var delayMs = delayElement ? parseInt(delayElement.value, 10) : 0;
                if (isNaN(delayMs) || delayMs < 0) {
                    delayMs = 0;
                }
                if (spector && spector.setShaderCompileDelay) {
                    spector.setShaderCompileDelay(delayMs);
                }
            });

            document.addEventListener("SpectorRequestPauseEvent", function() {
                spector.pause();
            });
            document.addEventListener("SpectorRequestPlayEvent", function() {
                spector.play(); 
            });
            document.addEventListener("SpectorRequestPlayNextFrameEvent", function() {
                spector.playNextFrame(); 
            });    
            document.addEventListener("SpectorRequestCaptureEvent", function(e) {
                var canvasIndex = document.getElementById(spectorCommunicationElementId).value;

                // Always look up from __SPECTOR_Canvases first (includes Workers and OffscreenCanvases).
                // Fall back to DOM query for legacy compatibility.
                var canvas = null;
                if (window.__SPECTOR_Canvases && window.__SPECTOR_Canvases[canvasIndex]) {
                    canvas = window.__SPECTOR_Canvases[canvasIndex];
                } else if (!captureOffScreen) {
                    canvas = document.body.querySelectorAll("canvas")[canvasIndex]; 
                }
                var quickCapture = (document.getElementById(spectorCommunicationQuickCaptureElementId).value === "true");
                var fullCapture = (document.getElementById(spectorCommunicationFullCaptureElementId).value === "true");
                var commandCount = parseInt(document.getElementById(spectorCommunicationCommandCountElementId).value, 10) || 0;

                // Route Worker proxy entries — send trigger directly to Worker
                if (canvas && canvas.__spector_worker) {
                    var worker = canvas.__spector_worker;

                    worker.postMessage({
                        type: 'spector:trigger-capture',
                        version: 1,
                        canvasIndex: 0,
                        commandCount: commandCount,
                        quickCapture: quickCapture,
                        fullCapture: fullCapture
                    });
                } else if (canvas && canvas.__spector_transferred) {
                    // The transferred canvas does not identify its owning Worker.
                    // Never send a capture request to an unrelated injected Worker.
                    var errorEvent = new CustomEvent("SpectorOnErrorEvent", {
                        detail: { errorString: "Cannot capture from this canvas: its Worker is unknown. " +
                            "Select the instrumented Worker entry instead, or load spector.worker.bundle.js " +
                            "inside the Worker and use the manual spyWorker() API." }
                    });
                    document.dispatchEvent(errorEvent);
                } else if (canvas) {
                    spector.captureCanvas(canvas, commandCount, quickCapture, fullCapture);
                }
            });
            document.addEventListener("SpectorRequestRebuildProgramEvent", function(e) {
                var buildInfoInText = document.getElementById(spectorCommunicationRebuildProgramElementId).value;
                var buildInfo = JSON.parse(buildInfoInText);
                var tabId = document.getElementById(spectorCommunicationElementId).value;

                var programId = buildInfo.programId;
                var sourceVertex = buildInfo.sourceVertex;
                var sourceFragment = buildInfo.sourceFragment;
                spector.rebuildProgramFromProgramId(programId,
                    sourceVertex,
                    sourceFragment,
                    (program) => {
                        spector.referenceNewProgram(programId, program);
                        var myEvent = new CustomEvent("SpectorOnProgramRebuilt", { detail: { programId: programId, errorString: null, tabId: tabId } });
                        document.dispatchEvent(myEvent);
                    },
                    (error) => {
                        var myEvent = new CustomEvent("SpectorOnProgramRebuilt", { detail: { programId: programId, errorString: error, tabId: tabId } });
                        document.dispatchEvent(myEvent);
                    });
            });
            document.addEventListener("SpectorRequestCanvasListEvent", function(e) {
                var canvasList = [];

                // Include DOM canvases with WebGL contexts (these may not be in
                // __SPECTOR_Canvases when captureOffScreen is false).
                if (document.body) {
                    var domCanvases = document.body.querySelectorAll("canvas");
                    for (var c = 0; c < domCanvases.length; c++) {
                        var dc = domCanvases[c];
                        var alreadyTracked = false;
                        for (var j = 0; j < window.__SPECTOR_Canvases.length; j++) {
                            if (window.__SPECTOR_Canvases[j] === dc) {
                                alreadyTracked = true;
                                break;
                            }
                        }
                        if (alreadyTracked) { continue; }

                        if (dc.__spector_transferred) {
                            // Transferred canvas — add as Worker entry
                            dc.id = dc.id || "OffscreenCanvas (Worker)";
                            window.__SPECTOR_Canvases.push(dc);
                        } else {
                            // Regular DOM canvas — add if it has a WebGL context
                            var ctx = null;
                            try { ctx = dc.getContext(dc.getAttribute(spectorContextTypeKey)); }
                            catch(ex) { /* ignore */ }
                            if (ctx) {
                                window.__SPECTOR_Canvases.push(dc);
                            }
                        }
                    }
                }

                for (var i = 0; i < window.__SPECTOR_Canvases.length; i++) {
                    var canvas = window.__SPECTOR_Canvases[i];
                    canvasList.push({
                        id: canvas.id,
                        width: canvas.width,
                        height: canvas.height,
                        ref: i
                    });
                }
                var myEvent = new CustomEvent("SpectorOnCanvasListEvent", { 
                    detail: {
                        canvasList: canvasList 
                    }
                });
                document.dispatchEvent(myEvent);
            });
            spector.onError.add((error) => {
                var myEvent = new CustomEvent("SpectorOnErrorEvent", { detail: { errorString: error } });
                document.dispatchEvent(myEvent);
            });
            spector.onCapture.add((capture) => {
                var myEvent = new CustomEvent("SpectorOnCaptureEvent", { detail: { capture: capture } });
                document.dispatchEvent(myEvent);
            });
            setInterval(() => {
                var myEvent = new CustomEvent("SpectorFPSEvent", { detail: { fps: (spector ? spector.getFps() : 0) } });
                document.dispatchEvent(myEvent);
            }, 1500);
            window.spector = spector;
    }, 0);

    document.addEventListener("DOMContentLoaded", function () {
        var input = document.createElement('input');
        input.type = 'Hidden';
        input.id = spectorCommunicationElementId;
        document.body.appendChild(input);
        var input2 = document.createElement('input');
        input2.type = 'Hidden';
        input2.id = spectorCommunicationQuickCaptureElementId;
        document.body.appendChild(input2);
        var input3 = document.createElement('input');
        input3.type = 'Hidden';
        input3.id = spectorCommunicationFullCaptureElementId;
        document.body.appendChild(input3);
        var input4 = document.createElement('input');
        input4.type = 'Hidden';
        input4.id = spectorCommunicationRebuildProgramElementId;
        document.body.appendChild(input4);
        var input5 = document.createElement('input');
        input5.type = 'Hidden';
        input5.id = spectorCommunicationCommandCountElementId;
        document.body.appendChild(input5);
        var input6 = document.createElement('input');
        input6.type = 'Hidden';
        input6.id = spectorCommunicationShaderDelayElementId;
        document.body.appendChild(input6);
    });
}