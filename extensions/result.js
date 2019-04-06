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
            canvasRef: { frameId: frameId, tabId: tabId },
            buildInfo: buildInfo,
        }, tabId);
    });
    ui.display();

    // On first load collect and display the capture from the background page.
    var bgPage = browser.extension.getBackgroundPage();
    addCapture(bgPage.currentCapture);
    frameId = bgPage.currentFrameId;
    tabId = bgPage.currentTabId;
    bgPage.currentCapture = null;
});

var addCapture = function(capture) {
    if (ui && capture) {
        ui.addCapture(capture);
    }
}