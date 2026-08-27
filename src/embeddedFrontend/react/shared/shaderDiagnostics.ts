export type ShaderDiagnosticType = "error" | "warning" | "info";

export interface IShaderDiagnostic {
    row: number;
    column: number;
    text: string;
    type: ShaderDiagnosticType;
}

function diagnostic(type: string, line: string, column: string, text: string): IShaderDiagnostic {
    return {
        row: Math.max(0, parseInt(line, 10) - 1),
        column: column ? Math.max(0, parseInt(column, 10) - 1) : 0,
        text: text.trim() || type,
        type: type.toLowerCase() as ShaderDiagnosticType,
    };
}

/**
 * Parse the common ANGLE, Mesa, Firefox, and NVIDIA WebGL compiler-log
 * formats into Ace editor annotations.
 */
export function parseShaderCompilerLog(log: string): IShaderDiagnostic[] {
    if (!log) {
        return [];
    }

    const diagnostics: IShaderDiagnostic[] = [];
    const lines = log.split(/\r?\n/);

    for (const rawLine of lines) {
        const line = rawLine.replace(/\0/g, "").trim();
        if (!line) {
            continue;
        }

        // ANGLE/WebGL: ERROR: source-id:line[:column]: message
        let match = /^(error|warning|info)\s*:\s*\d+\s*:\s*(\d+)(?:\s*:\s*(\d+))?\s*:\s*(.*)$/i.exec(line);
        if (match) {
            diagnostics.push(diagnostic(match[1], match[2], match[3], match[4]));
            continue;
        }

        // NVIDIA: source-id(line) : error message
        match = /^\d+\s*\(\s*(\d+)\s*\)\s*:\s*(error|warning|info)\b\s*:?\s*(.*)$/i.exec(line);
        if (match) {
            diagnostics.push(diagnostic(match[2], match[1], "", match[3]));
            continue;
        }

        // Mesa/Firefox: source-id:line[(column)]: error: message
        match = /^\d+\s*:\s*(\d+)(?:\s*\(\s*(\d+)\s*\))?\s*:\s*(error|warning|info)\b\s*:?\s*(.*)$/i.exec(line);
        if (match) {
            diagnostics.push(diagnostic(match[3], match[1], match[2], match[4]));
            continue;
        }

        const severity = /\b(error|warning|info)\b/i.exec(line);
        diagnostics.push({
            row: 0,
            column: 0,
            text: line,
            type: severity ? severity[1].toLowerCase() as ShaderDiagnosticType : "info",
        });
    }

    return diagnostics;
}
