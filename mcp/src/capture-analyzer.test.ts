/**
 * Comprehensive tests for every exported function in capture-analyzer.ts.
 *
 * These are pure functions that take raw Spector.js capture data and return
 * typed analysis results.  No browser, no side effects, no excuses for
 * missing edge cases.
 */

import type { RawCommand, RawCapture, RawShader, DrawCallInfo, WebGLStateDiff } from "./types.js";
import {
    countPrograms,
    extractErrors,
    buildCaptureSummary,
    extractDrawCalls,
    extractShaders,
    extractTextures,
    computeStateDiff,
    extractContextInfo,
    extractCommandDetails,
} from "./capture-analyzer.js";

// ═══════════════════════════════════════════════════════════════════
//  Test fixture helpers
// ═══════════════════════════════════════════════════════════════════

/** Create a minimal RawCommand with sensible defaults. */
function makeCmd(overrides: Partial<RawCommand> & { id: number; name: string }): RawCommand {
    return { ...overrides } as RawCommand;
}

/** Create a command that references a shader program by ID. */
function makeProgramCmd(
    id: number,
    programId: number,
    opts?: {
        linkStatus?: boolean;
        shaders?: RawShader[];
    },
): RawCommand {
    return makeCmd({
        id,
        name: "drawArrays",
        DrawCall: {
            programStatus: {
                program: { __SPECTOR_Object_TAG: { id: programId } },
                LINK_STATUS: opts?.linkStatus ?? true,
            },
            shaders: opts?.shaders ?? [],
        },
    });
}

/** Create a minimal RawCapture with sensible defaults. */
function makeCapture(overrides: Partial<RawCapture> = {}): RawCapture {
    return {
        commands: [],
        context: { version: 2 },
        canvas: { width: 800, height: 600 },
        startTime: 0,
        endTime: 0,
        ...overrides,
    };
}

// ═══════════════════════════════════════════════════════════════════
//  countPrograms()
// ═══════════════════════════════════════════════════════════════════

describe("countPrograms", () => {
    it("returns 0 for an empty command list", () => {
        expect(countPrograms([])).toBe(0);
    });

    it("returns 0 when no commands have DrawCall metadata", () => {
        const cmds = [
            makeCmd({ id: 0, name: "bindBuffer" }),
            makeCmd({ id: 1, name: "bufferData" }),
        ];
        expect(countPrograms(cmds)).toBe(0);
    });

    it("returns 0 when DrawCall exists but program tag is missing", () => {
        const cmds = [
            makeCmd({
                id: 0,
                name: "drawArrays",
                DrawCall: { programStatus: { program: {} } },
            }),
        ];
        expect(countPrograms(cmds)).toBe(0);
    });

    it("returns 0 when __SPECTOR_Object_TAG exists but id is undefined", () => {
        const cmds = [
            makeCmd({
                id: 0,
                name: "drawArrays",
                DrawCall: {
                    programStatus: {
                        program: { __SPECTOR_Object_TAG: {} },
                    },
                },
            }),
        ];
        expect(countPrograms(cmds)).toBe(0);
    });

    it("returns 0 when __SPECTOR_Object_TAG.id is null", () => {
        const cmds = [
            makeCmd({
                id: 0,
                name: "drawArrays",
                DrawCall: {
                    programStatus: {
                        program: {
                            __SPECTOR_Object_TAG: { id: null as unknown as number },
                        },
                    },
                },
            }),
        ];
        expect(countPrograms(cmds)).toBe(0);
    });

    it("counts a single program", () => {
        expect(countPrograms([makeProgramCmd(0, 42)])).toBe(1);
    });

    it("deduplicates commands referencing the same program ID", () => {
        const cmds = [
            makeProgramCmd(0, 42),
            makeProgramCmd(1, 42),
            makeProgramCmd(2, 42),
        ];
        expect(countPrograms(cmds)).toBe(1);
    });

    it("counts multiple unique programs", () => {
        const cmds = [
            makeProgramCmd(0, 1),
            makeProgramCmd(1, 2),
            makeProgramCmd(2, 3),
        ];
        expect(countPrograms(cmds)).toBe(3);
    });

    it("handles a mix of commands with and without program tags", () => {
        const cmds = [
            makeCmd({ id: 0, name: "bindBuffer" }),
            makeProgramCmd(1, 10),
            makeCmd({ id: 2, name: "getError" }),
            makeProgramCmd(3, 20),
            makeProgramCmd(4, 10), // duplicate
        ];
        expect(countPrograms(cmds)).toBe(2);
    });

    it("coerces numeric program ID to string for deduplication", () => {
        // The code does String(tag) — make sure numeric 0 is handled
        const cmds = [makeProgramCmd(0, 0), makeProgramCmd(1, 0)];
        expect(countPrograms(cmds)).toBe(1);
    });
});

// ═══════════════════════════════════════════════════════════════════
//  extractErrors()
// ═══════════════════════════════════════════════════════════════════

describe("extractErrors", () => {
    it("returns empty array when there are no commands", () => {
        expect(extractErrors([])).toEqual([]);
    });

    it("returns empty array when no getError commands exist", () => {
        const cmds = [
            makeCmd({ id: 0, name: "drawArrays" }),
            makeCmd({ id: 1, name: "bindBuffer" }),
        ];
        expect(extractErrors(cmds)).toEqual([]);
    });

    it("ignores getError with result === 0 (no error)", () => {
        const cmds = [makeCmd({ id: 0, name: "getError", result: 0 })];
        expect(extractErrors(cmds)).toEqual([]);
    });

    it("ignores getError with result === undefined", () => {
        const cmds = [makeCmd({ id: 0, name: "getError" })];
        expect(extractErrors(cmds)).toEqual([]);
    });

    it("ignores getError with result === null", () => {
        const cmds = [makeCmd({ id: 0, name: "getError", result: null })];
        expect(extractErrors(cmds)).toEqual([]);
    });

    it("captures getError with non-zero numeric result", () => {
        const cmds = [makeCmd({ id: 5, name: "getError", result: 1280 })];
        const errors = extractErrors(cmds);
        expect(errors).toHaveLength(1);
        expect(errors[0]).toBe("GL Error 1280 at command 5");
    });

    it("captures multiple errors from different commands", () => {
        const cmds = [
            makeCmd({ id: 0, name: "getError", result: 0 }),     // no error
            makeCmd({ id: 1, name: "getError", result: 1280 }),   // INVALID_ENUM
            makeCmd({ id: 2, name: "drawArrays" }),                // not getError
            makeCmd({ id: 3, name: "getError", result: 1281 }),   // INVALID_VALUE
        ];
        const errors = extractErrors(cmds);
        expect(errors).toHaveLength(2);
        expect(errors[0]).toContain("1280");
        expect(errors[0]).toContain("command 1");
        expect(errors[1]).toContain("1281");
        expect(errors[1]).toContain("command 3");
    });
});

// ═══════════════════════════════════════════════════════════════════
//  buildCaptureSummary()
// ═══════════════════════════════════════════════════════════════════

describe("buildCaptureSummary", () => {
    it("returns all zeros for a completely empty capture", () => {
        const summary = buildCaptureSummary({});
        expect(summary.totalCommands).toBe(0);
        expect(summary.drawCalls).toBe(0);
        expect(summary.clearCalls).toBe(0);
        expect(summary.programs).toBe(0);
        expect(summary.contextVersion).toBe(0);
        expect(summary.canvasWidth).toBe(0);
        expect(summary.canvasHeight).toBe(0);
        expect(summary.durationMs).toBe(0);
        expect(summary.errors).toEqual([]);
    });

    it("counts drawCalls correctly (excludes clear)", () => {
        const summary = buildCaptureSummary(makeCapture({
            commands: [
                makeCmd({ id: 0, name: "drawArrays" }),
                makeCmd({ id: 1, name: "drawElements" }),
                makeCmd({ id: 2, name: "clear" }),
                makeCmd({ id: 3, name: "bindBuffer" }),
            ],
        }));
        expect(summary.drawCalls).toBe(2);
        expect(summary.clearCalls).toBe(1);
        expect(summary.totalCommands).toBe(4);
    });

    it("counts instanced draw calls", () => {
        const summary = buildCaptureSummary(makeCapture({
            commands: [
                makeCmd({ id: 0, name: "drawArraysInstanced" }),
                makeCmd({ id: 1, name: "drawElementsInstanced" }),
            ],
        }));
        expect(summary.drawCalls).toBe(2);
    });

    it("counts drawRangeElements as a draw call", () => {
        const summary = buildCaptureSummary(makeCapture({
            commands: [makeCmd({ id: 0, name: "drawRangeElements" })],
        }));
        expect(summary.drawCalls).toBe(1);
    });

    it("skips commands with no name", () => {
        const summary = buildCaptureSummary(makeCapture({
            commands: [
                { id: 0, name: "" },      // empty name — falsy in JS
                { id: 1, name: "clear" } as RawCommand,
            ],
        }));
        // empty string is falsy, so `if (!name) continue;` skips it
        expect(summary.drawCalls).toBe(0);
        expect(summary.clearCalls).toBe(1);
    });

    it("calculates durationMs as (endTime - startTime) * 1000 rounded", () => {
        const summary = buildCaptureSummary(makeCapture({
            startTime: 1.5,
            endTime: 2.75,
        }));
        expect(summary.durationMs).toBe(Math.round((2.75 - 1.5) * 1000));
        expect(summary.durationMs).toBe(1250);
    });

    it("handles negative duration (endTime < startTime)", () => {
        const summary = buildCaptureSummary(makeCapture({
            startTime: 5.0,
            endTime: 3.0,
        }));
        expect(summary.durationMs).toBe(-2000);
    });

    it("extracts contextVersion from capture.context", () => {
        const summary = buildCaptureSummary(makeCapture({
            context: { version: 2 },
        }));
        expect(summary.contextVersion).toBe(2);
    });

    it("extracts canvas dimensions", () => {
        const summary = buildCaptureSummary(makeCapture({
            canvas: { width: 1920, height: 1080 },
        }));
        expect(summary.canvasWidth).toBe(1920);
        expect(summary.canvasHeight).toBe(1080);
    });

    it("includes GL errors in the summary", () => {
        const summary = buildCaptureSummary(makeCapture({
            commands: [
                makeCmd({ id: 0, name: "getError", result: 1282 }),
            ],
        }));
        expect(summary.errors).toHaveLength(1);
        expect(summary.errors[0]).toContain("1282");
    });

    it("counts programs from DrawCall metadata", () => {
        const summary = buildCaptureSummary(makeCapture({
            commands: [
                makeProgramCmd(0, 10),
                makeProgramCmd(1, 20),
                makeProgramCmd(2, 10), // dup
            ],
        }));
        expect(summary.programs).toBe(2);
    });
});

// ═══════════════════════════════════════════════════════════════════
//  extractDrawCalls()
// ═══════════════════════════════════════════════════════════════════

describe("extractDrawCalls", () => {
    it("returns empty array for empty command list", () => {
        expect(extractDrawCalls([])).toEqual([]);
    });

    it("filters only draw and clear commands from a mixed list", () => {
        const cmds = [
            makeCmd({ id: 0, name: "bindBuffer" }),
            makeCmd({ id: 1, name: "drawArrays", commandArguments: [4, 0, 36] }),
            makeCmd({ id: 2, name: "getError", result: 0 }),
            makeCmd({ id: 3, name: "clear", commandArguments: [16384] }),
            makeCmd({ id: 4, name: "drawElements", commandArguments: [4, 6, 5123, 0] }),
        ];
        const draws = extractDrawCalls(cmds);
        expect(draws).toHaveLength(3);
        expect(draws.map((d: DrawCallInfo) => d.name)).toEqual([
            "drawArrays",
            "clear",
            "drawElements",
        ]);
    });

    it("maps commandId correctly", () => {
        const draws = extractDrawCalls([
            makeCmd({ id: 42, name: "drawArrays" }),
        ]);
        expect(draws[0].commandId).toBe(42);
    });

    it("stringifies commandArguments to args", () => {
        const draws = extractDrawCalls([
            makeCmd({ id: 0, name: "drawArrays", commandArguments: [4, 0, 100] }),
        ]);
        expect(draws[0].args).toBe("[4,0,100]");
    });

    it("uses '{}' when commandArguments is undefined", () => {
        const draws = extractDrawCalls([
            makeCmd({ id: 0, name: "drawArrays" }),
        ]);
        expect(draws[0].args).toBe("{}");
    });

    it("extracts marker field, defaulting to empty string", () => {
        const draws = extractDrawCalls([
            makeCmd({ id: 0, name: "drawArrays", marker: "MyGroup" }),
            makeCmd({ id: 1, name: "clear" }),
        ]);
        expect(draws[0].marker).toBe("MyGroup");
        expect(draws[1].marker).toBe("");
    });

    it("extracts status as string, defaulting to 'unknown'", () => {
        const draws = extractDrawCalls([
            makeCmd({ id: 0, name: "drawArrays", status: 2 }),
            makeCmd({ id: 1, name: "clear" }),
        ]);
        expect(draws[0].status).toBe("2");
        expect(draws[1].status).toBe("unknown");
    });

    it("includes instanced draw calls", () => {
        const draws = extractDrawCalls([
            makeCmd({ id: 0, name: "drawArraysInstanced" }),
            makeCmd({ id: 1, name: "drawElementsInstanced" }),
            makeCmd({ id: 2, name: "drawRangeElements" }),
        ]);
        expect(draws).toHaveLength(3);
    });

    it("skips commands with empty name", () => {
        const cmds = [
            { id: 0, name: "" } as RawCommand,
            makeCmd({ id: 1, name: "drawArrays" }),
        ];
        const draws = extractDrawCalls(cmds);
        // empty name is falsy, so `c.name &&` short-circuits
        expect(draws).toHaveLength(1);
        expect(draws[0].commandId).toBe(1);
    });
});

// ═══════════════════════════════════════════════════════════════════
//  extractShaders()
// ═══════════════════════════════════════════════════════════════════

describe("extractShaders", () => {
    it("returns empty array when no commands have DrawCall", () => {
        const cmds = [
            makeCmd({ id: 0, name: "bindBuffer" }),
        ];
        expect(extractShaders(cmds)).toEqual([]);
    });

    it("returns empty array for empty commands", () => {
        expect(extractShaders([])).toEqual([]);
    });

    it("extracts vertex and fragment shaders using string shaderType", () => {
        const cmds = [
            makeProgramCmd(0, 1, {
                shaders: [
                    { shaderType: "VERTEX_SHADER", source: "void main() { gl_Position = vec4(0); }" },
                    { shaderType: "FRAGMENT_SHADER", source: "void main() { fragColor = vec4(1); }" },
                ],
            }),
        ];
        const shaders = extractShaders(cmds);
        expect(shaders).toHaveLength(1);
        expect(shaders[0].programIndex).toBe(0);
        expect(shaders[0].vertexSource).toContain("gl_Position");
        expect(shaders[0].fragmentSource).toContain("fragColor");
    });

    it("extracts shaders using numeric shaderType (35633 / 35632)", () => {
        const cmds = [
            makeProgramCmd(0, 1, {
                shaders: [
                    { shaderType: 35633, source: "vertex code" },
                    { shaderType: 35632, source: "fragment code" },
                ],
            }),
        ];
        const shaders = extractShaders(cmds);
        expect(shaders).toHaveLength(1);
        expect(shaders[0].vertexSource).toBe("vertex code");
        expect(shaders[0].fragmentSource).toBe("fragment code");
    });

    it("uses SHADER_SOURCE and SHADER_TYPE as fallback fields", () => {
        const cmds = [
            makeProgramCmd(0, 1, {
                shaders: [
                    { SHADER_TYPE: "VERTEX_SHADER", SHADER_SOURCE: "vs fallback" },
                    { SHADER_TYPE: "FRAGMENT_SHADER", SHADER_SOURCE: "fs fallback" },
                ],
            }),
        ];
        const shaders = extractShaders(cmds);
        expect(shaders[0].vertexSource).toBe("vs fallback");
        expect(shaders[0].fragmentSource).toBe("fs fallback");
    });

    it("deduplicates programs by __SPECTOR_Object_TAG.id", () => {
        const cmds = [
            makeProgramCmd(0, 42, {
                shaders: [
                    { shaderType: "VERTEX_SHADER", source: "vs1" },
                    { shaderType: "FRAGMENT_SHADER", source: "fs1" },
                ],
            }),
            makeProgramCmd(1, 42, {
                shaders: [
                    { shaderType: "VERTEX_SHADER", source: "vs2" },
                    { shaderType: "FRAGMENT_SHADER", source: "fs2" },
                ],
            }),
        ];
        const shaders = extractShaders(cmds);
        expect(shaders).toHaveLength(1);
        // Should keep the FIRST occurrence
        expect(shaders[0].vertexSource).toBe("vs1");
    });

    it("returns multiple programs when IDs differ", () => {
        const cmds = [
            makeProgramCmd(0, 1, {
                shaders: [
                    { shaderType: "VERTEX_SHADER", source: "vs-A" },
                    { shaderType: "FRAGMENT_SHADER", source: "fs-A" },
                ],
            }),
            makeProgramCmd(1, 2, {
                shaders: [
                    { shaderType: "VERTEX_SHADER", source: "vs-B" },
                    { shaderType: "FRAGMENT_SHADER", source: "fs-B" },
                ],
            }),
        ];
        const shaders = extractShaders(cmds);
        expect(shaders).toHaveLength(2);
        expect(shaders[0].programIndex).toBe(0);
        expect(shaders[1].programIndex).toBe(1);
    });

    it("filters by programIndex when provided", () => {
        const cmds = [
            makeProgramCmd(0, 1, {
                shaders: [
                    { shaderType: "VERTEX_SHADER", source: "vs-A" },
                ],
            }),
            makeProgramCmd(1, 2, {
                shaders: [
                    { shaderType: "VERTEX_SHADER", source: "vs-B" },
                ],
            }),
            makeProgramCmd(2, 3, {
                shaders: [
                    { shaderType: "VERTEX_SHADER", source: "vs-C" },
                ],
            }),
        ];
        const shaders = extractShaders(cmds, 1);
        expect(shaders).toHaveLength(1);
        expect(shaders[0].programIndex).toBe(1);
        expect(shaders[0].vertexSource).toBe("vs-B");
    });

    it("returns empty array when programIndex is out of range", () => {
        const cmds = [makeProgramCmd(0, 1, { shaders: [] })];
        expect(extractShaders(cmds, 999)).toEqual([]);
    });

    it("reports compile status correctly", () => {
        const cmds = [
            makeProgramCmd(0, 1, {
                shaders: [
                    { shaderType: "VERTEX_SHADER", source: "vs", COMPILE_STATUS: false },
                    { shaderType: "FRAGMENT_SHADER", source: "fs", COMPILE_STATUS: true },
                ],
            }),
        ];
        const shaders = extractShaders(cmds);
        expect(shaders[0].vertexCompileStatus).toBe(false);
        expect(shaders[0].fragmentCompileStatus).toBe(true);
    });

    it("defaults compile status to true when COMPILE_STATUS is undefined", () => {
        const cmds = [
            makeProgramCmd(0, 1, {
                shaders: [
                    { shaderType: "VERTEX_SHADER", source: "vs" },
                    { shaderType: "FRAGMENT_SHADER", source: "fs" },
                ],
            }),
        ];
        const shaders = extractShaders(cmds);
        // The code: `shader.COMPILE_STATUS !== false` → undefined !== false → true
        expect(shaders[0].vertexCompileStatus).toBe(true);
        expect(shaders[0].fragmentCompileStatus).toBe(true);
    });

    it("reports link status from programStatus", () => {
        const cmds = [
            makeProgramCmd(0, 1, {
                linkStatus: false,
                shaders: [],
            }),
        ];
        const shaders = extractShaders(cmds);
        expect(shaders[0].linkStatus).toBe(false);
    });

    it("defaults link status to true when LINK_STATUS is undefined", () => {
        const cmds = [
            makeCmd({
                id: 0,
                name: "drawArrays",
                DrawCall: {
                    programStatus: {
                        program: { __SPECTOR_Object_TAG: { id: 1 } },
                    },
                    shaders: [],
                },
            }),
        ];
        const shaders = extractShaders(cmds);
        expect(shaders[0].linkStatus).toBe(true);
    });

    it("handles empty shaders array gracefully", () => {
        const cmds = [makeProgramCmd(0, 1, { shaders: [] })];
        const shaders = extractShaders(cmds);
        expect(shaders).toHaveLength(1);
        expect(shaders[0].vertexSource).toBe("");
        expect(shaders[0].fragmentSource).toBe("");
    });

    it("handles missing source field gracefully", () => {
        const cmds = [
            makeProgramCmd(0, 1, {
                shaders: [
                    { shaderType: "VERTEX_SHADER" },    // no source or SHADER_SOURCE
                ],
            }),
        ];
        const shaders = extractShaders(cmds);
        expect(shaders[0].vertexSource).toBe("");
    });

    it("skips commands with empty name", () => {
        const cmds = [
            {
                id: 0,
                name: "",
                DrawCall: {
                    programStatus: {
                        program: { __SPECTOR_Object_TAG: { id: 1 } },
                    },
                    shaders: [{ shaderType: "VERTEX_SHADER", source: "vs" }],
                },
            } as unknown as RawCommand,
        ];
        const shaders = extractShaders(cmds);
        // Empty name is falsy → `if (!cmd.name || !cmd.DrawCall) continue;`
        expect(shaders).toEqual([]);
    });
});

// ═══════════════════════════════════════════════════════════════════
//  extractTextures()
// ═══════════════════════════════════════════════════════════════════

describe("extractTextures", () => {
    it("returns empty array for empty commands", () => {
        expect(extractTextures([])).toEqual([]);
    });

    it("returns empty array when no texture commands exist", () => {
        const cmds = [
            makeCmd({ id: 0, name: "drawArrays" }),
            makeCmd({ id: 1, name: "bindTexture" }),
        ];
        expect(extractTextures(cmds)).toEqual([]);
    });

    it("extracts texImage2D with known format/type enums", () => {
        // texImage2D args: [target, level, internalformat, width, height, border, format, type, ...]
        const cmds = [
            makeCmd({
                id: 5,
                name: "texImage2D",
                commandArguments: [3553, 0, 6408, 256, 512, 0, 6408, 5121],
            }),
        ];
        const textures = extractTextures(cmds);
        expect(textures).toHaveLength(1);
        expect(textures[0].commandId).toBe(5);
        expect(textures[0].name).toBe("texImage2D");
        expect(textures[0].width).toBe(256);
        expect(textures[0].height).toBe(512);
        expect(textures[0].internalFormat).toBe("RGBA");      // 6408
        expect(textures[0].format).toBe("RGBA");               // 6408
        expect(textures[0].type).toBe("UNSIGNED_BYTE");         // 5121
    });

    it("falls back to stringified number for unknown format", () => {
        const cmds = [
            makeCmd({
                id: 0,
                name: "texImage2D",
                commandArguments: [3553, 0, 99999, 64, 64, 0, 88888, 77777],
            }),
        ];
        const textures = extractTextures(cmds);
        expect(textures[0].internalFormat).toBe("99999");
        expect(textures[0].format).toBe("88888");
        expect(textures[0].type).toBe("77777");
    });

    it("extracts compressedTexImage2D with 'compressed' format/type", () => {
        // compressedTexImage2D args: [target, level, internalformat, width, height, ...]
        const cmds = [
            makeCmd({
                id: 3,
                name: "compressedTexImage2D",
                commandArguments: [3553, 0, 37808, 128, 256, 0, 32768],
            }),
        ];
        const textures = extractTextures(cmds);
        expect(textures).toHaveLength(1);
        expect(textures[0].commandId).toBe(3);
        expect(textures[0].name).toBe("compressedTexImage2D");
        expect(textures[0].width).toBe(128);
        expect(textures[0].height).toBe(256);
        expect(textures[0].internalFormat).toBe("37808");
        expect(textures[0].format).toBe("compressed");
        expect(textures[0].type).toBe("compressed");
    });

    it("handles texImage2D with no commandArguments → skips it", () => {
        const cmds = [makeCmd({ id: 0, name: "texImage2D" })];
        expect(extractTextures(cmds)).toEqual([]);
    });

    it("handles compressedTexImage2D with no commandArguments → skips it", () => {
        const cmds = [makeCmd({ id: 0, name: "compressedTexImage2D" })];
        expect(extractTextures(cmds)).toEqual([]);
    });

    it("extracts multiple textures from a mixed command list", () => {
        const cmds = [
            makeCmd({ id: 0, name: "bindTexture" }),
            makeCmd({
                id: 1,
                name: "texImage2D",
                commandArguments: [3553, 0, 6407, 100, 200, 0, 6407, 5126],
            }),
            makeCmd({ id: 2, name: "drawArrays" }),
            makeCmd({
                id: 3,
                name: "compressedTexImage2D",
                commandArguments: [3553, 0, 37808, 50, 50, 0, 1024],
            }),
        ];
        const textures = extractTextures(cmds);
        expect(textures).toHaveLength(2);
        expect(textures[0].name).toBe("texImage2D");
        expect(textures[0].format).toBe("RGB"); // 6407
        expect(textures[0].type).toBe("FLOAT"); // 5126
        expect(textures[1].name).toBe("compressedTexImage2D");
    });

    it("uses 0 for width/height when args value is falsy", () => {
        const cmds = [
            makeCmd({
                id: 0,
                name: "texImage2D",
                commandArguments: [3553, 0, 6408, 0, 0, 0, 6408, 5121],
            }),
        ];
        const textures = extractTextures(cmds);
        expect(textures[0].width).toBe(0);
        expect(textures[0].height).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════════
//  computeStateDiff()
// ═══════════════════════════════════════════════════════════════════

describe("computeStateDiff", () => {
    it("returns empty diff when both states are empty", () => {
        const result = computeStateDiff({}, {});
        expect(result.diff).toEqual([]);
        expect(result.initial).toEqual({});
        expect(result.final).toEqual({});
    });

    it("returns empty diff when states are identical", () => {
        const state = { depthTest: true, blendEnabled: false };
        const result = computeStateDiff(state, { ...state });
        expect(result.diff).toEqual([]);
    });

    it("detects added property (present in final, absent in initial)", () => {
        const result = computeStateDiff({}, { newProp: 42 });
        expect(result.diff).toHaveLength(1);
        expect(result.diff[0]).toEqual({
            property: "newProp",
            initial: undefined,
            final: 42,
        });
    });

    it("detects removed property (present in initial, absent in final)", () => {
        const result = computeStateDiff({ oldProp: "hello" }, {});
        expect(result.diff).toHaveLength(1);
        expect(result.diff[0]).toEqual({
            property: "oldProp",
            initial: "hello",
            final: undefined,
        });
    });

    it("detects changed property", () => {
        const result = computeStateDiff(
            { depthTest: true },
            { depthTest: false },
        );
        expect(result.diff).toHaveLength(1);
        expect(result.diff[0]).toEqual({
            property: "depthTest",
            initial: true,
            final: false,
        });
    });

    it("handles multiple diffs simultaneously", () => {
        const result = computeStateDiff(
            { a: 1, b: 2, c: 3 },
            { a: 1, b: 99, d: 4 },
        );
        // a: same → no diff
        // b: changed 2→99
        // c: removed
        // d: added
        expect(result.diff).toHaveLength(3);
        const props = result.diff.map((d: WebGLStateDiff) => d.property).sort();
        expect(props).toEqual(["b", "c", "d"]);
    });

    it("uses JSON.stringify for deep comparison of objects", () => {
        const result = computeStateDiff(
            { viewport: { x: 0, y: 0, w: 800, h: 600 } },
            { viewport: { x: 0, y: 0, w: 800, h: 600 } },
        );
        // Same structure → no diff
        expect(result.diff).toEqual([]);
    });

    it("detects deep object changes", () => {
        const result = computeStateDiff(
            { viewport: { x: 0, y: 0, w: 800, h: 600 } },
            { viewport: { x: 0, y: 0, w: 1024, h: 768 } },
        );
        expect(result.diff).toHaveLength(1);
        expect(result.diff[0].property).toBe("viewport");
    });

    it("returns the original objects as initial and final", () => {
        const init = { a: 1 };
        const end = { a: 2 };
        const result = computeStateDiff(init, end);
        expect(result.initial).toBe(init);
        expect(result.final).toBe(end);
    });

    it("handles arrays in state values", () => {
        const result = computeStateDiff(
            { colorMask: [true, true, true, true] },
            { colorMask: [true, true, true, false] },
        );
        expect(result.diff).toHaveLength(1);
        expect(result.diff[0].property).toBe("colorMask");
    });

    it("treats identical arrays as no diff", () => {
        const result = computeStateDiff(
            { colorMask: [true, true, true, true] },
            { colorMask: [true, true, true, true] },
        );
        expect(result.diff).toEqual([]);
    });
});

// ═══════════════════════════════════════════════════════════════════
//  extractContextInfo()
// ═══════════════════════════════════════════════════════════════════

describe("extractContextInfo", () => {
    it("returns empty object when capture has no context", () => {
        expect(extractContextInfo({})).toEqual({});
    });

    it("returns empty object when context is undefined", () => {
        expect(extractContextInfo({ context: undefined })).toEqual({});
    });

    it("extracts all context fields", () => {
        const capture = makeCapture({
            context: {
                version: 2,
                capabilities: { maxTextureSize: 16384 },
                extensions: ["EXT_color_buffer_float"],
                compressedTextures: { ASTC: true },
                contextAttributes: { alpha: true, antialias: false },
            },
        });
        const info = extractContextInfo(capture);
        expect(info.version).toBe(2);
        expect(info.capabilities).toEqual({ maxTextureSize: 16384 });
        expect(info.extensions).toEqual(["EXT_color_buffer_float"]);
        expect(info.compressedTextures).toEqual({ ASTC: true });
        expect(info.contextAttributes).toEqual({ alpha: true, antialias: false });
    });

    it("includes undefined fields when context sub-properties are absent", () => {
        const info = extractContextInfo(makeCapture({
            context: { version: 1 },
        }));
        expect(info.version).toBe(1);
        expect(info.capabilities).toBeUndefined();
        expect(info.extensions).toBeUndefined();
    });
});

// ═══════════════════════════════════════════════════════════════════
//  extractCommandDetails()
// ═══════════════════════════════════════════════════════════════════

describe("extractCommandDetails", () => {
    it("returns null when command is not found", () => {
        expect(extractCommandDetails([], 0)).toBeNull();
    });

    it("returns null when no command has the given ID", () => {
        const cmds = [makeCmd({ id: 1, name: "drawArrays" })];
        expect(extractCommandDetails(cmds, 999)).toBeNull();
    });

    it("extracts basic fields from a simple command", () => {
        const cmds = [
            makeCmd({
                id: 5,
                name: "drawArrays",
                commandArguments: [4, 0, 36],
                result: null,
                status: 2,
                marker: "MyMarker",
                text: "drawArrays(TRIANGLES, 0, 36)",
                stackTrace: ["at render (scene.js:42)"],
            }),
        ];
        const detail = extractCommandDetails(cmds, 5);
        expect(detail).not.toBeNull();
        expect(detail!.id).toBe(5);
        expect(detail!.name).toBe("drawArrays");
        expect(detail!.commandArguments).toEqual([4, 0, 36]);
        expect(detail!.result).toBeNull();
        expect(detail!.status).toBe(2);
        expect(detail!.marker).toBe("MyMarker");
        expect(detail!.text).toBe("drawArrays(TRIANGLES, 0, 36)");
        expect(detail!.stackTrace).toEqual(["at render (scene.js:42)"]);
    });

    it("defaults marker, text, and stackTrace when not present", () => {
        const cmds = [makeCmd({ id: 0, name: "bindBuffer" })];
        const detail = extractCommandDetails(cmds, 0);
        expect(detail!.marker).toBe("");
        expect(detail!.text).toBe("");
        expect(detail!.stackTrace).toEqual([]);
    });

    it("copies GL state groups when present", () => {
        const cmds = [
            {
                id: 0,
                name: "drawArrays",
                BlendState: { enabled: true, srcRGB: 1 },
                DepthState: { enabled: true, func: 513 },
            } as unknown as RawCommand,
        ];
        const detail = extractCommandDetails(cmds, 0);
        expect(detail!.BlendState).toEqual({ enabled: true, srcRGB: 1 });
        expect(detail!.DepthState).toEqual({ enabled: true, func: 513 });
    });

    it("does NOT include state groups that are absent", () => {
        const cmds = [makeCmd({ id: 0, name: "drawArrays" })];
        const detail = extractCommandDetails(cmds, 0);
        expect(detail!.BlendState).toBeUndefined();
        expect(detail!.DepthState).toBeUndefined();
        expect(detail!.CullState).toBeUndefined();
    });

    it("extracts DrawCall metadata with shaders, uniforms, attributes", () => {
        const cmds = [
            makeCmd({
                id: 0,
                name: "drawArrays",
                DrawCall: {
                    frameBuffer: { id: 1 },
                    programStatus: {
                        program: { __SPECTOR_Object_TAG: { id: 1 } },
                        LINK_STATUS: true,
                        VALIDATE_STATUS: true,
                        RECOMPILABLE: false,
                    },
                    shaders: [
                        {
                            shaderType: "VERTEX_SHADER",
                            name: "my-vs",
                            COMPILE_STATUS: true,
                            source: "precision highp float;\nvoid main() { gl_Position = vec4(0.0); }",
                        },
                        {
                            shaderType: "FRAGMENT_SHADER",
                            name: "my-fs",
                            COMPILE_STATUS: false,
                            source: "bad shader code here",
                        },
                    ],
                    uniforms: [{ name: "u_mvp", type: "mat4" }],
                    attributes: [{ name: "a_position", type: "vec3" }],
                },
            }),
        ];
        const detail = extractCommandDetails(cmds, 0);
        expect(detail!.DrawCall).toBeDefined();
        const dc = detail!.DrawCall as Record<string, unknown>;
        expect(dc.frameBuffer).toEqual({ id: 1 });
        expect(dc.linkStatus).toBe(true);
        expect(dc.validateStatus).toBe(true);
        expect(dc.recompilable).toBe(false);
        expect(dc.uniforms).toEqual([{ name: "u_mvp", type: "mat4" }]);
        expect(dc.attributes).toEqual([{ name: "a_position", type: "vec3" }]);

        // Shaders should have sourceLength and sourcePreview, NOT full source
        const shaders = dc.shaders as Array<Record<string, unknown>>;
        expect(shaders).toHaveLength(2);
        expect(shaders[0].shaderType).toBe("VERTEX_SHADER");
        expect(shaders[0].name).toBe("my-vs");
        expect(shaders[0].compileStatus).toBe(true);
        expect(typeof shaders[0].sourceLength).toBe("number");
        expect((shaders[0].sourceLength as number)).toBeGreaterThan(0);
        expect(typeof shaders[0].sourcePreview).toBe("string");
        expect(shaders[1].compileStatus).toBe(false);
    });

    it("does not include DrawCall when absent", () => {
        const cmds = [makeCmd({ id: 0, name: "bindBuffer" })];
        const detail = extractCommandDetails(cmds, 0);
        expect(detail!.DrawCall).toBeUndefined();
    });

    it("extracts VisualState.Attachments without base64 data", () => {
        const cmds = [
            makeCmd({
                id: 0,
                name: "drawArrays",
                VisualState: {
                    Attachments: [
                        {
                            attachmentName: "COLOR_ATTACHMENT0",
                            textureWidth: 1024,
                            textureHeight: 768,
                        },
                        {
                            textureWidth: 512,
                            textureHeight: 512,
                        },
                    ],
                },
            }),
        ];
        const detail = extractCommandDetails(cmds, 0);
        const vs = detail!.VisualState as {
            Attachments: Array<Record<string, unknown>>;
        };
        expect(vs.Attachments).toHaveLength(2);
        expect(vs.Attachments[0].attachmentName).toBe("COLOR_ATTACHMENT0");
        expect(vs.Attachments[0].textureWidth).toBe(1024);
        expect(vs.Attachments[0].textureHeight).toBe(768);
        // Missing attachmentName defaults to "unknown"
        expect(vs.Attachments[1].attachmentName).toBe("unknown");
    });

    it("does not include VisualState when absent", () => {
        const cmds = [makeCmd({ id: 0, name: "drawArrays" })];
        const detail = extractCommandDetails(cmds, 0);
        expect(detail!.VisualState).toBeUndefined();
    });

    it("handles DrawCall with no shaders array", () => {
        const cmds = [
            makeCmd({
                id: 0,
                name: "drawArrays",
                DrawCall: {
                    programStatus: {
                        program: { __SPECTOR_Object_TAG: { id: 1 } },
                        LINK_STATUS: true,
                    },
                },
            }),
        ];
        const detail = extractCommandDetails(cmds, 0);
        const dc = detail!.DrawCall as Record<string, unknown>;
        expect(dc.shaders).toBeUndefined();
    });

    it("truncates shader sourcePreview to 200 chars max", () => {
        const longSource = "x".repeat(500);
        const cmds = [
            makeCmd({
                id: 0,
                name: "drawArrays",
                DrawCall: {
                    shaders: [
                        { shaderType: "VERTEX_SHADER", source: longSource, name: "vs" },
                    ],
                    programStatus: {
                        program: { __SPECTOR_Object_TAG: { id: 1 } },
                    },
                },
            }),
        ];
        const detail = extractCommandDetails(cmds, 0);
        const dc = detail!.DrawCall as Record<string, unknown>;
        const shaders = dc.shaders as Array<Record<string, unknown>>;
        expect((shaders[0].sourcePreview as string).length).toBe(200);
        expect(shaders[0].sourceLength).toBe(500);
    });

    it("handles DrawCall with uniformBlocks", () => {
        const cmds = [
            makeCmd({
                id: 0,
                name: "drawArrays",
                DrawCall: {
                    uniformBlocks: [{ name: "Matrices", binding: 0 }],
                    programStatus: {
                        program: { __SPECTOR_Object_TAG: { id: 1 } },
                    },
                },
            }),
        ];
        const detail = extractCommandDetails(cmds, 0);
        const dc = detail!.DrawCall as Record<string, unknown>;
        expect(dc.uniformBlocks).toEqual([{ name: "Matrices", binding: 0 }]);
    });

    it("shader source defaults to empty string when missing", () => {
        const cmds = [
            makeCmd({
                id: 0,
                name: "drawArrays",
                DrawCall: {
                    shaders: [
                        { shaderType: "VERTEX_SHADER", name: "vs" },
                    ],
                    programStatus: {
                        program: { __SPECTOR_Object_TAG: { id: 1 } },
                    },
                },
            }),
        ];
        const detail = extractCommandDetails(cmds, 0);
        const dc = detail!.DrawCall as Record<string, unknown>;
        const shaders = dc.shaders as Array<Record<string, unknown>>;
        expect(shaders[0].sourceLength).toBe(0);
        expect(shaders[0].sourcePreview).toBe("");
    });
});
