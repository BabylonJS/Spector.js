//_______________________________EXTENSION POLYFILL_____________________________________
browser = (function () {
    return chrome ||
        browser ||
        chrome;
})();

function consumeLastError() {
    // Reading runtime.lastError marks an expected one-way delivery failure as
    // handled when the popup, tab, or content script has already closed.
    if (browser.runtime && browser.runtime.lastError) {
        return;
    }
};

function sendMessage(message) {
    browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs.length > 0) {
            browser.tabs.sendMessage(tabs[0].id, message, consumeLastError);
        }
    });
};

function sendRuntimeMessage(message) {
    browser.runtime.sendMessage(message, consumeLastError);
};

function listenForMessage(callback) {
    browser.runtime.onMessage.addListener(callback);
};
//_____________________________________________________________________________________

var tabInfo = {}
var resultTab = null;
var currentCapture = null;
var currentFrameId = null;
var currentTabId = null;

var clearCaptureSession = function() {
    browser.storage.local.remove([
        "currentCapture",
        "captureHistory",
        "currentFrameInfo"
    ], consumeLastError);
};

// Captures are useful within one browser session for comparison, but should
// not reappear after the browser is relaunched.
if (browser.runtime.onStartup) {
    browser.runtime.onStartup.addListener(clearCaptureSession);
}

var refreshCanvases = function() {
    var canvasesToSend = { canvases: [], captureOffScreen: false, workerAutoInject: false };
    browser.tabs.query({ active: true, currentWindow: true }, function(tabs) { 
        for (var tabId in tabInfo) {
            if (tabId == tabs[0].id) {
                for (var frameId in tabInfo[tabId]) {
                    var infos = tabInfo[tabId][frameId];
                    canvasesToSend.captureOffScreen = infos.captureOffScreen;
                    // Subframes may navigate to origins with different session
                    // settings. The popup reflects the top-level page's choice.
                    if (infos.isTopFrame) {
                        canvasesToSend.workerAutoInject = infos.workerAutoInject;
                    }
                    for (var i = 0; i < infos.canvases.length; i++) {
                        var info = infos.canvases[i];
                        canvasesToSend.canvases.push({
                            id: info.id,
                            width: info.width,
                            height: info.height,
                            ref: { tabId: tabId, frameId: frameId, index: info.ref }
                        });
                    }
                }
            }
        }

        sendRuntimeMessage({
            popup: "updateCanvasesListInformation",
            data: canvasesToSend
        });
    });
}

browser.action.onClicked.addListener(function (tab) {
    sendMessage({ action: "pageAction" });
});

listenForMessage(function(request, sender, sendResponse) {
    var frameId;
    if (sender.frameId) {
        frameId = sender.frameId;
    } 
    else if (request.uniqueId) {
        frameId = request.uniqueId;
    }
    else {
        frameId = sender.id;
    }
    frameId += "";

    if (request.action) {
    }
    else if (request.present === 1) {
        browser.action.enable(sender.tab.id);
    }
    // In case we are enabled, change the icon to green andd enable the popup.
    else if (request.present === 2) {
        browser.action.setIcon({tabId: sender.tab.id, path: {
            "19": "spectorjs-green-19.png",
            "38": "spectorjs-green-38.png"
        }});
        browser.action.setPopup({tabId: sender.tab.id, popup: "popup.html"});
        browser.action.enable(sender.tab.id);
    }
    else if (request.refreshCanvases) {
        browser.tabs.query({ active: true, currentWindow: true }, function(tabs) { 
            tabInfo = {}
            sendMessage({ action: "requestCanvases" });

            setTimeout(function() { refreshCanvases(); }, 500);
            setTimeout(function() { refreshCanvases(); }, 2000);
        });
    }
    else if (request.fps) {
        sendRuntimeMessage({
            popup: "refreshFps",
            data: {
                fps: request.fps,
                frameId: frameId,
                senderTabId: sender.tab.id
            }
        });
    }
    else if (request.canvases) {
        // Store the list of found canvases for the caller frame.
        var tabId = sender.tab.id + "";
        if (!tabInfo[tabId]) {
            tabInfo[tabId] = { };
        }

        tabInfo[tabId][frameId] = {
            canvases: request.canvases,
            captureOffScreen: request.captureOffScreen,
            workerAutoInject: request.workerAutoInject === true,
            isTopFrame: sender.frameId === 0
        };
    }
    else if (request.errorString) {
        // Close the wait message and may display an error.
        sendRuntimeMessage({
            popup: "captureComplete",
            data: request.errorString
        });
    }
    else if (request.captureDone) {
        currentFrameId = frameId;
        currentTabId = sender?.tab?.id;

        browser.storage.local.set({
            "currentFrameInfo": {
                currentFrameId,
                currentTabId
            }
        });

        // Open the result view if not open (need to check if length == 1 that the function exists for Edge),
        browser.tabs.create({ url: "result.html", active: true }, function(tab) {
            resultTab = tab;
        });


        // Close the wait message and may display an error.
        sendRuntimeMessage({
            popup: "captureComplete"
        });
    }
    else if (request.pageReload) {
        // Display the fps of the selected frame.
        sendRuntimeMessage({
            popup: "refreshCanvases"
        });
    }

    // Return the frameid for reference.
    sendResponse({ frameId: frameId });
});
