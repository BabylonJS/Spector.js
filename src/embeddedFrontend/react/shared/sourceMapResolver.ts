import { SourceMapConsumer, IRawSourceMap } from "./sourceMapConsumer";

/**
 * Resolves minified/bundled stack-trace frames to their original source
 * locations using source maps, on demand.
 *
 * Designed for lazy, display-time use: Spector captures raw stack strings on
 * the hot path (cheap) and only resolves the handful of frames for the command
 * a user is actually inspecting. Fetched + parsed maps are cached per script
 * URL (including a negative cache for scripts with no usable map), and
 * in-flight loads are de-duplicated.
 *
 * Every failure mode (no map, cross-origin block, parse error, unmapped
 * position) degrades gracefully by returning the original frame unchanged.
 */
export interface IParsedFrame {
    functionName: string;
    url: string;
    line: number;
    column: number;
}

export class SourceMapResolver {
    // null value = "known to have no usable source map" (negative cache).
    private readonly cache: Map<string, SourceMapConsumer | null> = new Map();
    private readonly inflight: Map<string, Promise<SourceMapConsumer | null>> = new Map();
    private readonly fetchFn: typeof fetch;

    constructor(fetchFn?: typeof fetch) {
        // Allow injection for testing; default to global fetch when available.
        this.fetchFn = fetchFn || (typeof fetch !== "undefined" ? fetch.bind(globalThis) : undefined as any);
    }

    /** Resolve a list of frames, preserving order. Never rejects. */
    public async resolveFrames(frames: string[]): Promise<string[]> {
        if (!frames || frames.length === 0) {
            return frames || [];
        }
        return Promise.all(frames.map((frame) => this.resolveFrame(frame)));
    }

    /**
     * Resolve a single frame string. Returns the original frame unchanged when
     * it cannot be parsed or mapped.
     */
    public async resolveFrame(frame: string): Promise<string> {
        const parsed = SourceMapResolver.parseFrame(frame);
        if (!parsed) {
            return frame;
        }

        let consumer: SourceMapConsumer | null;
        try {
            consumer = await this.getConsumer(parsed.url);
        } catch {
            return frame;
        }
        if (!consumer) {
            return frame;
        }

        const pos = consumer.originalPositionFor(parsed.line, parsed.column);
        if (!pos.source || pos.line === null) {
            return frame;
        }

        return SourceMapResolver.formatFrame(parsed.functionName, pos.name, pos.source, pos.line, pos.column || 0);
    }

    /** Parse a stack frame string into its components, or `null` if it has no location. */
    public static parseFrame(frame: string): IParsedFrame | null {
        if (!frame) {
            return null;
        }

        // "functionName (url:line:column)"  — url may contain colons (http://host:port/...)
        let match = frame.match(/^(.*?)\s*\((.+):(\d+):(\d+)\)\s*$/);
        if (match) {
            return {
                functionName: match[1].trim(),
                url: match[2],
                line: parseInt(match[3], 10),
                column: parseInt(match[4], 10),
            };
        }

        // "url:line:column"  (no function name, no parentheses)
        match = frame.match(/^\s*(.+):(\d+):(\d+)\s*$/);
        if (match) {
            return {
                functionName: "",
                url: match[1].trim(),
                line: parseInt(match[2], 10),
                column: parseInt(match[3], 10),
            };
        }

        return null;
    }

    /** Format a resolved frame back into the "fn (source:line:col)" convention. */
    public static formatFrame(
        originalFunctionName: string,
        mappedName: string | null,
        source: string,
        line: number,
        column: number,
    ): string {
        const name = mappedName || originalFunctionName;
        const location = source + ":" + line + ":" + column;
        return name ? name + " (" + location + ")" : location;
    }

    private async getConsumer(scriptUrl: string): Promise<SourceMapConsumer | null> {
        if (this.cache.has(scriptUrl)) {
            return this.cache.get(scriptUrl) as SourceMapConsumer | null;
        }
        const existing = this.inflight.get(scriptUrl);
        if (existing) {
            return existing;
        }

        const load = this.loadConsumer(scriptUrl)
            .then((consumer): SourceMapConsumer | null => {
                this.cache.set(scriptUrl, consumer);
                this.inflight.delete(scriptUrl);
                return consumer;
            })
            .catch((): SourceMapConsumer | null => {
                this.cache.set(scriptUrl, null);
                this.inflight.delete(scriptUrl);
                return null;
            });

        this.inflight.set(scriptUrl, load);
        return load;
    }

    private async loadConsumer(scriptUrl: string): Promise<SourceMapConsumer | null> {
        if (!this.fetchFn) {
            return null;
        }

        const scriptResponse = await this.fetchFn(scriptUrl);
        if (!scriptResponse.ok) {
            return null;
        }
        const scriptText = await scriptResponse.text();

        const mapUrl = SourceMapResolver.extractSourceMappingURL(scriptText);
        if (!mapUrl) {
            return null;
        }

        let rawMap: IRawSourceMap | null;
        if (mapUrl.indexOf("data:") === 0) {
            rawMap = SourceMapResolver.parseDataUri(mapUrl);
        } else {
            const absoluteMapUrl = SourceMapResolver.resolveUrl(mapUrl, scriptUrl);
            const mapResponse = await this.fetchFn(absoluteMapUrl);
            if (!mapResponse.ok) {
                return null;
            }
            rawMap = await mapResponse.json();
        }

        if (!rawMap || typeof rawMap.mappings !== "string") {
            return null;
        }
        return new SourceMapConsumer(rawMap);
    }

    /** Extract the last `//# sourceMappingURL=` (or legacy `//@`) directive. */
    public static extractSourceMappingURL(scriptText: string): string | null {
        const regex = /\/\/[#@]\s*sourceMappingURL=(\S+)\s*$/gm;
        let match: RegExpExecArray | null;
        let last: string | null = null;
        // tslint:disable-next-line:no-conditional-assignment
        while ((match = regex.exec(scriptText)) !== null) {
            last = match[1];
        }
        return last;
    }

    /** Decode a `data:` source-map URI (base64 or URL-encoded JSON). */
    public static parseDataUri(uri: string): IRawSourceMap | null {
        const comma = uri.indexOf(",");
        if (comma === -1) {
            return null;
        }
        const meta = uri.substring(0, comma);
        const data = uri.substring(comma + 1);
        try {
            const json = /;base64/i.test(meta)
                ? SourceMapResolver.decodeBase64(data)
                : decodeURIComponent(data);
            return JSON.parse(json);
        } catch {
            return null;
        }
    }

    private static decodeBase64(data: string): string {
        if (typeof atob === "function") {
            return atob(data);
        }
        // Node fallback (tests).
        const B: any = (globalThis as any).Buffer;
        if (B) {
            return B.from(data, "base64").toString("utf-8");
        }
        throw new Error("No base64 decoder available.");
    }

    private static resolveUrl(relative: string, base: string): string {
        try {
            return new URL(relative, base).href;
        } catch {
            return relative;
        }
    }
}
