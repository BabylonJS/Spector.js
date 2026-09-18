self.onmessage = function() {
    try {
        const childUrl = new URL("./worker-nested-child.js", self.location.href);
        const child = new Worker(childUrl, { type: "module" });
        child.onmessage = function(event) {
            self.postMessage({
                value: event.data,
                injected: self.__spectorTestInjected === true,
            });
        };
        child.onerror = function(event) {
            self.postMessage({ error: event.message });
        };
    } catch (error) {
        self.postMessage({ error: String(error) });
    }
};
