import { decodeBase64Bytes, decodeVertexRows, decodeIndices } from "../../../src/embeddedFrontend/react/shared/bufferView";
import { IBufferLayout } from "../../../src/embeddedFrontend/react/shared/types";

function encode(bytes: Uint8Array): string {
    return btoa(String.fromCharCode.apply(null, Array.from(bytes) as any));
}

function floats(values: number[]): Uint8Array {
    return new Uint8Array(new Float32Array(values).buffer);
}

describe("bufferView.decodeBase64Bytes", () => {
    it("round-trips bytes and exposes a reinterpretable buffer", () => {
        const bytes = decodeBase64Bytes(encode(floats([1.5, -2.25])));
        expect(Array.from(new Float32Array(bytes.buffer))).toEqual([1.5, -2.25]);
    });
});

describe("bufferView.decodeVertexRows", () => {
    const vec2: IBufferLayout = { kind: "vertex", componentType: "FLOAT", components: 2, stride: 0, offset: 0 };

    it("lays out tightly-packed float vec2 rows", () => {
        const bytes = decodeBase64Bytes(encode(floats([0, 1, 2, 3])));
        const decoded = decodeVertexRows(bytes, vec2, 100);
        expect(decoded.header).toEqual(["#", "x", "y"]);
        expect(decoded.rows).toEqual([["0", "0", "1"], ["1", "2", "3"]]);
        expect(decoded.truncated).toBe(false);
    });

    it("honors stride and offset when interleaved", () => {
        // Two vertices, stride 16 bytes, the vec2 at offset 4.
        const raw = new Float32Array([9, 0, 1, 9, 9, 2, 3, 9]);
        const decoded = decodeVertexRows(decodeBase64Bytes(encode(new Uint8Array(raw.buffer))),
            { kind: "vertex", componentType: "FLOAT", components: 2, stride: 16, offset: 4 }, 100);
        expect(decoded.rows).toEqual([["0", "0", "1"], ["1", "2", "3"]]);
    });

    it("normalizes unsigned byte components when requested", () => {
        const bytes = decodeBase64Bytes(encode(new Uint8Array([0, 255, 128, 255])));
        const decoded = decodeVertexRows(bytes,
            { kind: "vertex", componentType: "UNSIGNED_BYTE", components: 2, stride: 0, offset: 0, normalized: true }, 100);
        expect(decoded.rows[0]).toEqual(["0", "0", "1"]);
    });

    it("truncates to maxRows and flags it", () => {
        const bytes = decodeBase64Bytes(encode(floats([0, 1, 2, 3, 4, 5])));
        const decoded = decodeVertexRows(bytes, vec2, 1);
        expect(decoded.rows.length).toBe(1);
        expect(decoded.truncated).toBe(true);
    });
});

describe("bufferView.decodeIndices", () => {
    it("decodes unsigned short indices", () => {
        const bytes = decodeBase64Bytes(encode(new Uint8Array(new Uint16Array([0, 1, 2, 2, 1, 3]).buffer)));
        const decoded = decodeIndices(bytes, "UNSIGNED_SHORT", 100);
        expect(decoded.header).toEqual(["#", "index"]);
        expect(decoded.rows.map((r) => r[1])).toEqual(["0", "1", "2", "2", "1", "3"]);
    });
});
