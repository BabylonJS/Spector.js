/**
 * Minimal, self-contained Source Map v3 consumer.
 *
 * Decodes the base64-VLQ `mappings` field and resolves a generated
 * (line, column) position back to its original source location. Intentionally
 * dependency-free and lightweight — Spector only needs `originalPositionFor`
 * to resolve command stack-trace frames on demand, so the heavyweight
 * `source-map` package (with its WASM payload) is avoided.
 */

/** Raw Source Map v3 JSON shape (only the fields we consume). */
export interface IRawSourceMap {
    version: number;
    sources: string[];
    names: string[];
    mappings: string;
    sourcesContent?: (string | null)[];
    sourceRoot?: string;
    file?: string;
}

/** A resolved original position. `null` fields mean "no mapping found". */
export interface IOriginalPosition {
    /** Original source path (with `sourceRoot` applied), or `null`. */
    source: string | null;
    /** 1-based original line, or `null`. */
    line: number | null;
    /** 0-based original column, or `null`. */
    column: number | null;
    /** Original symbol name, or `null`. */
    name: string | null;
}

/** One decoded mapping segment for a generated line. */
interface IMappingSegment {
    generatedColumn: number;
    sourceIndex: number;
    originalLine: number;   // 0-based as stored in the map
    originalColumn: number; // 0-based
    nameIndex: number;      // -1 when absent
}

const BASE64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const BASE64_LOOKUP: { [char: string]: number } = (() => {
    const table: { [char: string]: number } = {};
    for (let i = 0; i < BASE64_CHARS.length; i++) {
        table[BASE64_CHARS.charAt(i)] = i;
    }
    return table;
})();

const VLQ_CONTINUATION_BIT = 0x20; // 32
const VLQ_VALUE_MASK = 0x1f;       // 31

export class SourceMapConsumer {
    private readonly sources: string[];
    private readonly names: string[];
    private readonly sourceRoot: string;
    // Parsed mappings: one entry per generated line (0-based), each a list of
    // segments sorted by ascending generated column.
    private readonly lines: IMappingSegment[][];

    constructor(rawMap: IRawSourceMap) {
        this.sources = rawMap.sources || [];
        this.names = rawMap.names || [];
        this.sourceRoot = rawMap.sourceRoot || "";
        this.lines = SourceMapConsumer.parseMappings(rawMap.mappings || "");
    }

    /**
     * Resolve a generated position to its original source location.
     *
     * @param generatedLine   - 1-based line in the generated file.
     * @param generatedColumn - 0-based column in the generated file.
     */
    public originalPositionFor(generatedLine: number, generatedColumn: number): IOriginalPosition {
        const empty: IOriginalPosition = { source: null, line: null, column: null, name: null };

        const lineIndex = generatedLine - 1;
        if (lineIndex < 0 || lineIndex >= this.lines.length) {
            return empty;
        }

        const segments = this.lines[lineIndex];
        if (!segments || segments.length === 0) {
            return empty;
        }

        const segment = this.findSegment(segments, generatedColumn);
        if (!segment) {
            return empty;
        }

        const source = (segment.sourceIndex >= 0 && segment.sourceIndex < this.sources.length)
            ? this.applySourceRoot(this.sources[segment.sourceIndex])
            : null;
        const name = (segment.nameIndex >= 0 && segment.nameIndex < this.names.length)
            ? this.names[segment.nameIndex]
            : null;

        return {
            source,
            line: segment.originalLine + 1, // convert to 1-based
            column: segment.originalColumn,
            name,
        };
    }

    private applySourceRoot(source: string): string {
        if (!this.sourceRoot) {
            return source;
        }
        if (/^([a-z][a-z0-9+.-]*:|\/)/i.test(source)) {
            // Absolute URL or absolute path — leave untouched.
            return source;
        }
        const root = this.sourceRoot.replace(/\/$/, "");
        return root + "/" + source;
    }

    /** Binary search for the segment with the greatest generatedColumn <= target. */
    private findSegment(segments: IMappingSegment[], column: number): IMappingSegment | null {
        let low = 0;
        let high = segments.length - 1;
        let best: IMappingSegment | null = null;
        while (low <= high) {
            const mid = (low + high) >> 1;
            const seg = segments[mid];
            if (seg.generatedColumn <= column) {
                best = seg;
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
        return best;
    }

    private static parseMappings(mappings: string): IMappingSegment[][] {
        const lines: IMappingSegment[][] = [];

        // Fields that persist across the whole map (only generatedColumn resets
        // at the start of each generated line).
        let sourceIndex = 0;
        let originalLine = 0;
        let originalColumn = 0;
        let nameIndex = 0;

        const generatedLines = mappings.split(";");
        for (let i = 0; i < generatedLines.length; i++) {
            const lineData = generatedLines[i];
            const segments: IMappingSegment[] = [];
            let generatedColumn = 0;

            if (lineData.length > 0) {
                const segmentStrings = lineData.split(",");
                for (let s = 0; s < segmentStrings.length; s++) {
                    const decoded = SourceMapConsumer.decodeSegment(segmentStrings[s]);
                    if (decoded.length === 0) {
                        continue;
                    }

                    generatedColumn += decoded[0];

                    const segment: IMappingSegment = {
                        generatedColumn,
                        sourceIndex: -1,
                        originalLine: 0,
                        originalColumn: 0,
                        nameIndex: -1,
                    };

                    if (decoded.length >= 4) {
                        sourceIndex += decoded[1];
                        originalLine += decoded[2];
                        originalColumn += decoded[3];
                        segment.sourceIndex = sourceIndex;
                        segment.originalLine = originalLine;
                        segment.originalColumn = originalColumn;

                        if (decoded.length >= 5) {
                            nameIndex += decoded[4];
                            segment.nameIndex = nameIndex;
                        }
                    }

                    segments.push(segment);
                }
            }

            // Segments should already be in ascending generated-column order, but
            // sort defensively so the binary search is always correct.
            segments.sort((a, b) => a.generatedColumn - b.generatedColumn);
            lines.push(segments);
        }

        return lines;
    }

    /** Decode a single comma-separated mapping segment into its VLQ integers. */
    private static decodeSegment(segment: string): number[] {
        const values: number[] = [];
        let index = 0;
        while (index < segment.length) {
            let result = 0;
            let shift = 0;
            let continuation = 0;
            do {
                const char = segment.charAt(index++);
                if (!(char in BASE64_LOOKUP)) {
                    return values; // Malformed — stop gracefully.
                }
                const digit = BASE64_LOOKUP[char];
                continuation = digit & VLQ_CONTINUATION_BIT;
                result += (digit & VLQ_VALUE_MASK) << shift;
                shift += 5;
            } while (continuation && index < segment.length);

            const shouldNegate = result & 1;
            // tslint:disable-next-line:no-bitwise
            result = result >>> 1;
            values.push(shouldNegate ? -result : result);
        }
        return values;
    }
}
