import { BufferRecorder } from "../../../../src/backend/recorders/bufferRecorder";
import { WebGlConstants } from "../../../../src/backend/types/webglConstants";
import { WebGlObjects } from "../../../../src/backend/webGlObjects/baseWebGlObject";
import { IContextInformation } from "../../../../src/backend/types/contextInformation";
import { ICapture } from "../../../../src/shared/capture/capture";

/** A tagged fake WebGLBuffer plus a context that reports it as the ARRAY_BUFFER binding. */
function setup(id: number): { recorder: BufferRecorder; buffer: any; call: (fn: any) => void } {
    const buffer: any = {};
    WebGlObjects.attachWebGlObjectTag(buffer, { typeName: "WebGLBuffer", id });

    const context: any = {
        getParameter: (parameter: number) =>
            parameter === WebGlConstants.ARRAY_BUFFER_BINDING.value ? buffer : null,
    };
    const options = {
        context,
        contextVersion: 1,
        toggleCapture: () => { /* no-op in tests */ },
    } as unknown as IContextInformation;

    const recorder = new BufferRecorder(options);
    // updateWithoutSideEffects is the registered dispatch entry for bufferData/bufferSubData.
    const call = (fn: any) => (recorder as any).updateWithoutSideEffects(fn);
    return { recorder, buffer, call };
}

/** Decode the base64 payload of a captured buffer into a byte array. */
function decode(base64: string): number[] {
    const binary = atob(base64);
    const out: number[] = [];
    for (let i = 0; i < binary.length; i++) {
        out.push(binary.charCodeAt(i));
    }
    return out;
}

/** Flush the recorder into a fresh capture and return its buffers map. */
function flush(recorder: BufferRecorder): ICapture["buffers"] {
    const capture = { frameMemory: {}, memory: {} } as unknown as ICapture;
    recorder.appendRecordedInformation(capture);
    return capture.buffers;
}

const bufferData = (data: any, usage = WebGlConstants.STATIC_DRAW.value) =>
    ({ name: "bufferData", arguments: [WebGlConstants.ARRAY_BUFFER.value, data, usage] });
const bufferSubData = (offset: number, data: any) =>
    ({ name: "bufferSubData", arguments: [WebGlConstants.ARRAY_BUFFER.value, offset, data] });

describe("BufferRecorder buffer-content capture", () => {
    afterEach(() => {
        BufferRecorder.cap = 4 * 1024 * 1024;
    });

    it("captures the bytes uploaded by bufferData while a capture is armed", () => {
        const { recorder, call } = setup(3);
        recorder.startCapture();
        call(bufferData(new Uint8Array([1, 2, 3, 4])));

        const buffers = flush(recorder);
        expect(buffers).toBeDefined();
        expect(buffers![3].byteLength).toBe(4);
        expect(buffers![3].capped).toBe(false);
        expect(buffers![3].usage).toBe("STATIC_DRAW");
        expect(decode(buffers![3].data)).toEqual([1, 2, 3, 4]);
    });

    it("captures nothing when no capture is armed (record-only-while-recording)", () => {
        const { recorder, call } = setup(3);
        // No startCapture(): capturing is false.
        call(bufferData(new Uint8Array([1, 2, 3, 4])));
        expect(flush(recorder)).toBeUndefined();
    });

    it("clears captured bytes at the start of each armed capture", () => {
        const { recorder, call } = setup(3);
        recorder.startCapture();
        call(bufferData(new Uint8Array([1, 2, 3, 4])));
        recorder.startCapture(); // arm again — previous frame's bytes must not leak
        expect(flush(recorder)).toBeUndefined();
    });

    it("merges bufferSubData writes into the stored copy at the byte offset", () => {
        const { recorder, call } = setup(5);
        recorder.startCapture();
        call(bufferData(new Uint8Array([0, 0, 0, 0, 0, 0])));
        call(bufferSubData(2, new Uint8Array([9, 8])));

        const buffers = flush(recorder);
        expect(decode(buffers![5].data)).toEqual([0, 0, 9, 8, 0, 0]);
        expect(buffers![5].byteLength).toBe(6);
    });

    it("synthesizes storage for bufferSubData with no prior bufferData this frame", () => {
        const { recorder, call } = setup(5);
        recorder.startCapture();
        call(bufferSubData(1, new Uint8Array([7, 7])));

        const buffers = flush(recorder);
        expect(buffers![5].byteLength).toBe(3);
        expect(decode(buffers![5].data)).toEqual([0, 7, 7]);
    });

    it("truncates buffers larger than the cap but reports the true byteLength", () => {
        BufferRecorder.cap = 4;
        const { recorder, call } = setup(9);
        recorder.startCapture();
        call(bufferData(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])));

        const buffers = flush(recorder);
        expect(buffers![9].byteLength).toBe(8);
        expect(buffers![9].capped).toBe(true);
        expect(decode(buffers![9].data)).toEqual([1, 2, 3, 4]);
    });

    it("drops captured bytes when the buffer is deleted", () => {
        const { recorder, buffer, call } = setup(3);
        recorder.startCapture();
        call(bufferData(new Uint8Array([1, 2, 3, 4])));
        (recorder as any).deleteWithoutSideEffects({ name: "deleteBuffer", arguments: [buffer] });
        expect(flush(recorder)).toBeUndefined();
    });
});
