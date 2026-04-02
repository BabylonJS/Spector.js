/**
 * Bridge between the MCP server and Spector.js running inside the browser.
 *
 * Every function here drives a Playwright {@link Page} — injecting the
 * Spector.js bundle, triggering captures, and reading back results via
 * `page.evaluate()`.
 *
 * **Important:** The callbacks passed to `page.evaluate()` run in the
 * browser's JS context. They **cannot** import Node modules, reference
 * outer-scope variables (except via the serialised second argument), or
 * call into `capture-analyzer.ts`. Any data-transformation logic that needs
 * to run in the browser must be duplicated inline inside the callback.
 */

import { readFileSync, existsSync } from "fs";
import { createRequire } from "module";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { Page } from "playwright";
import { CAPTURE_TIMEOUT_MS } from "./constants.js";
import { CaptureError } from "./errors.js";
import type {
    CaptureSummary,
    DrawCallInfo,
    ShaderInfo,
    TextureInfo,
    WebGLStateDiff,
} from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

let spectorBundleContent: string | null = null;

/**
 * Resolve and cache the Spector.js bundle source.
 *
 * Prefers the local repo `dist/` (when running inside the Spector.js repo),
 * falling back to the npm-installed `spectorjs` package.
 */
function getSpectorBundle(): string {
    if (!spectorBundleContent) {
        // Try local repo dist first (when running inside the Spector.js repo)
        const localBundle = resolve(__dirname, "..", "..", "dist", "spector.bundle.js");
        let bundlePath: string;
        if (existsSync(localBundle)) {
            bundlePath = localBundle;
        } else {
            try {
                bundlePath = require.resolve("spectorjs/dist/spector.bundle.js");
            } catch {
                throw new Error(
                    `Spector.js bundle not found. Either build the repo first ` +
                    `(npm run build from the repo root) or install the spectorjs ` +
                    `npm package. Looked at: ${localBundle}`,
                );
            }
        }
        spectorBundleContent = readFileSync(bundlePath, "utf-8");
    }
    return spectorBundleContent;
}

/**
 * Inject the Spector.js bundle into the page (idempotent).
 */
export async function injectSpector(page: Page): Promise<void> {
    const alreadyInjected = await page.evaluate(
        () => !!(window as any).__spectorInjected,
    );
    if (alreadyInjected) return;

    const bundle = getSpectorBundle();
    await page.addScriptTag({ content: bundle });

    await page.evaluate(() => {
        const w = window as any;
        w.__spectorInstance = new w.SPECTOR.Spector();
        w.__lastCapture = null;
        w.__spectorInjected = true;
    });
}

/**
 * Capture a single WebGL frame and return a summary.
 *
 * @param page - The Playwright page to capture from.
 * @param canvasIndex - Zero-based index of the target canvas.
 * @param quickCapture - When `true`, skips thumbnail generation.
 * @throws {CaptureError} when Spector fails or times out.
 */
export async function captureFrame(
    page: Page,
    canvasIndex: number,
    quickCapture = false,
): Promise<CaptureSummary> {
    await injectSpector(page);

    const summary = await page.evaluate(
        ({ quick, canvasIdx, timeoutMs }: { quick: boolean; canvasIdx: number; timeoutMs: number }) => {
            return new Promise<any>((resolve, reject) => {
                const w = window as any;
                const spector = w.__spectorInstance;
                if (!spector) {
                    reject(new Error("Spector not initialized"));
                    return;
                }

                const canvases = document.querySelectorAll("canvas");
                const canvas = canvases[canvasIdx];
                if (!canvas) {
                    reject(
                        new Error(
                            `No canvas at index ${canvasIdx}. Found ${canvases.length} canvas(es) on the page.`,
                        ),
                    );
                    return;
                }

                const timeout = setTimeout(() => {
                    reject(new Error(`Frame capture timed out after ${timeoutMs / 1000} seconds`));
                }, timeoutMs);

                spector.onCapture.clear();
                spector.onCapture.add((capture: any) => {
                    clearTimeout(timeout);
                    w.__lastCapture = capture;

                    // ── Inline analysis (browser context — cannot import) ──
                    const commands: any[] = capture.commands || [];
                    const drawCallNames = [
                        "drawArrays", "drawElements",
                        "drawArraysInstanced", "drawElementsInstanced",
                        "drawRangeElements", "multiDrawArrays", "multiDrawElements",
                    ];
                    const drawCalls = commands.filter(
                        (c: any) => c.name && drawCallNames.includes(c.name),
                    );
                    const clearCalls = commands.filter(
                        (c: any) => c.name === "clear",
                    );

                    const programSet = new Set<string>();
                    for (const cmd of commands) {
                        const tag =
                            cmd.DrawCall?.programStatus?.program?.__SPECTOR_Object_TAG?.id;
                        if (tag !== undefined && tag !== null) {
                            programSet.add(String(tag));
                        }
                    }

                    const errors: string[] = [];
                    for (const cmd of commands) {
                        if (cmd.name === "getError" && cmd.result && cmd.result !== 0) {
                            errors.push(`GL Error ${cmd.result} at command ${cmd.id}`);
                        }
                    }

                    resolve({
                        totalCommands: commands.length,
                        drawCalls: drawCalls.length,
                        clearCalls: clearCalls.length,
                        programs: programSet.size,
                        contextVersion: capture.context?.version || 0,
                        canvasWidth: capture.canvas?.width || 0,
                        canvasHeight: capture.canvas?.height || 0,
                        durationMs: Math.round(
                            ((capture.endTime || 0) - (capture.startTime || 0)) * 1000,
                        ),
                        errors,
                    });
                });

                spector.captureNextFrame(canvas, quick);
            });
        },
        { quick: quickCapture, canvasIdx: canvasIndex, timeoutMs: CAPTURE_TIMEOUT_MS },
    );

    return summary as CaptureSummary;
}

/**
 * List draw-call and clear commands from the last captured frame.
 */
export async function getDrawCalls(page: Page): Promise<DrawCallInfo[]> {
    return await page.evaluate(() => {
        const capture = (window as any).__lastCapture;
        if (!capture) return [];

        const drawCallNames = [
            "drawArrays", "drawElements",
            "drawArraysInstanced", "drawElementsInstanced",
            "drawRangeElements", "clear",
        ];

        return (capture.commands || [])
            .filter((c: any) => c.name && drawCallNames.includes(c.name))
            .map((c: any) => ({
                commandId: c.id,
                name: c.name,
                args: JSON.stringify(c.commandArguments || {}),
                marker: c.marker || "",
                status: String(c.status ?? "unknown"),
            }));
    });
}

/**
 * Get detailed state and metadata for a specific command by ID.
 */
export async function getCommandDetails(
    page: Page,
    commandId: number,
): Promise<Record<string, unknown> | null> {
    return await page.evaluate((cmdId: number) => {
        const capture = (window as any).__lastCapture;
        if (!capture) return null;

        const cmd = (capture.commands || []).find((c: any) => c.id === cmdId);
        if (!cmd) return null;

        const result: Record<string, any> = {
            id: cmd.id,
            name: cmd.name,
            commandArguments: cmd.commandArguments,
            result: cmd.result,
            status: cmd.status,
            marker: cmd.marker || "",
            text: cmd.text || "",
            stackTrace: cmd.stackTrace || [],
        };

        const stateGroups = [
            "BlendState", "ColorState", "CoverageState", "CullState",
            "DepthState", "DrawState", "PolygonOffsetState", "ScissorState",
            "StencilState",
        ];
        for (const key of stateGroups) {
            if (cmd[key]) result[key] = cmd[key];
        }

        if (cmd.DrawCall) {
            const dc = cmd.DrawCall;
            result.DrawCall = {
                frameBuffer: dc.frameBuffer,
                linkStatus: dc.programStatus?.LINK_STATUS,
                validateStatus: dc.programStatus?.VALIDATE_STATUS,
                recompilable: dc.programStatus?.RECOMPILABLE,
            };

            if (dc.shaders && Array.isArray(dc.shaders)) {
                result.DrawCall.shaders = dc.shaders.map((s: any) => ({
                    shaderType: s.shaderType,
                    name: s.name,
                    compileStatus: s.COMPILE_STATUS,
                    sourceLength: (s.source || "").length,
                    sourcePreview: (s.source || "").substring(0, 200),
                }));
            }
            if (dc.uniforms) result.DrawCall.uniforms = dc.uniforms;
            if (dc.attributes) result.DrawCall.attributes = dc.attributes;
            if (dc.uniformBlocks) result.DrawCall.uniformBlocks = dc.uniformBlocks;
        }

        if (cmd.VisualState?.Attachments) {
            result.VisualState = {
                Attachments: cmd.VisualState.Attachments.map((a: any) => ({
                    attachmentName: a.attachmentName || "unknown",
                    textureWidth: a.textureWidth,
                    textureHeight: a.textureHeight,
                })),
            };
        }

        return result;
    }, commandId);
}

/**
 * Extract shader programs from the last captured frame.
 *
 * @param programIndex - If supplied, only return the program at this index.
 */
export async function getShaders(
    page: Page,
    programIndex?: number,
): Promise<ShaderInfo[]> {
    return await page.evaluate((progIdx: number | undefined) => {
        const capture = (window as any).__lastCapture;
        if (!capture) return [];

        const commands: any[] = capture.commands || [];
        const programs = new Map<
            string,
            {
                vertexSource: string;
                fragmentSource: string;
                vertexCompileStatus: boolean;
                fragmentCompileStatus: boolean;
                linkStatus: boolean;
            }
        >();

        for (const cmd of commands) {
            if (!cmd.name || !cmd.DrawCall) continue;
            const dc = cmd.DrawCall;
            const progId = String(
                dc.programStatus?.program?.__SPECTOR_Object_TAG?.id ?? "unknown",
            );
            if (programs.has(progId)) continue;

            const shaders: any[] = dc.shaders || [];
            let vs = "", fs = "";
            let vsCompile = true, fsCompile = true;

            for (const shader of shaders) {
                const src = shader.source || shader.SHADER_SOURCE || "";
                const type = shader.shaderType || shader.SHADER_TYPE || "";
                if (type === "VERTEX_SHADER" || type === 35633) {
                    vs = src;
                    vsCompile = shader.COMPILE_STATUS !== false;
                } else if (type === "FRAGMENT_SHADER" || type === 35632) {
                    fs = src;
                    fsCompile = shader.COMPILE_STATUS !== false;
                }
            }

            programs.set(progId, {
                vertexSource: vs,
                fragmentSource: fs,
                vertexCompileStatus: vsCompile,
                fragmentCompileStatus: fsCompile,
                linkStatus: dc.programStatus?.LINK_STATUS !== false,
            });
        }

        const result: any[] = [];
        let idx = 0;
        for (const [, prog] of programs) {
            if (progIdx === undefined || idx === progIdx) {
                result.push({ programIndex: idx, ...prog });
            }
            idx++;
        }
        return result;
    }, programIndex);
}

/**
 * Extract texture uploads from the last captured frame.
 */
export async function getTextures(page: Page): Promise<TextureInfo[]> {
    return await page.evaluate(() => {
        const capture = (window as any).__lastCapture;
        if (!capture) return [];

        const commands: any[] = capture.commands || [];
        const textures: any[] = [];

        // Inline format maps — cannot import from constants.ts in browser ctx
        const glFormatNames: Record<number, string> = {
            6406: "ALPHA", 6407: "RGB", 6408: "RGBA",
            6409: "LUMINANCE", 6410: "LUMINANCE_ALPHA",
            33189: "DEPTH_COMPONENT16", 33190: "DEPTH_COMPONENT24",
            35056: "DEPTH24_STENCIL8", 36012: "DEPTH_COMPONENT32F",
            36013: "DEPTH32F_STENCIL8", 32854: "RGB8", 32855: "RGB565",
            32856: "RGBA4", 32857: "RGB5_A1", 32858: "RGBA8",
            33321: "R8", 33325: "R16F", 33326: "R32F",
            33327: "RG8", 33328: "RG16F", 33329: "RG32F",
            34842: "RGBA16F", 34836: "RGBA32F", 35898: "RGB16F", 34843: "RGB32F",
        };
        const glTypeNames: Record<number, string> = {
            5121: "UNSIGNED_BYTE", 5123: "UNSIGNED_SHORT",
            5125: "UNSIGNED_INT", 5126: "FLOAT",
            5131: "HALF_FLOAT", 36193: "HALF_FLOAT_OES",
        };

        for (const cmd of commands) {
            if (cmd.name === "texImage2D" && cmd.commandArguments) {
                const args = cmd.commandArguments;
                textures.push({
                    commandId: cmd.id,
                    name: cmd.name,
                    width: args[3] || 0,
                    height: args[4] || 0,
                    internalFormat: glFormatNames[args[2]] || String(args[2]),
                    format: glFormatNames[args[6]] || String(args[6]),
                    type: glTypeNames[args[7]] || String(args[7]),
                });
            } else if (cmd.name === "compressedTexImage2D" && cmd.commandArguments) {
                const args = cmd.commandArguments;
                textures.push({
                    commandId: cmd.id,
                    name: cmd.name,
                    width: args[3] || 0,
                    height: args[4] || 0,
                    internalFormat: String(args[2]),
                    format: "compressed",
                    type: "compressed",
                });
            }
        }

        return textures;
    });
}

/**
 * Compute the diff between initial and final WebGL state for the last capture.
 */
export async function getWebGLState(page: Page): Promise<{
    initial: Record<string, unknown>;
    final: Record<string, unknown>;
    diff: WebGLStateDiff[];
}> {
    return await page.evaluate(() => {
        const capture = (window as any).__lastCapture;
        if (!capture) return { initial: {}, final: {}, diff: [] };

        const init = capture.initState || {};
        const end = capture.endState || {};

        const allKeys = new Set([
            ...Object.keys(init),
            ...Object.keys(end),
        ]);
        const diff: any[] = [];
        for (const key of allKeys) {
            const a = init[key];
            const b = end[key];
            if (JSON.stringify(a) !== JSON.stringify(b)) {
                diff.push({ property: key, initial: a, final: b });
            }
        }

        return { initial: init, final: end, diff };
    });
}

/**
 * Retrieve WebGL context information from the last capture or live canvas.
 *
 * @param canvasIndex - The canvas to query when no capture data exists.
 */
export async function getContextInfo(
    page: Page,
    canvasIndex: number,
): Promise<Record<string, unknown>> {
    return await page.evaluate((canvasIdx: number) => {
        const capture = (window as any).__lastCapture;
        if (capture?.context) {
            return {
                version: capture.context.version,
                capabilities: capture.context.capabilities,
                extensions: capture.context.extensions,
                compressedTextures: capture.context.compressedTextures,
                contextAttributes: capture.context.contextAttributes,
            };
        }

        // Fall back to querying the canvas directly
        const canvases = document.querySelectorAll("canvas");
        const canvas = canvases[canvasIdx] as HTMLCanvasElement | undefined;
        if (!canvas) return { error: "No canvas found" };

        const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
        if (!gl) return { error: "No WebGL context found" };

        return {
            version: gl instanceof WebGL2RenderingContext ? 2 : 1,
            renderer: gl.getParameter(gl.RENDERER),
            vendor: gl.getParameter(gl.VENDOR),
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
            extensions: gl.getSupportedExtensions(),
        };
    }, canvasIndex);
}
