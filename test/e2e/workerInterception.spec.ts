import { expect, Page, test } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";
import { createServer } from "http";
import { AddressInfo } from "net";

interface IWorkerResult {
    value?: string;
    injected?: boolean;
    error?: string;
}

const fixtureRoot = "/test/e2e/fixtures";
const contentScript = readFileSync(join(__dirname, "..", "..", "extensions", "contentScript.js"), "utf8");

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

        test("leaves static-import module Workers native even after opt-in", async ({ page }) => {
            const result = await runWorker<IWorkerResult>(page, "worker-module-safe.js", { type: "module" });
            expect(result).toEqual({ value: "module-ok", injected: false });
            expect(preflightRequests.some((url) => url.endsWith("worker-module-safe.js")))
                .toBe(false);
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

test("opt-in preserves native message cloning, transfer and validation timing", async ({ page }) => {
    await installExtensionWorkerProxy(page, true);
    const result = await page.evaluate(() => {
        const worker = new Worker("./worker-module-safe.js", { type: "module" });
        const buffer = new ArrayBuffer(8);
        worker.postMessage(buffer, [buffer]);
        let cloneError = "";
        try { worker.postMessage(() => {}); } catch (error) { cloneError = (error as Error).name; }
        const ownPostMessage = Object.hasOwn(worker, "postMessage");
        worker.terminate();
        return { detached: buffer.byteLength === 0, cloneError, ownPostMessage };
    });
    expect(result).toEqual({ detached: true, cloneError: "DataCloneError", ownPostMessage: false });
});

test("opt-in fallback does not inspect options or coerce URL objects before the native constructor", async ({ page }) => {
    await installExtensionWorkerProxy(page, true);
    const result = await page.evaluate(() => {
        const inspect = (Ctor: typeof Worker) => {
            const calls: string[] = [];
            const url = {
                [Symbol.toPrimitive](hint: string) { calls.push("url:" + hint); return "./worker-safe.js"; },
                toString() { throw new Error("Unexpected toString"); },
            };
            const options = {
                get credentials(): RequestCredentials { calls.push("credentials"); return "omit"; },
                get name() { calls.push("name"); return "named"; },
                get type(): WorkerType { calls.push("type"); return "module"; },
            };
            try {
                class Child extends Ctor {}
                const worker = new Child(url as any, options);
                const subclass = worker instanceof Child;
                worker.terminate();
                return { calls, subclass };
            } catch (error) {
                return { calls, error: String(error) };
            }
        };
        return { actual: inspect(Worker), native: inspect((window as any).__nativeWorker) };
    });
    expect(result.actual).toEqual(result.native);
});

test("manual instrumentation captures a transferred OffscreenCanvas in a native module Worker", async ({ page }) => {
    await installExtensionWorkerProxy(page, true);

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
    }, `${fixtureRoot}/worker-module-manual.js`);

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

for (const mode of ["extension", "api"]) {
    test.describe(`${mode} conservative opt-in`, () => {
        test.beforeEach(async ({ page }) => {
            if (mode === "extension") {
                await installExtensionWorkerProxy(page, true);
            } else {
                await page.addInitScript("window.__nativeWorker = Worker;");
                await page.goto(`${fixtureRoot}/worker-host.html`);
                await page.addScriptTag({ url: "/dist/spector.bundle.js" });
                await page.evaluate(() => {
                    const spector = new (window as any).SPECTOR.Spector();
                    spector.spyWorkers("/test/e2e/fixtures/worker-spector-stub.js");
                    (window as any).__testSpector = spector;
                });
            }
        });

        test("preserves constructor errors, descriptors, URL conversion and getter order", async ({ page }) => {
            const results = await page.evaluate(() => {
                const Native = (window as any).__nativeWorker;
                Native.customStatic = 42;
                const inspect = (Ctor: typeof Worker) => {
                    const calls: string[] = [];
                    const url = {
                        [Symbol.toPrimitive](hint: string) { calls.push("url:" + hint); return "./worker-safe.js"; },
                        toString() { throw new Error("extra conversion"); },
                    };
                    const options = {
                        get credentials(): RequestCredentials { calls.push("credentials"); return "same-origin"; },
                        get name() { calls.push("name"); return "child"; },
                        get type(): WorkerType { calls.push("type"); return "classic"; },
                    };
                    class Child extends Ctor {}
                    Object.defineProperty(Child.prototype, "addEventListener", {
                        get() { throw new Error("unexpected instance method access"); },
                    });
                    const worker = new Child(url as any, options);
                    const subclass = worker instanceof Child;
                    worker.terminate();
                    const errors: string[] = [];
                    for (const construct of [
                        () => (Ctor as any)(),
                        () => new (Ctor as any)(),
                        () => new Ctor("./worker-safe.js", { get type(): WorkerType { throw new Error("getter"); } }),
                    ]) {
                        try { construct(); } catch (error) { errors.push(String(error)); }
                    }
                    return { calls, subclass, errors, keys: Object.getOwnPropertyNames(Ctor),
                        name: Object.getOwnPropertyDescriptor(Ctor, "name"), staticValue: (Ctor as any).customStatic };
                };
                return { actual: inspect(Worker), native: inspect(Native) };
            });
            expect(results.actual).toEqual(results.native);
        });

        test("leaves startup messages, cloning, transfers and top-level await native", async ({ page }) => {
            const result = await page.evaluate(() => new Promise<any>((resolve, reject) => {
                const worker = new Worker("./worker-module-startup.js", { type: "module" });
                const timeout = setTimeout(() => { worker.terminate(); reject(new Error("startup deadlock")); }, 5000);
                const data = { value: 1, buffer: new ArrayBuffer(8) };
                let detached = false;
                let cloneError = "";
                worker.onmessage = (event) => {
                    clearTimeout(timeout);
                    worker.terminate();
                    resolve({ result: event.data, detached, cloneError, ownPostMessage: Object.hasOwn(worker, "postMessage") });
                };
                worker.onerror = (event) => { clearTimeout(timeout); worker.terminate(); reject(new Error(event.message)); };
                worker.postMessage(data, { transfer: [data.buffer] });
                detached = data.buffer.byteLength === 0;
                data.value = 2;
                try { worker.postMessage(() => {}); } catch (error) { cloneError = (error as Error).name; }
            }));
            expect(result).toMatchObject({ detached: true, cloneError: "DataCloneError", ownPostMessage: false,
                result: { data: { value: 1 }, trusted: true, value: "module-ok" } });
            expect(result.result.moduleURL).toBe(result.result.workerURL);
            expect(result.result.moduleURL).toMatch(/\/worker-module-startup\.js$/);
        });

        test("preserves relative importScripts, Request, fetch and XHR semantics", async ({ page }) => {
            const result = await runWorker<any>(page, "worker-url-apis.js");
            expect(result.fetched.trim()).toBe("ready");
            expect(result.loaded.trim()).toBe("ready");
            expect(result.requestURL).toMatch(/\/fixtures\/worker-module-offscreen-data\.txt$/);
            expect(result.workerURL).toMatch(/\/fixtures\/worker-url-apis\.js$/);
        });

        test("keeps native workers usable when CSP blocks preflight", async ({ page }) => {
            await page.evaluate(() => {
                const policy = document.createElement("meta");
                policy.httpEquiv = "Content-Security-Policy";
                policy.content = "worker-src 'self'; connect-src 'none'";
                document.head.append(policy);
            });
            expect(await runWorker<IWorkerResult>(page, "worker-safe.js")).toEqual({ value: "safe-ok", injected: false });
            expect(await runWorker<IWorkerResult>(page, "worker-module-safe.js", { type: "module" }))
                .toEqual({ value: "module-ok", injected: false });
        });

        test("keeps the application running when CSP blocks only the bundle import", async ({ page }) => {
            await page.evaluate(() => {
                const policy = document.createElement("meta");
                policy.httpEquiv = "Content-Security-Policy";
                policy.content = "worker-src 'self' blob:; script-src 'none'; connect-src 'self'";
                document.head.append(policy);
            });
            expect(await runWorker<IWorkerResult>(page, "worker-safe.js"))
                .toEqual({ value: "safe-ok", injected: false });
        });

        test("keeps the application running when a preflighted bundle throws during execution", async ({ page }) => {
            const warnings: string[] = [];
            page.on("console", (message) => {
                if (message.type() === "warning") {
                    warnings.push(message.text());
                }
            });
            await page.route("**/worker-spector-stub.js", (route) => route.fulfill({
                contentType: "text/javascript",
                body: 'throw new Error("instrumentation startup failed");',
            }));
            expect(await runWorker<IWorkerResult>(page, "worker-safe.js"))
                .toEqual({ value: "safe-ok", injected: false });
            expect(warnings).toEqual(expect.arrayContaining([
                expect.stringContaining("[Spector.js] Worker auto-injection failed:"),
            ]));
        });

        test("preserves native HTTP charset decoding of Worker scripts", async ({ page }) => {
            await page.route("**/worker-encoding.js", (route) => route.fulfill({
                contentType: "text/javascript; charset=windows-1252",
                body: Buffer.from('onmessage = () => postMessage("café");', "utf8"),
            }));
            const native = await page.evaluate(() => new Promise((resolve, reject) => {
                const worker = new (window as any).__nativeWorker("./worker-encoding.js");
                worker.onmessage = (event: MessageEvent) => { worker.terminate(); resolve(event.data); };
                worker.onerror = (event: ErrorEvent) => { worker.terminate(); reject(new Error(event.message)); };
                worker.postMessage("start");
            }));
            expect(await runWorker<string>(page, "worker-encoding.js")).toBe(native);
        });

        test("retains the application Worker's response CSP", async ({ page }) => {
            await page.route("**/worker-response-csp.js", (route) => route.fulfill({
                contentType: "text/javascript",
                headers: { "Content-Security-Policy": "script-src 'none'" },
                body: 'onmessage = () => { setTimeout("self.ran = true", 0); setTimeout(() => postMessage(self.ran === true), 50); };',
            }));
            const native = await page.evaluate(() => new Promise((resolve, reject) => {
                const worker = new (window as any).__nativeWorker("./worker-response-csp.js");
                worker.onmessage = (event: MessageEvent) => { worker.terminate(); resolve(event.data); };
                worker.onerror = (event: ErrorEvent) => { worker.terminate(); reject(new Error(event.message)); };
                worker.postMessage("start");
            }));
            expect(native).toBe(false);
            expect(await runWorker<boolean>(page, "worker-response-csp.js")).toBe(native);
        });

        test("bypasses commented dynamic imports and aliased nested workers", async ({ page }) => {
            const original = readFileSync(join(__dirname, "fixtures/worker-dynamic-import.js"), "utf8");
            await page.route("**/worker-dynamic-import.js", (route) => route.fulfill({
                contentType: "text/javascript", body: original.replace('import(', 'import // comment\n/* comment */ ('),
            }));
            expect(await runWorker<IWorkerResult>(page, "worker-dynamic-import.js"))
                .toEqual({ value: "dynamic-ok", injected: false });
            await page.route("**/worker-module-parent.js", (route) => route.fulfill({
                contentType: "text/javascript",
                body: 'import "./worker-nested-alias.js";',
            }));
            await page.route("**/worker-nested-alias.js", (route) => route.fulfill({
                contentType: "text/javascript",
                body: 'const Child = Worker; const child = new Child("./worker-nested-child.js", {type:"module"}); child.onmessage = e => postMessage(e.data);',
            }));
            expect(await runWorker<string>(page, "worker-module-parent.js", { type: "module" })).toBe("nested-ok");
        });

        test("does not preflight blob/data URLs, URL objects, custom options or cross-origin URLs", async ({ page }) => {
            const preflights: string[] = [];
            page.on("request", (request) => {
                if (request.resourceType() === "xhr") { preflights.push(request.url()); }
            });
            const results = await page.evaluate(async () => {
                const source = 'onmessage = () => postMessage("ok")';
                const blob = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
                const results = [];
                for (const url of [blob, "data:text/javascript," + encodeURIComponent(source), new URL("./worker-safe.js", location.href)]) {
                    results.push(await new Promise((resolve, reject) => {
                        const worker = new Worker(url);
                        worker.onmessage = (event) => { worker.terminate(); resolve(event.data); };
                        worker.onerror = (event) => { worker.terminate(); reject(new Error(event.message)); };
                        worker.postMessage("start");
                    }));
                }
                URL.revokeObjectURL(blob);
                new Worker("./worker-safe.js", { name: "native" }).terminate();
                let crossOriginError = "";
                try { new Worker(location.href.replace("localhost", "127.0.0.1")); } catch (error) { crossOriginError = (error as Error).name; }
                return { results, crossOriginError };
            });
            expect(results.results).toEqual(["ok", "ok", { value: "safe-ok", injected: false }]);
            expect(results.crossOriginError).toBe("SecurityError");
            expect(preflights).toEqual([]);
        });

        test("uses document.baseURI and leaves strict scripts native", async ({ page }) => {
            await page.evaluate(() => {
                const base = document.createElement("base");
                base.href = "/";
                document.head.append(base);
            });
            expect(await runWorker<IWorkerResult>(page, "worker-safe.js")).toEqual({ value: "safe-ok", injected: true });
            const relativeResult = await page.evaluate(() => new Promise((resolve, reject) => {
                const worker = new Worker("test/e2e/fixtures/worker-safe.js");
                worker.onmessage = (event) => { worker.terminate(); resolve(event.data); };
                worker.onerror = (event) => { worker.terminate(); reject(new Error(event.message)); };
                worker.postMessage("start");
            }));
            expect(relativeResult).toEqual({ value: "safe-ok", injected: true });
            await page.route("**/worker-strict.js", (route) => route.fulfill({
                contentType: "text/javascript",
                body: '"use strict"; onmessage = function() { postMessage({ strict: (function() {return this})() === undefined }); };',
            }));
            expect(await runWorker<any>(page, "worker-strict.js")).toEqual({ strict: true });
        });

        test("leaves HTTP redirects to the native Worker loader", async ({ page }) => {
            // Real HTTP redirects are needed: intercepted Worker redirects do
            // not reliably resume through Chromium's DevTools Fetch domain.
            const server = createServer((request, response) => {
                if (request.url === "/redirect.js") {
                    response.writeHead(302, { location: "/worker.js" }).end();
                } else if (request.url === "/worker.js") {
                    response.writeHead(200, { "Content-Type": "text/javascript" });
                    response.end('onmessage = () => postMessage({ value: "redirect-ok", injected: self.__spectorTestInjected === true });');
                } else {
                    response.writeHead(200, { "Content-Type": "text/html" });
                    response.end('<input id="TexturesId_SpectorWorkerBundleUrl" value="http://localhost:1337/test/e2e/fixtures/worker-spector-stub.js">');
                }
            });
            await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
            try {
                await page.goto(`http://127.0.0.1:${(server.address() as AddressInfo).port}/`);
                if (mode === "api") {
                    await page.addScriptTag({ url: "http://localhost:1337/dist/spector.bundle.js" });
                    await page.evaluate(() => new (window as any).SPECTOR.Spector()
                        .spyWorkers("http://localhost:1337/test/e2e/fixtures/worker-spector-stub.js"));
                }
                const result = await page.evaluate(() => new Promise((resolve, reject) => {
                    const worker = new Worker("./redirect.js");
                    worker.onmessage = (event) => { worker.terminate(); resolve(event.data); };
                    worker.onerror = (event) => { worker.terminate(); reject(new Error(event.message)); };
                    worker.postMessage("start");
                }));
                expect(result).toEqual({ value: "redirect-ok", injected: false });
            } finally {
                await new Promise<void>((resolve) => server.close(() => resolve()));
            }
        });

        test("does not lose application startup when the instrumentation bundle cannot load", async ({ page }) => {
            await page.evaluate((testMode) => {
                const missingBundle = "/test/e2e/fixtures/missing-worker-bundle.js";
                if (testMode === "extension") {
                    (document.getElementById("TexturesId_SpectorWorkerBundleUrl") as HTMLInputElement).value =
                        missingBundle;
                } else {
                    const spector = (window as any).__testSpector;
                    spector.stopSpyingWorkers();
                    spector.spyWorkers(missingBundle);
                }
            }, mode);
            const result = await page.evaluate<any, string>((scriptUrl) => new Promise((resolve, reject) => {
                const created: string[] = [];
                const create = URL.createObjectURL.bind(URL);
                URL.createObjectURL = (blob) => {
                    const url = create(blob);
                    created.push(url);
                    return url;
                };
                const worker = new Worker(scriptUrl);
                worker.onmessage = (event) => {
                    worker.terminate();
                    resolve({ message: event.data, created });
                };
                worker.onerror = (event) => {
                    worker.terminate();
                    reject(new Error(event.message));
                };
                worker.postMessage("start");
            }), `${fixtureRoot}/worker-safe.js`);
            expect(result).toEqual({
                message: { value: "safe-ok", injected: false },
                created: [],
            });
        });

        test("preserves native error delivery and reclaims injection blob URLs", async ({ page }) => {
            await page.route("**/worker-throws.js", (route) => route.fulfill({
                contentType: "text/javascript", body: 'throw new Error("application startup failed")',
            }));
            const result = await page.evaluate(() => new Promise<any>((resolve) => {
                const created: string[] = [];
                const revoked: string[] = [];
                const create = URL.createObjectURL.bind(URL);
                const revoke = URL.revokeObjectURL.bind(URL);
                URL.createObjectURL = (blob) => { const url = create(blob); created.push(url); return url; };
                URL.revokeObjectURL = (url) => { revoked.push(url); revoke(url); };
                const worker = new Worker("./worker-throws.js");
                worker.onerror = (event) => {
                    event.preventDefault();
                    worker.terminate();
                    setTimeout(() => resolve({ message: event.message, trusted: event.isTrusted, created, revoked }), 5100);
                };
            }));
            expect(result.message).toContain("application startup failed");
            expect(result.trusted).toBe(true);
            expect(result.created).toHaveLength(1);
            expect(result.revoked).toEqual(expect.arrayContaining(result.created));
        });
    });
}

test("stopping interception preserves third-party wrappers and deactivates retained proxies", async ({ page }) => {
    await page.goto(`${fixtureRoot}/worker-host.html`);
    await page.addScriptTag({ url: "/dist/spector.bundle.js" });
    await page.evaluate(() => {
        const spector = new (window as any).SPECTOR.Spector();
        spector.spyWorkers("/test/e2e/fixtures/worker-spector-stub.js");
        const retainedProxy = Worker;
        const thirdParty = new Proxy(Worker, {});
        (window as any).Worker = thirdParty;
        spector.stopSpyingWorkers();
        (window as any).__stopResult = Worker === thirdParty;
        (window as any).__retainedProxy = retainedProxy;
        (window as any).__testSpector = spector;
    });
    expect(await page.evaluate(() => (window as any).__stopResult)).toBe(true);
    const preflights: string[] = [];
    page.on("request", (request) => {
        if (request.resourceType() === "xhr") { preflights.push(request.url()); }
    });
    expect(await runWorker<IWorkerResult>(page, "worker-safe.js")).toEqual({ value: "safe-ok", injected: false });
    expect(preflights).toEqual([]);
    // Restart must not reactivate the retained, nested interceptor.
    await page.evaluate(() => (window as any).__testSpector.spyWorkers("/test/e2e/fixtures/worker-spector-stub.js"));
    expect(await runWorker<IWorkerResult>(page, "worker-safe.js")).toEqual({ value: "safe-ok", injected: true });
    expect(preflights).toHaveLength(2);
    expect(await page.evaluate(() => new Promise((resolve, reject) => {
        const worker = new (window as any).__retainedProxy("./worker-safe.js");
        worker.onmessage = (event: MessageEvent) => { worker.terminate(); resolve(event.data); };
        worker.onerror = (event: ErrorEvent) => { worker.terminate(); reject(new Error(event.message)); };
        worker.postMessage("start");
    }))).toEqual({ value: "safe-ok", injected: false });
    expect(preflights).toHaveLength(2);
});

test("captureWorker publishes each manual module Worker capture exactly once", async ({ page }) => {
    await page.goto(`${fixtureRoot}/worker-host.html`);
    await page.addScriptTag({ url: "/dist/spector.bundle.js" });
    const captures = await page.evaluate(() => new Promise<number>((resolve, reject) => {
        const worker = new Worker("./worker-module-manual.js", { type: "module" });
        const spector = new (window as any).SPECTOR.Spector();
        const canvas = new OffscreenCanvas(16, 16);
        const timer = setTimeout(() => { worker.terminate(); reject(new Error("No capture")); }, 10000);
        let captures = 0;
        spector.onCapture.add(() => {
            captures++;
            if (captures === 1) {
                setTimeout(() => { clearTimeout(timer); worker.terminate(); resolve(captures); }, 100);
            }
        });
        worker.onmessage = (event) => {
            if (event.data?.type === "spector:context-ready") {
                spector.captureWorker(worker, 6, true);
            }
        };
        worker.postMessage({ type: "init", canvas }, [canvas]);
    }));
    expect(captures).toBe(1);
});
