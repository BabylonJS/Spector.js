import { readFileSync } from "fs";
import { join } from "path";
import { createContext, runInContext } from "vm";

const extensionRoot = join(__dirname, "..", "..", "..", "extensions");
const settingKey = "SPECTOR_WORKERAUTOINJECT";

function createStorage(initial: { [key: string]: string } = {}) {
    const values = new Map(Object.entries(initial));
    return {
        getItem: jest.fn((key: string) => values.get(key) ?? null),
        setItem: jest.fn((key: string, value: string) => values.set(key, String(value))),
    };
}

function createBrowser() {
    return {
        tabs: {
            query: jest.fn((_query, callback) => callback([{ id: 7 }])),
            sendMessage: jest.fn(),
        },
        runtime: {
            getURL: jest.fn((name) => "https://extension.test/" + name),
            sendMessage: jest.fn((_message, callback) => callback?.({ frameId: "extension" })),
            onMessage: { addListener: jest.fn() },
            onStartup: { addListener: jest.fn() },
        },
        action: { onClicked: { addListener: jest.fn() } },
        storage: { local: { get: jest.fn(), set: jest.fn(), remove: jest.fn() } },
    };
}

function createWorld(storage = createStorage()) {
    const testURL: any = class extends URL {};
    testURL.createObjectURL = jest.fn();
    testURL.revokeObjectURL = jest.fn();
    const nativeWorker = jest.fn(function() {
        this.addEventListener = jest.fn();
    });
    const nativeGetContext = jest.fn();
    const world: any = {
        document: document.implementation.createHTMLDocument(),
        sessionStorage: storage,
        Worker: nativeWorker,
        HTMLCanvasElement: function() { /* isolated prototype */ },
        OffscreenCanvas: function() { /* isolated prototype */ },
        XMLHttpRequest: jest.fn(),
        URL: testURL,
        location: { href: "https://page.test/index.html", reload: jest.fn() },
        CustomEvent,
        console,
        setTimeout: jest.fn(),
        setInterval: jest.fn(),
        addEventListener: jest.fn(),
        spectorBundleHook: function() { /* no library execution needed here */ },
        browser: createBrowser(),
    };
    world.HTMLCanvasElement.prototype.getContext = nativeGetContext;
    world.OffscreenCanvas.prototype.getContext = jest.fn();
    world.window = world;
    world.chrome = world.browser;
    return createContext(world);
}

function loadScript(world: any, file: string) {
    runInContext(readFileSync(join(extensionRoot, file), "utf8"), world, { filename: file });
}

function loadPopup() {
    const world = createWorld();
    world.document.documentElement.innerHTML = readFileSync(join(extensionRoot, "popup.html"), "utf8");
    const event = { add: jest.fn() };
    world.SPECTOR = {
        EmbeddedFrontend: {
            CaptureMenu: function() {
                return {
                    onPlayRequested: event,
                    onPlayNextFrameRequested: event,
                    onPauseRequested: event,
                    onCaptureRequested: event,
                    display: jest.fn(),
                    updateCanvasesListInformation: jest.fn(),
                };
            },
        },
    };
    loadScript(world, "popup.js");
    world.addEventListener.mock.calls[0][1].call(world);
    return world;
}

// Exercise the real canvas-report -> background -> popup path, not just the
// checkbox setter, including top-frame selection in a tab with other origins.
function refreshPopup(proxy: any, popup: any) {
    const background = createWorld();
    loadScript(background, "background.js");
    const receive = background.browser.runtime.onMessage.addListener.mock.calls[0][0];
    proxy.document.dispatchEvent(new CustomEvent("SpectorOnCanvasListEvent", {
        detail: { canvasList: [] },
    }));
    const report = proxy.browser.runtime.sendMessage.mock.calls.at(-1)[0];
    receive(report, { id: "extension", frameId: 0, tab: { id: 7 } }, jest.fn());
    receive({ canvases: [], workerAutoInject: !report.workerAutoInject },
        { id: "extension", frameId: 2, tab: { id: 7 } }, jest.fn());
    background.refreshCanvases();
    const update = background.browser.runtime.sendMessage.mock.calls.at(-1)[0];
    const receivePopup = popup.browser.runtime.onMessage.addListener.mock.calls[0][0];
    receivePopup(update, { id: "extension" }, jest.fn());
    return report;
}

describe("Extension Worker auto-injection opt-in", () => {
    it.each([undefined, "false", "TRUE", "1"])("does not even read Worker for setting %s", (value) => {
        const storage = createStorage({
            SPECTOR_LOADED: "true",
            SPECTOR_CAPTUREOFFSCREEN: "true",
            ...(value === undefined ? {} : { [settingKey]: value }),
        });
        const world = createWorld(storage);
        const nativeWorker = world.Worker;
        const nativeGetContext = world.HTMLCanvasElement.prototype.getContext;
        const get = jest.fn(() => nativeWorker);
        const set = jest.fn();
        Object.defineProperty(world, "Worker", { configurable: true, get, set });

        loadScript(world, "contentScript.js");

        expect(get).not.toHaveBeenCalled();
        expect(set).not.toHaveBeenCalled();
        expect(world.Worker).toBe(nativeWorker);
        expect(world.XMLHttpRequest).not.toHaveBeenCalled();
        expect(world.URL.createObjectURL).not.toHaveBeenCalled();
        expect(world.__SPECTOR_Workers).toBeUndefined();
        // Main-thread capture hooks are still installed with Workers disabled.
        expect(world.HTMLCanvasElement.prototype.getContext).not.toBe(nativeGetContext);
    });

    it("installs interception only for the explicit true value", () => {
        const world = createWorld(createStorage({ [settingKey]: "true" }));
        const nativeWorker = world.Worker;

        loadScript(world, "contentScript.js");

        expect(world.Worker).not.toBe(nativeWorker);
        expect(world.Worker.prototype).toBe(nativeWorker.prototype);
        expect(world.__SPECTOR_Workers).toEqual([]);
    });

    it("passes module URLs and options through when the module injector is unavailable", () => {
        const world = createWorld(createStorage({ [settingKey]: "true" }));
        const nativeWorker = world.Worker;
        const scriptURL = { toString: jest.fn(() => { throw new Error("extra coercion"); }) };
        const options = { type: "module" };
        loadScript(world, "contentScript.js");

        new world.Worker(scriptURL, options);

        expect(nativeWorker).toHaveBeenCalledWith(scriptURL, options);
        expect(scriptURL.toString).not.toHaveBeenCalled();
        expect(world.XMLHttpRequest).not.toHaveBeenCalled();
        expect(world.__SPECTOR_Workers[0].injected).toBe(false);
    });

    it("uses the module injector after explicit opt-in", () => {
        const world = createWorld(createStorage({ [settingKey]: "true" }));
        const nativeWorker = world.Worker;
        const injectedWorker = {
            addEventListener: jest.fn(),
        };
        world.__SPECTOR_ModuleInjector = {
            injectModuleWorker: jest.fn(() => ({ worker: injectedWorker, injected: true })),
        };
        world.document.body.innerHTML =
            '<input id="TexturesId_SpectorWorkerBundleUrl" value="https://extension.test/spector.worker.bundle.js">';
        loadScript(world, "contentScript.js");

        const worker = new world.Worker("./worker.js", { type: "module" });

        expect(worker).toBe(injectedWorker);
        expect(nativeWorker).not.toHaveBeenCalled();
        expect(world.__SPECTOR_ModuleInjector.injectModuleWorker).toHaveBeenCalledWith(
            "./worker.js",
            { type: "module" },
            "https://extension.test/spector.worker.bundle.js",
            nativeWorker,
        );
        expect(world.__SPECTOR_Workers[0].injected).toBe(true);
    });

    it("starts the popup unchecked and treats older reports as off", () => {
        const popup = loadPopup();
        const checkbox = popup.document.getElementById("workerAutoInject");
        expect(checkbox.checked).toBe(false);
        expect(checkbox.closest("label").textContent).toContain("experimental");
        expect(popup.document.getElementById(checkbox.getAttribute("aria-describedby")).textContent)
            .toContain("may alter Worker behavior");
        checkbox.checked = true;

        popup.updateCanvasesListInformation({ canvases: [], captureOffScreen: true });

        expect(checkbox.checked).toBe(false);
    });

    it.each([true, false])("persists checkbox=%s before reload and restores it through the bridge", (enabled) => {
        const storage = createStorage({ SPECTOR_LOADED: "true", [settingKey]: String(!enabled) });
        const proxy = createWorld(storage);
        loadScript(proxy, "contentScriptProxy.js");
        const popup = loadPopup();
        refreshPopup(proxy, popup);
        const checkbox = popup.document.getElementById("workerAutoInject");
        expect(checkbox.checked).toBe(!enabled);

        checkbox.checked = enabled;
        checkbox.dispatchEvent(new Event("change"));
        const [tabId, message] = popup.browser.tabs.sendMessage.mock.calls.at(-1);
        expect(tabId).toBe(7);
        expect(message).toEqual({ action: "changeWorkerAutoInject", workerAutoInject: enabled });
        const receiveProxy = proxy.browser.runtime.onMessage.addListener.mock.calls[0][0];
        receiveProxy(message);

        expect(storage.getItem(settingKey)).toBe(String(enabled));
        expect(proxy.location.reload).not.toHaveBeenCalled();
        expect(proxy.setTimeout).toHaveBeenCalledWith(expect.any(Function), 50);
        proxy.setTimeout.mock.calls.at(-1)[0]();
        expect(proxy.location.reload).toHaveBeenCalledTimes(1);
        expect(proxy.browser.storage.local.get).not.toHaveBeenCalled();
        expect(proxy.browser.storage.local.set).not.toHaveBeenCalled();

        // Simulate a fresh MAIN world before the isolated script starts: the
        // saved setting is enough, even without a DOM/storage callback.
        const reloadedMain = createWorld(storage);
        const nativeWorker = reloadedMain.Worker;
        loadScript(reloadedMain, "contentScript.js");
        expect(reloadedMain.Worker === nativeWorker).toBe(!enabled);

        const reloadedProxy = createWorld(storage);
        loadScript(reloadedProxy, "contentScriptProxy.js");
        const reopenedPopup = loadPopup();
        const report = refreshPopup(reloadedProxy, reopenedPopup);
        expect(report.workerAutoInject).toBe(enabled);
        expect(reopenedPopup.document.getElementById("workerAutoInject").checked).toBe(enabled);
    });

    it("does not adopt an iframe's opt-in as the top-level default", () => {
        const background = createWorld();
        loadScript(background, "background.js");
        const receive = background.browser.runtime.onMessage.addListener.mock.calls[0][0];
        receive({ canvases: [], workerAutoInject: true },
            { id: "extension", frameId: 2, tab: { id: 7 } }, jest.fn());

        background.refreshCanvases();

        expect(background.browser.runtime.sendMessage.mock.calls.at(-1)[0].data.workerAutoInject).toBe(false);
    });

    it("clears capture history when the browser starts", () => {
        const background = createWorld();
        loadScript(background, "background.js");
        const onStartup = background.browser.runtime.onStartup.addListener.mock.calls[0][0];

        onStartup();

        expect(background.browser.storage.local.remove).toHaveBeenCalledWith(
            ["currentCapture", "captureHistory", "currentFrameInfo"],
            background.consumeLastError,
        );
    });
});

describe("Extension one-way messaging", () => {
    function installLastError(world: any) {
        const lastErrorRead = jest.fn();
        Object.defineProperty(world.browser.runtime, "lastError", {
            configurable: true,
            get: () => {
                lastErrorRead();
                return { message: "The message port closed before a response was received." };
            },
        });
        world.browser.tabs.sendMessage.mockImplementation(
            (_tabId: number, _message: unknown, callback?: () => void) => callback?.(),
        );
        return lastErrorRead;
    }

    it("consumes runtime errors when the background targets a closed extension page or tab", () => {
        const world = createWorld();
        const lastErrorRead = installLastError(world);
        loadScript(world, "background.js");

        world.sendRuntimeMessage({ popup: "closed" });
        world.sendMessage({ action: "no-listener" });

        expect(lastErrorRead).toHaveBeenCalledTimes(2);
    });

    it("does not invoke content callbacks after a runtime delivery error", () => {
        const world = createWorld();
        const lastErrorRead = installLastError(world);
        const callback = jest.fn();
        loadScript(world, "contentScriptProxy.js");

        world.sendMessage({ present: 1 }, callback);

        expect(lastErrorRead).toHaveBeenCalledTimes(1);
        expect(callback).not.toHaveBeenCalled();
    });

    it.each(["popup.js", "result.js"])("consumes tab delivery errors in %s", (file) => {
        const world = createWorld();
        const lastErrorRead = installLastError(world);
        loadScript(world, file);

        world.sendMessage({ action: "no-listener" }, 7);

        expect(lastErrorRead).toHaveBeenCalledTimes(1);
    });
});
