//_______________________________EXTENSION POLYFILL_____________________________________
// Safari natively supports the browser.* namespace
var _browser = (typeof browser !== "undefined") ? browser : chrome;
if (typeof globalThis !== "undefined") {
    globalThis.browser = _browser;
} else {
    self.browser = _browser;
}

function sendMessage(message) {
    _browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        _browser.tabs.sendMessage(tabs[0].id, message, function(response) { });
    });
};

function sendRuntimeMessage(message) {
    _browser.runtime.sendMessage(message, function(response) { });
};

function listenForMessage(callback) {
    _browser.runtime.onMessage.addListener(callback);
};
//_____________________________________________________________________________________

//_______________________________ MAIN WORLD CONTENT SCRIPTS ___________________________
// Register pageScript.js to run in the MAIN world at document_start.
// This bypasses page CSP (unlike inline <script> injection) and ensures the
// getContext() patch is in place before any page scripts run.
_browser.scripting.registerContentScripts([{
    id: "spector-page-script",
    matches: ["http://*/*", "https://*/*"],
    js: ["pageScript.js"],
    runAt: "document_start",
    allFrames: true,
    world: "MAIN"
}]).catch(function() {
    // Script may already be registered from a previous session
});
//_____________________________________________________________________________________

// Inject the Spector bundle and init script into a tab's MAIN world.
function injectSpectorBundle(tabId) {
    _browser.scripting.executeScript({
        target: { tabId: tabId, allFrames: true },
        files: ["spector.bundle.js", "pageScriptInit.js"],
        world: "MAIN"
    }).catch(function(e) {
        console.error("Spector: Failed to inject bundle", e);
    });
}
//_____________________________________________________________________________________

var tabInfo = {}
var resultTab = null;
var currentCapture = null;
var currentFrameId = null;
var currentTabId = null;

var refreshCanvases = function() {
    var canvasesToSend = { canvases: [], captureOffScreen: false };
    _browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        for (var tabId in tabInfo) {
            if (tabId == tabs[0].id) {
                for (var frameId in tabInfo[tabId]) {
                    var infos = tabInfo[tabId][frameId];
                    canvasesToSend.captureOffScreen = infos.captureOffScreen;
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

_browser.action.onClicked.addListener(function (tab) {
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
    // Content script requests bundle injection after page reload with Spector enabled
    else if (request.injectSpector && sender.tab) {
        injectSpectorBundle(sender.tab.id);
    }
    else if (request.present === 1) {
        _browser.action.enable(sender.tab.id);
    }
    // In case we are enabled, change the icon to green and enable the popup.
    else if (request.present === 2) {
        _browser.action.setIcon({tabId: sender.tab.id, path: {
            "19": "spectorjs-green-19.png",
            "38": "spectorjs-green-38.png"
        }});
        _browser.action.setPopup({tabId: sender.tab.id, popup: "popup.html"});
        _browser.action.enable(sender.tab.id);
    }
    else if (request.refreshCanvases) {
        _browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
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

        tabInfo[tabId][frameId] = { canvases: request.canvases, captureOffScreen: request.captureOffScreen };
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

        _browser.storage.local.set({
            "currentFrameInfo": {
                currentFrameId,
                currentTabId
            }
        });

        // Open the result view.
        _browser.tabs.create({ url: "result.html", active: true }, function(tab) {
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
