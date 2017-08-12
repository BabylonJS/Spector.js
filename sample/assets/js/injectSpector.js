var spector = new SPECTOR.Spector();
window.spector = spector;
spector.displayUI();

var noSpy = false;
if ((window.location + "").indexOf("noSpy") !== -1) {
    noSpy = true;
}
else {
    spector.spyCanvases();
}
