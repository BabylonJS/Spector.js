export interface IProgramCompilationError {
    readonly errorMessage: string;
    readonly linking: boolean;
}

export class ProgramRecompilerHelper {
    public static readonly rebuildProgramFunctionName = "__SPECTOR_rebuildProgram";

    public static isBuildableProgram(program: WebGLProgram): boolean {
        if (!program) {
            return false;
        }

        if (!(program as any)[this.rebuildProgramFunctionName]) {
            return false;
        }

        return true;
    }

    public static rebuildProgram(program: WebGLProgram,
        vertexSourceCode: string,
        fragmentSourceCode: string,
        onCompiled: (program: WebGLProgram) => void,
        onError: (message: string) => void): void {

        if (!this.isBuildableProgram(program)) {
            return;
        }

        // Recompile the shader sources.
        (program as any)[this.rebuildProgramFunctionName](vertexSourceCode,
            fragmentSourceCode,
            onCompiled,
            onError);
    }
}
