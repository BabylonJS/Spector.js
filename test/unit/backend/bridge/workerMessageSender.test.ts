import { WorkerMessageSender } from "../../../src/backend/bridge/workerMessageSender";
import { PROTOCOL_VERSION } from "../../../src/backend/bridge/messageProtocol";
import { ICapture } from "../../../src/shared/capture/capture";

class MockScope {
    public messages: any[] = [];
    public postMessage(data: any): void {
        this.messages.push(data);
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

describe("WorkerMessageSender", () => {
    let scope: MockScope;
    let sender: WorkerMessageSender;

    beforeEach(() => {
        scope = new MockScope();
        sender = new WorkerMessageSender(scope);
    });

    it("sendContextReady sends correct message", () => {
        sender.sendContextReady(2);
        expect(scope.messages).toHaveLength(1);
        const msg = scope.messages[0];
        expect(msg.type).toBe("spector:context-ready");
        expect(msg.version).toBe(PROTOCOL_VERSION);
        expect(msg.canvasCount).toBe(2);
    });

    it("sendCaptureStarted sends correct message", () => {
        sender.sendCaptureStarted();
        expect(scope.messages).toHaveLength(1);
        const msg = scope.messages[0];
        expect(msg.type).toBe("spector:capture-started");
        expect(msg.version).toBe(PROTOCOL_VERSION);
    });

    it("sendCaptureComplete sends capture data", () => {
        const capture = makeCapture();
        sender.sendCaptureComplete(capture);
        expect(scope.messages).toHaveLength(1);
        const msg = scope.messages[0];
        expect(msg.type).toBe("spector:capture-complete");
        expect(msg.version).toBe(PROTOCOL_VERSION);
        expect(msg.capture).toBe(capture);
    });

    it("sendError sends error string", () => {
        sender.sendError("something broke");
        expect(scope.messages).toHaveLength(1);
        const msg = scope.messages[0];
        expect(msg.type).toBe("spector:error");
        expect(msg.version).toBe(PROTOCOL_VERSION);
        expect(msg.error).toBe("something broke");
    });

    it("sendFps sends fps number", () => {
        sender.sendFps(59.94);
        expect(scope.messages).toHaveLength(1);
        const msg = scope.messages[0];
        expect(msg.type).toBe("spector:fps");
        expect(msg.version).toBe(PROTOCOL_VERSION);
        expect(msg.fps).toBe(59.94);
    });

    it("all messages have correct version", () => {
        sender.sendContextReady(1);
        sender.sendCaptureStarted();
        sender.sendCaptureComplete(makeCapture());
        sender.sendError("e");
        sender.sendFps(60);
        expect(scope.messages).toHaveLength(5);
        for (const msg of scope.messages) {
            expect(msg.version).toBe(PROTOCOL_VERSION);
        }
    });

    it("all messages have a type starting with 'spector:'", () => {
        sender.sendContextReady(1);
        sender.sendCaptureStarted();
        sender.sendCaptureComplete(makeCapture());
        sender.sendError("e");
        sender.sendFps(60);
        for (const msg of scope.messages) {
            expect(typeof msg.type).toBe("string");
            expect(msg.type.startsWith("spector:")).toBe(true);
        }
    });
});
