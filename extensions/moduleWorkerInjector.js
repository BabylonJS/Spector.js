/**
 * Module Worker Injector for Spector.js
 *
 * Handles injection of the Spector worker bundle into ES module workers
 * (`new Worker(url, { type: 'module' })`).
 *
 * The core challenge: module workers forbid `importScripts()`, and blob-wrapped
 * modules lose their original base URL — breaking all relative `import` paths.
 *
 * Solution: inspect the original entry point, inline the Spector bundle in a
 * loader module, queue messages while dynamically importing the original
 * module at its real URL, then replay those messages after its handlers exist.
 */

var SpectorModuleInjector = (function () {
    "use strict";

    /**
     * Resolves a relative or bare import specifier against a base URL.
     * Only rewrites specifiers that start with './' or '../'.
     * Leaves absolute URLs and bare specifiers (npm-style) untouched.
     *
     * @param {string} specifier - The import specifier (e.g. './engine.js')
     * @param {string} baseUrl   - The base URL of the original script
     * @returns {string} The resolved absolute URL, or the original specifier
     */
    function resolveSpecifier(specifier, baseUrl) {
        if (specifier.startsWith('./') || specifier.startsWith('../')) {
            try {
                return new URL(specifier, baseUrl).href;
            } catch (e) {
                return specifier;
            }
        }
        // Absolute URLs and bare specifiers pass through unchanged
        return specifier;
    }

    /**
     * Rewrites all static import/export specifiers in ES module source code
     * from relative paths to absolute URLs.
     *
     * Handles:
     *   - import { x } from './foo.js'
     *   - import './side-effect.js'
     *   - import x from "../bar.js"
     *   - export { y } from './baz.js'
     *   - export * from './qux.js'
     *   - import(  './dynamic.js'  )     (dynamic imports)
     *   - import x from './foo.js' assert { type: 'json' }
     *
     * Does NOT handle:
     *   - Template literal import specifiers: import(`./dir/${name}.js`)
     *   - Computed dynamic imports with non-string arguments
     *   - Import maps (these are handled by the browser after rewriting)
     *
     * @param {string} source  - The original module source code
     * @param {string} baseUrl - The base URL for resolving relative specifiers
     * @returns {string} The source with relative specifiers replaced by absolute URLs
     */
    function rewriteImports(source, baseUrl) {
        // Match static imports/exports:  from '...' or from "..."
        // Captures the specifier in group 1 (single-quoted) or group 2 (double-quoted)
        var staticPattern = /((?:import|export)\s+(?:[\s\S]*?\s+)?from\s+)(?:'([^']+)'|"([^"]+)")/g;

        source = source.replace(staticPattern, function (match, prefix, specSingle, specDouble) {
            var spec = specSingle || specDouble;
            var quote = specSingle ? "'" : '"';
            var resolved = resolveSpecifier(spec, baseUrl);
            return prefix + quote + resolved + quote;
        });

        // Match side-effect imports: import './foo.js' or import "./foo.js"
        // (import keyword followed directly by a string, no `from`)
        var sideEffectPattern = /(import\s+)(?:'([^']+)'|"([^"]+)")/g;

        source = source.replace(sideEffectPattern, function (match, prefix, specSingle, specDouble) {
            var spec = specSingle || specDouble;
            var quote = specSingle ? "'" : '"';
            var resolved = resolveSpecifier(spec, baseUrl);
            return prefix + quote + resolved + quote;
        });

        // Match dynamic imports: import('./foo.js') or import("./foo.js")
        // Careful not to match import.meta or other import.xxx
        var dynamicPattern = /import\s*\(\s*(?:'([^']+)'|"([^"]+)")\s*\)/g;

        source = source.replace(dynamicPattern, function (match, specSingle, specDouble) {
            var spec = specSingle || specDouble;
            var quote = specSingle ? "'" : '"';
            var resolved = resolveSpecifier(spec, baseUrl);
            return 'import(' + quote + resolved + quote + ')';
        });

        return source;
    }

    /**
     * Direct nested Worker construction may resolve relative URLs against the
     * loader blob instead of the original module. Leave those entries native.
     */
    function canSafelyInject(source) {
        var nestedWorkerPattern = /\bnew\s+(?:(?:self|globalThis)\s*\.\s*)?(?:Worker|SharedWorker)\s*\(/;
        return !nestedWorkerPattern.test(source);
    }

    /**
     * Attempts to inject the Spector worker bundle into a module worker.
     *
     * Strategy:
     * 1. Synchronously fetch the original worker script
     * 2. Reject direct nested Worker construction that depends on blob-relative URLs
     * 3. Synchronously fetch the Spector worker bundle
     * 4. Create a blob loader module that:
     *    a. Initializes Spector
     *    b. Queues startup messages
     *    c. Imports the original module from its absolute URL
     *    d. Signals that application handlers are installed
     *    e. Replays any Worker-side startup messages
     * 5. Create the Worker and queue main-thread postMessage calls until ready
     *
     * The bundle is fetched in the page and inlined because Chromium can leave
     * a blob module Worker pending when it imports a chrome-extension URL.
     *
     * @param {string} scriptURL       - The original worker script URL
     * @param {object} options         - The original Worker options (includes type: 'module')
     * @param {string} bundleUrl       - Absolute URL to spector.worker.bundle.js
     * @param {function} OriginalWorker - The original Worker constructor
     * @returns {{ worker: Worker, injected: boolean }} The created worker and injection status
     */
    function injectModuleWorker(scriptURL, options, bundleUrl, OriginalWorker) {
        var urlStr = scriptURL.toString();

        // Resolve the script URL to absolute for use as base URL
        var absoluteScriptUrl;
        try {
            absoluteScriptUrl = new URL(urlStr, location.href).href;
        } catch (e) {
            // Can't resolve — fall back to no injection
            return { worker: new OriginalWorker(scriptURL, options), injected: false };
        }

        // Skip blob URLs — their original module URL cannot be recovered.
        if (urlStr.indexOf('blob:') === 0) {
            return { worker: new OriginalWorker(scriptURL, options), injected: false };
        }

        // Skip data URLs
        if (urlStr.indexOf('data:') === 0) {
            return { worker: new OriginalWorker(scriptURL, options), injected: false };
        }

        if (!bundleUrl) {
            return { worker: new OriginalWorker(scriptURL, options), injected: false };
        }

        if (new URL(absoluteScriptUrl).origin !== location.origin) {
            return { worker: new OriginalWorker(scriptURL, options), injected: false };
        }

        try {
            // Synchronously fetch the original worker script
            var xhr = new XMLHttpRequest();
            xhr.open('GET', absoluteScriptUrl, false);
            xhr.send();

            if (xhr.status !== 200) {
                return { worker: new OriginalWorker(scriptURL, options), injected: false };
            }

            var originalSource = xhr.responseText;
            if (!canSafelyInject(originalSource)) {
                return { worker: new OriginalWorker(scriptURL, options), injected: false };
            }

            var bundleXhr = new XMLHttpRequest();
            bundleXhr.open('GET', bundleUrl, false);
            bundleXhr.send();
            if (bundleXhr.status !== 200) {
                return { worker: new OriginalWorker(scriptURL, options), injected: false };
            }

            var resolvedScriptUrl = xhr.responseURL || absoluteScriptUrl;

            // Dynamic module import allows the application's relative imports
            // and import.meta.url to retain their native URL semantics. Worker
            // messages can be dispatched while top-level await is pending, so
            // hold and replay them once the application module has evaluated.
            var runtimeShim =
                '(function(){\n' +
                '  var __spectorBase = ' + JSON.stringify(resolvedScriptUrl) + ';\n' +
                '  self.__SPECTOR_workerBaseUrl = __spectorBase;\n' +
                '  function __spectorResolve(url) {\n' +
                '    if (url == null || typeof url !== "string" || /^(?:[a-z][a-z0-9+.-]*:|\\/\\/)/i.test(url)) return url;\n' +
                '    try { return new URL(url, __spectorBase).href; } catch (e) { return url; }\n' +
                '  }\n' +
                '  self.__SPECTOR_resolveWorkerUrl = __spectorResolve;\n' +
                '  var __originalFetch = self.fetch;\n' +
                '  if (typeof __originalFetch === "function") {\n' +
                '    self.fetch = function(input, init) {\n' +
                '      try {\n' +
                '        if (typeof input === "string") {\n' +
                '          input = __spectorResolve(input);\n' +
                '        } else if (input && typeof input === "object" && "url" in input && typeof Request === "function") {\n' +
                '          var request = input;\n' +
                '          var resolved = __spectorResolve(request.url);\n' +
                '          if (resolved !== request.url) input = new Request(resolved, request);\n' +
                '        }\n' +
                '      } catch (e) { /* use the original input */ }\n' +
                '      return __originalFetch.call(self, input, init);\n' +
                '    };\n' +
                '  }\n' +
                '  if (typeof XMLHttpRequest === "function" && XMLHttpRequest.prototype.open) {\n' +
                '    var __originalXhrOpen = XMLHttpRequest.prototype.open;\n' +
                '    XMLHttpRequest.prototype.open = function(method, url) {\n' +
                '      var args = Array.prototype.slice.call(arguments);\n' +
                '      args[1] = __spectorResolve(url);\n' +
                '      return __originalXhrOpen.apply(this, args);\n' +
                '    };\n' +
                '  }\n' +
                '})();\n';
            var blobContent =
                '/* Spector.js module worker injection */\n' +
                bundleXhr.responseText + '\n' +
                runtimeShim +
                'var __spectorQueuedMessages = [];\n' +
                'var __spectorQueueMessage = function(event) { __spectorQueuedMessages.push(event); };\n' +
                'self.addEventListener("message", __spectorQueueMessage);\n' +
                'try {\n' +
                '  await import(' + JSON.stringify(resolvedScriptUrl) + ');\n' +
                '} finally {\n' +
                '  self.removeEventListener("message", __spectorQueueMessage);\n' +
                '}\n' +
                'self.postMessage({ type: "spector:module-ready", version: 1 });\n' +
                'for (var __spectorMessageIndex = 0; __spectorMessageIndex < __spectorQueuedMessages.length; __spectorMessageIndex++) {\n' +
                '  self.dispatchEvent(__spectorQueuedMessages[__spectorMessageIndex]);\n' +
                '}\n';

            var blob = new Blob([blobContent], { type: 'application/javascript' });
            var blobUrl = URL.createObjectURL(blob);

            var worker = new OriginalWorker(blobUrl, options);
            var originalPostMessage = worker.postMessage;
            var queuedPostMessages = [];
            var moduleReady = false;
            worker.postMessage = function () {
                if (moduleReady) {
                    return originalPostMessage.apply(worker, arguments);
                }
                queuedPostMessages.push(Array.prototype.slice.call(arguments));
            };
            worker.addEventListener('message', function moduleReadyHandler(event) {
                if (!event.data || event.data.type !== 'spector:module-ready') {
                    return;
                }
                event.stopImmediatePropagation();
                worker.removeEventListener('message', moduleReadyHandler);
                moduleReady = true;
                for (var i = 0; i < queuedPostMessages.length; i++) {
                    originalPostMessage.apply(worker, queuedPostMessages[i]);
                }
                queuedPostMessages.length = 0;
            });

            // Revoke after a delay — the browser needs time to fetch the blob
            setTimeout(function () { URL.revokeObjectURL(blobUrl); }, 5000);

            return { worker: worker, injected: true };

        } catch (e) {
            // CORS, CSP, or other fetch failure — fall back gracefully
            return { worker: new OriginalWorker(scriptURL, options), injected: false };
        }
    }

    return {
        rewriteImports: rewriteImports,
        resolveSpecifier: resolveSpecifier,
        canSafelyInject: canSafelyInject,
        injectModuleWorker: injectModuleWorker,
    };
})();

// Make available globally for contentScript.js
if (typeof window !== 'undefined') {
    window.__SPECTOR_ModuleInjector = SpectorModuleInjector;
}
