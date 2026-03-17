//_______________________________EXTENSION POLYFILL_____________________________________
window.browser = (function () {
    return window.browser ||
        window.chrome;
})();
//_____________________________________________________________________________________

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

//_______________________________ISOLATED WORLD LISTENERS________________________________
// The getContext() patch runs in the MAIN world via pageScript.js (registered by background.js).
// The Spector bundle + init run in the MAIN world via scripting.executeScript (triggered below).
// This content script (ISOLATED world) bridges extension APIs <-> page CustomEvents.

// In case the spector injection has been requested, inject the bundle via the background.
if (sessionStorage.getItem(spectorLoadedKey)) {

    // Ask the background to inject spector.bundle.js + pageScriptInit.js into MAIN world.
    // This uses browser.scripting.executeScript which bypasses page CSP.
    sendMessage({ injectSpector: true });

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

        sendMessage({ canvases: uiInformation, captureOffScreen: true }, function (response) {
            frameId = response.frameId;
        });
    });
}
else {
    document.addEventListener('SpectorWebGLCanvasAvailableEvent', function(e) {
        sendMessage({ present: 1 }, function (response) {
            frameId = response.frameId;
        });
    }, false);
}

//_______________________________CANVAS LIST REFRESH____________________________________
var refreshCanvases = function() {
    if (captureOffScreen) {
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

//_______________________________DOM CONTENT LOADED_____________________________________
document.addEventListener("DOMContentLoaded", function () {
    if (sessionStorage.getItem(spectorLoadedKey)) {
        sendMessage({ present: 2 }, function (response) {
            frameId = response.frameId;
        });

        setTimeout(function () {
            sendMessage({ pageReload: true }, function (response) {
                frameId = response.frameId;
            });
        }, 500);

        // Create hidden input elements for cross-world communication via DOM
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
    }
});

//_______________________________MESSAGE HANDLER________________________________________
listenForMessage(function (message) {
    var action = message.action;
    if (!action) {
        return;
    }

    if (action === "pageAction") {
        if (!sessionStorage.getItem(spectorLoadedKey)) {
            sessionStorage.setItem(spectorLoadedKey, "true");
            setTimeout(function () { window.location.reload(); }, 50);
            return;
        }
    }

    if (action === "changeOffScreen") {
        sessionStorage.setItem(captureOffScreenKey, message.captureOffScreen ? "true" : "false");
        setTimeout(function () { window.location.reload(); }, 50);
        return;
    }

    if (action === "captureOnLoad") {
        sessionStorage.setItem(spectorCaptureOnLoadTransientKey, message.transient);
        sessionStorage.setItem(spectorCaptureOnLoadQuickCaptureKey, message.quickCapture);
        sessionStorage.setItem(spectorCaptureOnLoadFullCaptureKey, message.fullCapture);
        sessionStorage.setItem(spectorCaptureOnLoadCommandCountKey, message.commandCount);
        sessionStorage.setItem(spectorCaptureOnLoadKey, "true");
        setTimeout(function () { window.location.reload(); }, 50);
        return;
    }

    if (action === "playAll") {
        var myEvent = new CustomEvent("SpectorRequestPlayEvent");
        document.dispatchEvent(myEvent);
        return;
    }

    if (action === "requestCanvases") {
        setTimeout(function () { refreshCanvases(); }, 0);
        setTimeout(function () { refreshCanvases(); }, 1000);
        return;
    }

    var canvasRef = message.canvasRef;
    if (canvasRef.frameId !== frameId) {
        return;
    }

    if (action === "pause") {
        document.dispatchEvent(new CustomEvent("SpectorRequestPauseEvent"));
    }
    else if (action === "play") {
        document.dispatchEvent(new CustomEvent("SpectorRequestPlayEvent"));
    }
    else if (action === "playNextFrame") {
        document.dispatchEvent(new CustomEvent("SpectorRequestPlayNextFrameEvent"));
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

            document.dispatchEvent(new CustomEvent("SpectorRequestCaptureEvent"));
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

            document.dispatchEvent(new CustomEvent("SpectorRequestRebuildProgramEvent"));
        }
    }
});
