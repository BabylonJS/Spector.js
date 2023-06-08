var spectorOptions = {};
if ((window.location + "").indexOf("webxr") !== -1) {
	spectorOptions.enableXRCapture = true;
}

var spector = new SPECTOR.Spector(spectorOptions);
window.spector = spector;
spector.displayUI();

var noSpy = false;
if ((window.location + "").indexOf("noSpy") !== -1) {
    noSpy = true;
}
else {
    spector.spyCanvases();
}
