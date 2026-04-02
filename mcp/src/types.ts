/**
 * Shared type definitions for the Spector.js MCP server.
 *
 * This file is intentionally free of runtime logic — only interfaces, types,
 * and type-only exports live here.
 */

// ── Console / browser-side types ─────────────────────────────────

/** A single entry captured from the browser console. */
export interface ConsoleEntry {
    level: string;
    message: string;
    source: string;
}

// ── Analysis result types ────────────────────────────────────────

/** High-level statistics for a single captured WebGL frame. */
export interface CaptureSummary {
    totalCommands: number;
    drawCalls: number;
    clearCalls: number;
    programs: number;
    contextVersion: number;
    canvasWidth: number;
    canvasHeight: number;
    durationMs: number;
    errors: string[];
}

/** A draw-call or clear command extracted from a capture. */
export interface DrawCallInfo {
    commandId: number;
    name: string;
    args: string;
    marker: string;
    status: string;
}

/** Vertex + fragment shader pair for a single GPU program. */
export interface ShaderInfo {
    programIndex: number;
    vertexSource: string;
    fragmentSource: string;
    vertexCompileStatus: boolean;
    fragmentCompileStatus: boolean;
    linkStatus: boolean;
}

/** A texture upload recorded during the captured frame. */
export interface TextureInfo {
    commandId: number;
    name: string;
    width: number;
    height: number;
    internalFormat: string;
    format: string;
    type: string;
}

/** A single WebGL state property that changed between frame start and end. */
export interface WebGLStateDiff {
    property: string;
    initial: unknown;
    final: unknown;
}

/** Metadata about a `<canvas>` element found on the page. */
export interface CanvasInfo {
    index: number;
    id: string;
    width: number;
    height: number;
    contextType: "webgl2" | "webgl" | "none";
    isVisible: boolean;
}

// ── Raw capture data shapes (from Spector.js) ────────────────────

/** A single Spector shader object attached to a DrawCall. */
export interface RawShader {
    shaderType?: string | number;
    name?: string;
    source?: string;
    SHADER_SOURCE?: string;
    SHADER_TYPE?: string | number;
    COMPILE_STATUS?: boolean;
}

/** Render-target attachment metadata from a VisualState snapshot. */
export interface RawAttachment {
    attachmentName?: string;
    textureWidth?: number;
    textureHeight?: number;
}

/** The `DrawCall` metadata object Spector attaches to relevant commands. */
export interface RawDrawCall {
    frameBuffer?: unknown;
    programStatus?: {
        program?: { __SPECTOR_Object_TAG?: { id?: number } };
        LINK_STATUS?: boolean;
        VALIDATE_STATUS?: boolean;
        RECOMPILABLE?: boolean;
    };
    shaders?: RawShader[];
    uniforms?: unknown;
    attributes?: unknown;
    uniformBlocks?: unknown;
}

/** A single WebGL command recorded by Spector.js during a frame capture. */
export interface RawCommand {
    id: number;
    name: string;
    commandArguments?: unknown;
    result?: unknown;
    status?: unknown;
    marker?: string;
    text?: string;
    stackTrace?: string[];
    DrawCall?: RawDrawCall;
    VisualState?: { Attachments?: RawAttachment[] };
    [stateGroup: string]: unknown;
}

/** The top-level capture object produced by Spector.js. */
export interface RawCapture {
    commands?: RawCommand[];
    context?: {
        version?: number;
        capabilities?: unknown;
        extensions?: unknown;
        compressedTextures?: unknown;
        contextAttributes?: unknown;
    };
    canvas?: { width?: number; height?: number };
    startTime?: number;
    endTime?: number;
    initState?: Record<string, unknown>;
    endState?: Record<string, unknown>;
}

// ── MCP tool result helpers ──────────────────────────────────────

/** Content item inside an MCP tool result. */
export type ToolContentItem =
    | { type: "text"; text: string }
    | { type: "image"; data: string; mimeType: string };

/** Shape returned by every MCP tool handler. */
export interface ToolResult {
    content: ToolContentItem[];
    isError?: boolean;
}
