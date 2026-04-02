/**
 * Sanity tests for shared constants.
 *
 * These are intentionally lightweight — we're not testing that someone can
 * define an array, we're testing that the SPECIFIC VALUES we depend on
 * elsewhere are present and mapped correctly.  If someone accidentally
 * deletes "drawArraysInstanced" from DRAW_CALL_NAMES, we want to know.
 */

import {
    DRAW_CALL_NAMES,
    DRAW_AND_CLEAR_NAMES,
    STATE_GROUP_NAMES,
    GL_FORMAT_NAMES,
    GL_TYPE_NAMES,
    NAVIGATION_TIMEOUT_MS,
    CANVAS_WAIT_TIMEOUT_MS,
    CAPTURE_TIMEOUT_MS,
} from "./constants.js";

// ── Draw call names ──────────────────────────────────────────────

describe("DRAW_CALL_NAMES", () => {
    it("contains all core WebGL draw commands", () => {
        expect(DRAW_CALL_NAMES).toContain("drawArrays");
        expect(DRAW_CALL_NAMES).toContain("drawElements");
        expect(DRAW_CALL_NAMES).toContain("drawArraysInstanced");
        expect(DRAW_CALL_NAMES).toContain("drawElementsInstanced");
        expect(DRAW_CALL_NAMES).toContain("drawRangeElements");
    });

    it("does NOT include 'clear' (that is counted separately)", () => {
        expect(DRAW_CALL_NAMES).not.toContain("clear");
    });
});

describe("DRAW_AND_CLEAR_NAMES", () => {
    it("is a superset of the basic draw calls plus 'clear'", () => {
        expect(DRAW_AND_CLEAR_NAMES).toContain("drawArrays");
        expect(DRAW_AND_CLEAR_NAMES).toContain("drawElements");
        expect(DRAW_AND_CLEAR_NAMES).toContain("clear");
    });
});

// ── State group names ────────────────────────────────────────────

describe("STATE_GROUP_NAMES", () => {
    const expected = [
        "BlendState",
        "ColorState",
        "CoverageState",
        "CullState",
        "DepthState",
        "DrawState",
        "PolygonOffsetState",
        "ScissorState",
        "StencilState",
    ];

    it.each(expected)("contains '%s'", (name) => {
        expect(STATE_GROUP_NAMES).toContain(name);
    });

    it("has exactly the expected number of state groups", () => {
        expect(STATE_GROUP_NAMES).toHaveLength(expected.length);
    });
});

// ── GL format name mapping ───────────────────────────────────────

describe("GL_FORMAT_NAMES", () => {
    it("maps 6408 → 'RGBA'", () => {
        expect(GL_FORMAT_NAMES[6408]).toBe("RGBA");
    });

    it("maps 6407 → 'RGB'", () => {
        expect(GL_FORMAT_NAMES[6407]).toBe("RGB");
    });

    it("maps 6406 → 'ALPHA'", () => {
        expect(GL_FORMAT_NAMES[6406]).toBe("ALPHA");
    });

    it("maps 6409 → 'LUMINANCE'", () => {
        expect(GL_FORMAT_NAMES[6409]).toBe("LUMINANCE");
    });

    it("maps 6410 → 'LUMINANCE_ALPHA'", () => {
        expect(GL_FORMAT_NAMES[6410]).toBe("LUMINANCE_ALPHA");
    });

    it("maps 34842 → 'RGBA16F'", () => {
        expect(GL_FORMAT_NAMES[34842]).toBe("RGBA16F");
    });

    it("maps 34836 → 'RGBA32F'", () => {
        expect(GL_FORMAT_NAMES[34836]).toBe("RGBA32F");
    });

    it("returns undefined for an unknown format enum", () => {
        expect(GL_FORMAT_NAMES[99999]).toBeUndefined();
    });
});

// ── GL type name mapping ─────────────────────────────────────────

describe("GL_TYPE_NAMES", () => {
    it("maps 5121 → 'UNSIGNED_BYTE'", () => {
        expect(GL_TYPE_NAMES[5121]).toBe("UNSIGNED_BYTE");
    });

    it("maps 5126 → 'FLOAT'", () => {
        expect(GL_TYPE_NAMES[5126]).toBe("FLOAT");
    });

    it("maps 5131 → 'HALF_FLOAT'", () => {
        expect(GL_TYPE_NAMES[5131]).toBe("HALF_FLOAT");
    });

    it("maps 36193 → 'HALF_FLOAT_OES'", () => {
        expect(GL_TYPE_NAMES[36193]).toBe("HALF_FLOAT_OES");
    });

    it("returns undefined for an unknown type enum", () => {
        expect(GL_TYPE_NAMES[77777]).toBeUndefined();
    });
});

// ── Timeout constants ────────────────────────────────────────────

describe("Timeout constants", () => {
    it("NAVIGATION_TIMEOUT_MS is a positive number", () => {
        expect(NAVIGATION_TIMEOUT_MS).toBeGreaterThan(0);
    });

    it("CANVAS_WAIT_TIMEOUT_MS is a positive number", () => {
        expect(CANVAS_WAIT_TIMEOUT_MS).toBeGreaterThan(0);
    });

    it("CAPTURE_TIMEOUT_MS is a positive number", () => {
        expect(CAPTURE_TIMEOUT_MS).toBeGreaterThan(0);
    });
});
