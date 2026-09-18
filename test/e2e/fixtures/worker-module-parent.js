const child = new Worker(new URL("./worker-nested-child.js", import.meta.url), { type: "module" });

child.onmessage = function(event) {
    self.postMessage(event.data);
};

child.onerror = function(event) {
    self.postMessage({ error: event.message });
};
