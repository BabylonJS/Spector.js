import { ShaderCompileThrottle } from "../../../../src/backend/throttle/shaderCompileThrottle";
import { WebGlConstants } from "../../../../src/backend/types/webglConstants";

const COMPLETION = WebGlConstants.COMPLETION_STATUS_KHR.value; // 37297
const LINK_STATUS = WebGlConstants.LINK_STATUS.value;          // 35714

/**
 * Builds a minimal fake WebGL context exposing only linkProgram and
 * getProgramParameter, recording the calls that reach the originals.
 */
function makeFakeContext(getResult: any = true) {
    const calls = {
        link: [] as any[],
        getParam: [] as Array<{ program: any; pname: number }>,
    };
    const ctx: any = {
        linkProgram(program: any) {
            calls.link.push(program);
        },
        getProgramParameter(program: any, pname: number) {
            calls.getParam.push({ program, pname });
            return getResult;
        },
    };
    return { ctx, calls };
}

describe("ShaderCompileThrottle", () => {
    afterEach(() => {
        ShaderCompileThrottle.reset();
    });

    describe("setDelay / getDelay", () => {
        it("defaults to 0", () => {
            expect(ShaderCompileThrottle.getDelay()).toBe(0);
        });

        it("stores a positive delay", () => {
            ShaderCompileThrottle.setDelay(500);
            expect(ShaderCompileThrottle.getDelay()).toBe(500);
        });

        it("clamps negative delay to 0", () => {
            ShaderCompileThrottle.setDelay(-100);
            expect(ShaderCompileThrottle.getDelay()).toBe(0);
        });

        it("treats non-number as 0", () => {
            ShaderCompileThrottle.setDelay(NaN);
            expect(ShaderCompileThrottle.getDelay()).toBe(0);
            ShaderCompileThrottle.setDelay(undefined as any);
            expect(ShaderCompileThrottle.getDelay()).toBe(0);
        });
    });

    describe("shouldForceIncomplete", () => {
        it("returns false when delay is 0", () => {
            expect(ShaderCompileThrottle.shouldForceIncomplete(COMPLETION, 100, 150, 0)).toBe(false);
        });

        it("returns false for non-COMPLETION_STATUS_KHR pnames", () => {
            expect(ShaderCompileThrottle.shouldForceIncomplete(LINK_STATUS, 100, 150, 1000)).toBe(false);
        });

        it("returns false when the program was never linked", () => {
            expect(ShaderCompileThrottle.shouldForceIncomplete(COMPLETION, undefined, 150, 1000)).toBe(false);
        });

        it("returns true while still within the delay window", () => {
            // linked at 100, now 600, delay 1000 -> elapsed 500 < 1000
            expect(ShaderCompileThrottle.shouldForceIncomplete(COMPLETION, 100, 600, 1000)).toBe(true);
        });

        it("returns false once the delay has elapsed", () => {
            // linked at 100, now 1200, delay 1000 -> elapsed 1100 >= 1000
            expect(ShaderCompileThrottle.shouldForceIncomplete(COMPLETION, 100, 1200, 1000)).toBe(false);
        });

        it("returns false exactly at the boundary (elapsed === delay)", () => {
            expect(ShaderCompileThrottle.shouldForceIncomplete(COMPLETION, 100, 1100, 1000)).toBe(false);
        });
    });

    describe("register", () => {
        it("marks the context as registered", () => {
            const { ctx } = makeFakeContext();
            expect(ShaderCompileThrottle.isRegistered(ctx)).toBe(false);
            ShaderCompileThrottle.register(ctx);
            expect(ShaderCompileThrottle.isRegistered(ctx)).toBe(true);
        });

        it("is idempotent (does not double-wrap)", () => {
            const { ctx } = makeFakeContext();
            ShaderCompileThrottle.register(ctx);
            const wrapped = ctx.getProgramParameter;
            ShaderCompileThrottle.register(ctx);
            expect(ctx.getProgramParameter).toBe(wrapped);
        });

        it("ignores a null context", () => {
            expect(() => ShaderCompileThrottle.register(null as any)).not.toThrow();
        });

        it("ignores a context lacking the required functions", () => {
            const bad: any = {};
            ShaderCompileThrottle.register(bad);
            expect(ShaderCompileThrottle.isRegistered(bad)).toBe(false);
        });

        it("delegates linkProgram to the original", () => {
            const { ctx, calls } = makeFakeContext();
            ShaderCompileThrottle.register(ctx);
            const program = {};
            ctx.linkProgram(program);
            expect(calls.link).toEqual([program]);
        });

        it("passes through getProgramParameter when delay is 0", () => {
            const { ctx, calls } = makeFakeContext(true);
            ShaderCompileThrottle.register(ctx);
            const program = {};
            ctx.linkProgram(program);
            const result = ctx.getProgramParameter(program, COMPLETION);
            expect(result).toBe(true);
            // The original was actually called.
            expect(calls.getParam).toEqual([{ program, pname: COMPLETION }]);
        });

        it("forces false for COMPLETION_STATUS_KHR while throttling", () => {
            const { ctx, calls } = makeFakeContext(true);
            ShaderCompileThrottle.register(ctx);
            ShaderCompileThrottle.setDelay(10000); // long window
            const program = {};
            ctx.linkProgram(program);
            const result = ctx.getProgramParameter(program, COMPLETION);
            expect(result).toBe(false);
            // The original getProgramParameter was NOT called for the forced path.
            expect(calls.getParam.length).toBe(0);
        });

        it("does not affect other pnames while throttling", () => {
            const { ctx, calls } = makeFakeContext(42);
            ShaderCompileThrottle.register(ctx);
            ShaderCompileThrottle.setDelay(10000);
            const program = {};
            ctx.linkProgram(program);
            const result = ctx.getProgramParameter(program, LINK_STATUS);
            expect(result).toBe(42);
            expect(calls.getParam).toEqual([{ program, pname: LINK_STATUS }]);
        });

        it("passes through for a program that was never linked", () => {
            const { ctx, calls } = makeFakeContext(true);
            ShaderCompileThrottle.register(ctx);
            ShaderCompileThrottle.setDelay(10000);
            const program = {}; // never linked
            const result = ctx.getProgramParameter(program, COMPLETION);
            expect(result).toBe(true);
            expect(calls.getParam).toEqual([{ program, pname: COMPLETION }]);
        });

        it("reports complete again after the delay elapses", async () => {
            const { ctx } = makeFakeContext(true);
            ShaderCompileThrottle.register(ctx);
            ShaderCompileThrottle.setDelay(30); // short window
            const program = {};
            ctx.linkProgram(program);
            // Immediately: still compiling.
            expect(ctx.getProgramParameter(program, COMPLETION)).toBe(false);
            // After the window: real value.
            await new Promise((r) => setTimeout(r, 60));
            expect(ctx.getProgramParameter(program, COMPLETION)).toBe(true);
        });
    });

    describe("unregister", () => {
        it("restores the original functions", () => {
            const { ctx } = makeFakeContext();
            const originalGet = ctx.getProgramParameter;
            const originalLink = ctx.linkProgram;
            ShaderCompileThrottle.register(ctx);
            expect(ctx.getProgramParameter).not.toBe(originalGet);
            ShaderCompileThrottle.unregister(ctx);
            expect(ctx.getProgramParameter).toBe(originalGet);
            expect(ctx.linkProgram).toBe(originalLink);
            expect(ShaderCompileThrottle.isRegistered(ctx)).toBe(false);
        });

        it("is a no-op for an unregistered context", () => {
            const { ctx } = makeFakeContext();
            expect(() => ShaderCompileThrottle.unregister(ctx)).not.toThrow();
        });
    });

    describe("reset", () => {
        it("clears delay and registrations", () => {
            const { ctx } = makeFakeContext();
            ShaderCompileThrottle.register(ctx);
            ShaderCompileThrottle.setDelay(1000);
            ShaderCompileThrottle.reset();
            expect(ShaderCompileThrottle.getDelay()).toBe(0);
            expect(ShaderCompileThrottle.isRegistered(ctx)).toBe(false);
        });
    });

    describe("install", () => {
        // jsdom typically does not define WebGLRenderingContext, so install()
        // becomes a no-op there. We install fakes to exercise the real path.
        const g = globalThis as any;
        let hadWebGL: boolean;
        let hadWebGL2: boolean;
        let prevWebGL: any;
        let prevWebGL2: any;

        beforeEach(() => {
            hadWebGL = "WebGLRenderingContext" in g;
            hadWebGL2 = "WebGL2RenderingContext" in g;
            prevWebGL = g.WebGLRenderingContext;
            prevWebGL2 = g.WebGL2RenderingContext;
        });

        afterEach(() => {
            if (hadWebGL) { g.WebGLRenderingContext = prevWebGL; } else { delete g.WebGLRenderingContext; }
            if (hadWebGL2) { g.WebGL2RenderingContext = prevWebGL2; } else { delete g.WebGL2RenderingContext; }
        });

        it("patches both WebGL prototypes when present", () => {
            function FakeGL1() { /* ctor */ }
            FakeGL1.prototype.linkProgram = function () { /* noop */ };
            FakeGL1.prototype.getProgramParameter = function () { return true; };
            function FakeGL2() { /* ctor */ }
            FakeGL2.prototype.linkProgram = function () { /* noop */ };
            FakeGL2.prototype.getProgramParameter = function () { return true; };
            g.WebGLRenderingContext = FakeGL1;
            g.WebGL2RenderingContext = FakeGL2;

            ShaderCompileThrottle.install();

            expect(ShaderCompileThrottle.isRegistered(FakeGL1.prototype)).toBe(true);
            expect(ShaderCompileThrottle.isRegistered(FakeGL2.prototype)).toBe(true);
        });

        it("throttles a program linked through a patched prototype instance", () => {
            const calls: number[] = [];
            function FakeGL2() { /* ctor */ }
            FakeGL2.prototype.linkProgram = function () { /* noop */ };
            FakeGL2.prototype.getProgramParameter = function (_p: any, pname: number) {
                calls.push(pname);
                return true;
            };
            g.WebGL2RenderingContext = FakeGL2;
            delete g.WebGLRenderingContext;

            ShaderCompileThrottle.install();
            ShaderCompileThrottle.setDelay(10000);

            const instance: any = new (FakeGL2 as any)();
            const program = {};
            instance.linkProgram(program);
            // COMPLETION_STATUS_KHR is forced false without hitting the original.
            expect(instance.getProgramParameter(program, COMPLETION)).toBe(false);
            expect(calls.length).toBe(0);
            // Other pnames pass through to the original.
            expect(instance.getProgramParameter(program, LINK_STATUS)).toBe(true);
            expect(calls).toEqual([LINK_STATUS]);
        });

        it("is idempotent", () => {
            function FakeGL2() { /* ctor */ }
            FakeGL2.prototype.linkProgram = function () { /* noop */ };
            FakeGL2.prototype.getProgramParameter = function () { return true; };
            g.WebGL2RenderingContext = FakeGL2;
            delete g.WebGLRenderingContext;

            ShaderCompileThrottle.install();
            const wrapped = FakeGL2.prototype.getProgramParameter;
            ShaderCompileThrottle.install();
            expect(FakeGL2.prototype.getProgramParameter).toBe(wrapped);
        });

        it("does not throw when no WebGL globals are present", () => {
            delete g.WebGLRenderingContext;
            delete g.WebGL2RenderingContext;
            expect(() => ShaderCompileThrottle.install()).not.toThrow();
        });
    });
});
