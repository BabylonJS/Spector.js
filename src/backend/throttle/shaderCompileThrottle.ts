import { WebGlConstants } from "../types/webglConstants";
import { Time } from "../../shared/utils/time";

type WebGLRenderingContexts = WebGLRenderingContext | WebGL2RenderingContext;

interface IPatchedContext {
    context: WebGLRenderingContexts;
    originalLinkProgram: (program: WebGLProgram | null) => void;
    originalGetProgramParameter: (program: WebGLProgram | null, pname: number) => any;
}

/**
 * Simulates slow asynchronous (parallel) shader compilation.
 *
 * The `KHR_parallel_shader_compile` extension lets applications poll
 * `getProgramParameter(program, COMPLETION_STATUS_KHR)` to learn whether a
 * program has finished linking, instead of blocking on `LINK_STATUS`.
 *
 * This throttle wraps `linkProgram` and `getProgramParameter` on each WebGL
 * context so that, for a configurable delay after `linkProgram` is called,
 * `COMPLETION_STATUS_KHR` reports `false` (still compiling). Once the delay has
 * elapsed, the real value is returned. This makes it possible to test loading
 * screens, fallback shaders, and hitch-handling without needing a genuinely
 * slow GPU driver — analogous to the CPU/network throttling in browser
 * developer tools.
 *
 * The wrapper is installed **once per context** and is permanent: when the
 * delay is `0` it is a transparent passthrough. This avoids corrupting the
 * function chain when other Spector spies wrap the same functions.
 *
 * Only `COMPLETION_STATUS_KHR` queries are affected — every other
 * `getProgramParameter` call (LINK_STATUS, ACTIVE_UNIFORMS, etc.) is delegated
 * untouched, so capture and analysis are unaffected.
 */
export class ShaderCompileThrottle {
    private static delayMs = 0;
    private static installedGlobally = false;
    private static readonly patchedContexts = new Map<WebGLRenderingContexts, IPatchedContext>();
    private static readonly linkTimes = new WeakMap<WebGLProgram, number>();

    /** The current artificial compile delay in milliseconds (0 = disabled). */
    public static getDelay(): number {
        return ShaderCompileThrottle.delayMs;
    }

    /**
     * Set the artificial compile delay in milliseconds.
     * A value of `0` (or less) disables throttling. Negative values are clamped
     * to `0`.
     */
    public static setDelay(ms: number): void {
        ShaderCompileThrottle.delayMs = (typeof ms === "number" && ms > 0) ? ms : 0;
    }

    /**
     * Pure decision helper: should a `COMPLETION_STATUS_KHR` query currently be
     * forced to report `false` (still compiling)?
     *
     * @param pname    - The `getProgramParameter` parameter name being queried.
     * @param linkTime - When the program was last linked (ms), or `undefined`
     *                   if it was never linked through the throttle.
     * @param now      - The current time in milliseconds.
     * @param delayMs  - The configured delay in milliseconds.
     */
    public static shouldForceIncomplete(
        pname: number,
        linkTime: number | undefined,
        now: number,
        delayMs: number,
    ): boolean {
        if (delayMs <= 0) {
            return false;
        }
        if (pname !== WebGlConstants.COMPLETION_STATUS_KHR.value) {
            return false;
        }
        if (linkTime === undefined) {
            return false;
        }
        return (now - linkTime) < delayMs;
    }

    /**
     * Install the throttle globally by patching the `WebGLRenderingContext` and
     * `WebGL2RenderingContext` prototypes (idempotent).
     *
     * Patching the prototypes — rather than individual context instances —
     * guarantees the throttle applies to every context, whether or not Spector
     * is explicitly spying it, and whether it was created before or after this
     * call. Because the wrapper is transparent while the delay is `0`, it is
     * safe to install eagerly.
     *
     * This must run before any context is spied so that Spector's command spies
     * capture the throttle wrapper as their origin function (otherwise the spy
     * would call the raw GL function and bypass the throttle).
     */
    public static install(): void {
        if (ShaderCompileThrottle.installedGlobally) {
            return;
        }

        let patchedAny = false;
        if (typeof WebGLRenderingContext !== "undefined" && WebGLRenderingContext.prototype) {
            ShaderCompileThrottle.register(WebGLRenderingContext.prototype as WebGLRenderingContexts);
            patchedAny = true;
        }
        if (typeof WebGL2RenderingContext !== "undefined" && WebGL2RenderingContext.prototype) {
            ShaderCompileThrottle.register(WebGL2RenderingContext.prototype as WebGLRenderingContexts);
            patchedAny = true;
        }

        ShaderCompileThrottle.installedGlobally = patchedAny;
    }

    /**
     * Install the throttle on a WebGL context (idempotent).
     *
     * The wrappers are permanent and become transparent passthroughs when the
     * delay is `0`, so registering a context that is also spied by Spector's
     * capture machinery does not corrupt the function chain.
     */
    public static register(context: WebGLRenderingContexts): void {
        if (!context || ShaderCompileThrottle.patchedContexts.has(context)) {
            return;
        }
        if (typeof context.linkProgram !== "function" || typeof context.getProgramParameter !== "function") {
            return;
        }

        const originalLinkProgram = context.linkProgram;
        const originalGetProgramParameter = context.getProgramParameter;

        // tslint:disable-next-line:only-arrow-functions
        context.linkProgram = function (program: WebGLProgram | null): void {
            if (program) {
                ShaderCompileThrottle.linkTimes.set(program, Time.now);
            }
            return originalLinkProgram.call(this, program);
        };

        // tslint:disable-next-line:only-arrow-functions
        context.getProgramParameter = function (program: WebGLProgram | null, pname: number): any {
            if (program && ShaderCompileThrottle.shouldForceIncomplete(
                pname,
                ShaderCompileThrottle.linkTimes.get(program),
                Time.now,
                ShaderCompileThrottle.delayMs,
            )) {
                return false;
            }
            return originalGetProgramParameter.call(this, program, pname);
        };

        ShaderCompileThrottle.patchedContexts.set(context, {
            context,
            originalLinkProgram,
            originalGetProgramParameter,
        });
    }

    /** Whether a context currently has the throttle wrappers installed. */
    public static isRegistered(context: WebGLRenderingContexts): boolean {
        return ShaderCompileThrottle.patchedContexts.has(context);
    }

    /**
     * Restore the original `linkProgram` / `getProgramParameter` on a context.
     *
     * Note: if another spy wrapped these functions after registration, the
     * restore is best-effort. Prefer leaving the (transparent) wrapper in place
     * and simply setting the delay to `0`.
     */
    public static unregister(context: WebGLRenderingContexts): void {
        const entry = ShaderCompileThrottle.patchedContexts.get(context);
        if (!entry) {
            return;
        }
        entry.context.linkProgram = entry.originalLinkProgram;
        entry.context.getProgramParameter = entry.originalGetProgramParameter;
        ShaderCompileThrottle.patchedContexts.delete(context);
    }

    /** Disable throttling and forget all link timestamps / patched contexts. */
    public static reset(): void {
        ShaderCompileThrottle.delayMs = 0;
        ShaderCompileThrottle.installedGlobally = false;
        ShaderCompileThrottle.patchedContexts.clear();
    }
}
