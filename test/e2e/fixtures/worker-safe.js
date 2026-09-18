self.onmessage = function() {
    self.postMessage({
        value: "safe-ok",
        injected: self.__spectorTestInjected === true,
    });
};
