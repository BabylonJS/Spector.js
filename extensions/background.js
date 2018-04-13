//_______________________________EXTENSION POLYFILL_____________________________________
window.browser = (function () {
    return window.msBrowser ||
        window.browser ||
        window.chrome ||
        browser;
})();

function sendMessage(message) {
    window.browser.tabs.query({ active: true, currentWindow: true }, function(tabs) { 
        window.browser.tabs.sendMessage(tabs[0].id, message, function(response) { }); 
    });
};

function listenForMessage(callback) {
    window.browser.runtime.onMessage.addListener(callback);
};
//_____________________________________________________________________________________

var tabInfo = {}
var resultTab = null;
var currentCapture = null;
var currentCaptureChunks = [];
var currentFrameId = null;
var currentTabId = null;

var refreshCanvases = function() {
    var popup = window.browser.extension.getViews({ type: "popup" })[0];
    if (popup != null) {
        var canvasesToSend = { canvases: [], captureOffScreen: false };
        window.browser.tabs.query({ active: true, currentWindow: true }, function(tabs) { 
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

            popup.updateCanvasesListInformation(canvasesToSend);
        });
    }
}

window.browser.pageAction.onClicked.addListener(function (tab) {
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
        window.browser.pageAction.show(sender.tab.id);
    }
    // In case we are enabled, change the icon to green andd enable the popup.
    else if (request.present === 2) {
        window.browser.pageAction.setIcon({tabId: sender.tab.id, path: {
            "19": "spectorjs-green-19.png",
            "38": "spectorjs-green-38.png"
        }});
        window.browser.pageAction.setPopup({tabId: sender.tab.id, popup: "popup.html"});
        window.browser.pageAction.show(sender.tab.id);
    }
    else if (request.refreshCanvases) {
        window.browser.tabs.query({ active: true, currentWindow: true }, function(tabs) { 
            tabInfo = {}
            sendMessage({ action: "requestCanvases" });

            setTimeout(function() { refreshCanvases(); }, 500);
            setTimeout(function() { refreshCanvases(); }, 2000);
        });
    }
    else if (request.fps) {
        // Display the fps of the selected frame.
        var popup = window.browser.extension.getViews({ type: "popup" })[0];
        if (popup != null && popup.refreshFps) {
            popup.refreshFps(request.fps, frameId, sender.tab.id);
        }
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
        var popup = window.browser.extension.getViews({ type: "popup" })[0];
        if (popup != null && popup.captureComplete) {
            popup.captureComplete(request.errorString);
        }
    }
    else if (request.captureChunk) {
        currentCaptureChunks.push(request.captureChunk);
    }
    else if (request.captureDone) {
        // Concatenate the current capture chunks and reset the array.
        var allChunks = currentCaptureChunks;
        currentCaptureChunks = [];
        var fullJSON = "".concat.apply("", allChunks);
        var capture = JSON.parse(fullJSON);
        // If a capture has been received,
        var tabWindows = browser.extension.getViews({type: "tab"});
        // Open the result view if not open (need to check if length == 1 that the function exists for Edge),
        window.browser.tabs.create({ url: "result.html", active: true }, function(tab) {
            resultTab = tab;
            currentCapture = capture;
            currentFrameId = frameId;
            currentTabId = sender.tab.id;
        });
        

        // Close the wait message and may display an error.
        var popup = window.browser.extension.getViews({ type: "popup" })[0];
        if (popup != null && popup.captureComplete) {
            popup.captureComplete();
        }
    }
    else if (request.pageReload) {
        // Display the fps of the selected frame.
        var popup = window.browser.extension.getViews({ type: "popup" })[0];
        if (popup != null && popup.refreshCanvases) {
            popup.refreshCanvases();
        }
    }

    // Return the frameid for reference.
    sendResponse({ frameId: frameId });
});
