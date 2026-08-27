import { CompileShader } from "../../../../src/backend/commands/compileShader";
import { GetShaderInfoLog } from "../../../../src/backend/commands/getShaderInfoLog";
import { LinkProgram } from "../../../../src/backend/commands/linkProgram";
import { ShaderSource } from "../../../../src/backend/commands/shaderSource";
import { IContextInformation } from "../../../../src/backend/types/contextInformation";
import { IFunctionInformation } from "../../../../src/backend/types/functionInformation";
import { WebGlConstants } from "../../../../src/backend/types/webglConstants";
import { WebGlObjects } from "../../../../src/backend/webGlObjects/baseWebGlObject";
import { createMockWebGLContext } from "../../mocks/webglMock";

const source = [
    "precision mediump float;",
    "void main(){gl_FragColor=vec4(1.0);}",
    "// Ensure the source exceeds the generic argument truncation threshold.",
].join("\n");
const infoLog = [
    "WARNING: 0:2: implicit conversion",
    "ERROR: 0:2: invalid expression",
].join("\n");
const programInfoLog = "Link failed: varying type mismatch";

function functionInformation(name: string, args: any[], result?: any): IFunctionInformation {
    return {
        name,
        arguments: args as unknown as IArguments,
        result,
        startTime: 1,
        endTime: 2,
    };
}

function createOptions(compileStatus: boolean): {
    options: IContextInformation;
    shader: WebGLShader;
    toggleCapture: jest.Mock;
} {
    const shader = {} as WebGLShader;
    WebGlObjects.attachWebGlObjectTag(shader, {
        id: 7,
        typeName: "WebGLShader",
    });

    const context = createMockWebGLContext({
        getShaderSource: jest.fn().mockReturnValue(source),
        getShaderInfoLog: jest.fn().mockReturnValue(infoLog),
        getShaderParameter: jest.fn((_shader: WebGLShader, parameter: number) => {
            if (parameter === WebGlConstants.SHADER_TYPE.value) {
                return WebGlConstants.FRAGMENT_SHADER.value;
            }
            if (parameter === WebGlConstants.COMPILE_STATUS.value) {
                return compileStatus;
            }
            return null;
        }),
    });
    const toggleCapture = jest.fn();

    return {
        shader,
        toggleCapture,
        options: {
            context,
            contextVersion: 1,
            toggleCapture,
            extensions: {},
        },
    };
}

describe("shader command capture", () => {
    it("keeps shaderSource compact while retaining the exact source", () => {
        const { options, shader, toggleCapture } = createOptions(false);
        const command = new ShaderSource(options);

        const capture = command.createCapture(
            functionInformation("shaderSource", [shader, source]),
            1,
            "",
        );

        expect(capture.text).toBe(`shaderSource: WebGLShader - ID: 7, ${source.length} chars`);
        expect(capture.text).not.toContain("gl_FragColor");
        expect(capture.commandArguments[1]).toBe(`Array Length: ${source.length}`);
        expect(capture.shader).toMatchObject({
            source,
            shaderType: "FRAGMENT_SHADER",
            COMPILE_STATUS: null,
            infoLog: "",
            translatedSource: "",
        });
        expect(toggleCapture.mock.calls).toEqual([[false], [true]]);
    });

    it("captures compile status and diagnostics after compileShader", () => {
        const { options, shader } = createOptions(false);
        const command = new CompileShader(options);

        const capture = command.createCapture(
            functionInformation("compileShader", [shader]),
            2,
            "",
        );

        expect(capture.text).toBe("compileShader: WebGLShader - ID: 7 -> failed");
        expect(capture.shader?.infoLog).toBe(infoLog);
        expect(capture.shader?.source).toBe(source);
    });

    it("summarizes getShaderInfoLog without dropping its raw result", () => {
        const { options, shader } = createOptions(false);
        const command = new GetShaderInfoLog(options);

        const capture = command.createCapture(
            functionInformation("getShaderInfoLog", [shader], infoLog),
            3,
            "",
        );

        expect(capture.text).toBe("getShaderInfoLog: WebGLShader - ID: 7 -> 2 messages");
        expect(capture.result).toBe(infoLog);
        expect(capture.shader?.source).toBe(source);
    });

    it("captures both shader sources and diagnostics after linkProgram", () => {
        const { options, shader, toggleCapture } = createOptions(true);
        const program = {} as WebGLProgram;
        WebGlObjects.attachWebGlObjectTag(program, {
            id: 8,
            typeName: "WebGLProgram",
        });
        const context = options.context as any;
        context.getAttachedShaders = jest.fn().mockReturnValue([shader]);
        context.getProgramInfoLog = jest.fn().mockReturnValue(programInfoLog);
        context.getProgramParameter = jest.fn((_program: WebGLProgram, parameter: number) =>
            parameter === WebGlConstants.LINK_STATUS.value ? false : true);
        const command = new LinkProgram(options);

        const capture = command.createCapture(
            functionInformation("linkProgram", [program]),
            4,
            "",
        );

        expect(capture.text).toBe("linkProgram: WebGLProgram - ID: 8 -> failed");
        expect(capture.program?.programStatus).toMatchObject({
            LINK_STATUS: false,
            infoLog: programInfoLog,
        });
        expect(capture.program?.shaders[1]).toMatchObject({
            source,
            COMPILE_STATUS: true,
        });
        expect(toggleCapture.mock.calls).toEqual([[false], [true]]);
    });
});
