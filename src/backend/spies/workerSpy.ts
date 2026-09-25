interface ISpiedWorker {
    worker: Worker;
    originalUrl: string;
}

/**
 * Explicit, experimental Worker auto-injection for simple classic scripts.
 * Module Workers, URL objects, options and URL-sensitive sources stay native.
 * Blob wrapping still changes the worker global and may fail under CSP.
 * Prefer manual instrumentation with spector.spyWorker(worker).
 */
export class WorkerSpy {
    private static readonly spiedWorkers: ISpiedWorker[] = [];
    private static originalWorkerConstructor: typeof Worker;
    private static workerProxy: typeof Worker;
    private static intercepting: boolean = false;

    /**
     * Start intercepting simple classic Worker construction.
     * @param workerBundleUrl URL to the spector.worker.bundle.js file
     */
    public static startIntercepting(workerBundleUrl: string): void {
        if (WorkerSpy.intercepting || typeof Worker === "undefined") {
            return;
        }

        const originalWorkerConstructor = Worker;
        const workerProxy = new Proxy(originalWorkerConstructor, {
            construct(target, args, newTarget) {
                // Other libraries may retain this proxy after stop/restart.
                if (WorkerSpy.workerProxy !== workerProxy) {
                    return Reflect.construct(target, args, newTarget);
                }
                const scriptURL = args[0];
                const urlStr = typeof scriptURL === "string" ? scriptURL : "Worker";
                const record = (worker: Worker): Worker => {
                    WorkerSpy.spiedWorkers.push({ worker, originalUrl: urlStr });
                    return worker;
                };
                const fallback = (): Worker => record(Reflect.construct(target, args, newTarget));

                // Inspecting options or coercing objects here changes WebIDL's
                // getter/conversion order. Subclasses also keep native new.target.
                if (newTarget !== workerProxy || typeof scriptURL !== "string" ||
                    args.length > 2 || args[1] !== undefined) {
                    return fallback();
                }

                let blobUrl: string;
                try {
                    const base = typeof document === "undefined" ? location.href : document.baseURI;
                    const url = new URL(scriptURL, base);
                    if (workerBundleUrl && /^https?:$/.test(url.protocol) && url.origin === location.origin) {
                        const bundleUrl = new URL(workerBundleUrl, base).href;
                        url.hash = "";
                        const xhr = new XMLHttpRequest();
                        xhr.open("GET", url.href, false);
                        xhr.send();
                        if (WorkerSpy.isJavaScriptResponse(xhr, url.href) &&
                            !xhr.getResponseHeader("Content-Security-Policy") &&
                            !xhr.getResponseHeader("Content-Security-Policy-Report-Only") &&
                            WorkerSpy.shouldInjectSource(xhr.responseText)) {
                            const bundleXhr = new XMLHttpRequest();
                            bundleXhr.open("GET", bundleUrl, false);
                            bundleXhr.send();
                            const bundleAvailable = WorkerSpy.isJavaScriptResponse(bundleXhr, bundleUrl);
                            if (bundleAvailable) {
                                // XHR uses connect-src; importScripts uses script-src.
                                // A later load/execution failure must not abort the app.
                                const importLine = "try { importScripts(" + JSON.stringify(bundleUrl) +
                                    "); } catch (e) { console.warn(\"[Spector.js] Worker auto-injection failed:\", e); }\n";
                                blobUrl = URL.createObjectURL(new Blob([importLine, xhr.responseText],
                                    { type: "application/javascript" }));
                            }
                        }
                    }
                } catch (e) {
                    // tslint:disable-next-line:no-console
                    console.warn("[Spector.js] Could not inject into Worker (" + urlStr + "):", e);
                }

                if (blobUrl) {
                    let worker: Worker;
                    try {
                        worker = Reflect.construct(target, [blobUrl], newTarget);
                    } catch (e) {
                        URL.revokeObjectURL(blobUrl);
                        return fallback();
                    }
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
                    return record(worker);
                }
                return fallback();
            },
        });
        (globalThis as any).Worker = workerProxy;
        WorkerSpy.originalWorkerConstructor = originalWorkerConstructor;
        WorkerSpy.workerProxy = workerProxy;
        WorkerSpy.intercepting = true;
    }

    /** Deactivate interception without overwriting a later third-party constructor. */
    public static stopIntercepting(): void {
        if (!WorkerSpy.intercepting) {
            return;
        }
        const workerProxy = WorkerSpy.workerProxy;
        WorkerSpy.workerProxy = undefined;
        WorkerSpy.intercepting = false;
        if ((globalThis as any).Worker === workerProxy) {
            try {
                (globalThis as any).Worker = WorkerSpy.originalWorkerConstructor;
            } catch (e) {
                // A third party may have made the property read-only. The
                // installed proxy is already inactive and forwards natively.
            }
        }
    }

    /** Check a synchronous preflight without accepting redirects or non-script MIME types. */
    private static isJavaScriptResponse(xhr: XMLHttpRequest, requestedUrl: string): boolean {
        const mime = (xhr.getResponseHeader("Content-Type") || "").split(";")[0].trim();
        return xhr.status === 200 && xhr.responseURL === requestedUrl &&
            /^(?:text|application)\/(?:x-)?(?:java|ecma)script$/i.test(mime);
    }

    /**
     * Bypass recognizable URL-dependent code instead of emulating native APIs.
     * Token checks cover comments between tokens and ordinary aliases, but not
     * arbitrary computed names. False positives intentionally stay native.
     * Strict directives and hashbangs cannot be preserved by prepending code.
     */
    private static shouldInjectSource(source: string): boolean {
        return !/\b(?:import|importScripts|Worker|SharedWorker|location|fetch|Request|XMLHttpRequest|WebSocket|EventSource|crossOriginIsolated|SharedArrayBuffer|Atomics|WebAssembly|eval|Function)\b|\\u|["']use strict["']|^(?:\uFEFF)?#!/.test(source);
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
