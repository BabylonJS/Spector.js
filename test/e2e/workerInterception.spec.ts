import { expect, Page, test } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

interface IWorkerResult {
    value?: string;
    injected?: boolean;
    error?: string;
}

const fixtureRoot = "/test/e2e/fixtures";
const contentScript = readFileSync(join(__dirname, "..", "..", "extensions", "contentScript.js"), "utf8");
const moduleWorkerInjector = readFileSync(
    join(__dirname, "..", "..", "extensions", "moduleWorkerInjector.js"),
    "utf8",
);

async function installExtensionWorkerProxy(page: Page, enabled?: boolean): Promise<void> {
    // One init script fixes the ordering: native snapshot -> session setting ->
    // actual MAIN content script, all before the parser/application runs.
    await page.addInitScript(`
        window.__nativeWorker = window.Worker;
        if (!sessionStorage.getItem("__spectorTestInitialized")) {
            sessionStorage.setItem("__spectorTestInitialized", "true");
            sessionStorage.setItem("SPECTOR_CAPTUREOFFSCREEN", "true");
            ${enabled === undefined ? "" : `sessionStorage.setItem("SPECTOR_WORKERAUTOINJECT", "${enabled}");`}
        }
        ${moduleWorkerInjector}
        ${contentScript}
    `);
    await page.goto(`${fixtureRoot}/worker-host.html`);
}

async function runWorker<T>(page: Page, scriptName: string, options?: WorkerOptions): Promise<T> {
    return page.evaluate<T, { scriptUrl: string; workerOptions?: WorkerOptions }>(({ scriptUrl, workerOptions }) => {
        return new Promise<T>((resolve, reject) => {
            const worker = new Worker(scriptUrl, workerOptions);
            const timeout = setTimeout(() => {
                worker.terminate();
                reject(new Error("Worker response timed out"));
            }, 10000);
            worker.onmessage = (event) => {
                clearTimeout(timeout);
                worker.terminate();
                resolve(event.data as T);
            };
            worker.onerror = (event) => {
                clearTimeout(timeout);
                worker.terminate();
                reject(new Error(event.message));
            };
            worker.postMessage("start");
        });
    }, {
        scriptUrl: `${fixtureRoot}/${scriptName}`,
        workerOptions: options,
    });
}

for (const enabled of [undefined, false, true]) {
    test.describe(`Extension Worker auto-injection: ${enabled === undefined ? "default" : enabled ? "on" : "off"}`, () => {
        let preflightRequests: string[];
        test.beforeEach(async ({ page }) => {
            preflightRequests = [];
            page.on("request", (request) => {
                if (request.resourceType() === "xhr") {
                    preflightRequests.push(request.url());
                }
            });
            await installExtensionWorkerProxy(page, enabled);
        });

        test("decides interception before application Workers are constructed", async ({ page }) => {
            expect(await page.evaluate(() => window.Worker === (window as any).__nativeWorker)).toBe(enabled !== true);
            expect(await page.evaluate(() => (window as any).earlyWorkerResult))
                .toEqual({ value: "safe-ok", injected: enabled === true });
            if (enabled !== true) {
                expect(preflightRequests).toEqual([]);
            } else {
                expect(preflightRequests.some((url) => url.endsWith("worker-safe.js"))).toBe(true);
                expect(await page.evaluate(() => (window as any).__SPECTOR_Workers[0].injected)).toBe(true);
            }
        });

        test("preserves relative dynamic imports in classic Workers", async ({ page }) => {
            const result = await runWorker<IWorkerResult>(page, "worker-dynamic-import.js");
            expect(result).toEqual({ value: "dynamic-ok", injected: false });
            if (enabled !== true) {
                expect(preflightRequests).toEqual([]);
            }
        });

        test("preserves nested module Workers created by classic Workers", async ({ page }) => {
            const result = await runWorker<IWorkerResult>(page, "worker-nested-parent.js");
            expect(result).toEqual({ value: "nested-ok", injected: false });
            if (enabled !== true) {
                expect(preflightRequests).toEqual([]);
            }
        });

        test("preserves module Workers with nested Workers", async ({ page }) => {
            const result = await runWorker<string>(page, "worker-module-parent.js", { type: "module" });
            expect(result).toBe("nested-ok");
            expect(await page.evaluate(() => {
                const workers = (window as any).__SPECTOR_Workers;
                return workers ? workers[workers.length - 1].injected : false;
            })).toBe(false);
        });

        test("injects a static-import module Worker only after opt-in", async ({ page }) => {
            const result = await runWorker<IWorkerResult>(page, "worker-module-safe.js", { type: "module" });
            expect(result).toEqual({ value: "module-ok", injected: enabled === true });
            expect(preflightRequests.some((url) => url.endsWith("worker-module-safe.js")))
                .toBe(enabled === true);
        });
    });
}

test("off mode preserves native subclassing, statics, invocation errors and coercion", async ({ page }) => {
    await installExtensionWorkerProxy(page);
    const result = await page.evaluate(() => {
        const NativeWorker = (window as any).__nativeWorker;
        NativeWorker.testStatic = "unchanged";
        const inspect = (Ctor: typeof Worker) => {
            const calls: string[] = [];
            const scriptURL = {
                [Symbol.toPrimitive](hint: string) {
                    calls.push("URL:" + hint);
                    return "./worker-safe.js";
                },
                toString() { throw new Error("Unexpected toString"); },
            };
            const options = {
                get name() { calls.push("name"); return "native"; },
                get type(): WorkerType { calls.push("type"); return "classic"; },
                get credentials(): RequestCredentials { calls.push("credentials"); return "same-origin"; },
            };
            class ChildWorker extends Ctor {}
            const worker = new ChildWorker(scriptURL as any, options);
            const subclass = worker instanceof ChildWorker;
            const nativeInstance = worker instanceof NativeWorker;
            worker.terminate();
            let invocationError: string | undefined;
            try { (Ctor as any)(scriptURL, options); } catch (error) { invocationError = String(error); }
            let missingArgumentError: string | undefined;
            try { new (Ctor as any)(); } catch (error) { missingArgumentError = String(error); }
            return { calls, subclass, nativeInstance, invocationError, missingArgumentError };
        };
        return {
            identical: Worker === NativeWorker,
            staticValue: (Worker as any).testStatic,
            actual: inspect(Worker),
            native: inspect(NativeWorker),
        };
    });
    expect(result.identical).toBe(true);
    expect(result.staticValue).toBe("unchanged");
    expect(result.actual).toEqual(result.native);
    expect(result.actual.subclass).toBe(true);
    expect(result.actual.nativeInstance).toBe(true);
    expect(result.actual.invocationError).toContain("TypeError");
    expect(result.actual.missingArgumentError).toContain("TypeError");
});

test("opt-in captures a transferred OffscreenCanvas in a module Worker", async ({ page }) => {
    await installExtensionWorkerProxy(page, true);
    await page.evaluate(() => {
        const bundle = document.getElementById("TexturesId_SpectorWorkerBundleUrl") as HTMLInputElement;
        bundle.value = `${location.origin}/.temp/spector.worker.bundle.js`;
    });

    const result = await page.evaluate<{ commands: number; names: string[] }, string>((scriptUrl) => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement("canvas");
            const offscreen = canvas.transferControlToOffscreen();
            const worker = new Worker(scriptUrl, { type: "module" });
            const timeout = setTimeout(() => {
                worker.terminate();
                reject(new Error("Module Worker capture timed out"));
            }, 15000);
            worker.addEventListener("message", (event) => {
                if (event.data?.type === "spector:context-ready") {
                    worker.postMessage({
                        type: "spector:trigger-capture",
                        version: 1,
                        canvasIndex: 0,
                        commandCount: 6,
                        quickCapture: true,
                        fullCapture: false,
                    });
                }
                if (event.data?.type === "spector:capture-complete") {
                    clearTimeout(timeout);
                    worker.terminate();
                    resolve({
                        commands: event.data.capture.commands.length,
                        names: event.data.capture.commands.map((command: { name: string }) => command.name),
                    });
                }
            });
            worker.postMessage({ type: "init", canvas: offscreen }, [offscreen]);
        });
    }, `${fixtureRoot}/worker-module-offscreen.js`);

    expect(result.commands).toBeGreaterThan(3);
    expect(result.names).toContain("drawArrays");
});

test("disabling persisted opt-in restores native construction on reload", async ({ page }) => {
    await installExtensionWorkerProxy(page, true);
    expect(await page.evaluate(() => (window as any).earlyWorkerResult)).toEqual({ value: "safe-ok", injected: true });
    await page.reload();
    expect(await page.evaluate(() => (window as any).earlyWorkerResult)).toEqual({ value: "safe-ok", injected: true });

    // The proxy message handler's write/reload ordering is covered by the unit
    // bridge test; here verify fresh-document behavior with that persisted key.
    await page.evaluate(() => sessionStorage.setItem("SPECTOR_WORKERAUTOINJECT", "false"));
    await page.reload();
    expect(await page.evaluate(() => Worker === (window as any).__nativeWorker)).toBe(true);
    expect(await page.evaluate(() => (window as any).earlyWorkerResult)).toEqual({ value: "safe-ok", injected: false });
    expect(await runWorker<IWorkerResult>(page, "worker-dynamic-import.js")).toEqual({ value: "dynamic-ok", injected: false });
    await page.reload();
    expect(await page.evaluate(() => Worker === (window as any).__nativeWorker)).toBe(true);
});

test("loaded extension still captures main-thread canvases with Workers left native", async ({ page }) => {
    await page.addInitScript(() => {
        (window as any).__nativeWorker = Worker;
        sessionStorage.setItem("SPECTOR_LOADED", "true");
        sessionStorage.setItem("SPECTOR_CAPTUREOFFSCREEN", "true");
    });
    await page.route(`${fixtureRoot}/worker-host.html`, async (route) => {
        const response = await route.fetch();
        const body = (await response.text()).replace("</head>", `
            <script src="/extensions/spector.bundle.func.js"></script>
            <script src="/extensions/contentScript.js"></script>
            </head>`);
        await route.fulfill({ response, body });
    });
    await page.goto(`${fixtureRoot}/worker-host.html`);
    await page.waitForFunction(() => !!(window as any).spector);
    expect(await page.evaluate(() => Worker === (window as any).__nativeWorker)).toBe(true);
    expect(await page.evaluate(() => (window as any).earlyWorkerResult)).toEqual({ value: "safe-ok", injected: false });

    const commands = await page.evaluate(() => new Promise<string[]>((resolve, reject) => {
        const canvas = document.createElement("canvas");
        document.body.appendChild(canvas);
        const gl = canvas.getContext("webgl2");
        if (!gl) { reject(new Error("WebGL2 unavailable")); return; }
        const spector = (window as any).spector;
        const timeout = setTimeout(() => reject(new Error("Main-thread capture timed out")), 10000);
        spector.onCapture.add((capture: any) => {
            clearTimeout(timeout);
            resolve(capture.commands.map((command: any) => command.name));
        });
        spector.onError.add((error: string) => {
            clearTimeout(timeout);
            reject(new Error(error));
        });
        spector.captureContext(gl, 3, true);
        gl.clearColor(1, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.viewport(0, 0, canvas.width, canvas.height);
    }));
    expect(commands).toEqual(["clearColor", "clear", "viewport"]);
});

test("popup exposes the experimental opt-in as an unchecked, labeled checkbox", async ({ page }) => {
    await page.setViewportSize({ width: 418, height: 550 });
    await page.addInitScript(() => {
        (window as any).__popupMessages = [];
        (window as any).browser = {
            runtime: {
                onMessage: { addListener() { /* no background in this UI test */ } },
                sendMessage(_message: any, callback: any) { callback({}); },
            },
            tabs: {
                query(_query: any, callback: any) { callback([{ id: 7 }]); },
                sendMessage(_tabId: number, message: any, callback: any) {
                    (window as any).__popupMessages.push(message);
                    callback({});
                },
            },
            storage: { local: { get(_key: string, callback: any) { callback({}); } } },
        };
    });
    await page.goto("/extensions/popup.html");
    const checkbox = page.getByRole("checkbox", { name: "Auto-inject Workers (experimental)", exact: true });
    await expect(checkbox).not.toBeChecked();
    await expect(checkbox).toHaveAccessibleDescription(/OffscreenCanvas Workers.*may alter Worker behavior/);
    await checkbox.focus();
    await page.keyboard.press("Space");
    await expect(checkbox).toBeChecked();
    expect(await page.evaluate(() => (window as any).__popupMessages))
        .toContainEqual({ action: "changeWorkerAutoInject", workerAutoInject: true });

    const footer = (await page.locator(".footer").boundingBox())!;
    const hint = (await page.locator(".captureHint").boundingBox())!;
    expect(hint.y + hint.height).toBeLessThanOrEqual(footer.y);
    expect(footer.y + footer.height).toBeLessThanOrEqual(550);
});
