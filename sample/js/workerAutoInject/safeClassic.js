self.onmessage = function () {
    var canvas = new OffscreenCanvas(8, 8);
    var gl = canvas.getContext("webgl");

    self.postMessage({
        value: gl ? "safe-classic-ok" : "webgl-unavailable",
    });
};
