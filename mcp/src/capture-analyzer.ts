/**
 * Pure data-transformation functions for analysing Spector.js capture data.
 *
 * Every function here is side-effect-free: it takes raw capture structures as
 * input and returns typed results. This makes the logic easy to unit-test
 * without a browser.
 *
 * **Important:** These functions run on the Node side. The `page.evaluate()`
 * callbacks in `spector-bridge.ts` duplicate some of this logic because they
 * execute in the browser context and cannot import Node modules.
 */

import {
    DRAW_CALL_NAMES,
    DRAW_AND_CLEAR_NAMES,
    STATE_GROUP_NAMES,
    GL_FORMAT_NAMES,
    GL_TYPE_NAMES,
} from "./constants.js";

import type {
    RawCommand,
    RawCapture,
    CaptureSummary,
    DrawCallInfo,
    ShaderInfo,
    TextureInfo,
    WebGLStateDiff,
} from "./types.js";

// ── Capture summary helpers ──────────────────────────────────────

/**
 * Count unique shader programs referenced by commands in a capture.
 *
 * Programs are identified by the `__SPECTOR_Object_TAG.id` attached to each
 * command's `DrawCall.programStatus.program`.
 */
export function countPrograms(commands: RawCommand[]): number {
    const seen = new Set<string>();
    for (let i = 0; i < commands.length; i++) {
        const tag = commands[i].DrawCall?.programStatus?.program?.__SPECTOR_Object_TAG?.id;
        if (tag !== undefined && tag !== null) {
            seen.add(String(tag));
        }
    }
    return seen.size;
}

/**
 * Extract GL error strings from a command list.
 *
 * Errors are identified by `getError` commands whose `result` is non-zero.
 */
export function extractErrors(commands: RawCommand[]): string[] {
    const errors: string[] = [];
    for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        if (cmd.name === "getError" && cmd.result && cmd.result !== 0) {
            errors.push(`GL Error ${cmd.result} at command ${cmd.id}`);
        }
    }
    return errors;
}

/**
 * Build a {@link CaptureSummary} from a raw Spector capture object.
 */
export function buildCaptureSummary(capture: RawCapture): CaptureSummary {
    const commands = capture.commands ?? [];
    let drawCalls = 0;
    let clearCalls = 0;
    for (let i = 0; i < commands.length; i++) {
        const name = commands[i].name;
        if (!name) continue;
        if ((DRAW_CALL_NAMES as readonly string[]).includes(name)) drawCalls++;
        if (name === "clear") clearCalls++;
    }

    return {
        totalCommands: commands.length,
        drawCalls,
        clearCalls,
        programs: countPrograms(commands),
        contextVersion: capture.context?.version ?? 0,
        canvasWidth: capture.canvas?.width ?? 0,
        canvasHeight: capture.canvas?.height ?? 0,
        durationMs: Math.round(
            ((capture.endTime ?? 0) - (capture.startTime ?? 0)) * 1000,
        ),
        errors: extractErrors(commands),
    };
}

// ── Draw call extraction ─────────────────────────────────────────

/**
 * Extract draw-call and clear commands from a raw command list.
 */
export function extractDrawCalls(commands: RawCommand[]): DrawCallInfo[] {
    const result: DrawCallInfo[] = [];
    for (let i = 0; i < commands.length; i++) {
        const c = commands[i];
        if (c.name && (DRAW_AND_CLEAR_NAMES as readonly string[]).includes(c.name)) {
            result.push({
                commandId: c.id,
                name: c.name,
                args: JSON.stringify(c.commandArguments ?? {}),
                marker: c.marker ?? "",
                status: String(c.status ?? "unknown"),
            });
        }
    }
    return result;
}

// ── Shader extraction ────────────────────────────────────────────

/**
 * Extract shader program info from commands that carry `DrawCall` metadata.
 *
 * Optionally filter to a single program by zero-based index.
 */
export function extractShaders(
    commands: RawCommand[],
    programIndex?: number,
): ShaderInfo[] {
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

    for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        if (!cmd.name || !cmd.DrawCall) continue;

        const dc = cmd.DrawCall;
        const progId = String(
            dc.programStatus?.program?.__SPECTOR_Object_TAG?.id ?? "unknown",
        );
        if (programs.has(progId)) continue;

        const shaders = dc.shaders ?? [];
        let vs = "";
        let fs = "";
        let vsCompile = true;
        let fsCompile = true;

        for (const shader of shaders) {
            const src = shader.source ?? shader.SHADER_SOURCE ?? "";
            const type = shader.shaderType ?? shader.SHADER_TYPE ?? "";
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

    const result: ShaderInfo[] = [];
    let idx = 0;
    for (const [, prog] of programs) {
        if (programIndex === undefined || idx === programIndex) {
            result.push({ programIndex: idx, ...prog });
        }
        idx++;
    }
    return result;
}

// ── Texture extraction ───────────────────────────────────────────

/**
 * Extract texture upload commands from the command list.
 */
export function extractTextures(commands: RawCommand[]): TextureInfo[] {
    const textures: TextureInfo[] = [];
    for (let i = 0; i < commands.length; i++) {
        const cmd = commands[i];
        const args = cmd.commandArguments as number[] | undefined;
        if (cmd.name === "texImage2D" && args) {
            textures.push({
                commandId: cmd.id,
                name: cmd.name,
                width: args[3] || 0,
                height: args[4] || 0,
                internalFormat: GL_FORMAT_NAMES[args[2]] || String(args[2]),
                format: GL_FORMAT_NAMES[args[6]] || String(args[6]),
                type: GL_TYPE_NAMES[args[7]] || String(args[7]),
            });
        } else if (cmd.name === "compressedTexImage2D" && args) {
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
}

// ── State diff ───────────────────────────────────────────────────

/**
 * Compute the diff between the initial and final WebGL state snapshots.
 */
export function computeStateDiff(
    initState: Record<string, unknown>,
    endState: Record<string, unknown>,
): { initial: Record<string, unknown>; final: Record<string, unknown>; diff: WebGLStateDiff[] } {
    const allKeys = new Set([
        ...Object.keys(initState),
        ...Object.keys(endState),
    ]);
    const diff: WebGLStateDiff[] = [];
    for (const key of allKeys) {
        const a = initState[key];
        const b = endState[key];
        if (JSON.stringify(a) !== JSON.stringify(b)) {
            diff.push({ property: key, initial: a, final: b });
        }
    }
    return { initial: initState, final: endState, diff };
}

// ── Context info ─────────────────────────────────────────────────

/**
 * Extract context information from a raw capture object.
 *
 * Returns a plain record suitable for JSON serialisation.
 */
export function extractContextInfo(capture: RawCapture): Record<string, unknown> {
    if (!capture.context) return {};
    return {
        version: capture.context.version,
        capabilities: capture.context.capabilities,
        extensions: capture.context.extensions,
        compressedTextures: capture.context.compressedTextures,
        contextAttributes: capture.context.contextAttributes,
    };
}

// ── Command details ──────────────────────────────────────────────

/**
 * Extract detailed information for a single command by ID.
 *
 * Returns `null` when the command is not found.
 */
export function extractCommandDetails(
    commands: RawCommand[],
    commandId: number,
): Record<string, unknown> | null {
    const cmd = commands.find((c) => c.id === commandId);
    if (!cmd) return null;

    const result: Record<string, unknown> = {
        id: cmd.id,
        name: cmd.name,
        commandArguments: cmd.commandArguments,
        result: cmd.result,
        status: cmd.status,
        marker: cmd.marker ?? "",
        text: cmd.text ?? "",
        stackTrace: cmd.stackTrace ?? [],
    };

    // Copy GL state groups
    for (const key of STATE_GROUP_NAMES) {
        if (cmd[key]) result[key] = cmd[key];
    }

    // DrawCall metadata
    if (cmd.DrawCall) {
        const dc = cmd.DrawCall;
        const drawCallResult: Record<string, unknown> = {
            frameBuffer: dc.frameBuffer,
            linkStatus: dc.programStatus?.LINK_STATUS,
            validateStatus: dc.programStatus?.VALIDATE_STATUS,
            recompilable: dc.programStatus?.RECOMPILABLE,
        };

        if (dc.shaders && Array.isArray(dc.shaders)) {
            drawCallResult.shaders = dc.shaders.map((s) => ({
                shaderType: s.shaderType,
                name: s.name,
                compileStatus: s.COMPILE_STATUS,
                sourceLength: (s.source ?? "").length,
                sourcePreview: (s.source ?? "").substring(0, 200),
            }));
        }
        if (dc.uniforms) drawCallResult.uniforms = dc.uniforms;
        if (dc.attributes) drawCallResult.attributes = dc.attributes;
        if (dc.uniformBlocks) drawCallResult.uniformBlocks = dc.uniformBlocks;
        result.DrawCall = drawCallResult;
    }

    // VisualState — attachment names without base64 data
    if (cmd.VisualState?.Attachments) {
        result.VisualState = {
            Attachments: cmd.VisualState.Attachments.map((a) => ({
                attachmentName: a.attachmentName ?? "unknown",
                textureWidth: a.textureWidth,
                textureHeight: a.textureHeight,
            })),
        };
    }

    return result;
}
