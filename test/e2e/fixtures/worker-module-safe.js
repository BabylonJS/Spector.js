import { value } from "./worker-module-safe-dependency.js";

self.onmessage = function() {
    self.postMessage({
        value: value,
        injected: self.__spectorTestInjected === true,
    });
};
