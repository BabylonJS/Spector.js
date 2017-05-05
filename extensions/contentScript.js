var debug = false;

//_______________________________EXTENSION POLYFILL_____________________________________
window.browser = (function () {
    return window.msBrowser ||
        window.browser ||
        window.chrome ||
        browser;
})();

function getExtensionURL() {
    if (window["safari"]) {
        return safari.extension.baseURI;
    }

    return window.browser.extension.getURL("");
};

var uniqueId = new Date().getTime() + Math.abs(Math.random() * 1000000);
function sendMessage(message, cb) {
    message["uniqueId"] = uniqueId;

    if (window["safari"]) {
        safari.self.tab.dispatchMessage("message", message);
        return;
    }

    window.browser.runtime.sendMessage(message, function (response) {
        if (cb) {
            cb(response);
        }
    });
};

function listenForMessage(callback) {
    if (window["safari"]) {
        safari.self.addEventListener("message", callback);
    }

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
var spectorCommunicationElementId = "SPECTOR_COMMUNICATION";
var spectorContextTypeKey = "__spector_context_type";

var canvasGetContextDetection = `
    var OLDGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function () {
        var context = OLDGetContext.apply(this, arguments);
        if (context === null) {
            return null;
        }

        var contextNames = ["webgl", "experimental-webgl", "webgl2", "experimental-webgl2"];
        if (contextNames.indexOf(arguments[0]) !== -1) {
            context.canvas.setAttribute("${spectorContextTypeKey}", arguments[0]);
        }

        return context;
    }`;
insertTextScript(canvasGetContextDetection);

// In case the spector injection has been requested, inject the library in the page.
if (sessionStorage.getItem(spectorLoadedKey)) {
    var pathRoot = getExtensionURL();
    var jsurl = pathRoot + "spector.bundle.js";

    if (debug) {
        insertScript("http://localhost:1337/tools/loader.js");
    }
    else {
        insertScript(jsurl);
    }

    // Defer exec to next slot to ensure proper loading of the lib.
    setTimeout(function () {
        var captureLib = `var spector = new SPECTOR.Spector();
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
                var canvas = document.body.querySelectorAll("canvas")[canvasIndex];
                spector.captureCanvas(canvas);
            });
            spector.onError.add((error) => {
                var myEvent = new CustomEvent("SpectorOnErrorEvent", { detail: { errorString: error } });
                document.dispatchEvent(myEvent);
            });
            spector.onCapture.add((capture) => {
                var myEvent = new CustomEvent("SpectorOnCaptureEvent", { detail: { captureString: JSON.stringify(capture) } });
                document.dispatchEvent(myEvent);
            });
            setInterval(() => {
                var myEvent = new CustomEvent("SpectorFPSEvent", { detail: { fps: spector.getFps() } });
                document.dispatchEvent(myEvent);
            }, 1500);`;

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
        document.body.appendChild(input);`;

        insertTextScript(script);
    });

    document.addEventListener('SpectorOnCaptureEvent', function (e) {
        sendMessage({ captureString: e.detail.captureString });
    }, false);

    document.addEventListener('SpectorOnErrorEvent', function (e) {
        sendMessage({ errorString: e.detail.errorString });
    }, false);

    document.addEventListener('SpectorFPSEvent', function (e) {
        sendMessage({ fps: e.detail.fps });
    }, false);
}

var frameId = null;


var getCanvases = function() {
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

            return canvasesInformation;
        }
    }
    return [];
}

var sendPresenceIfCanvases = function () {
    if (getCanvases().length > 0) {
        // Inform the extension that canvases are present (2 means injection has been done, 1 means ready to inject)
        sendMessage({ present: 1 }, function (response) {
            frameId = response.frameId;
        });
    }
}

var sendCanvases = function () {
    var canvases = getCanvases();
    // Inform the extension that canvases are present (2 means injection has been done, 1 means ready to inject)
    sendMessage({ canvases: canvases }, function (response) {
        frameId = response.frameId;
    });
}

// Check for existing canvas a bit after the end of the loading.
document.addEventListener("DOMContentLoaded", function () {
    if (!sessionStorage.getItem(spectorLoadedKey)) {
        setTimeout(sendPresenceIfCanvases, 1500);
        setTimeout(sendPresenceIfCanvases, 5000);
    }
    else {
        // Inform the extension that canvases are present (2 means injection has been done, 1 means ready to inject)
        sendMessage({ present: 2 }, function (response) {
            frameId = response.frameId;
        });
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

    // Let the paused canvas play again. 
    if (action === "playAll") {
        var myEvent = new CustomEvent("SpectorRequestPlayEvent");
        document.dispatchEvent(myEvent);
        return;
    }

    // Let s refresh the canvases list. 
    if (action === "requestCanvases") {
        setTimeout(function () { sendCanvases(); }, 0);
        setTimeout(function () { sendCanvases(); }, 1000);
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
            var myEvent = new CustomEvent("SpectorRequestCaptureEvent");
            document.dispatchEvent(myEvent);
        }
    }
});