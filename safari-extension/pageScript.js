// pageScript.js — Runs in MAIN world at document_start via browser.scripting API.
// Patches getContext() to detect WebGL canvases and support capture-on-load.
// This file is registered as a MAIN-world content script by background.js,
// which means it bypasses page CSP (unlike inline <script> injection).

(function() {
    "use strict";

    var spectorContextTypeKey = "__spector_context_type";
    var captureOffScreenKey = "SPECTOR_CAPTUREOFFSCREEN";
    var spectorCaptureOnLoadKey = "SPECTOR_CAPTUREONLOAD";
    var spectorCaptureOnLoadCommandCountKey = "SPECTOR_CAPTUREONLOAD_COMMANDCOUNT";
    var spectorCaptureOnLoadTransientKey = "SPECTOR_CAPTUREONLOAD_TRANSIENT";
    var spectorCaptureOnLoadQuickCaptureKey = "SPECTOR_CAPTUREONLOAD_QUICKCAPTURE";
    var spectorCaptureOnLoadFullCaptureKey = "SPECTOR_CAPTUREONLOAD_FULLCAPTURE";

    var captureOnLoad = false;
    var captureOnLoadTransient = false;
    var captureOnLoadQuickCapture = false;
    var captureOnLoadFullCapture = false;
    var captureOnLoadCommandCount = 500;
    var captureOffScreen = false;

    try {
        if (sessionStorage.getItem(spectorCaptureOnLoadKey) === "true") {
            sessionStorage.setItem(spectorCaptureOnLoadKey, "false");
            captureOnLoad = true;
            captureOnLoadTransient = (sessionStorage.getItem(spectorCaptureOnLoadTransientKey) === "true");
            captureOnLoadQuickCapture = (sessionStorage.getItem(spectorCaptureOnLoadQuickCaptureKey) === "true");
            captureOnLoadFullCapture = (sessionStorage.getItem(spectorCaptureOnLoadFullCaptureKey) === "true");
            captureOnLoadCommandCount = parseInt(sessionStorage.getItem(spectorCaptureOnLoadCommandCountKey)) || 500;
        }
        captureOffScreen = (sessionStorage.getItem(captureOffScreenKey) === "true");
    } catch(e) {
        // sessionStorage may be unavailable in some contexts
    }

    window.__SPECTOR_Canvases = [];

    var originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.__SPECTOR_Origin_EXTENSION_GetContext = originalGetContext;

    HTMLCanvasElement.prototype.getContext = function () {
        var context = originalGetContext.apply(this, arguments);
        if (!context) { return context; }

        try {
            var contextNames = ["webgl", "experimental-webgl", "webgl2", "experimental-webgl2"];
            if (contextNames.indexOf(arguments[0]) !== -1) {
                context.canvas.setAttribute(spectorContextTypeKey, arguments[0]);
                document.dispatchEvent(new CustomEvent("SpectorWebGLCanvasAvailableEvent"));

                if (captureOffScreen) {
                    var found = false;
                    for (var i = 0; i < window.__SPECTOR_Canvases.length; i++) {
                        if (window.__SPECTOR_Canvases[i] === this) { found = true; break; }
                    }
                    if (!found) { window.__SPECTOR_Canvases.push(this); }
                }

                if (captureOnLoad && (this.parentElement || captureOnLoadTransient)) {
                    if (window.spector) {
                        window.spector.captureContext(context, captureOnLoadCommandCount, captureOnLoadQuickCapture, captureOnLoadFullCapture);
                        captureOnLoad = false;
                    }
                }
            }
        } catch(e) {
            // Extension logic must never break page getContext calls
        }

        return context;
    };

    if (typeof OffscreenCanvas !== "undefined") {
        var originalOffscreenGetContext = OffscreenCanvas.prototype.getContext;
        OffscreenCanvas.prototype.__SPECTOR_Origin_EXTENSION_OffscreenGetContext = originalOffscreenGetContext;

        OffscreenCanvas.prototype.getContext = function () {
            var context = originalOffscreenGetContext.apply(this, arguments);
            if (!context) { return context; }

            try {
                var contextNames = ["webgl", "experimental-webgl", "webgl2", "experimental-webgl2"];
                if (contextNames.indexOf(arguments[0]) !== -1) {
                    document.dispatchEvent(new CustomEvent("SpectorWebGLCanvasAvailableEvent"));
                    this.id = "Offscreen";
                    window.__SPECTOR_Canvases.push(this);

                    if (captureOnLoad && captureOnLoadTransient && window.spector) {
                        window.spector.captureContext(context, captureOnLoadCommandCount, captureOnLoadQuickCapture, captureOnLoadFullCapture);
                        captureOnLoad = false;
                    }
                }
            } catch(e) {
                // Extension logic must never break page getContext calls
            }

            return context;
        };
    }
})();
