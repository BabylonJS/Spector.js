import { WebGLParameterNameHelper } from "../../../src/embeddedFrontend/react/shared/webglParameterNameHelper";
import { webglParameterNames } from "../../../src/embeddedFrontend/react/shared/webglParameterNames";

describe("WebGLParameterNameHelper", () => {
    describe("generated data sanity", () => {
        it("contains a large set of WebGL functions", () => {
            expect(Object.keys(webglParameterNames).length).toBeGreaterThan(150);
        });

        it("has the exact vertexAttribPointer signature from issue #56", () => {
            expect(webglParameterNames["vertexAttribPointer"]).toEqual([
                ["index", "size", "type", "normalized", "stride", "offset"],
            ]);
        });
    });

    describe("getNames", () => {
        it("returns the single signature for a non-overloaded function", () => {
            expect(WebGLParameterNameHelper.getNames("vertexAttribPointer", 6)).toEqual([
                "index", "size", "type", "normalized", "stride", "offset",
            ]);
        });

        it("returns null for an unknown function", () => {
            expect(WebGLParameterNameHelper.getNames("notARealGlFunction", 3)).toBeNull();
        });

        it("prefers an exact-arity overload", () => {
            // texImage2D has both a 6-arg and a 9-arg form.
            const six = WebGLParameterNameHelper.getNames("texImage2D", 6);
            expect(six).not.toBeNull();
            expect(six!.length).toBe(6);

            const nine = WebGLParameterNameHelper.getNames("texImage2D", 9);
            expect(nine).not.toBeNull();
            expect(nine!.length).toBe(9);
        });

        it("falls back to the shortest covering overload when arity does not match", () => {
            // bufferData overloads have arities 3 and 5. A 4-arg call has no exact
            // match, so it should pick the 5-arg (shortest that covers 4).
            const names = WebGLParameterNameHelper.getNames("bufferData", 4);
            expect(names).not.toBeNull();
            expect(names!.length).toBe(5);
            expect(names!.slice(0, 3)).toEqual(["target", "srcData", "usage"]);
        });

        it("falls back to the longest overload when argCount exceeds every signature", () => {
            const names = WebGLParameterNameHelper.getNames("clear", 5); // clear takes 1 arg
            expect(names).toEqual(["mask"]);
        });
    });

    describe("getName", () => {
        it("returns the name for a valid index", () => {
            expect(WebGLParameterNameHelper.getName("vertexAttribPointer", 2, 6)).toBe("type");
            expect(WebGLParameterNameHelper.getName("vertexAttribPointer", 0, 6)).toBe("index");
        });

        it("returns null for an out-of-range index", () => {
            expect(WebGLParameterNameHelper.getName("clear", 3, 1)).toBeNull();
        });

        it("returns null for a negative index", () => {
            expect(WebGLParameterNameHelper.getName("clear", -1, 1)).toBeNull();
        });

        it("returns null for an unknown function", () => {
            expect(WebGLParameterNameHelper.getName("notARealGlFunction", 0, 1)).toBeNull();
        });
    });
});
