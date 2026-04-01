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
                // Fetch the worker script and prepend Spector import
                const xhr = new XMLHttpRequest();
                xhr.open("GET", urlStr, false); // synchronous
                xhr.send();

                if (xhr.status === 200) {
                    const importLine = 'importScripts("' + WorkerSpy.workerBundleUrl + '");\n';
                    const modifiedScript = importLine + xhr.responseText;
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

    /** Get all Workers that were created while intercepting. */
    public static getSpiedWorkers(): ISpiedWorker[] {
        return WorkerSpy.spiedWorkers;
    }

    /** Check if currently intercepting. */
    public static isIntercepting(): boolean {
        return WorkerSpy.intercepting;
    }
}
