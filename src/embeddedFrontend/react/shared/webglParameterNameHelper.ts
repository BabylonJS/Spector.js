import { webglParameterNames } from "./webglParameterNames";

/**
 * Resolves human-readable parameter names for WebGL / WebGL2 command arguments.
 *
 * The underlying data ({@link webglParameterNames}) is generated from
 * TypeScript's `lib.dom.d.ts` and maps each function to one or more overload
 * signatures (parameter-name lists). This helper picks the signature that best
 * matches the number of arguments actually captured.
 */
export class WebGLParameterNameHelper {
    /**
     * Return the parameter-name list that best matches a call with `argCount`
     * arguments, or `null` when the function is unknown (e.g. an extension
     * method not present in the DOM typings).
     *
     * Resolution order:
     *  1. An overload whose arity exactly matches `argCount`.
     *  2. Otherwise the shortest overload that still covers every argument.
     *  3. Otherwise the longest known overload.
     */
    public static getNames(functionName: string, argCount: number): string[] | null {
        const overloads = webglParameterNames[functionName];
        if (!overloads || overloads.length === 0) {
            return null;
        }

        // 1. Exact arity match.
        for (const overload of overloads) {
            if (overload.length === argCount) {
                return overload;
            }
        }

        // 2. Shortest overload that covers all provided arguments.
        let cover: string[] | null = null;
        for (const overload of overloads) {
            if (overload.length >= argCount && (cover === null || overload.length < cover.length)) {
                cover = overload;
            }
        }
        if (cover) {
            return cover;
        }

        // 3. Longest known overload.
        let longest = overloads[0];
        for (const overload of overloads) {
            if (overload.length > longest.length) {
                longest = overload;
            }
        }
        return longest;
    }

    /**
     * Return the parameter name for a single argument, or `null` when unknown.
     *
     * @param functionName - The WebGL command name (e.g. `"vertexAttribPointer"`).
     * @param index        - Zero-based argument index.
     * @param argCount     - Total number of arguments in the captured call,
     *                       used to disambiguate overloads.
     */
    public static getName(functionName: string, index: number, argCount: number): string | null {
        const names = WebGLParameterNameHelper.getNames(functionName, argCount);
        if (names && index >= 0 && index < names.length) {
            return names[index];
        }
        return null;
    }
}
