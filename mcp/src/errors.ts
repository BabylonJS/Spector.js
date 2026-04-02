/**
 * Custom error hierarchy for the Spector.js MCP server.
 *
 * Every error carries a machine-readable `code` string so that callers can
 * distinguish error classes without parsing human-readable messages.
 */

/** Base class for all Spector MCP errors. */
export class SpectorMcpError extends Error {
    /** Machine-readable error code (e.g. `"NO_PAGE"`, `"CAPTURE_TIMEOUT"`). */
    public readonly code: string;

    constructor(message: string, code: string) {
        super(message);
        this.name = "SpectorMcpError";
        this.code = code;
    }
}

/** Thrown when an operation requires a loaded page but none exists. */
export class NoPageError extends SpectorMcpError {
    constructor(message = "No page loaded. Call load_url or load_playground first.") {
        super(message, "NO_PAGE");
        this.name = "NoPageError";
    }
}

/** Thrown when a Spector.js frame capture fails or times out. */
export class CaptureError extends SpectorMcpError {
    constructor(message: string) {
        super(message, "CAPTURE_FAILED");
        this.name = "CaptureError";
    }
}

/** Thrown when page navigation fails. */
export class NavigationError extends SpectorMcpError {
    constructor(message: string) {
        super(message, "NAVIGATION_FAILED");
        this.name = "NavigationError";
    }
}
