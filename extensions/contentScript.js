var debug = false;

//_______________________________EXTENSION POLYFILL_____________________________________
window.browser = (function () {
    return window.msBrowser ||
        window.browser ||
        window.chrome ||
        browser;
})();

function getExtensionURL() {
    return window.browser.extension.getURL("");
};

var uniqueId = new Date().getTime() + Math.abs(Math.random() * 1000000);
function sendMessage(message, cb) {
    message["uniqueId"] = uniqueId;
    window.browser.runtime.sendMessage(message, function (response) {
        if (cb) {
            cb(response);
        }
    });
};

function listenForMessage(callback) {
    window.browser.runtime.onMessage.addListener(callback);
};
//_____________________________________________________________________________________

//_______________________________SCRIPT  UTILITIES_____________________________________
function insertTextScript(text) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.text = text;
    insertHeaderNode(script);
    return script;
};

function insertScript(url) {
    var script = document.createElement("script");
    script.type = "text/javascript";

    // Place the entire inspector into a <script> tag instead of referencing
    // the URL - this enables synchronous loading and inspection of code
    // creating contexts before dom ready.
    // It's nasty, though, as dev tools shows it as another script group on
    // the main page.
    // script.src = url;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send('');
    script.text = xhr.responseText;

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

var canvasGetContextDetection = `
    var spector;
    var captureOnLoad = ${captureOnLoad ? "true" : "false"};
    var captureOffScreen = ${captureOffScreen ? "true" : "false"};
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
                    // context.canvas.setAttribute("${spectorContextTypeKey}", arguments[0]);
                    // Notify the page a canvas is available.
                    var myEvent = new CustomEvent("SpectorWebGLCanvasAvailableEvent");
                    document.dispatchEvent(myEvent);
                    this.id = "Offscreen";
                    window.__SPECTOR_Canvases.push(this);
    
                    if (captureOnLoad) {
                        // Ensures canvas is in the dom to capture the one we are currently tracking.
                        if (${captureOnLoadTransient}) {
                            spector.captureContext(context, ${captureOnLoadCommandCount}, ${captureOnLoadQuickCapture}, ${captureOnLoadFullCapture});
                            captureOnLoad = false;
                        }
                    }
                }
    
                return context;
            }
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
                context.canvas.setAttribute("${spectorContextTypeKey}", arguments[0]);
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
                    if (this.parentElement || ${captureOnLoadTransient}) {
                        spector.captureContext(context, ${captureOnLoadCommandCount}, ${captureOnLoadQuickCapture}, ${captureOnLoadFullCapture});
                        captureOnLoad = false;
                    }
                }
            }

            return context;
        }
    })()`;
insertTextScript(canvasGetContextDetection);

var frameId = null;

// In case the spector injection has been requested, inject the library in the page.
if (sessionStorage.getItem(spectorLoadedKey)) {
    
    if (debug) {
        insertScript("http://localhost:1337/tools/loader.js");
    }
    else {
        insertTextScript( '(' + spectorBundleHook.toString() + ' )();');
    }

    // Defer exec to next slot to ensure proper loading of the lib.
    setTimeout(function () {
        var captureLib = `spector = new SPECTOR.Spector();
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
                var canvasIndex = document.getElementById('${spectorCommunicationElementId}').value;

                var canvas = null;
                if (${captureOffScreen}) {
                    canvas = window.__SPECTOR_Canvases[canvasIndex];
                } else {
                    canvas = document.body.querySelectorAll("canvas")[canvasIndex]; 
                }
                var quickCapture = (document.getElementById('${spectorCommunicationQuickCaptureElementId}').value === "true");
                var fullCapture = (document.getElementById('${spectorCommunicationFullCaptureElementId}').value === "true");
                var commandCount = 0 + document.getElementById('${spectorCommunicationCommandCountElementId}').value;

                spector.captureCanvas(canvas, commandCount, quickCapture, fullCapture);
            });
            document.addEventListener("SpectorRequestRebuildProgramEvent", function(e) {
                var buildInfoInText = document.getElementById('${spectorCommunicationRebuildProgramElementId}').value;
                var buildInfo = JSON.parse(buildInfoInText);
                var tabId = document.getElementById('${spectorCommunicationElementId}').value;

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
            window.spector = spector;`;

        if (debug) {
            insertTextScript(`SPECTORTOOLS.Loader
			.onReady(function() {
				${captureLib}
			})
			.load();`);
        }
        else {
            insertTextScript(captureLib);
        }
    }, 0);

    document.addEventListener("DOMContentLoaded", function () {
        var script = `var input = document.createElement('input');
        input.type = 'Hidden';
        input.id = '${spectorCommunicationElementId}';
        document.body.appendChild(input);
        var input2 = document.createElement('input');
        input2.type = 'Hidden';
        input2.id = '${spectorCommunicationQuickCaptureElementId}';
        document.body.appendChild(input2);
        var input3 = document.createElement('input');
        input3.type = 'Hidden';
        input3.id = '${spectorCommunicationFullCaptureElementId}';
        document.body.appendChild(input3);
        var input4 = document.createElement('input');
        input4.type = 'Hidden';
        input4.id = '${spectorCommunicationRebuildProgramElementId}';
        document.body.appendChild(input4);
        var input5 = document.createElement('input');
        input5.type = 'Hidden';
        input5.id = '${spectorCommunicationCommandCountElementId}';
        document.body.appendChild(input5);`;

        insertTextScript(script);
    });

    document.addEventListener('SpectorOnCaptureEvent', function (e) {
        // The browser imposes limits on the size of the serialized JSON
        // associated with these messages. To avoid running into these limits,
        // and not have to introspect too deeply into the ICapture structure, we
        // manually serialize to JSON and chop up the resulting string.
        //
        // Note for future reference: the object that comes in via
        // e.detail.capture is actually immutable, because of the way it's
        // serialized from the main world to the content script. If the goal
        // were to stub out certain fields and send them separately,
        // Object.assign would have to be used to create a new top-level object.
        var serialized = JSON.stringify(e.detail.capture);
        var len = serialized.length;
        var ii = 0;
        var step = 32 * 1024 * 1024; // 32 MB
        while (ii < len) {
            var nextIndex = Math.min(ii + step, len);
            var substr = serialized.substring(ii, nextIndex);
            sendMessage({ captureChunk: substr });
            ii = nextIndex;
        }
        sendMessage({ captureDone: true });
    }, false);

    document.addEventListener('SpectorOnErrorEvent', function (e) {
        sendMessage({ errorString: e.detail.errorString });
    }, false);

    document.addEventListener('SpectorFPSEvent', function (e) {
        sendMessage({ fps: e.detail.fps });
    }, false);

    document.addEventListener('SpectorOnProgramRebuilt', function (e) {
        sendMessage({ 
            programRebuilt: {
                programId: e.detail.programId, 
                errorString: e.detail.errorString 
            },
            tabId: e.detail.tabId
        });
    }, false);

    document.addEventListener('SpectorOnCanvasListEvent', function(e) {
        var canvasList = e.detail.canvasList;

        var uiInformation = [];
        for (var i = 0; i < canvasList.length; i++) {
            var canvasInformation = canvasList[i];
            uiInformation.push({
                id: canvasInformation.id,
                width: canvasInformation.width,
                height: canvasInformation.height,
                ref: canvasInformation.ref
            });
        }

        // Inform the extension that canvases are present (2 means injection has been done, 1 means ready to inject)
        sendMessage({ canvases: uiInformation, captureOffScreen: true }, function (response) {
            frameId = response.frameId;
        });
    });
}
else {
    document.addEventListener('SpectorWebGLCanvasAvailableEvent', function(e) {
        // Inform the extension that canvases are present (2 means injection has been done, 1 means ready to inject)
        sendMessage({ present: 1 }, function (response) {
            frameId = response.frameId;
        });
    }, false);
}

var refreshCanvases = function() {
    if (captureOffScreen) {
        // List is retrieved from all the ever created canvases.
        var myEvent = new CustomEvent("SpectorRequestCanvasListEvent");
        document.dispatchEvent(myEvent);
    }
    else {
        if (document.body) {
            var canvasElements = document.body.querySelectorAll("canvas");
            if (canvasElements.length > 0) {

                var canvasesInformation = [];
                for (var i = 0; i < canvasElements.length; i++) {
                    var canvas = canvasElements[i];
                    var context = null;
                    try {
                        context = canvas.getContext(canvas.getAttribute(spectorContextTypeKey));
                    }
                    catch (e) {
                        // Do Nothing.
                    }
                    
                    if (context) {
                        canvasesInformation.push({
                            id: canvas.id,
                            width: canvas.width,
                            height: canvas.height,
                            ref: i
                        });
                    }
                }
                sendMessage({ canvases: canvasesInformation, captureOffScreen: false }, function (response) {
                    frameId = response.frameId;
                });
            }
        }
    }
}

// Check for existing canvas a bit after the end of the loading.
document.addEventListener("DOMContentLoaded", function () {
    if (sessionStorage.getItem(spectorLoadedKey)) {
        // Inform the extension that canvases are present (2 means injection has been done, 1 means ready to inject)
        sendMessage({ present: 2 }, function (response) {
            frameId = response.frameId;
        });

        // Refresh the canvas list.
        setTimeout(function () {
            sendMessage({ pageReload: true }, function (response) {
                frameId = response.frameId;
            });
        }, 500);
    }
});

listenForMessage(function (message) {
    var action = message.action;
    // Only answer to actions.
    if (!action) {
        return;
    }

    // We need to reload to inject the scripts.
    if (action === "pageAction") {
        if (!sessionStorage.getItem(spectorLoadedKey)) {
            sessionStorage.setItem(spectorLoadedKey, "true");
            // Delay for all frames.
            setTimeout(function () { window.location.reload(); }, 50);
            return;
        }
    }

    // Set offscreen canvas mode.
    if (action === "changeOffScreen") {
        sessionStorage.setItem(captureOffScreenKey, message.captureOffScreen ? "true" : "false");
        // Delay for all frames.
        setTimeout(function () { window.location.reload(); }, 50);
        return;
    }

    // We need to reload to inject the capture loading sequence.
    if (action === "captureOnLoad") {
        var transient = message.transient;
        var commandCount = message.commandCount;
        var quickCapture = message.quickCapture;
        var fullCapture = message.fullCapture;

        sessionStorage.setItem(spectorCaptureOnLoadTransientKey, transient);
        sessionStorage.setItem(spectorCaptureOnLoadQuickCaptureKey, quickCapture);
        sessionStorage.setItem(spectorCaptureOnLoadFullCaptureKey, fullCapture);
        sessionStorage.setItem(spectorCaptureOnLoadCommandCountKey, commandCount);
        sessionStorage.setItem(spectorCaptureOnLoadKey, "true");

        // Delay for all frames.
        setTimeout(function () { window.location.reload(); }, 50);
        return;
    }

    // Let the paused canvas play again. 
    if (action === "playAll") {
        var myEvent = new CustomEvent("SpectorRequestPlayEvent");
        document.dispatchEvent(myEvent);
        return;
    }

    // Let s refresh the canvases list. 
    if (action === "requestCanvases") {
        setTimeout(function () { refreshCanvases(); }, 0);
        setTimeout(function () { refreshCanvases(); }, 1000);
        return;
    }

    // Following actions are only valid for the selected frame.
    var canvasRef = message.canvasRef;
    if (canvasRef.frameId !== frameId) {
        return;
    }

    if (action === "pause") {
        var myEvent = new CustomEvent("SpectorRequestPauseEvent");
        document.dispatchEvent(myEvent);
    }
    else if (action === "play") {
        var myEvent = new CustomEvent("SpectorRequestPlayEvent");
        document.dispatchEvent(myEvent);
    }
    else if (action === "playNextFrame") {
        var myEvent = new CustomEvent("SpectorRequestPlayNextFrameEvent");
        document.dispatchEvent(myEvent);
    }
    else if (action === "capture") {
        var input = document.getElementById(spectorCommunicationElementId);
        if (input) {
            input.value = canvasRef.index;

            var inputQuickCapture = document.getElementById(spectorCommunicationQuickCaptureElementId);
            if (inputQuickCapture) {
                inputQuickCapture.value = message.quickCapture ? "true" : "false";
            }
            var inputFullCapture = document.getElementById(spectorCommunicationFullCaptureElementId);
            if (inputFullCapture) {
                inputFullCapture.value = message.fullCapture ? "true" : "false";
            }
            var inputCommandCount = document.getElementById(spectorCommunicationCommandCountElementId);
            if (inputCommandCount) {
                inputCommandCount.value = message.commandCount;
            }

            var myEvent = new CustomEvent("SpectorRequestCaptureEvent");
            document.dispatchEvent(myEvent);
        }
    }
    else if (action === "rebuildProgram") {
        var input = document.getElementById(spectorCommunicationRebuildProgramElementId);
        var tabIdInput = document.getElementById(spectorCommunicationElementId);
        if (input && tabIdInput) {
            var buildInfo = message.buildInfo;
            var buildInfoInText = JSON.stringify(buildInfo);
            input.value = buildInfoInText;
            tabIdInput.value = canvasRef.tabId;

            var myEvent = new CustomEvent("SpectorRequestRebuildProgramEvent");
            document.dispatchEvent(myEvent);
        }
    }
});
