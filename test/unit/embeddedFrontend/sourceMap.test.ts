import { SourceMapConsumer, IRawSourceMap } from "../../../src/embeddedFrontend/react/shared/sourceMapConsumer";
import { SourceMapResolver } from "../../../src/embeddedFrontend/react/shared/sourceMapResolver";

// ─── Independent base64-VLQ encoder (to build fixtures & cross-check decode) ──
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function encodeVLQ(num: number): string {
    let vlq = num < 0 ? ((-num) << 1) | 1 : num << 1;
    let out = "";
    do {
        let digit = vlq & 31;
        vlq = vlq >>> 5;
        if (vlq > 0) { digit |= 32; }
        out += CHARS.charAt(digit);
    } while (vlq > 0);
    return out;
}
function encodeSegment(fields: number[]): string {
    return fields.map(encodeVLQ).join("");
}

/**
 * Fixture map:
 *   generated (1,0..19)  -> src/app.ts:10:4  name "render"
 *   generated (1,20..)   -> src/app.ts:16:2  name "draw"
 *   generated (2,0..)    -> src/app.ts:21:0  (no name)
 */
function buildFixtureMap(sourceRoot = ""): IRawSourceMap {
    const line1 =
        encodeSegment([0, 0, 9, 4, 0]) + "," +   // genCol0, src0, origLine9, origCol4, name0
        encodeSegment([20, 0, 6, -2, 1]);        // genCol20, src0, +6 line, -2 col, +1 name
    const line2 = encodeSegment([0, 0, 5, -2]);  // genCol0, src0, +5 line, -2 col, no name
    return {
        version: 3,
        sources: ["src/app.ts"],
        names: ["render", "draw"],
        mappings: line1 + ";" + line2,
        sourceRoot,
    };
}

describe("SourceMapConsumer", () => {
    const consumer = new SourceMapConsumer(buildFixtureMap());

    it("resolves the first segment of a line", () => {
        expect(consumer.originalPositionFor(1, 0)).toEqual({
            source: "src/app.ts", line: 10, column: 4, name: "render",
        });
    });

    it("uses the nearest preceding segment for an in-between column", () => {
        expect(consumer.originalPositionFor(1, 5)).toEqual({
            source: "src/app.ts", line: 10, column: 4, name: "render",
        });
    });

    it("resolves a later segment on the same line", () => {
        expect(consumer.originalPositionFor(1, 20)).toEqual({
            source: "src/app.ts", line: 16, column: 2, name: "draw",
        });
        expect(consumer.originalPositionFor(1, 25)).toEqual({
            source: "src/app.ts", line: 16, column: 2, name: "draw",
        });
    });

    it("resolves a segment with no name", () => {
        expect(consumer.originalPositionFor(2, 0)).toEqual({
            source: "src/app.ts", line: 21, column: 0, name: null,
        });
    });

    it("returns empty for an out-of-range line", () => {
        expect(consumer.originalPositionFor(3, 0)).toEqual({
            source: null, line: null, column: null, name: null,
        });
    });

    it("returns empty for a column before the first segment", () => {
        // The only line-1 segments start at column 0, so column -1 has no match.
        expect(consumer.originalPositionFor(1, -1).source).toBeNull();
    });

    it("applies sourceRoot to relative sources", () => {
        const rooted = new SourceMapConsumer(buildFixtureMap("webpack:///"));
        expect(rooted.originalPositionFor(1, 0).source).toBe("webpack:///src/app.ts");
    });
});

describe("SourceMapResolver.parseFrame", () => {
    it("parses a frame with a function name and parenthesised location", () => {
        expect(SourceMapResolver.parseFrame("render (http://localhost:7799/app.js:12:5)")).toEqual({
            functionName: "render",
            url: "http://localhost:7799/app.js",
            line: 12,
            column: 5,
        });
    });

    it("parses a bare location without a function name", () => {
        expect(SourceMapResolver.parseFrame("http://localhost:7799/app.js:12:5")).toEqual({
            functionName: "",
            url: "http://localhost:7799/app.js",
            line: 12,
            column: 5,
        });
    });

    it("returns null for a frame without a location", () => {
        expect(SourceMapResolver.parseFrame("someAnonymousFunction")).toBeNull();
    });
});

describe("SourceMapResolver.formatFrame", () => {
    it("prefers the mapped name over the original function name", () => {
        expect(SourceMapResolver.formatFrame("m", "render", "src/app.ts", 10, 4))
            .toBe("render (src/app.ts:10:4)");
    });

    it("falls back to the original name when there is no mapped name", () => {
        expect(SourceMapResolver.formatFrame("render", null, "src/app.ts", 10, 4))
            .toBe("render (src/app.ts:10:4)");
    });

    it("emits a bare location when neither name is present", () => {
        expect(SourceMapResolver.formatFrame("", null, "src/app.ts", 10, 4))
            .toBe("src/app.ts:10:4");
    });
});

describe("SourceMapResolver.extractSourceMappingURL", () => {
    it("finds a trailing sourceMappingURL directive", () => {
        const js = "var a=1;\n//# sourceMappingURL=app.js.map\n";
        expect(SourceMapResolver.extractSourceMappingURL(js)).toBe("app.js.map");
    });

    it("supports the legacy //@ directive", () => {
        const js = "var a=1;\n//@ sourceMappingURL=app.js.map";
        expect(SourceMapResolver.extractSourceMappingURL(js)).toBe("app.js.map");
    });

    it("returns null when absent", () => {
        expect(SourceMapResolver.extractSourceMappingURL("var a=1;")).toBeNull();
    });
});

describe("SourceMapResolver.parseDataUri", () => {
    const map = buildFixtureMap();

    it("decodes a base64 data URI", () => {
        const b64 = Buffer.from(JSON.stringify(map)).toString("base64");
        const uri = "data:application/json;charset=utf-8;base64," + b64;
        expect(SourceMapResolver.parseDataUri(uri)!.mappings).toBe(map.mappings);
    });

    it("decodes a url-encoded data URI", () => {
        const uri = "data:application/json," + encodeURIComponent(JSON.stringify(map));
        expect(SourceMapResolver.parseDataUri(uri)!.mappings).toBe(map.mappings);
    });

    it("returns null for malformed input", () => {
        expect(SourceMapResolver.parseDataUri("data:application/json;base64,%%%")).toBeNull();
    });
});

describe("SourceMapResolver.resolveFrame (end-to-end with mocked fetch)", () => {
    function makeJs(mappingUrl: string): string {
        return "console.log(1);\n//# sourceMappingURL=" + mappingUrl + "\n";
    }
    function inlineMap(): string {
        const b64 = Buffer.from(JSON.stringify(buildFixtureMap())).toString("base64");
        return "data:application/json;base64," + b64;
    }

    it("resolves a frame to its original source via an inline map", async () => {
        const fetchMock = jest.fn(async (url: string) => ({
            ok: true,
            text: async () => makeJs(inlineMap()),
        })) as any;
        const resolver = new SourceMapResolver(fetchMock);

        const out = await resolver.resolveFrame("render (http://x/app.js:1:0)");
        expect(out).toBe("render (src/app.ts:10:4)");
    });

    it("resolves a frame via an external .map file", async () => {
        const fetchMock = jest.fn(async (url: string) => {
            if (url === "http://x/app.js") {
                return { ok: true, text: async () => makeJs("app.js.map") } as any;
            }
            if (url === "http://x/app.js.map") {
                return { ok: true, json: async () => buildFixtureMap() } as any;
            }
            throw new Error("unexpected url " + url);
        }) as any;
        const resolver = new SourceMapResolver(fetchMock);

        const out = await resolver.resolveFrame("draw (http://x/app.js:1:20)");
        expect(out).toBe("draw (src/app.ts:16:2)");
    });

    it("caches the parsed map across frames (fetches once)", async () => {
        const fetchMock = jest.fn(async () => ({
            ok: true,
            text: async () => makeJs(inlineMap()),
        })) as any;
        const resolver = new SourceMapResolver(fetchMock);

        await resolver.resolveFrames([
            "render (http://x/app.js:1:0)",
            "draw (http://x/app.js:1:20)",
        ]);
        // Only the JS is fetched, and only once (inline map needs no extra fetch).
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("returns the original frame when there is no source map", async () => {
        const fetchMock = jest.fn(async () => ({
            ok: true,
            text: async () => "console.log(1);\n",
        })) as any;
        const resolver = new SourceMapResolver(fetchMock);

        const frame = "render (http://x/app.js:1:0)";
        expect(await resolver.resolveFrame(frame)).toBe(frame);
    });

    it("returns the original frame when the fetch fails", async () => {
        const fetchMock = jest.fn(async () => { throw new Error("network"); }) as any;
        const resolver = new SourceMapResolver(fetchMock);

        const frame = "render (http://x/app.js:1:0)";
        expect(await resolver.resolveFrame(frame)).toBe(frame);
    });

    it("returns unparsable frames unchanged", async () => {
        const fetchMock = jest.fn() as any;
        const resolver = new SourceMapResolver(fetchMock);
        expect(await resolver.resolveFrame("anonymous")).toBe("anonymous");
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
