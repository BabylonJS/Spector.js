var spector = new SPECTOR.Spector();
spector.displayUI();

var noSpy = false;
if ((window.location + "").indexOf("noSpy") !== -1) {
    noSpy = true;
}
else {
    spector.spyCanvases();
}
