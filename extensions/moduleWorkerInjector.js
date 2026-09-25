/**
 * Compatibility entry point for callers of the experimental module injector.
 *
 * A blob loader cannot preserve the worker global's URL, relative Request and
 * nested Worker resolution, or native startup messaging while importing the
 * application asynchronously. Modules must load Spector explicitly instead.
 */
var SpectorModuleInjector = (function () {
    "use strict";

    /**
     * Construct a native module Worker without inspecting or converting inputs.
     * @param {string|URL} scriptURL - Original Worker URL
     * @param {object} options - Original Worker options
     * @param {string} bundleUrl - Retained for compatibility; unused
     * @param {function} OriginalWorker - Original Worker constructor
     * @returns {{ worker: Worker, injected: boolean }} Native Worker and status
     */
    function injectModuleWorker(scriptURL, options, bundleUrl, OriginalWorker) {
        return { worker: new OriginalWorker(scriptURL, options), injected: false };
    }

    return { injectModuleWorker: injectModuleWorker };
})();

if (typeof window !== 'undefined') {
    window.__SPECTOR_ModuleInjector = SpectorModuleInjector;
}
