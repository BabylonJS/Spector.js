import { WebGlConstants, WebGlConstantsByValue } from "../types/webglConstants";
import { WebGLRenderingContexts } from "../types/contextInformation";
import { IProgramCapture, IShaderCapture } from "../../shared/capture/programCapture";

export class ReadProgramHelper {
    public static getProgramData(context: WebGLRenderingContexts, program: WebGLProgram): IProgramCapture {
        const programStatus = {
            LINK_STATUS: context.getProgramParameter(program, WebGlConstants.LINK_STATUS.value),
            VALIDATE_STATUS: context.getProgramParameter(program, WebGlConstants.VALIDATE_STATUS.value),
        };

        const webGLshaders = context.getAttachedShaders(program);
        const shaders = new Array(2);

        let length = 0;
        for (const shader of webGLshaders) {
            const shaderState = this.readShaderFromContext(context, shader);
            length += shaderState.source.length;

            if (shaderState.fragment) {
                shaders[1] = shaderState;
            }
            else {
                shaders[0] = shaderState;
            }
        }

        return {
            programStatus,
            shaders,
            length,
        };
    }

    private static readShaderFromContext(context: WebGLRenderingContexts, shader: WebGLShader): IShaderCapture {
        const source = context.getShaderSource(shader);
        const ext = context.getExtension("WEBGL_debug_shaders");
        const translatedSource = ext ? ext.getTranslatedShaderSource(shader) : null;

        const shaderTypeValue = context.getShaderParameter(shader, WebGlConstants.SHADER_TYPE.value);
        const isFragment = shaderTypeValue === WebGlConstants.FRAGMENT_SHADER.value;

        const nameInMetadata = (shader && (shader as any).__SPECTOR_Metadata && (shader as any).__SPECTOR_Metadata.name);
        let name = nameInMetadata ?
            (shader as any).__SPECTOR_Metadata.name :
            this.readNameFromShaderSource(source);

        if (!name) {
            name = (isFragment) ? "Fragment" : "Vertex";
        }

        return {
            COMPILE_STATUS: context.getShaderParameter(shader, WebGlConstants.COMPILE_STATUS.value),
            fragment: isFragment,
            name,
            source,
            translatedSource,
        };
    }

    // Thx to https://github.com/spite/ShaderEditorExtension/blob/7b9483fdf5c417573906bae4139ca8bc7b8a49ca/src/panel.js#L689
    // This helps displaying SHADER_NAME used in the extension.
    private static readNameFromShaderSource(source: string): string {
        try {
            let name = "";
            let match;

            const shaderNameRegex = /#define[\s]+SHADER_NAME[\s]+([\S]+)(\n|$)/gi;
            match = shaderNameRegex.exec(source);
            if (match !== null) {
                if (match.index === shaderNameRegex.lastIndex) {
                    shaderNameRegex.lastIndex++;
                }
                name = match[1];
            }

            if (name === "") {
                // #define SHADER_NAME_B64 44K344Kn44O844OA44O8
                // #define SHADER_NAME_B64 8J+YjvCfmIE=
                const shaderName64Regex = /#define[\s]+SHADER_NAME_B64[\s]+([\S]+)(\n|$)/gi;
                match = shaderName64Regex.exec(source);
                if (match !== null) {
                    if (match.index === shaderName64Regex.lastIndex) {
                        shaderName64Regex.lastIndex++;
                    }

                    name = match[1];
                }

                if (name) {
                    name = decodeURIComponent(atob(name));
                }
            }

            return name;
        }
        catch (e) {
            return null;
        }
    }
}
