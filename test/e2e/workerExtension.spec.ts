import { chromium, expect, test } from "@playwright/test";
import { resolve } from "path";

test("installed extension persists opt-in through the real popup, background and isolated worlds", async ({}, testInfo) => {
    const extensionPath = resolve(__dirname, "../../extensions");
    const context = await chromium.launchPersistentContext(testInfo.outputPath("profile"), {
        channel: "chromium",
        headless: true,
        args: [
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
            "--use-gl=angle",
            "--use-angle=swiftshader",
        ],
    });
    try {
        const background = context.serviceWorkers()[0] || await context.waitForEvent("serviceworker");
        const extensionId = new URL(background.url()).host;
        const page = await context.newPage();
        await page.addInitScript(() => {
            if (window.top === window) {
                document.addEventListener("DOMContentLoaded", () => {
                    const frame = document.createElement("iframe");
                    frame.src = "http://127.0.0.1:1337/test/e2e/fixtures/worker-host.html";
                    document.body.append(frame);
                });
            }
        });
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto("http://localhost:1337/test/e2e/fixtures/worker-host.html");
        expect(await page.evaluate(() => Worker === Worker.prototype.constructor)).toBe(true);
        expect(await page.evaluate(() => (window as any).earlyWorkerResult))
            .toEqual({ value: "safe-ok", injected: false });

        await page.evaluate(() => sessionStorage.setItem("SPECTOR_LOADED", "true"));
        await page.reload();
        await page.waitForFunction(() => !!(window as any).spector);
        const bridgeUrl = await page.locator("#TexturesId_SpectorWorkerBundleUrl").first().inputValue();
        expect(bridgeUrl).toBe(`chrome-extension://${extensionId}/spector.worker.bundle.js`);

        // A cross-origin frame starts without the top frame's session setting.
        const childFrame = () => page.frames().find((frame) => frame.url().startsWith("http://127.0.0.1:1337/"))!;
        expect(await childFrame().evaluate(() => sessionStorage.getItem("SPECTOR_WORKERAUTOINJECT"))).toBeNull();

        const popup = await context.newPage();
        await popup.goto(`chrome-extension://${extensionId}/popup.html`);
        const checkbox = popup.getByRole("checkbox", { name: "Auto-inject Workers (experimental)", exact: true });
        const focusTab = async () => background.evaluate(async () => {
            const chrome = (globalThis as any).chrome;
            const tabs = await chrome.tabs.query({});
            const tab = tabs.find((candidate: any) => candidate.url === "http://localhost:1337/test/e2e/fixtures/worker-host.html");
            await chrome.tabs.update(tab.id, { active: true });
        });
        await focusTab();
        await popup.evaluate(() => (globalThis as any).refreshCanvases());
        await expect(checkbox).not.toBeChecked();

        // This test opens popup.html as a background tab. A physical click would
        // activate that tab, unlike a real action popup, and target the wrong tab.
        await Promise.all([
            page.waitForEvent("load"),
            checkbox.evaluate((input: HTMLInputElement) => input.click()),
        ]);
        await page.waitForFunction(() => !!(window as any).spector);
        expect(await page.evaluate(() => sessionStorage.getItem("SPECTOR_WORKERAUTOINJECT"))).toBe("true");
        expect(await page.evaluate(() => (window as any).__SPECTOR_Workers[0].injected)).toBe(true);
        expect(await childFrame().evaluate(() => sessionStorage.getItem("SPECTOR_WORKERAUTOINJECT"))).toBe("true");
        // The parser-created Worker ran with the real extension bundle, not a stub.
        expect(await page.evaluate(() => (window as any).earlyWorkerResult))
            .toEqual({ value: "safe-ok", injected: false });

        await page.reload();
        await page.waitForFunction(() => !!(window as any).spector);
        expect(await page.evaluate(() => (window as any).__SPECTOR_Workers[0].injected)).toBe(true);
        expect(await page.evaluate(() => new Promise<boolean>((resolve, reject) => {
            const worker = new Worker("/sample/js/workerAutoInject/safeClassic.js");
            const timer = setTimeout(() => { worker.terminate(); reject(new Error("No instrumented context")); }, 10000);
            worker.onmessage = (event) => {
                if (event.data?.type === "spector:context-ready") {
                    clearTimeout(timer);
                    worker.terminate();
                    resolve(true);
                }
            };
            worker.onerror = (event) => { clearTimeout(timer); worker.terminate(); reject(new Error(event.message)); };
            worker.postMessage("start");
        }))).toBe(true);
        const captureResult = await page.evaluate(() => new Promise<{ count: number; commands: number[] }>((resolve, reject) => {
            const worker = new Worker("./worker-module-manual.js", { type: "module" });
            const canvas = new OffscreenCanvas(16, 16);
            const captures: any[] = [];
            const timer = setTimeout(() => { worker.terminate(); reject(new Error("No extension capture")); }, 15000);
            const onCapture = (event: Event) => {
                captures.push((event as CustomEvent).detail.capture);
                if (captures.length === 1) {
                    setTimeout(() => {
                        clearTimeout(timer);
                        worker.terminate();
                        document.removeEventListener("SpectorOnCaptureEvent", onCapture);
                        resolve({ count: captures.length, commands: captures.map(capture => capture.commands?.length) });
                    }, 100);
                }
            };
            document.addEventListener("SpectorOnCaptureEvent", onCapture);
            worker.onmessage = (event) => {
                if (event.data?.type === "spector:context-ready") {
                    const index = (window as any).__SPECTOR_Canvases.findIndex((entry: any) => entry.__spector_worker === worker);
                    (document.getElementById("SPECTOR_COMMUNICATION") as HTMLInputElement).value = String(index);
                    (document.getElementById("SPECTOR_COMMUNICATION_COMMANDCOUNT") as HTMLInputElement).value = "6";
                    (document.getElementById("SPECTOR_COMMUNICATION_QUICKCAPTURE") as HTMLInputElement).value = "true";
                    document.dispatchEvent(new CustomEvent("SpectorRequestCaptureEvent"));
                }
            };
            worker.postMessage({ type: "init", canvas }, [canvas]);
        }));
        expect(captureResult).toEqual({ count: 1, commands: [6] });

        const unlinkedCanvas = await page.evaluate(() => {
            const unrelated = new Worker("/test/e2e/fixtures/worker-safe.js");
            const native = new Worker("/test/e2e/fixtures/worker-module-safe.js", { type: "module" });
            const canvas = document.createElement("canvas");
            document.body.append(canvas);
            const offscreen = canvas.transferControlToOffscreen();
            native.postMessage({ canvas: offscreen }, [offscreen]);
            document.dispatchEvent(new CustomEvent("SpectorRequestCanvasListEvent"));
            const canvases = (window as any).__SPECTOR_Canvases;
            const index = canvases.indexOf(canvas);
            const requests: unknown[] = [];
            const postMessage = unrelated.postMessage.bind(unrelated);
            unrelated.postMessage = (message: unknown) => {
                requests.push(message);
                postMessage(message);
            };
            const errors: string[] = [];
            document.addEventListener("SpectorOnErrorEvent", (event) => {
                errors.push((event as CustomEvent).detail.errorString);
            }, { once: true });
            (document.getElementById("SPECTOR_COMMUNICATION") as HTMLInputElement).value = String(index);
            document.dispatchEvent(new CustomEvent("SpectorRequestCaptureEvent"));
            const linked = Object.hasOwn(canvas, "__spector_worker");
            unrelated.terminate();
            native.terminate();
            canvas.remove();
            return { index, requests, errors, linked };
        });
        expect(unlinkedCanvas.index).toBeGreaterThanOrEqual(0);
        expect(unlinkedCanvas.requests).toEqual([]);
        expect(unlinkedCanvas.linked).toBe(false);
        expect(unlinkedCanvas.errors).toEqual([expect.stringContaining("Worker is unknown")]);

        const restrictedStartup = await page.evaluate(() => new Promise((resolve, reject) => {
            const policy = document.createElement("meta");
            policy.httpEquiv = "Content-Security-Policy";
            policy.content = "worker-src 'self' blob:; script-src 'none'; connect-src 'self' chrome-extension:";
            document.head.append(policy);
            const xhr = new XMLHttpRequest();
            xhr.open("GET", (document.getElementById("TexturesId_SpectorWorkerBundleUrl") as HTMLInputElement).value, false);
            xhr.send();
            const worker = new Worker("/sample/js/workerAutoInject/safeClassic.js");
            const timer = setTimeout(() => { worker.terminate(); reject(new Error("No restricted Worker startup")); }, 10000);
            let contexts = 0;
            worker.onmessage = (event) => {
                if (event.data?.type === "spector:context-ready") { contexts++; }
                if (event.data?.value) {
                    clearTimeout(timer);
                    worker.terminate();
                    resolve({ status: xhr.status, contexts, value: event.data.value });
                }
            };
            worker.onerror = (event) => { clearTimeout(timer); worker.terminate(); reject(new Error(event.message)); };
            worker.postMessage("start");
        }));
        // Chromium allows web-accessible extension scripts here even though an
        // HTTP bundle's importScripts is blocked by the same script-src policy.
        expect(restrictedStartup).toEqual({ status: 200, contexts: 1, value: "safe-classic-ok" });
        // A subframe's different setting must not become the popup's default.
        await childFrame().evaluate(() => sessionStorage.setItem("SPECTOR_WORKERAUTOINJECT", "false"));
        await childFrame().goto(childFrame().url());
        await focusTab();
        await popup.reload();
        await popup.evaluate(() => (globalThis as any).refreshCanvases());
        await expect(checkbox).toBeChecked();

        await Promise.all([
            page.waitForEvent("load"),
            checkbox.evaluate((input: HTMLInputElement) => input.click()),
        ]);
        await page.waitForFunction(() => !!(window as any).spector);
        expect(await page.evaluate(() => Worker === Worker.prototype.constructor)).toBe(true);
        expect(await page.evaluate(() => sessionStorage.getItem("SPECTOR_WORKERAUTOINJECT"))).toBe("false");
        await focusTab();
        await popup.reload();
        await popup.evaluate(() => (globalThis as any).refreshCanvases());
        await expect(checkbox).not.toBeChecked();
        await page.evaluate(() => {
            document.addEventListener("SpectorRequestPauseEvent", () => {
                (window as any).__pauseRoutedToTopFrame = true;
            });
        });
        await popup.evaluate(() => (globalThis as any).pause({ ref: { frameId: "0" } }));
        await page.waitForFunction(() => (window as any).__pauseRoutedToTopFrame === true);
        expect(errors).toEqual([]);
    } finally {
        await context.close();
    }
});
