import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ISourceCodeState, ISourceCodeChangeEvent } from "../../shared/types";
import { Logger } from "../../../../shared/utils/logger";
import { IShaderDiagnostic, parseShaderCompilerLog } from "../../shared/shaderDiagnostics";
import { formatShaderSource } from "../../shared/shaderFormatter";

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
    off(eventName: string, callback: (e: any) => void): void;
    setAnnotations(annotations: IShaderDiagnostic[]): void;
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

interface IFormatState {
    source: string;
    formatted: string | null;
    error: string;
}

interface IShaderSelection {
    edited: boolean;
    source: string;
    preprocessed: boolean;
}

interface IShaderDisplay {
    source: string;
    formatted: boolean;
    preprocessed: boolean;
    error: string;
}

interface IEditedSources {
    vertex: boolean;
    fragment: boolean;
}

interface IShaderDraftSources {
    baseProgramId: number;
    baseVertex: string;
    baseFragment: string;
    vertex: string;
    fragment: string;
}

interface IShaderSourceContext {
    programId: number;
    sourceVertex: string;
    sourceFragment: string;
}

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

interface SourceCodeFooterProps {
    beautify: boolean;
    capturedDiagnosticsHidden: boolean;
    fragment: boolean;
    preprocessed: boolean;
    processingError: string;
    onBeautifyChanged: (beautify: boolean) => void;
    onFragmentSourceClicked: () => void;
    onPreprocessChanged: (preprocessed: boolean) => void;
    onVertexSourceClicked: () => void;
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
    const draftSourcesRef = useRef<IShaderDraftSources>({
        baseProgramId: state.programId,
        baseVertex: state.sourceVertex,
        baseFragment: state.sourceFragment,
        vertex: state.sourceVertex,
        fragment: state.sourceFragment,
    });
    const sourceContextRef = useRef<IShaderSourceContext>({
        programId: state.programId,
        sourceVertex: state.sourceVertex,
        sourceFragment: state.sourceFragment,
    });
    const [editedSources, setEditedSources] = useState<IEditedSources>({
        vertex: false,
        fragment: false,
    });
    const shaderSelection = selectShaderSource(state, draftSourcesRef.current, editedSources);
    const shaderDisplay = useShaderDisplay(shaderSelection.source, shaderSelection.preprocessed, state.beautify);
    const displayedShader = shaderDisplay.source;
    const sourceEdited = shaderSelection.edited;
    const capturedLog = [
        state.fragment ? state.sourceFragmentLog : state.sourceVertexLog,
        state.programLog,
    ].filter((message) => !!message).join("\n");
    const displaysOriginalSource = !state.translated && !shaderDisplay.preprocessed && !shaderDisplay.formatted;
    const capturedDiagnosticsHidden = areCapturedDiagnosticsHidden(
        errorMessage,
        sourceEdited,
        capturedLog,
        displaysOriginalSource,
    );

    useLayoutEffect(() => {
        sourceContextRef.current = {
            programId: state.programId,
            sourceVertex: state.sourceVertex,
            sourceFragment: state.sourceFragment,
        };
    }, [state.programId, state.sourceFragment, state.sourceVertex]);

    // Initialize Ace editor once, update content on state changes.
    useEffect(() => {
        if (!editorContainerRef.current) { return undefined; }

        if (!editorRef.current) {
            const newEditor = ace.edit(editorContainerRef.current);
            newEditor.setTheme("ace/theme/monokai");
            newEditor.getSession().setMode("ace/mode/glsl");
            newEditor.setShowPrintMargin(false);
            editorRef.current = newEditor;
        }

        const editor = editorRef.current;
        editor.setReadOnly(!state.editable || state.translated);

        // Only update value if it differs (avoid cursor-reset on no-op).
        if (editor.getValue() !== displayedShader) {
            editor.setValue(displayedShader, -1);
        }

        // Change handler with 1500ms debounce.
        const changeHandler = () => {
            const currentValue = editor.getValue();
            if (state.fragment) {
                draftSourcesRef.current.fragment = currentValue;
            }
            else {
                draftSourcesRef.current.vertex = currentValue;
            }
            setEditedSources((current) => {
                if (state.fragment) {
                    return current.fragment ? current : { ...current, fragment: true };
                }
                return current.vertex ? current : { ...current, vertex: true };
            });
            resetShaderTransformations(
                state.beautify,
                state.preprocessed,
                onBeautifyChanged,
                onPreprocessChanged,
            );
            if (timeoutRef.current !== -1) {
                clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
                timeoutRef.current = -1;
                if (!isCurrentSourceContext(sourceContextRef.current, state)) {
                    return;
                }
                const event: ISourceCodeChangeEvent = {
                    sourceVertex: draftSourcesRef.current.vertex,
                    sourceFragment: draftSourcesRef.current.fragment,
                    translatedSourceVertex: state.translatedSourceVertex,
                    translatedSourceFragment: state.translatedSourceFragment,
                    programId: state.programId,
                };
                onSourceCodeChanged(event);
            }, 1500) as any;
        };

        const listenForChanges = state.editable && !state.translated;
        if (listenForChanges) {
            editor.getSession().on("change", changeHandler);
        }

        return () => {
            if (listenForChanges) {
                editor.getSession().off("change", changeHandler);
            }
        };
    }, [displayedShader, state.editable, state.translated, state.fragment,
        state.beautify, state.preprocessed,
        state.sourceVertex, state.sourceFragment, state.translatedSourceVertex,
        state.translatedSourceFragment, state.programId, onBeautifyChanged,
        onPreprocessChanged, onSourceCodeChanged]);

    useEffect(() => {
        if (timeoutRef.current !== -1) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = -1;
        }
        draftSourcesRef.current = {
            baseProgramId: state.programId,
            baseVertex: state.sourceVertex,
            baseFragment: state.sourceFragment,
            vertex: state.sourceVertex,
            fragment: state.sourceFragment,
        };
        setEditedSources({ vertex: false, fragment: false });
    }, [state.programId, state.sourceFragment, state.sourceVertex]);

    // Error annotations.
    useEffect(() => {
        if (!editorRef.current) { return; }

        const log = errorMessage || (displaysOriginalSource && !sourceEdited ? capturedLog : "");
        editorRef.current.getSession().setAnnotations(parseShaderCompilerLog(log));
    }, [
        capturedLog,
        displaysOriginalSource,
        errorMessage,
        shaderDisplay.formatted,
        shaderDisplay.preprocessed,
        sourceEdited,
        state.beautify,
        state.fragment,
        state.programLog,
        state.sourceFragmentLog,
        state.sourceVertexLog,
        state.translated,
    ]);

    // Cleanup editor on unmount.
    useEffect(() => {
        return () => {
            if (timeoutRef.current !== -1) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = -1;
            }
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

    const showVertex = !state.singleShader || !state.fragment;
    const showFragment = !state.singleShader || state.fragment;
    const processingError = shaderDisplay.error;

    return (
        <div className="sourceCodeComponentContainer">
            <div className="sourceCodeMenuComponentContainer">
                <ul className="sourceCodeMenuComponent">
                    {showVertex && state.translatedSourceVertex && (
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
                    {showFragment && state.translatedSourceFragment && (
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
                    {showVertex && (
                        <li>
                            <a
                                className={!state.fragment && !state.translated ? "active" : ""}
                                href="#"
                                role="button"
                                commandName="onVertexSourceClicked"
                                onClick={handleVertexClick}
                            >Vertex</a>
                        </li>
                    )}
                    {showFragment && (
                        <li>
                            <a
                                className={state.fragment && !state.translated ? "active" : ""}
                                href="#"
                                role="button"
                                commandName="onFragmentSourceClicked"
                                onClick={handleFragmentClick}
                            >Fragment</a>
                        </li>
                    )}
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
            <div className="sourceCodeComponent" ref={editorContainerRef} />
            <SourceCodeFooter
                beautify={state.beautify}
                capturedDiagnosticsHidden={capturedDiagnosticsHidden}
                fragment={state.fragment}
                preprocessed={state.preprocessed}
                processingError={processingError}
                onBeautifyChanged={onBeautifyChanged}
                onFragmentSourceClicked={onFragmentSourceClicked}
                onPreprocessChanged={onPreprocessChanged}
                onVertexSourceClicked={onVertexSourceClicked}
            />
        </div>
    );
}

function SourceCodeFooter({
    beautify,
    capturedDiagnosticsHidden,
    fragment,
    preprocessed,
    processingError,
    onBeautifyChanged,
    onFragmentSourceClicked,
    onPreprocessChanged,
    onVertexSourceClicked,
}: SourceCodeFooterProps) {
    const handleBeautifyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onBeautifyChanged(e.target.checked);
    }, [onBeautifyChanged]);

    const handlePreprocessChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onPreprocessChanged(e.target.checked);
    }, [onPreprocessChanged]);

    const handleShowCapturedDiagnostics = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        (fragment ? onFragmentSourceClicked : onVertexSourceClicked)();
        onBeautifyChanged(false);
        onPreprocessChanged(false);
    }, [
        fragment,
        onBeautifyChanged,
        onFragmentSourceClicked,
        onPreprocessChanged,
        onVertexSourceClicked,
    ]);

    return (
        <div className="sourceCodeMenuComponentFooter">
            <p>
                <label>
                    <input
                        type="checkbox"
                        commandName="onBeautifyChanged"
                        checked={beautify}
                        onChange={handleBeautifyChange}
                    /> Beautify
                </label>
                <label>
                    <input
                        type="checkbox"
                        commandName="onPreprocessChanged"
                        checked={preprocessed}
                        onChange={handlePreprocessChange}
                    /> Preprocess
                </label>
                {processingError && (
                    <span className="sourceCodeFormatError" role="alert" title={processingError}>
                        Shader processing failed
                    </span>
                )}
                {capturedDiagnosticsHidden && (
                    <span className="sourceCodeDiagnosticsNotice" role="status">
                        Captured diagnostics hidden.{" "}
                        <a
                            href="#"
                            role="button"
                            commandName="onShowCapturedDiagnostics"
                            onClick={handleShowCapturedDiagnostics}
                        >Show original with diagnostics</a>
                    </span>
                )}
            </p>
        </div>
    );
}

function areCapturedDiagnosticsHidden(
    errorMessage: string,
    sourceEdited: boolean,
    capturedLog: string,
    displaysOriginalSource: boolean,
): boolean {
    return !errorMessage && !sourceEdited && !!capturedLog && !displaysOriginalSource;
}

function selectShaderSource(
    state: ISourceCodeState,
    draftSources: IShaderDraftSources,
    editedSources: IEditedSources,
): IShaderSelection {
    if (state.translated) {
        return {
            edited: false,
            source: state.fragment ? state.translatedSourceFragment : state.translatedSourceVertex,
            preprocessed: false,
        };
    }

    const baseSourcesChanged = draftSources.baseProgramId !== state.programId ||
        draftSources.baseVertex !== state.sourceVertex ||
        draftSources.baseFragment !== state.sourceFragment;
    const sourceEdited = !baseSourcesChanged && (state.fragment ? editedSources.fragment : editedSources.vertex);
    const draftSource = state.fragment ? draftSources.fragment : draftSources.vertex;
    return {
        edited: sourceEdited,
        source: sourceEdited ? draftSource : (state.fragment ? state.sourceFragment : state.sourceVertex) ?? "",
        preprocessed: state.preprocessed,
    };
}

function resetShaderTransformations(
    beautify: boolean,
    preprocessed: boolean,
    onBeautifyChanged: (beautify: boolean) => void,
    onPreprocessChanged: (preprocessed: boolean) => void,
): void {
    if (beautify) {
        onBeautifyChanged(false);
    }
    if (preprocessed) {
        onPreprocessChanged(false);
    }
}

function isCurrentSourceContext(context: IShaderSourceContext, state: ISourceCodeState): boolean {
    return context.programId === state.programId &&
        context.sourceVertex === state.sourceVertex &&
        context.sourceFragment === state.sourceFragment;
}

function getErrorMessage(error: any): string {
    return error instanceof Error ? error.message : String(error);
}

function useShaderDisplay(source: string, preprocessed: boolean, beautify: boolean): IShaderDisplay {
    const [formatState, setFormatState] = useState<IFormatState>({
        source: "",
        formatted: null,
        error: "",
    });
    let shaderToFormat = source;
    let preprocessError = "";
    let preprocessSucceeded = false;

    if (preprocessed) {
        try {
            shaderToFormat = preprocess(shaderToFormat, {
                preserveComments: false,
                stopOnError: true,
            });
            preprocessSucceeded = true;
        } catch (error) {
            preprocessError = getErrorMessage(error);
            Logger.error("shader preprocess failed: " + preprocessError);
        }
    }

    useEffect(() => {
        let active = true;
        if (!beautify) {
            setFormatState({ source: shaderToFormat, formatted: null, error: "" });
            return () => { active = false; };
        }

        setFormatState({ source: shaderToFormat, formatted: null, error: "" });
        formatShaderSource(shaderToFormat).then((formattedSource) => {
            if (active) {
                setFormatState({ source: shaderToFormat, formatted: formattedSource, error: "" });
            }
        }).catch((error) => {
            if (!active) { return; }
            const message = getErrorMessage(error);
            Logger.error("shader formatting failed: " + message);
            setFormatState({ source: shaderToFormat, formatted: null, error: message });
        });

        return () => { active = false; };
    }, [beautify, shaderToFormat]);

    const formatted = beautify && formatState.source === shaderToFormat
        ? formatState.formatted
        : null;
    return {
        source: formatted || shaderToFormat,
        formatted: !!formatted,
        preprocessed: preprocessSucceeded,
        error: (formatState.source === shaderToFormat ? formatState.error : "") || preprocessError,
    };
}
