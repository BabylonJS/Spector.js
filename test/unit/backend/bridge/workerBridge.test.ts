import { WorkerBridge } from "../../../../src/backend/bridge/workerBridge";
import { PROTOCOL_VERSION } from "../../../../src/backend/bridge/messageProtocol";
import { ICapture } from "../../../../src/shared/capture/capture";

class MockWorker {
    private listeners: Map<string, Function[]> = new Map();
    public postedMessages: any[] = [];

    addEventListener(type: string, handler: Function): void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type)!.push(handler);
    }

    removeEventListener(type: string, handler: Function): void {
        const handlers = this.listeners.get(type);
        if (handlers) {
            const idx = handlers.indexOf(handler);
            if (idx >= 0) {
                handlers.splice(idx, 1);
            }
        }
    }

    postMessage(data: any): void {
        this.postedMessages.push(data);
    }

    /** Simulate receiving a message from the Worker thread. */
    simulateMessage(data: any): void {
        const handlers = this.listeners.get("message") || [];
        for (const h of handlers) {
            h({ data } as MessageEvent);
        }
    }

    /** Number of registered message listeners. */
    listenerCount(type: string): number {
        return (this.listeners.get(type) || []).length;
    }
}

function makeCapture(): ICapture {
    return {
        canvas: { width: 800, height: 600, clientWidth: 800, clientHeight: 600, browserAgent: "test" },
        context: { version: 2, contextAttributes: {}, capabilities: {}, extensions: {}, compressedTextures: {} },
        commands: [{ id: 0, name: "drawArrays", startTime: 0, endTime: 1, result: null, text: "" }],
        initState: {},
        endState: {},
        startTime: 0,
        listenCommandsStartTime: 1,
        listenCommandsEndTime: 2,
        endTime: 3,
        analyses: [],
        frameMemory: {},
        memory: {},
    } as any;
}

describe("WorkerBridge", () => {
    let worker: MockWorker;
    let bridge: WorkerBridge;

    beforeEach(() => {
        jest.useFakeTimers();
        worker = new MockWorker();
        bridge = new WorkerBridge(worker as any);
    });

    afterEach(() => {
        bridge.dispose();
        jest.useRealTimers();
    });

    // --- Message reception ---

    it("fires onCapture when CaptureComplete is received", () => {
        const capture = makeCapture();
        const handler = jest.fn();
        bridge.onCapture.add(handler);

        worker.simulateMessage({
            type: "spector:capture-complete",
            version: PROTOCOL_VERSION,
            capture,
        });

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(capture);
    });

    it("fires onError when Error is received", () => {
        const handler = jest.fn();
        bridge.onError.add(handler);

        worker.simulateMessage({
            type: "spector:error",
            version: PROTOCOL_VERSION,
            error: "GL context lost",
        });

        expect(handler).toHaveBeenCalledWith("GL context lost");
    });

    it("fires onFps when Fps is received", () => {
        const handler = jest.fn();
        bridge.onFps.add(handler);

        worker.simulateMessage({
            type: "spector:fps",
            version: PROTOCOL_VERSION,
            fps: 60,
        });

        expect(handler).toHaveBeenCalledWith(60);
    });

    it("fires onContextReady when ContextReady is received", () => {
        const handler = jest.fn();
        bridge.onContextReady.add(handler);

        worker.simulateMessage({
            type: "spector:context-ready",
            version: PROTOCOL_VERSION,
            canvasCount: 3,
            canvasWidth: 640,
            canvasHeight: 480,
        });

        expect(handler).toHaveBeenCalledWith({
            canvasCount: 3,
            canvasWidth: 640,
            canvasHeight: 480,
        });
    });

    it("fires onCaptureStarted when CaptureStarted is received", () => {
        const handler = jest.fn();
        bridge.onCaptureStarted.add(handler);

        worker.simulateMessage({
            type: "spector:capture-started",
            version: PROTOCOL_VERSION,
        });

        expect(handler).toHaveBeenCalledTimes(1);
    });

    // --- Non-Spector messages ---

    it("ignores non-Spector messages (app messages)", () => {
        const captureHandler = jest.fn();
        const errorHandler = jest.fn();
        bridge.onCapture.add(captureHandler);
        bridge.onError.add(errorHandler);

        worker.simulateMessage({ type: "app:data-ready", payload: [1, 2, 3] });
        worker.simulateMessage("plain string");
        worker.simulateMessage(null);
        worker.simulateMessage(42);

        expect(captureHandler).not.toHaveBeenCalled();
        expect(errorHandler).not.toHaveBeenCalled();
    });

    // --- triggerCapture ---

    it("triggerCapture sends correct message format to Worker", () => {
        bridge.triggerCapture(1, 500, true, false);

        expect(worker.postedMessages).toHaveLength(1);
        const msg = worker.postedMessages[0];
        expect(msg.type).toBe("spector:trigger-capture");
        expect(msg.version).toBe(PROTOCOL_VERSION);
        expect(msg.canvasIndex).toBe(1);
        expect(msg.commandCount).toBe(500);
        expect(msg.quickCapture).toBe(true);
        expect(msg.fullCapture).toBe(false);
    });

    it("triggerCapture uses default parameters", () => {
        bridge.triggerCapture();

        const msg = worker.postedMessages[0];
        expect(msg.canvasIndex).toBe(0);
        expect(msg.commandCount).toBe(0);
        expect(msg.quickCapture).toBe(false);
        expect(msg.fullCapture).toBe(false);
    });

    // --- Timeout ---

    it("capture timeout fires onError after configured delay", () => {
        const errorHandler = jest.fn();
        bridge.onError.add(errorHandler);

        bridge.triggerCapture();

        // Not yet timed out
        jest.advanceTimersByTime(9999);
        expect(errorHandler).not.toHaveBeenCalled();

        // Now it should fire
        jest.advanceTimersByTime(1);
        expect(errorHandler).toHaveBeenCalledTimes(1);
        expect(errorHandler).toHaveBeenCalledWith("Capture timed out after 10000ms");
    });

    it("custom timeout is respected", () => {
        bridge.dispose();
        bridge = new WorkerBridge(worker as any, { captureTimeout: 5000 });

        const errorHandler = jest.fn();
        bridge.onError.add(errorHandler);
        bridge.triggerCapture();

        jest.advanceTimersByTime(4999);
        expect(errorHandler).not.toHaveBeenCalled();

        jest.advanceTimersByTime(1);
        expect(errorHandler).toHaveBeenCalledWith("Capture timed out after 5000ms");
    });

    it("CaptureComplete clears the timeout", () => {
        const errorHandler = jest.fn();
        bridge.onError.add(errorHandler);

        bridge.triggerCapture();

        // Receive capture before timeout
        worker.simulateMessage({
            type: "spector:capture-complete",
            version: PROTOCOL_VERSION,
            capture: makeCapture(),
        });

        // Advance past original timeout
        jest.advanceTimersByTime(20000);
        expect(errorHandler).not.toHaveBeenCalled();
    });

    it("Error message clears the timeout", () => {
        const errorHandler = jest.fn();
        bridge.onError.add(errorHandler);

        bridge.triggerCapture();

        worker.simulateMessage({
            type: "spector:error",
            version: PROTOCOL_VERSION,
            error: "GL error",
        });

        // Only the error from the message, not the timeout
        jest.advanceTimersByTime(20000);
        expect(errorHandler).toHaveBeenCalledTimes(1);
        expect(errorHandler).toHaveBeenCalledWith("GL error");
    });

    it("new triggerCapture clears previous timeout", () => {
        const errorHandler = jest.fn();
        bridge.onError.add(errorHandler);

        bridge.triggerCapture();
        jest.advanceTimersByTime(5000); // half-way through first timeout

        bridge.triggerCapture(); // resets the timer

        jest.advanceTimersByTime(5000); // would have been first timeout
        expect(errorHandler).not.toHaveBeenCalled();

        jest.advanceTimersByTime(5000); // second timeout fires
        expect(errorHandler).toHaveBeenCalledTimes(1);
    });

    // --- dispose ---

    it("dispose removes message listener", () => {
        expect(worker.listenerCount("message")).toBe(1);
        bridge.dispose();
        expect(worker.listenerCount("message")).toBe(0);
    });

    it("dispose clears observables", () => {
        const handler = jest.fn();
        bridge.onCapture.add(handler);
        bridge.dispose();

        // Manually trigger after dispose — handler should not fire because clear() was called
        worker.simulateMessage({
            type: "spector:capture-complete",
            version: PROTOCOL_VERSION,
            capture: makeCapture(),
        });
        expect(handler).not.toHaveBeenCalled();
    });

    it("triggerCapture is a no-op after dispose", () => {
        bridge.dispose();
        bridge.triggerCapture();
        expect(worker.postedMessages).toHaveLength(0);
    });

    it("double dispose is safe", () => {
        bridge.dispose();
        expect(() => bridge.dispose()).not.toThrow();
    });

    // --- Multiple bridges ---

    it("two bridges on different workers are independent", () => {
        const worker2 = new MockWorker();
        const bridge2 = new WorkerBridge(worker2 as any);

        const handler1 = jest.fn();
        const handler2 = jest.fn();
        bridge.onCapture.add(handler1);
        bridge2.onCapture.add(handler2);

        const capture = makeCapture();
        worker.simulateMessage({
            type: "spector:capture-complete",
            version: PROTOCOL_VERSION,
            capture,
        });

        expect(handler1).toHaveBeenCalledTimes(1);
        expect(handler2).not.toHaveBeenCalled();

        bridge2.dispose();
    });
});
