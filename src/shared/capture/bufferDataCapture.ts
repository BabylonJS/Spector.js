export interface IBufferDataCapture {
    /** Base64 of the captured bytes, truncated to the byte cap when `capped`. */
    data: string;
    /** Total byte length even when `data` was truncated. */
    byteLength: number;
    capped: boolean;
    usage?: string;
}
