import { isSpectorMessage, SPECTOR_MESSAGE_PREFIX, PROTOCOL_VERSION } from "../../../../src/backend/bridge/messageProtocol";

// const enum values are inlined at compile time, so we reference the string literals directly.
const MESSAGE_TYPES = [
    "spector:context-ready",
    "spector:trigger-capture",
    "spector:capture-started",
    "spector:capture-complete",
    "spector:error",
    "spector:fps",
];

describe("messageProtocol", () => {
    describe("constants", () => {
        it("SPECTOR_MESSAGE_PREFIX is 'spector:'", () => {
            expect(SPECTOR_MESSAGE_PREFIX).toBe("spector:");
        });

        it("PROTOCOL_VERSION is 1", () => {
            expect(PROTOCOL_VERSION).toBe(1);
        });

        it("all message type strings start with the spector prefix", () => {
            for (const type of MESSAGE_TYPES) {
                expect(type.indexOf(SPECTOR_MESSAGE_PREFIX)).toBe(0);
            }
        });
    });

    describe("isSpectorMessage", () => {
        it("returns true for a valid Spector message", () => {
            expect(isSpectorMessage({ type: "spector:capture-complete", version: 1 })).toBe(true);
        });

        it("returns true for every defined message type", () => {
            for (const type of MESSAGE_TYPES) {
                expect(isSpectorMessage({ type, version: 1 })).toBe(true);
            }
        });

        it("returns false for null", () => {
            expect(isSpectorMessage(null)).toBe(false);
        });

        it("returns false for undefined", () => {
            expect(isSpectorMessage(undefined)).toBe(false);
        });

        it("returns false for a number", () => {
            expect(isSpectorMessage(42)).toBe(false);
        });

        it("returns false for a string", () => {
            expect(isSpectorMessage("spector:capture-complete")).toBe(false);
        });

        it("returns false for an object without a type property", () => {
            expect(isSpectorMessage({ version: 1 })).toBe(false);
        });

        it("returns false for an object with a non-string type", () => {
            expect(isSpectorMessage({ type: 123, version: 1 })).toBe(false);
        });

        it("returns false for an object whose type does not start with 'spector:'", () => {
            expect(isSpectorMessage({ type: "app:some-event", version: 1 })).toBe(false);
        });

        it("returns false for an empty object", () => {
            expect(isSpectorMessage({})).toBe(false);
        });

        it("returns false for an array", () => {
            expect(isSpectorMessage([{ type: "spector:error" }])).toBe(false);
        });
    });
});
