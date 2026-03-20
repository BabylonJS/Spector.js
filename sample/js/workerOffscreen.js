// Worker OffscreenCanvas sample — transfers canvas to a Worker for rendering.
// Uses the global `spector` from injectSpector.js.

var canvas = document.getElementById("renderCanvas");
var offscreen = canvas.transferControlToOffscreen();

// Determine worker bundle path (dev vs prod) — same logic as tools/loader.js
var useDist = (document.location.href.toLowerCase().indexOf('dist=true') > 0);
var bundlePath = useDist ? '/dist/spector.worker.bundle.js' : '/.temp/spector.worker.bundle.js';

// Fetch the worker renderer script
var xhr = new XMLHttpRequest();
xhr.open('GET', 'js/workerRenderer.js', false);
xhr.send();

// Build blob Worker: import Spector worker bundle + renderer
var workerScript = 'importScripts("' + location.origin + bundlePath + '");\n' + xhr.responseText;
var blob = new Blob([workerScript], { type: 'application/javascript' });
var workerUrl = URL.createObjectURL(blob);
var worker = new Worker(workerUrl);

// Bridge the Worker for Spector capture
var bridge = spector.spyWorker(worker);

// Send canvas to Worker to start rendering
worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen]);

// Wait for the Worker's WebGL context to be ready, then capture after a short delay
// to ensure at least one render frame has completed.
bridge.onContextReady.add(function() {
    setTimeout(function() {
        spector.captureWorker(worker);
    }, 1000);
});
