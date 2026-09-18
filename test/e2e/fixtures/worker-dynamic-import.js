self.onmessage = async function() {
    try {
        const dependency = await import("./worker-dynamic-dependency.js");
        self.postMessage({
            value: dependency.value,
            injected: self.__spectorTestInjected === true,
        });
    } catch (error) {
        self.postMessage({ error: String(error) });
    }
};
