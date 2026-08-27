// tslint:disable-next-line:no-implicit-dependencies no-submodule-imports
import { format } from "prettier/standalone";
// tslint:disable-next-line:no-implicit-dependencies
import { parsers, printers } from "prettier-plugin-glsl";

const glslPlugin = { parsers, printers };

/** Format GLSL with Prettier's parser-backed GLSL plugin. */
export function formatShaderSource(source: string): Promise<string> {
    return format(source, {
        parser: "glsl-parser",
        plugins: [glslPlugin],
        printWidth: 80,
        tabWidth: 4,
        useTabs: false,
    }).then(addTopLevelSpacing);
}

/**
 * Prettier preserves blank lines from the input, but captured shaders are often
 * minified. Add the top-level separation that is missing from those sources
 * after the parser-backed formatter has established the block structure.
 */
function addTopLevelSpacing(source: string): string {
    return source
        .replace(
            /^([^\n]*;)\n(?=(?:[A-Za-z_]\w*\s+)+[A-Za-z_]\w*\s*\()/gm,
            "$1\n\n",
        )
        .replace(/^}\n(?=\S)/gm, "}\n\n");
}
