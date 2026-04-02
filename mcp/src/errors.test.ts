/**
 * Tests for the custom error hierarchy.
 *
 * Every MCP error carries a machine-readable `code`, a human-readable
 * `message`, and a correct `name`.  We verify all of that here, plus
 * prototype-chain correctness so `instanceof` works as expected.
 */

import { SpectorMcpError, NoPageError, CaptureError, NavigationError } from "./errors.js";

// ── SpectorMcpError (base class) ─────────────────────────────────

describe("SpectorMcpError", () => {
    it("stores message and code correctly", () => {
        const err = new SpectorMcpError("something broke", "TEST_CODE");
        expect(err.message).toBe("something broke");
        expect(err.code).toBe("TEST_CODE");
    });

    it("has name set to 'SpectorMcpError'", () => {
        const err = new SpectorMcpError("msg", "CODE");
        expect(err.name).toBe("SpectorMcpError");
    });

    it("is an instance of Error", () => {
        const err = new SpectorMcpError("msg", "CODE");
        expect(err).toBeInstanceOf(Error);
    });

    it("is an instance of SpectorMcpError", () => {
        const err = new SpectorMcpError("msg", "CODE");
        expect(err).toBeInstanceOf(SpectorMcpError);
    });

    it("has a stack trace", () => {
        const err = new SpectorMcpError("msg", "CODE");
        expect(err.stack).toBeDefined();
        expect(err.stack).toContain("SpectorMcpError");
    });
});

// ── NoPageError ──────────────────────────────────────────────────

describe("NoPageError", () => {
    it("uses default message when none is provided", () => {
        const err = new NoPageError();
        expect(err.message).toBe(
            "No page loaded. Call load_url or load_playground first.",
        );
    });

    it("accepts a custom message", () => {
        const err = new NoPageError("custom no-page message");
        expect(err.message).toBe("custom no-page message");
    });

    it("has code 'NO_PAGE'", () => {
        const err = new NoPageError();
        expect(err.code).toBe("NO_PAGE");
    });

    it("has name 'NoPageError'", () => {
        const err = new NoPageError();
        expect(err.name).toBe("NoPageError");
    });

    it("is instanceof SpectorMcpError and Error", () => {
        const err = new NoPageError();
        expect(err).toBeInstanceOf(SpectorMcpError);
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(NoPageError);
    });
});

// ── CaptureError ─────────────────────────────────────────────────

describe("CaptureError", () => {
    it("stores message and has code 'CAPTURE_FAILED'", () => {
        const err = new CaptureError("capture timed out");
        expect(err.message).toBe("capture timed out");
        expect(err.code).toBe("CAPTURE_FAILED");
    });

    it("has name 'CaptureError'", () => {
        const err = new CaptureError("boom");
        expect(err.name).toBe("CaptureError");
    });

    it("is instanceof SpectorMcpError and Error", () => {
        const err = new CaptureError("boom");
        expect(err).toBeInstanceOf(SpectorMcpError);
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(CaptureError);
    });
});

// ── NavigationError ──────────────────────────────────────────────

describe("NavigationError", () => {
    it("stores message and has code 'NAVIGATION_FAILED'", () => {
        const err = new NavigationError("DNS lookup failed");
        expect(err.message).toBe("DNS lookup failed");
        expect(err.code).toBe("NAVIGATION_FAILED");
    });

    it("has name 'NavigationError'", () => {
        const err = new NavigationError("oops");
        expect(err.name).toBe("NavigationError");
    });

    it("is instanceof SpectorMcpError and Error", () => {
        const err = new NavigationError("oops");
        expect(err).toBeInstanceOf(SpectorMcpError);
        expect(err).toBeInstanceOf(Error);
        expect(err).toBeInstanceOf(NavigationError);
    });
});

// ── Cross-type instanceof checks ─────────────────────────────────

describe("cross-type instanceof safety", () => {
    it("CaptureError is NOT instanceof NavigationError", () => {
        const err = new CaptureError("x");
        expect(err).not.toBeInstanceOf(NavigationError);
    });

    it("NavigationError is NOT instanceof CaptureError", () => {
        const err = new NavigationError("x");
        expect(err).not.toBeInstanceOf(CaptureError);
    });

    it("NoPageError is NOT instanceof CaptureError", () => {
        const err = new NoPageError();
        expect(err).not.toBeInstanceOf(CaptureError);
    });
});
