var child = new Worker(new URL("./nestedModule.js", import.meta.url), { type: "module" });

child.onmessage = function (event) {
    self.postMessage(event.data);
};

child.onerror = function (event) {
    self.postMessage({ error: event.message });
};
