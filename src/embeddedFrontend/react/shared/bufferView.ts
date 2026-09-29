import { IBufferLayout } from "./types";

export interface IDecodedRows {
    header: string[];
    rows: string[][];
    truncated: boolean;
}

interface IComponentType {
    ctor: new (buffer: ArrayBuffer) => ArrayLike<number>;
    size: number;
    max: number;
    half?: boolean;
}

const COMPONENT_TYPES: { [name: string]: IComponentType } = {
    BYTE: { ctor: Int8Array, size: 1, max: 127 },
    UNSIGNED_BYTE: { ctor: Uint8Array, size: 1, max: 255 },
    SHORT: { ctor: Int16Array, size: 2, max: 32767 },
    UNSIGNED_SHORT: { ctor: Uint16Array, size: 2, max: 65535 },
    INT: { ctor: Int32Array, size: 4, max: 2147483647 },
    UNSIGNED_INT: { ctor: Uint32Array, size: 4, max: 4294967295 },
    FLOAT: { ctor: Float32Array, size: 4, max: 1 },
    HALF_FLOAT: { ctor: Uint16Array, size: 2, max: 1, half: true },
};

export function decodeBase64Bytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        out[i] = binary.charCodeAt(i);
    }
    return out;
}

function decodeHalf(bits: number): number {
    const exponent = (bits & 0x7c00) >> 10;
    const fraction = bits & 0x03ff;
    const sign = (bits & 0x8000) ? -1 : 1;
    if (exponent === 0) {
        return sign * Math.pow(2, -14) * (fraction / 1024);
    }
    if (exponent === 0x1f) {
        return fraction ? NaN : sign * Infinity;
    }
    return sign * Math.pow(2, exponent - 15) * (1 + fraction / 1024);
}

function format(value: number): string {
    return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(4);
}

export function decodeVertexRows(bytes: Uint8Array, layout: IBufferLayout, maxRows: number): IDecodedRows {
    const type = COMPONENT_TYPES[layout.componentType] || COMPONENT_TYPES.FLOAT;
    const components = layout.components || 1;
    const offset = layout.offset || 0;
    const stride = layout.stride || components * type.size;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    const available = Math.floor((bytes.length - offset - components * type.size) / stride) + 1;
    const count = Math.max(0, Math.min(available, maxRows));

    const header = ["#"];
    for (let c = 0; c < components; c++) {
        header.push(String.fromCharCode(120 + c)); // x, y, z, w
    }

    const rows: string[][] = [];
    for (let r = 0; r < count; r++) {
        const row = [r.toFixed(0)];
        for (let c = 0; c < components; c++) {
            let value = readComponent(view, offset + r * stride + c * type.size, type);
            if (layout.normalized && !type.half && type.max !== 1) {
                value = type.max === 255 || type.max === 65535 || type.max === 4294967295
                    ? value / type.max
                    : Math.max(value / type.max, -1);
            }
            row.push(format(value));
        }
        rows.push(row);
    }
    return { header, rows, truncated: available > count };
}

function readComponent(view: DataView, byteOffset: number, type: IComponentType): number {
    switch (type) {
        case COMPONENT_TYPES.BYTE: return view.getInt8(byteOffset);
        case COMPONENT_TYPES.UNSIGNED_BYTE: return view.getUint8(byteOffset);
        case COMPONENT_TYPES.SHORT: return view.getInt16(byteOffset, true);
        case COMPONENT_TYPES.UNSIGNED_SHORT: return view.getUint16(byteOffset, true);
        case COMPONENT_TYPES.INT: return view.getInt32(byteOffset, true);
        case COMPONENT_TYPES.UNSIGNED_INT: return view.getUint32(byteOffset, true);
        case COMPONENT_TYPES.HALF_FLOAT: return decodeHalf(view.getUint16(byteOffset, true));
        default: return view.getFloat32(byteOffset, true);
    }
}

export function decodeIndices(bytes: Uint8Array, indexType: string, maxRows: number): IDecodedRows {
    const type = COMPONENT_TYPES[indexType] || COMPONENT_TYPES.UNSIGNED_SHORT;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const available = Math.floor(bytes.length / type.size);
    const count = Math.max(0, Math.min(available, maxRows));

    const rows: string[][] = [];
    for (let i = 0; i < count; i++) {
        rows.push([i.toFixed(0), readComponent(view, i * type.size, type).toFixed(0)]);
    }
    return { header: ["#", "index"], rows, truncated: available > count };
}
