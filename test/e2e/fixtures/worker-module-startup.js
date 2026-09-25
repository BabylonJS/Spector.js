import { value } from "./worker-module-safe-dependency.js";

const received = await new Promise((resolve) => {
    self.onmessage = (event) => resolve({ data: event.data, trusted: event.isTrusted });
});
self.postMessage({
    ...received,
    value,
    moduleURL: import.meta.url,
    workerURL: self.location.href,
});
