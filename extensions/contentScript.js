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
var spectorCommunicationElementId = "SPECTOR_COMMUNICATION";
var spectorCommunicationQuickCaptureElementId = "SPECTOR_COMMUNICATION_QUICKCAPTURE";
var spectorCommunicationFullCaptureElementId = "SPECTOR_COMMUNICATION_FULLCAPTURE";
var spectorCommunicationCommandCountElementId = "SPECTOR_COMMUNICATION_COMMANDCOUNT";
var spectorCommunicationRebuildProgramElementId = "SPECTOR_COMMUNICATION_REBUILDPROGRAM";

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

var spector;
window.__SPECTOR_Canvases = [];

(function() {
    var __SPECTOR_Origin_EXTENSION_GetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.__SPECTOR_Origin_EXTENSION_GetContext = __SPECTOR_Origin_EXTENSION_GetContext;

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
    if (typeof Worker !== 'undefined') {
        var __SPECTOR_Origin_Worker = Worker;
        window.__SPECTOR_Workers = [];

        // When a Worker reports its WebGL context is ready, add it to the canvas list
        var __SPECTOR_trackWorker = function(w, urlStr) {
            w.addEventListener('message', function(e) {
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
                            detail: { capture: JSON.stringify(e.data.capture) }
                        });
                        document.dispatchEvent(captureEvent);
                    }
                }
            });
        };

        window.Worker = function SpectorWorkerProxy(scriptURL, options) {
            var urlStr = scriptURL.toString();

            // Skip module workers — importScripts doesn't work there
            if (options && options.type === 'module') {
                var w = new __SPECTOR_Origin_Worker(scriptURL, options);
                window.__SPECTOR_Workers.push({ worker: w, url: urlStr, injected: false });
                __SPECTOR_trackWorker(w, urlStr);
                return w;
            }

            try {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', urlStr, false);
                xhr.send();

                if (xhr.status === 200) {
                    // Get the worker bundle URL — use the extension's own URL
                    var workerBundleUrl = document.getElementById('TexturesId_SpectorWorkerBundleUrl');
                    var bundleUrl = workerBundleUrl ? workerBundleUrl.value : '';

                    if (bundleUrl) {
                        var importLine = 'importScripts("' + bundleUrl + '");\n';
                        var modifiedScript = importLine + xhr.responseText;
                        var blob = new Blob([modifiedScript], { type: 'application/javascript' });
                        var blobUrl = URL.createObjectURL(blob);
                        var w = new __SPECTOR_Origin_Worker(blobUrl, options);
                        window.__SPECTOR_Workers.push({ worker: w, url: urlStr, injected: true });
                        __SPECTOR_trackWorker(w, urlStr);
                        return w;
                    }
                }
            } catch(e) {
                // tslint:disable-next-line:no-console
                // Fallback silently on CORS/CSP errors
            }

            var w = new __SPECTOR_Origin_Worker(scriptURL, options);
            window.__SPECTOR_Workers.push({ worker: w, url: urlStr, injected: false });
            __SPECTOR_trackWorker(w, urlStr);
            return w;
        };
        window.Worker.prototype = __SPECTOR_Origin_Worker.prototype;
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

                var canvas = null;
                if (captureOffScreen) {
                    canvas = window.__SPECTOR_Canvases[canvasIndex];
                } else {
                    canvas = document.body.querySelectorAll("canvas")[canvasIndex]; 
                }
                var quickCapture = (document.getElementById(spectorCommunicationQuickCaptureElementId).value === "true");
                var fullCapture = (document.getElementById(spectorCommunicationFullCaptureElementId).value === "true");
                var commandCount = 0 + document.getElementById(spectorCommunicationCommandCountElementId).value;

                // Route Worker proxy entries to captureWorker
                if (canvas && canvas.__spector_worker) {
                    spector.spyWorker(canvas.__spector_worker);
                    spector.captureWorker(canvas.__spector_worker, commandCount, quickCapture, fullCapture);
                } else {
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
    });
}