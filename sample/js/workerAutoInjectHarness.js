(function () {
    "use strict";

    var fixtureRoot = "js/workerAutoInject/";
    var constructorName = Worker.name || "(anonymous)";
    var constructorElement = document.getElementById("worker-constructor");
    var modeHint = document.getElementById("mode-hint");

    constructorElement.textContent = constructorName;
    modeHint.textContent = constructorName === "Worker"
        ? "Native Worker constructor detected. Auto-injection appears to be off."
        : "A Worker proxy is active. Auto-injection appears to be on.";

    function setResult(testName, status, details) {
        var card = document.querySelector('[data-test="' + testName + '"]');
        var statusElement = card.querySelector(".status");
        var detailsElement = card.querySelector(".details");

        statusElement.className = "status " + status;
        statusElement.textContent = status === "pass" ? "Pass" : status === "fail" ? "Fail" : "Running";
        detailsElement.textContent = details;
    }

    function runWorker(testName, scriptName, options) {
        setResult(testName, "running", "Waiting for Worker messages...");

        return new Promise(function (resolve) {
            var messages = [];
            var worker;
            var timeout = setTimeout(function () {
                if (worker) {
                    worker.terminate();
                }
                setResult(testName, "fail", "Timed out.\nMessages: " + JSON.stringify(messages, null, 2));
                resolve(false);
            }, 10000);

            try {
                worker = new Worker(fixtureRoot + scriptName, options);
                worker.onmessage = function (event) {
                    messages.push(event.data);

                    if (event.data && event.data.type === "spector:context-ready") {
                        return;
                    }

                    clearTimeout(timeout);
                    worker.terminate();

                    if (event.data && event.data.error) {
                        setResult(testName, "fail", event.data.error);
                        resolve(false);
                        return;
                    }

                    var injected = messages.some(function (message) {
                        return message && message.type === "spector:context-ready";
                    });
                    setResult(
                        testName,
                        "pass",
                        "Application result: " + JSON.stringify(event.data) +
                        "\nSpector context message observed: " + injected
                    );
                    resolve(true);
                };
                worker.onerror = function (event) {
                    clearTimeout(timeout);
                    worker.terminate();
                    setResult(testName, "fail", event.message || "Worker startup failed.");
                    resolve(false);
                };
                worker.postMessage("start");
            } catch (error) {
                clearTimeout(timeout);
                setResult(testName, "fail", String(error));
                resolve(false);
            }
        });
    }

    async function runAll() {
        var results = [];
        results.push(await runWorker("safe", "safeClassic.js"));
        results.push(await runWorker("dynamic", "dynamicImport.js"));
        results.push(await runWorker("nested", "nestedClassic.js"));
        results.push(await runWorker("module", "moduleParent.js", { type: "module" }));

        document.getElementById("run-all").textContent =
            results.every(Boolean) ? "All tests passed - run again" : "Some tests failed - run again";
    }

    document.getElementById("run-all").addEventListener("click", runAll);
    document.getElementById("clear-results").addEventListener("click", function () {
        document.querySelectorAll(".test-card").forEach(function (card) {
            card.querySelector(".status").className = "status";
            card.querySelector(".status").textContent = "Not run";
            card.querySelector(".details").textContent = "Waiting.";
        });
        document.getElementById("run-all").textContent = "Run all Worker tests";
    });
})();
