/**
 * Shared constants for the Spector.js MCP server.
 *
 * All magic values, timeout durations, format maps, and sentinel strings
 * are centralised here so they can be updated in one place.
 */

// ── Timeouts (milliseconds) ──────────────────────────────────────

/** Maximum time to wait for a page navigation to complete. */
export const NAVIGATION_TIMEOUT_MS = 60_000;

/** Maximum time to wait for a canvas element to appear on the page. */
export const CANVAS_WAIT_TIMEOUT_MS = 15_000;

/** Maximum time to wait for a Spector.js frame capture callback. */
export const CAPTURE_TIMEOUT_MS = 15_000;

/** Grace period after navigation for WebGL initialisation. */
export const POST_NAVIGATION_DELAY_MS = 3_000;

/** Maximum time to wait for Babylon playground engine/scene readiness. */
export const PLAYGROUND_READY_TIMEOUT_MS = 30_000;

/** Grace period after playground scene readiness for rendering. */
export const POST_PLAYGROUND_DELAY_MS = 2_000;

// ── Sentinel messages ────────────────────────────────────────────

/** Error message returned when no page has been loaded yet. */
export const NO_PAGE_MSG = "No page loaded. Call load_url or load_playground first.";

// ── WebGL draw-call command names ────────────────────────────────

/**
 * WebGL commands considered "draw calls" for capture summary statistics.
 * Does NOT include `clear` — those are counted separately.
 */
export const DRAW_CALL_NAMES: readonly string[] = [
    "drawArrays",
    "drawElements",
    "drawArraysInstanced",
    "drawElementsInstanced",
    "drawRangeElements",
    "multiDrawArrays",
    "multiDrawElements",
] as const;

/**
 * Combined list of draw + clear commands used when listing "draw calls"
 * in the get_draw_calls tool.
 */
export const DRAW_AND_CLEAR_NAMES: readonly string[] = [
    "drawArrays",
    "drawElements",
    "drawArraysInstanced",
    "drawElementsInstanced",
    "drawRangeElements",
    "clear",
] as const;

// ── GL state groups attached to per-command snapshots ─────────────

/** Names of GL state group objects that Spector attaches to each command. */
export const STATE_GROUP_NAMES: readonly string[] = [
    "BlendState",
    "ColorState",
    "CoverageState",
    "CullState",
    "DepthState",
    "DrawState",
    "PolygonOffsetState",
    "ScissorState",
    "StencilState",
] as const;

// ── WebGL format / type enum-to-name maps ────────────────────────

/** Human-readable names for common `GLenum` internal-format / format values. */
export const GL_FORMAT_NAMES: Readonly<Record<number, string>> = {
    6406: "ALPHA",
    6407: "RGB",
    6408: "RGBA",
    6409: "LUMINANCE",
    6410: "LUMINANCE_ALPHA",
    33189: "DEPTH_COMPONENT16",
    33190: "DEPTH_COMPONENT24",
    35056: "DEPTH24_STENCIL8",
    36012: "DEPTH_COMPONENT32F",
    36013: "DEPTH32F_STENCIL8",
    32854: "RGB8",
    32855: "RGB565",
    32856: "RGBA4",
    32857: "RGB5_A1",
    32858: "RGBA8",
    33321: "R8",
    33325: "R16F",
    33326: "R32F",
    33327: "RG8",
    33328: "RG16F",
    33329: "RG32F",
    34842: "RGBA16F",
    34836: "RGBA32F",
    35898: "RGB16F",
    34843: "RGB32F",
} as const;

/** Human-readable names for common `GLenum` texture data type values. */
export const GL_TYPE_NAMES: Readonly<Record<number, string>> = {
    5121: "UNSIGNED_BYTE",
    5123: "UNSIGNED_SHORT",
    5125: "UNSIGNED_INT",
    5126: "FLOAT",
    5131: "HALF_FLOAT",
    36193: "HALF_FLOAT_OES",
} as const;
