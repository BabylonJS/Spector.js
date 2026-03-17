// pageScriptInit.js — Runs in MAIN world after spector.bundle.js is loaded.
// Initializes the Spector instance and sets up event listeners for the extension.
// Injected by the background service worker via browser.scripting.executeScript().

(function() {
    "use strict";

    if (typeof SPECTOR === "undefined") {
        return;
    }

    var captureOffScreenKey = "SPECTOR_CAPTUREOFFSCREEN";
    var spectorCommunicationElementId = "SPECTOR_COMMUNICATION";
    var spectorCommunicationQuickCaptureElementId = "SPECTOR_COMMUNICATION_QUICKCAPTURE";
    var spectorCommunicationFullCaptureElementId = "SPECTOR_COMMUNICATION_FULLCAPTURE";
    var spectorCommunicationCommandCountElementId = "SPECTOR_COMMUNICATION_COMMANDCOUNT";
    var spectorCommunicationRebuildProgramElementId = "SPECTOR_COMMUNICATION_REBUILDPROGRAM";

    var captureOffScreen = false;
    try {
        captureOffScreen = (sessionStorage.getItem(captureOffScreenKey) === "true");
    } catch(e) {}

    var spector = new SPECTOR.Spector();
    spector.spyCanvases();

    document.addEventListener("SpectorRequestPauseEvent", function() { spector.pause(); });
    document.addEventListener("SpectorRequestPlayEvent", function() { spector.play(); });
    document.addEventListener("SpectorRequestPlayNextFrameEvent", function() { spector.playNextFrame(); });

    document.addEventListener("SpectorRequestCaptureEvent", function() {
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
        spector.captureCanvas(canvas, commandCount, quickCapture, fullCapture);
    });

    document.addEventListener("SpectorRequestRebuildProgramEvent", function() {
        var buildInfoInText = document.getElementById(spectorCommunicationRebuildProgramElementId).value;
        var buildInfo = JSON.parse(buildInfoInText);
        var tabId = document.getElementById(spectorCommunicationElementId).value;
        var programId = buildInfo.programId;
        var sourceVertex = buildInfo.sourceVertex;
        var sourceFragment = buildInfo.sourceFragment;
        spector.rebuildProgramFromProgramId(programId, sourceVertex, sourceFragment,
            function(program) {
                spector.referenceNewProgram(programId, program);
                document.dispatchEvent(new CustomEvent("SpectorOnProgramRebuilt", { detail: { programId: programId, errorString: null, tabId: tabId } }));
            },
            function(error) {
                document.dispatchEvent(new CustomEvent("SpectorOnProgramRebuilt", { detail: { programId: programId, errorString: error, tabId: tabId } }));
            });
    });

    document.addEventListener("SpectorRequestCanvasListEvent", function() {
        var canvasList = [];
        for (var i = 0; i < window.__SPECTOR_Canvases.length; i++) {
            var canvas = window.__SPECTOR_Canvases[i];
            canvasList.push({ id: canvas.id, width: canvas.width, height: canvas.height, ref: i });
        }
        document.dispatchEvent(new CustomEvent("SpectorOnCanvasListEvent", { detail: { canvasList: canvasList } }));
    });

    spector.onError.add(function(error) {
        document.dispatchEvent(new CustomEvent("SpectorOnErrorEvent", { detail: { errorString: error } }));
    });
    spector.onCapture.add(function(capture) {
        document.dispatchEvent(new CustomEvent("SpectorOnCaptureEvent", { detail: { capture: capture } }));
    });
    setInterval(function() {
        document.dispatchEvent(new CustomEvent("SpectorFPSEvent", { detail: { fps: (spector ? spector.getFps() : 0) } }));
    }, 1500);
    window.spector = spector;
})();
