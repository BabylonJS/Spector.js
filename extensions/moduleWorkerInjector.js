/**
 * Module Worker Injector for Spector.js
 *
 * Handles injection of the Spector worker bundle into ES module workers
 * (`new Worker(url, { type: 'module' })`).
 *
 * The core challenge: module workers forbid `importScripts()`, and blob-wrapped
 * modules lose their original base URL — breaking all relative `import` paths.
 *
 * Solution: fetch the original script source, rewrite all relative import
 * specifiers to absolute URLs (preserving the original script's base URL),
 * then create a blob module that first loads the Spector bundle and then
 * includes the rewritten application code.
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
     * Attempts to inject the Spector worker bundle into a module worker.
     *
     * Strategy:
     * 1. Synchronously fetch the original worker script
     * 2. Rewrite all relative import specifiers to absolute URLs
     * 3. Create a blob module that:
     *    a. Dynamically imports the Spector worker bundle (via absolute URL)
     *    b. Contains the rewritten application code
     * 4. Create the Worker from the blob URL with { type: 'module' }
     *
     * The Spector bundle is loaded via a dynamic `import()` of its absolute URL.
     * This works because `web_accessible_resources` in the extension manifest
     * allows the page origin to fetch extension resources.
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

        // Skip blob URLs — can't fetch them from main thread for rewriting
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

        try {
            // Synchronously fetch the original worker script
            var xhr = new XMLHttpRequest();
            xhr.open('GET', absoluteScriptUrl, false);
            xhr.send();

            if (xhr.status !== 200) {
                return { worker: new OriginalWorker(scriptURL, options), injected: false };
            }

            var originalSource = xhr.responseText;

            // Rewrite relative imports to absolute URLs
            var rewrittenSource = rewriteImports(originalSource, absoluteScriptUrl);

            // Build the blob module:
            // 1. Dynamically import the Spector worker bundle (fire-and-forget,
            //    Spector auto-initializes on load)
            // 2. Include the rewritten application code
            //
            // We use `await import(...)` to ensure Spector is initialized before
            // the application code runs (so getContext() calls are intercepted).
            var blobContent =
                '/* Spector.js module worker injection */\n' +
                'try { await import("' + bundleUrl + '"); } catch(e) { console.warn("[Spector] Worker bundle load failed:", e); }\n' +
                '\n' +
                rewrittenSource;

            var blob = new Blob([blobContent], { type: 'application/javascript' });
            var blobUrl = URL.createObjectURL(blob);

            var worker = new OriginalWorker(blobUrl, options);

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
        injectModuleWorker: injectModuleWorker,
    };
})();

// Make available globally for contentScript.js
if (typeof window !== 'undefined') {
    window.__SPECTOR_ModuleInjector = SpectorModuleInjector;
}
