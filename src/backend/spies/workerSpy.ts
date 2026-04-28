interface ISpiedWorker {
    worker: Worker;
    originalUrl: string;
}

/**
 * Intercepts Worker constructor on the main thread to inject Spector.
 *
 * This is a best-effort mechanism. It will fail in cases of:
 * - CORS restrictions on Worker scripts
 * - CSP policies blocking blob: URLs
 * - Module Workers (type: 'module')
 *
 * The primary API is manual: spector.spyWorker(worker).
 * Auto-injection is a convenience that works in simple cases.
 */
export class WorkerSpy {
    private static readonly spiedWorkers: ISpiedWorker[] = [];
    private static originalWorkerConstructor: typeof Worker;
    private static workerBundleUrl: string;
    private static intercepting: boolean = false;

    /**
     * Start intercepting Worker construction.
     * @param workerBundleUrl URL to the spector.worker.bundle.js file
     */
    public static startIntercepting(workerBundleUrl: string): void {
        if (WorkerSpy.intercepting) {
            return;
        }
        if (typeof Worker === "undefined") {
            return;
        }

        WorkerSpy.workerBundleUrl = workerBundleUrl;
        WorkerSpy.originalWorkerConstructor = Worker;
        WorkerSpy.intercepting = true;

        const OriginalWorker = Worker;

        // Replace the global Worker constructor
        (globalThis as any).Worker = function SpectorWorkerProxy(scriptURL: string | URL, options?: WorkerOptions): Worker {
            const urlStr = scriptURL.toString();

            // Don't intercept module workers — importScripts doesn't work there
            if (options && options.type === "module") {
                return new OriginalWorker(scriptURL, options);
            }

            try {
                // Resolve the original script URL to absolute (so we can use it
                // both as a fetch URL and as a base for rewriting relative imports).
                let absoluteScriptUrl: string;
                try {
                    absoluteScriptUrl = new URL(urlStr, location.href).href;
                } catch {
                    return new OriginalWorker(scriptURL, options);
                }

                // Fetch the worker script and prepend Spector import
                const xhr = new XMLHttpRequest();
                xhr.open("GET", absoluteScriptUrl, false); // synchronous
                xhr.send();

                if (xhr.status === 200) {
                    // Rewrite static `importScripts(...)` calls in source so
                    // relative / root-relative URLs work when the worker runs
                    // from a `blob:` URL.
                    const rewrittenSource = WorkerSpy.rewriteImportScripts(xhr.responseText, absoluteScriptUrl);

                    // Runtime guard: webpack and other bundlers compute chunk
                    // URLs at runtime and pass them straight to importScripts.
                    // We can't statically rewrite those, so we wrap
                    // `self.importScripts` to resolve every URL against the
                    // original worker location before delegating to the real
                    // implementation. We also override `self.location` lookups
                    // by exposing a synthetic `__SPECTOR_workerBaseUrl` that
                    // bundlers reading `self.location.href` could pick up.
                    const runtimeShim =
                        "(function(){\n" +
                        "  var __spectorBase = " + JSON.stringify(absoluteScriptUrl) + ";\n" +
                        "  self.__SPECTOR_workerBaseUrl = __spectorBase;\n" +
                        "  function __spectorResolve(u) {\n" +
                        "    if (u == null) return u;\n" +
                        "    if (typeof u !== \"string\") {\n" +
                        "      if (u instanceof URL) return u;\n" +
                        "      try { u = String(u); } catch (e) { return u; }\n" +
                        "    }\n" +
                        "    if (/^(?:[a-z][a-z0-9+.-]*:|\\/\\/)/i.test(u)) return u;\n" +
                        "    try { return new URL(u, __spectorBase).href; }\n" +
                        "    catch (e) { return u; }\n" +
                        "  }\n" +
                        "  self.__SPECTOR_resolveWorkerUrl = __spectorResolve;\n" +
                        "  var __origImportScripts = self.importScripts;\n" +
                        "  if (typeof __origImportScripts === \"function\") {\n" +
                        "    self.importScripts = function() {\n" +
                        "      var args = new Array(arguments.length);\n" +
                        "      for (var i = 0; i < arguments.length; i++) args[i] = __spectorResolve(arguments[i]);\n" +
                        "      return __origImportScripts.apply(self, args);\n" +
                        "    };\n" +
                        "  }\n" +
                        "  var __origFetch = self.fetch;\n" +
                        "  if (typeof __origFetch === \"function\") {\n" +
                        "    self.fetch = function(input, init) {\n" +
                        "      try {\n" +
                        "        if (typeof input === \"string\") {\n" +
                        "          input = __spectorResolve(input);\n" +
                        "        } else if (input && typeof input === \"object\" && \"url\" in input && typeof Request === \"function\") {\n" +
                        "          var r = input;\n" +
                        "          var resolved = __spectorResolve(r.url);\n" +
                        "          if (resolved !== r.url) input = new Request(resolved, r);\n" +
                        "        }\n" +
                        "      } catch (e) { /* fall through with original input */ }\n" +
                        "      return __origFetch.call(self, input, init);\n" +
                        "    };\n" +
                        "  }\n" +
                        "  if (typeof XMLHttpRequest === \"function\" && XMLHttpRequest.prototype && XMLHttpRequest.prototype.open) {\n" +
                        "    var __origXhrOpen = XMLHttpRequest.prototype.open;\n" +
                        "    XMLHttpRequest.prototype.open = function(method, url) {\n" +
                        "      var args = Array.prototype.slice.call(arguments);\n" +
                        "      args[1] = __spectorResolve(url);\n" +
                        "      return __origXhrOpen.apply(this, args);\n" +
                        "    };\n" +
                        "  }\n" +
                        "  if (typeof Worker === \"function\") {\n" +
                        "    var __OrigWorker = Worker;\n" +
                        "    self.Worker = function(scriptURL, options) {\n" +
                        "      var resolved = __spectorResolve(scriptURL);\n" +
                        "      return new __OrigWorker(resolved, options);\n" +
                        "    };\n" +
                        "    self.Worker.prototype = __OrigWorker.prototype;\n" +
                        "  }\n" +
                        "})();\n";

                    const spectorImport = "importScripts(" + JSON.stringify(WorkerSpy.workerBundleUrl) + ");\n";
                    const modifiedScript = runtimeShim + spectorImport + rewrittenSource;
                    const blob = new Blob([modifiedScript], { type: "application/javascript" });
                    const blobUrl = URL.createObjectURL(blob);

                    const spiedWorker = new OriginalWorker(blobUrl, options);

                    WorkerSpy.spiedWorkers.push({
                        worker: spiedWorker,
                        originalUrl: urlStr,
                    });

                    return spiedWorker;
                }
            }
            catch (e) {
                // tslint:disable-next-line:no-console
                console.warn("[Spector.js] Could not inject into Worker (" + urlStr + "):", e);
            }

            // Fallback: create original Worker without Spector
            const fallbackWorker = new OriginalWorker(scriptURL, options);
            WorkerSpy.spiedWorkers.push({
                worker: fallbackWorker,
                originalUrl: urlStr,
            });
            return fallbackWorker;
        };

        // Preserve instanceof checks
        (globalThis as any).Worker.prototype = OriginalWorker.prototype;
    }

    /** Stop intercepting Worker construction. */
    public static stopIntercepting(): void {
        if (!WorkerSpy.intercepting) {
            return;
        }
        (globalThis as any).Worker = WorkerSpy.originalWorkerConstructor;
        WorkerSpy.intercepting = false;
    }

    /**
     * Rewrite every URL passed to `importScripts(...)` in the worker source
     * to an absolute URL resolved against the worker's original location.
     *
     * Without this, when the worker is loaded from a `blob:` URL, calls like
     * `importScripts("/scripts/foo.js")` or `importScripts("./bar.js")`
     * resolve against the blob URL — which has no meaningful path — and the
     * browser throws `The URL '...' is invalid`.
     *
     * Handles single, double, and template (no-interpolation) string literals,
     * and multiple comma-separated arguments.
     */
    private static rewriteImportScripts(source: string, baseUrl: string): string {
        // Match `importScripts(...)` and rewrite each string literal argument.
        // We deliberately keep this regex permissive — argument list is
        // re-tokenised inside the replacer.
        const importScriptsPattern = /importScripts\s*\(([^)]*)\)/g;
        const stringLiteralPattern = /(['"`])((?:\\.|(?!\1).)*)\1/g;

        return source.replace(importScriptsPattern, (match, argList: string) => {
            const rewrittenArgs = argList.replace(stringLiteralPattern, (_lit, quote: string, value: string) => {
                // Skip rewriting if it contains any escape that suggests
                // template interpolation — we can't statically resolve those.
                if (quote === "`" && value.indexOf("${") !== -1) {
                    return _lit;
                }
                let resolved: string;
                try {
                    resolved = new URL(value, baseUrl).href;
                } catch {
                    return _lit;
                }
                return quote + resolved + quote;
            });
            return "importScripts(" + rewrittenArgs + ")";
        });
    }

    /** Get all Workers that were created while intercepting. */
    public static getSpiedWorkers(): ISpiedWorker[] {
        return WorkerSpy.spiedWorkers;
    }

    /** Check if currently intercepting. */
    public static isIntercepting(): boolean {
        return WorkerSpy.intercepting;
    }
}
