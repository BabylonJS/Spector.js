import React, { useCallback, useEffect, useRef } from "react";
import { ISourceCodeState, ISourceCodeChangeEvent } from "../../shared/types";
import { Logger } from "../../../../shared/utils/logger";

// tslint:disable-next-line:no-submodule-imports
import preprocess from "@shaderfrog/glsl-parser/preprocessor";

/**
 * Ace editor wrapper for GLSL shader source code.
 * Original: src/embeddedFrontend/resultView/sourceCode/sourceCodeComponent.ts
 *
 * DOM:
 * <div class="sourceCodeComponentContainer">
 *   <div class="sourceCodeMenuComponentContainer">
 *     <ul class="sourceCodeMenuComponent">
 *       <li><a class="[active?]" ...>Translated Vertex</a></li>  (conditional)
 *       <li><a class="[active?]" ...>Translated Fragment</a></li>  (conditional)
 *       <li><a class="[active?]" ...>Vertex</a></li>
 *       <li><a class="[active?]" ...>Fragment</a></li>
 *       <li><a ...>Close</a></li>
 *     </ul>
 *   </div>
 *   <div class="sourceCodeComponent">shader text</div>
 *   <div class="sourceCodeMenuComponentFooter">
 *     <p>
 *       <label><input type="checkbox" /> Beautify</label>
 *       <label><input type="checkbox" /> Preprocess</label>
 *     </p>
 *   </div>
 * </div>
 *
 * Uses Ace editor (global `ace` object). Editor instance is held in a ref
 * to avoid re-mounting on every render. Editor cleanup via useEffect return.
 */

// Declare Ace types.
interface IAceEditorSession {
    setMode(mode: string): void;
    on(eventName: string, callback: (e: any) => void): void;
    setAnnotations(annotations: any[]): void;
}
interface IAceEditor {
    getValue(): string;
    setValue(val: string, cursorPos?: number): void;
    setTheme(theme: string): void;
    getSession(): IAceEditorSession;
    setReadOnly(readonly: boolean): void;
    setShowPrintMargin(show: boolean): void;
    destroy(): void;
}
type AceStatic = {
    edit(element: Element): IAceEditor;
};
declare const ace: AceStatic;

const semicolonReplacementKey = "[[[semicolonReplacementKey]]]";
const semicolonReplacementKeyRegex = /\[\[\[semicolonReplacementKey\]\]\]/g;
const openCurlyReplacementKey = "[[[openCurlyReplacementKey]]]";
const openCurlyReplacementKeyRegex = /\[\[\[openCurlyReplacementKey\]\]\]/g;
const closeCurlyReplacementKey = "[[[closeCurlyReplacementKey]]]";
const closeCurlyReplacementKeyRegex = /\[\[\[closeCurlyReplacementKey\]\]\]/g;

export interface SourceCodeProps {
    state: ISourceCodeState;
    errorMessage?: string;
    onVertexSourceClicked: () => void;
    onFragmentSourceClicked: () => void;
    onTranslatedVertexSourceClicked?: () => void;
    onTranslatedFragmentSourceClicked?: () => void;
    onCloseClicked: () => void;
    onSourceCodeChanged: (event: ISourceCodeChangeEvent) => void;
    onBeautifyChanged: (beautify: boolean) => void;
    onPreprocessChanged: (preprocessed: boolean) => void;
}

export function SourceCode({
    state,
    errorMessage,
    onVertexSourceClicked,
    onFragmentSourceClicked,
    onTranslatedVertexSourceClicked,
    onTranslatedFragmentSourceClicked,
    onCloseClicked,
    onSourceCodeChanged,
    onBeautifyChanged,
    onPreprocessChanged,
}: SourceCodeProps) {
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<IAceEditor | null>(null);
    const timeoutRef = useRef<number>(-1);

    // Compute the displayed shader text.
    let originalShader: string;
    let preprocessed = state.preprocessed;

    if (state.translated) {
        originalShader = state.fragment ? state.translatedSourceFragment : state.translatedSourceVertex;
        preprocessed = false;
    } else {
        originalShader = (state.fragment ? state.sourceFragment : state.sourceVertex) ?? "";
    }

    let displayedShader = originalShader;
    if (preprocessed) {
        try {
            displayedShader = preprocess(displayedShader, {
                preserveComments: false,
                stopOnError: true,
            });
        } catch (e) {
            Logger.error("shader preprocess failed", e);
        }
    }

    if (state.beautify) {
        displayedShader = indentIfdef(beautify(displayedShader));
    }

    // Initialize Ace editor once, update content on state changes.
    useEffect(() => {
        if (!editorContainerRef.current) return undefined;

        if (!editorRef.current) {
            const editor = ace.edit(editorContainerRef.current);
            editor.setTheme("ace/theme/monokai");
            editor.getSession().setMode("ace/mode/glsl");
            editor.setShowPrintMargin(false);
            editorRef.current = editor;
        }

        const editor = editorRef.current;
        editor.setReadOnly(!state.editable || state.translated);

        // Only update value if it differs (avoid cursor-reset on no-op).
        if (editor.getValue() !== displayedShader) {
            editor.setValue(displayedShader, -1);
        }

        // Change handler with 1500ms debounce.
        const changeHandler = () => {
            if (timeoutRef.current !== -1) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                const currentValue = editor.getValue();
                const event: ISourceCodeChangeEvent = {
                    sourceVertex: state.fragment ? state.sourceVertex : currentValue,
                    sourceFragment: state.fragment ? currentValue : state.sourceFragment,
                    translatedSourceVertex: state.translatedSourceVertex,
                    translatedSourceFragment: state.translatedSourceFragment,
                    programId: state.programId,
                };
                onSourceCodeChanged(event);
            }, 1500) as any;
        };

        editor.getSession().on("change", changeHandler);

        return () => {
            if (timeoutRef.current !== -1) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = -1;
            }
        };
    }, [displayedShader, state.editable, state.translated, state.fragment,
        state.sourceVertex, state.sourceFragment, state.translatedSourceVertex,
        state.translatedSourceFragment, state.programId, onSourceCodeChanged]);

    // Error annotations.
    useEffect(() => {
        if (!editorRef.current) return;

        const msg = errorMessage || "";
        const annotations: any[] = [];

        if (msg) {
            const errorChecker = /^.*ERROR:\W([0-9]+):([0-9]+):(.*)$/gm;
            let errors = errorChecker.exec(msg);
            while (errors != null) {
                annotations.push({
                    row: +errors[2] - 1,
                    column: errors[1],
                    text: errors[3] || "Error",
                    type: "error",
                });
                errors = errorChecker.exec(msg);
            }
        }

        editorRef.current.getSession().setAnnotations(annotations);
    }, [errorMessage]);

    // Cleanup editor on unmount.
    useEffect(() => {
        return () => {
            if (editorRef.current) {
                editorRef.current.destroy();
                editorRef.current = null;
            }
        };
    }, []);

    const handleVertexClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        onVertexSourceClicked();
    }, [onVertexSourceClicked]);

    const handleFragmentClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        onFragmentSourceClicked();
    }, [onFragmentSourceClicked]);

    const handleTranslatedVertexClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        onTranslatedVertexSourceClicked?.();
    }, [onTranslatedVertexSourceClicked]);

    const handleTranslatedFragmentClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        onTranslatedFragmentSourceClicked?.();
    }, [onTranslatedFragmentSourceClicked]);

    const handleCloseClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        onCloseClicked();
    }, [onCloseClicked]);

    const handleBeautifyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onBeautifyChanged(e.target.checked);
    }, [onBeautifyChanged]);

    const handlePreprocessChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onPreprocessChanged(e.target.checked);
    }, [onPreprocessChanged]);

    return (
        <div className="sourceCodeComponentContainer">
            <div className="sourceCodeMenuComponentContainer">
                <ul className="sourceCodeMenuComponent">
                    {state.translatedSourceVertex && (
                        <li>
                            <a
                                className={!state.fragment && state.translated ? "active" : ""}
                                href="#"
                                role="button"
                                commandName="onTranslatedVertexSourceClicked"
                                onClick={handleTranslatedVertexClick}
                            >Translated Vertex</a>
                        </li>
                    )}
                    {state.translatedSourceFragment && (
                        <li>
                            <a
                                className={state.fragment && state.translated ? "active" : ""}
                                href="#"
                                role="button"
                                commandName="onTranslatedFragmentSourceClicked"
                                onClick={handleTranslatedFragmentClick}
                            >Translated Fragment</a>
                        </li>
                    )}
                    <li>
                        <a
                            className={!state.fragment && !state.translated ? "active" : ""}
                            href="#"
                            role="button"
                            commandName="onVertexSourceClicked"
                            onClick={handleVertexClick}
                        >Vertex</a>
                    </li>
                    <li>
                        <a
                            className={state.fragment && !state.translated ? "active" : ""}
                            href="#"
                            role="button"
                            commandName="onFragmentSourceClicked"
                            onClick={handleFragmentClick}
                        >Fragment</a>
                    </li>
                    <li>
                        <a
                            href="#"
                            role="button"
                            commandName="onSourceCodeCloseClicked"
                            onClick={handleCloseClick}
                        >Close</a>
                    </li>
                </ul>
            </div>
            <div className="sourceCodeComponent" ref={editorContainerRef}>
                {displayedShader}
            </div>
            <div className="sourceCodeMenuComponentFooter">
                <p>
                    <label>
                        <input
                            type="checkbox"
                            commandName="onBeautifyChanged"
                            checked={state.beautify}
                            onChange={handleBeautifyChange}
                        /> Beautify
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            commandName="onPreprocessChanged"
                            checked={state.preprocessed}
                            onChange={handlePreprocessChange}
                        /> Preprocess
                    </label>
                </p>
            </div>
        </div>
    );
}

// ─── Beautify utilities (ported from original SourceCodeComponent) ────────────

function adaptComments(str: string): string {
    let singleLineComment = false;
    let multiLineComment = false;

    for (let index = 0; index < str.length; index++) {
        const char = str[index];
        if (char === "/") {
            if (str[index - 1] === "*") {
                multiLineComment = false;
            } else if (str[index + 1] === "*") {
                if (!singleLineComment) {
                    multiLineComment = true;
                    index++;
                }
            } else if (str[index + 1] === "/") {
                if (!multiLineComment) {
                    singleLineComment = true;
                    index++;
                }
            }
        } else if (char === "\n") {
            singleLineComment = false;
        } else if (char === ";") {
            if (singleLineComment || multiLineComment) {
                str = str.substr(0, index) + semicolonReplacementKey + str.substr(index + 1);
            }
        } else if (char === "{") {
            if (singleLineComment || multiLineComment) {
                str = str.substr(0, index) + openCurlyReplacementKey + str.substr(index + 1);
            }
        } else if (char === "}") {
            if (singleLineComment || multiLineComment) {
                str = str.substr(0, index) + closeCurlyReplacementKey + str.substr(index + 1);
            }
        }
    }

    return str;
}

function getBracket(str: string, searchFrom = -1): { firstIteration: number; lastIteration: number } {
    const fb = str.indexOf("{", searchFrom);
    const arr = str.substr(fb + 1).split("");
    let counter = 1;
    let currentPosInString = fb;
    let lastBracketIndex = 0;
    for (const char of arr) {
        currentPosInString++;
        if (char === "{") counter++;
        if (char === "}") counter--;
        if (counter === 0) {
            lastBracketIndex = currentPosInString;
            break;
        }
    }

    // More open than close.
    if (fb > -1 && lastBracketIndex === 0) {
        return getBracket(str, fb + 1);
    }

    return { firstIteration: fb, lastIteration: lastBracketIndex };
}

function beautify(glsl: string, level: number = 0): string {
    let spaces = "";
    for (let i = 0; i < level; i++) {
        spaces += "    ";
    }

    const untrimmedGlsl = glsl;
    glsl = glsl.trim();

    if (glsl[0] === "#") {
        const preprocessorStart = untrimmedGlsl.indexOf("#");
        const newline = untrimmedGlsl.indexOf("\n");
        let preservedNewline = "";
        if (newline !== -1) {
            if (newline < preprocessorStart) {
                preservedNewline = spaces + "\n";
            }
        }

        const firstLineEnd = glsl.indexOf("\n");
        const preprocessorLineEnd = firstLineEnd !== -1 ? firstLineEnd : glsl.length;
        const preprocessorLine = glsl.substr(0, preprocessorLineEnd);
        const rest = glsl.substr(preprocessorLineEnd + 1);

        return preservedNewline + spaces + preprocessorLine + "\n" + beautify(rest, level);
    }

    glsl = adaptComments(glsl);
    const brackets = getBracket(glsl);
    const firstBracket = brackets.firstIteration;
    const lastBracket = brackets.lastIteration;

    let result: string;
    if (firstBracket === -1) {
        glsl = spaces + glsl;
        glsl = glsl.replace(/;(?![^\(]*\))\s*(\/\/.*)?/g, (x) => x.trim() + "\n");
        glsl = glsl.replace(/\s*([*+-/=><\s]*=)\s*/g, (x) => " " + x.trim() + " ");
        glsl = glsl.replace(/\s*(,)\s*/g, (x) => x.trim() + " ");
        glsl = glsl.replace(/\n[ \t]+/g, "\n");
        glsl = glsl.replace(/\n/g, "\n" + spaces);
        glsl = glsl.replace(/\s+$/g, "");
        glsl = glsl.replace(/\n+$/g, "");
        result = glsl;
    } else {
        const left = glsl.substr(0, firstBracket).trim();
        const right = glsl.substr(lastBracket + 1, glsl.length).trim();
        const inside = glsl.substr(firstBracket + 1, lastBracket - firstBracket - 1).trim();
        const prettyLeft = left === "" ? spaces + "{" : beautify(left, level) + " {\n";
        const prettyInside = beautify(inside, level + 1);
        const prettyRight = beautify(right, level);
        result = prettyLeft + prettyInside + "\n" + spaces + "}\n" + prettyRight;
        result = result.replace(/\s*\n+\s*;/g, ";");
    }

    result = result.replace(semicolonReplacementKeyRegex, ";");
    result = result.replace(openCurlyReplacementKeyRegex, "{");
    result = result.replace(closeCurlyReplacementKeyRegex, "}");

    return result;
}

function indentIfdef(str: string): string {
    let level = 0;
    const arr2 = str.split("\n");

    for (let index = 0; index < arr2.length; index++) {
        const line = arr2[index];
        if (line.indexOf("#endif") !== -1) level--;
        if (line.indexOf("#else") !== -1) level--;
        let spaces = "";
        for (let i = 0; i < level; i++) {
            spaces += "    ";
        }
        arr2[index] = spaces + line;
        if (line.indexOf("#if") !== -1 || line.indexOf("#else") !== -1) {
            level++;
        }
    }
    return arr2.join("\n");
}
