self.onmessage = async function () {
    try {
        var dependency = await import("./workerAutoInjectDependency.js");
        self.postMessage({
            value: dependency.value,
            workerLocation: self.location.href,
        });
    } catch (error) {
        self.postMessage({ error: String(error) });
    }
};
