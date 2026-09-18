self.onmessage = function () {
    try {
        var childUrl = new URL("./nestedModule.js", self.location.href);
        var child = new Worker(childUrl, { type: "module" });

        child.onmessage = function (event) {
            self.postMessage({
                value: event.data,
                workerLocation: self.location.href,
            });
        };
        child.onerror = function (event) {
            self.postMessage({ error: event.message });
        };
    } catch (error) {
        self.postMessage({ error: String(error) });
    }
};
