var spectorOptions = {};
if ((globalThis.location + "").indexOf("webxr") !== -1) {
	spectorOptions.enableXRCapture = true;
}
var MAIN_THREAD = typeof window === "object";
var spector;

if (MAIN_THREAD) {
    spector = new SPECTOR.RemoteSpector(spectorOptions, window.spectorWorker);
    spector.displayUI();
} else {
    spector = new SPECTOR.BaseSpector(spectorOptions);
}
globalThis.spector = spector;

var noSpy = false;
if ((globalThis.location + "").indexOf("noSpy") !== -1) {
    noSpy = true;
}
else {
    spector.spyCanvases();
}
