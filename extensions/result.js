//_______________________________EXTENSION POLYFILL_____________________________________
window.browser = (function () {
  return window.msBrowser ||
    window.browser ||
    window.chrome ||
    browser;
})();

function sendMessage(message, tabId) {
    if (tabId) {
        window.browser.tabs.sendMessage(tabId, message, function(response) { }); 
    }
    else {
        window.browser.tabs.query({ active: true, currentWindow: true }, function(tabs) { 
            window.browser.tabs.sendMessage(tabs[0].id, message, function(response) { }); 
        });
    }
};

function listenForMessage(callback) {
    window.browser.runtime.onMessage.addListener(callback);
};
//_____________________________________________________________________________________

var ui = null;
var frameId = null;
var tabId = null;

listenForMessage(function(request, sender, sendResponse) {
    if (request.programRebuilt && request.tabId == tabId) {
        ui.showSourceCodeError(request.programRebuilt.errorString);
    }
});

window.addEventListener("DOMContentLoaded", function() {
    ui = new SPECTOR.EmbeddedFrontend.ResultView();
    ui.onSourceCodeChanged.add((sourceCodeEvent) => {

        var buildInfo = {
            programId: sourceCodeEvent.programId,
            sourceVertex: sourceCodeEvent.sourceVertex,
            sourceFragment: sourceCodeEvent.sourceFragment,
        };

        sendMessage({ 
            action: "rebuildProgram", 
            canvasRef: { frameId, tabId },
            buildInfo: buildInfo,
        }, tabId);
    });
    ui.display();

    browser.storage.local.get("currentFrameInfo").then(c => {
        frameId = c.currentFrameInfo.currentFrameId;
        tabId = c.currentFrameInfo.currentTabId;
    });

    // Load the rolling capture history (most recent first) so the Compare tab
    // has a previous capture to diff against. Add oldest-first so the newest
    // capture ends up active at the front of the list. Falls back to the single
    // currentCapture for backward compatibility.
    browser.storage.local.get("captureHistory").then(c => {
        const history = c && c.captureHistory;
        if (history && history.length > 0) {
            for (let i = history.length - 1; i >= 0; i--) {
                addCapture(history[i]);
            }
        } else {
            browser.storage.local.get("currentCapture").then(cc => {
                addCapture(cc.currentCapture);
            });
        }
    });
});

var addCapture = function(capture) {
    if (ui && capture) {
        ui.addCapture(capture);
    }
}