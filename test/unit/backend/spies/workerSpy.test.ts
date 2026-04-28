import { WorkerSpy } from "../../../../src/backend/spies/workerSpy";

describe("WorkerSpy", () => {
    // jsdom does not provide a real Worker, so we install a minimal stub
    // that lets startIntercepting run its replacement logic.
    let OriginalWorkerStub: any;

    beforeEach(() => {
        // Create a minimal Worker stub on globalThis so typeof Worker !== "undefined"
        OriginalWorkerStub = function MockWorker() { /* noop */ };
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

    describe("rewriteImportScripts", () => {
        // The method is private but accessible for unit testing via cast.
        const rewrite = (WorkerSpy as any).rewriteImportScripts.bind(WorkerSpy) as
            (source: string, baseUrl: string) => string;

        const baseUrl = "http://localhost:8081/scripts/index.worker.js";

        it("rewrites a root-relative URL to absolute", () => {
            const out = rewrite('importScripts("/scripts/foo.js");', baseUrl);
            expect(out).toBe('importScripts("http://localhost:8081/scripts/foo.js");');
        });

        it("rewrites a relative URL to absolute", () => {
            const out = rewrite('importScripts("./foo.js");', baseUrl);
            expect(out).toBe('importScripts("http://localhost:8081/scripts/foo.js");');
        });

        it("leaves an already-absolute URL untouched", () => {
            const out = rewrite('importScripts("https://cdn.example.com/lib.js");', baseUrl);
            expect(out).toBe('importScripts("https://cdn.example.com/lib.js");');
        });

        it("rewrites multiple comma-separated URLs", () => {
            const out = rewrite(
                'importScripts("/a.js", "./b.js", "https://x/c.js");',
                baseUrl,
            );
            expect(out).toBe(
                'importScripts("http://localhost:8081/a.js", "http://localhost:8081/scripts/b.js", "https://x/c.js");',
            );
        });

        it("supports single-quoted strings", () => {
            const out = rewrite("importScripts('/foo.js');", baseUrl);
            expect(out).toBe("importScripts('http://localhost:8081/foo.js');");
        });

        it("supports template literals without interpolation", () => {
            const out = rewrite("importScripts(`/foo.js`);", baseUrl);
            expect(out).toBe("importScripts(`http://localhost:8081/foo.js`);");
        });

        it("leaves template literals with interpolation untouched", () => {
            const src = "importScripts(`/scripts/${name}.js`);";
            expect(rewrite(src, baseUrl)).toBe(src);
        });

        it("leaves source without importScripts unchanged", () => {
            const src = 'self.addEventListener("message", () => {});';
            expect(rewrite(src, baseUrl)).toBe(src);
        });

        it("rewrites multiple importScripts calls", () => {
            const out = rewrite(
                'importScripts("/a.js");\nself.x = 1;\nimportScripts("./b.js");',
                baseUrl,
            );
            expect(out).toBe(
                'importScripts("http://localhost:8081/a.js");\nself.x = 1;\nimportScripts("http://localhost:8081/scripts/b.js");',
            );
        });
    });
});
