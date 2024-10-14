//_______________________________EXTENSION POLYFILL_____________________________________
window.browser = (function () {
    return window.msBrowser ||
        window.browser ||
        window.chrome ||
        browser;
})();

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

var captureOffScreen = (sessionStorage.getItem(captureOffScreenKey) === "true");

var frameId = null;

// In case the spector injection has been requested, inject the library in the page.
if (sessionStorage.getItem(spectorLoadedKey)) {

    document.addEventListener('SpectorOnCaptureEvent', function (e) {
        browser.storage.local.set({
            "currentCapture": e.detail.capture,
        });

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
        sessionStorage.setItem(spectorCaptureOnLoadTransientKey, message.transient);
        sessionStorage.setItem(spectorCaptureOnLoadQuickCaptureKey, message.quickCapture);
        sessionStorage.setItem(spectorCaptureOnLoadFullCaptureKey, message.fullCapture);
        sessionStorage.setItem(spectorCaptureOnLoadCommandCountKey, message.commandCount);
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
