import { WorkerSpy } from "../../../../src/backend/spies/workerSpy";

describe("WorkerSpy", () => {
    // jsdom does not provide a real Worker, so we install a minimal stub
    // that lets startIntercepting run its replacement logic.
    let OriginalWorkerStub: any;

    beforeEach(() => {
        // Create a minimal Worker stub on globalThis so typeof Worker !== "undefined"
        OriginalWorkerStub = jest.fn(function MockWorker() { /* noop */ });
        OriginalWorkerStub.prototype = {};
        (globalThis as any).Worker = OriginalWorkerStub;

        // Ensure clean state — stop any lingering interception
        WorkerSpy.stopIntercepting();
    });

    afterEach(() => {
        WorkerSpy.stopIntercepting();
        // Restore stub so other tests are clean
        (globalThis as any).Worker = OriginalWorkerStub;
    });

    it("isIntercepting returns false initially", () => {
        expect(WorkerSpy.isIntercepting()).toBe(false);
    });

    it("startIntercepting sets intercepting state to true", () => {
        WorkerSpy.startIntercepting("spector.worker.bundle.js");
        expect(WorkerSpy.isIntercepting()).toBe(true);
    });

    it("startIntercepting replaces the global Worker constructor", () => {
        WorkerSpy.startIntercepting("spector.worker.bundle.js");
        // The global Worker should no longer be our original stub
        expect((globalThis as any).Worker).not.toBe(OriginalWorkerStub);
    });

    it("stopIntercepting restores the original Worker constructor", () => {
        WorkerSpy.startIntercepting("spector.worker.bundle.js");
        WorkerSpy.stopIntercepting();
        expect((globalThis as any).Worker).toBe(OriginalWorkerStub);
        expect(WorkerSpy.isIntercepting()).toBe(false);
    });

    it("double startIntercepting is a no-op", () => {
        WorkerSpy.startIntercepting("spector.worker.bundle.js");
        const replacedWorker = (globalThis as any).Worker;
        WorkerSpy.startIntercepting("spector.worker.bundle.js");
        // Should still be the same replacement — not double-wrapped
        expect((globalThis as any).Worker).toBe(replacedWorker);
    });

    it("stopIntercepting without startIntercepting is a no-op", () => {
        const before = (globalThis as any).Worker;
        WorkerSpy.stopIntercepting();
        expect((globalThis as any).Worker).toBe(before);
        expect(WorkerSpy.isIntercepting()).toBe(false);
    });

    it("does not overwrite a third-party wrapper on stop or reactivate retained proxies on restart", () => {
        WorkerSpy.startIntercepting("spector.worker.bundle.js");
        const retainedProxy = Worker;
        const thirdParty = new Proxy(Worker, {});
        (globalThis as any).Worker = thirdParty;
        WorkerSpy.stopIntercepting();
        expect(Worker).toBe(thirdParty);

        const count = WorkerSpy.getSpiedWorkers().length;
        new Worker("worker.js");
        expect(WorkerSpy.getSpiedWorkers()).toHaveLength(count);
        WorkerSpy.startIntercepting("spector.worker.bundle.js");
        new retainedProxy("worker.js");
        expect(WorkerSpy.getSpiedWorkers()).toHaveLength(count);
        new Worker("worker.js", { name: "native" });
        expect(WorkerSpy.getSpiedWorkers()).toHaveLength(count + 1);
        WorkerSpy.stopIntercepting();
        expect(Worker).toBe(thirdParty);
        WorkerSpy.getSpiedWorkers().splice(count);
    });

    it("does not claim to intercept when installing the proxy fails", () => {
        const descriptor = Object.getOwnPropertyDescriptor(globalThis, "Worker")!;
        Object.defineProperty(globalThis, "Worker", { ...descriptor, writable: false });
        try {
            expect(() => WorkerSpy.startIntercepting("spector.worker.bundle.js")).toThrow(TypeError);
            expect(WorkerSpy.isIntercepting()).toBe(false);
        } finally {
            Object.defineProperty(globalThis, "Worker", descriptor);
        }
    });

    it("deactivates a proxy even if a third party makes the Worker property read-only", () => {
        WorkerSpy.startIntercepting("spector.worker.bundle.js");
        const descriptor = Object.getOwnPropertyDescriptor(globalThis, "Worker")!;
        Object.defineProperty(globalThis, "Worker", { ...descriptor, writable: false });
        try {
            expect(() => WorkerSpy.stopIntercepting()).not.toThrow();
            expect(WorkerSpy.isIntercepting()).toBe(false);
            const count = WorkerSpy.getSpiedWorkers().length;
            new Worker("worker.js");
            expect(WorkerSpy.getSpiedWorkers()).toHaveLength(count);
        } finally {
            Object.defineProperty(globalThis, "Worker", descriptor);
        }
    });

    it("getSpiedWorkers returns empty array initially", () => {
        expect(WorkerSpy.getSpiedWorkers()).toEqual([]);
    });

    it("preserves prototype of original Worker on replacement", () => {
        WorkerSpy.startIntercepting("spector.worker.bundle.js");
        expect((globalThis as any).Worker.prototype).toBe(OriginalWorkerStub.prototype);
    });

    it("startIntercepting does nothing if Worker is undefined", () => {
        delete (globalThis as any).Worker;
        // Should not throw
        WorkerSpy.startIntercepting("spector.worker.bundle.js");
        expect(WorkerSpy.isIntercepting()).toBe(false);
    });

    describe("shouldInjectSource (best-effort bypass)", () => {
        const shouldInjectSource = (WorkerSpy as any).shouldInjectSource.bind(WorkerSpy) as
            (source: string) => boolean;

        it("allows simple classic Worker scripts", () => {
            expect(shouldInjectSource('self.onmessage = function() { postMessage("ok"); };')).toBe(true);
        });

        it("rejects dynamic imports", () => {
            expect(shouldInjectSource('import("./dep.js").then(function(dep) { postMessage(dep); });')).toBe(false);
            expect(shouldInjectSource('import /* webpackIgnore: true */ ("./dep.js");')).toBe(false);
        });

        it("rejects nested Worker construction", () => {
            expect(shouldInjectSource('new Worker("./child.js", { type: "module" });')).toBe(false);
            expect(shouldInjectSource('new self.SharedWorker("./child.js");')).toBe(false);
        });

        it.each([
            'import // comment\n("./dep.js")',
            'import /* first */ /* second */ ("./dep.js")',
            'const Child = Worker; new Child("./child.js")',
            'new /* comment */ self.Worker("./child.js")',
            'importScripts("./dependency.js")',
            'fetch(new Request("./data"))',
            'new XMLHttpRequest().open("GET", "./data")',
            'new WebSocket("/socket")',
            'new EventSource("/events")',
            'new URL("./child.js", self.location.href)',
            'postMessage({ isolated: crossOriginIsolated, buffer: typeof SharedArrayBuffer })',
            'WebAssembly.compile(bytes)',
            '"use strict"; self.onmessage = function() {}',
            '#!/usr/bin/env node\nself.onmessage = function() {}',
            '\uFEFF#!/usr/bin/env node\nself.onmessage = function() {}',
        ])("bypasses sources whose URL or script semantics cannot be preserved: %s", (source) => {
            expect(shouldInjectSource(source)).toBe(false);
        });
    });

    it("passes module Workers to the native constructor unchanged", () => {
        const scriptUrl = new URL("https://example.com/worker.js");
        const options: WorkerOptions = { type: "module", name: "module-worker" };

        WorkerSpy.startIntercepting("spector.worker.bundle.js");
        new (globalThis as any).Worker(scriptUrl, options);

        expect(OriginalWorkerStub).toHaveBeenCalledWith(scriptUrl, options);
    });
});
