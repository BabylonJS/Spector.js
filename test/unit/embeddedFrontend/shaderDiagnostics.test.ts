import { parseShaderCompilerLog } from "../../../src/embeddedFrontend/react/shared/shaderDiagnostics";

describe("parseShaderCompilerLog", () => {
    it("parses ANGLE errors, warnings, and optional columns", () => {
        expect(parseShaderCompilerLog([
            "ERROR: 0:12: undeclared identifier",
            "WARNING: 0:7:3: implicit conversion",
        ].join("\n"))).toEqual([
            {
                row: 11,
                column: 0,
                text: "undeclared identifier",
                type: "error",
            },
            {
                row: 6,
                column: 2,
                text: "implicit conversion",
                type: "warning",
            },
        ]);
    });

    it("parses NVIDIA and Mesa locations", () => {
        expect(parseShaderCompilerLog([
            "0(9) : error C0000: syntax error",
            "0:4(8): warning: extension is not supported",
        ].join("\n"))).toEqual([
            {
                row: 8,
                column: 0,
                text: "C0000: syntax error",
                type: "error",
            },
            {
                row: 3,
                column: 7,
                text: "extension is not supported",
                type: "warning",
            },
        ]);
    });

    it("retains unlocated compiler messages at the first line", () => {
        expect(parseShaderCompilerLog("Shader compiler failed unexpectedly")).toEqual([
            {
                row: 0,
                column: 0,
                text: "Shader compiler failed unexpectedly",
                type: "info",
            },
        ]);
    });

    it("ignores null terminators in browser compiler logs", () => {
        expect(parseShaderCompilerLog("ERROR: 0:3: invalid expression\n\0")).toEqual([
            {
                row: 2,
                column: 0,
                text: "invalid expression",
                type: "error",
            },
        ]);
    });
});
