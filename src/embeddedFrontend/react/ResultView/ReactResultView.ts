import { createRoot, Root } from "react-dom/client";
import { createElement } from "react";
import { Observable } from "../../../shared/utils/observable";
import { ICapture } from "../../../shared/capture/capture";
import { CommandCaptureStatus, ICommandCapture } from "../../../shared/capture/commandCapture";
import { ExternalStore } from "../shared/ExternalStore";
import {
    ISourceCodeChangeEvent,
    ICommandListItemState,
    IVisualStateItem,
    ISourceCodeState,
    MenuStatus,
    ResultViewState,
    JSONRenderItem,
} from "../shared/types";
import { ResultViewRoot } from "./ResultViewRoot";
import { ResultViewContext } from "./ResultViewContext";
import { MDNCommandLinkHelper } from "../shared/mdnCommandLinkHelper";

// ─── Default (empty) state ───────────────────────────────────────────────────

const EMPTY_STATE: ResultViewState = {
    visible: false,
    menuStatus: MenuStatus.Captures,
    searchText: "",
    captures: [],
    currentCapture: null,
    commands: [],
    currentCommandIndex: -1,
    visualStates: [],
    currentVisualStateIndex: -1,
    sourceCodeState: null,
    sourceCodeError: "",
    commandCount: 0,
    informationLeft: [],
    informationRight: [],
    initStateData: [],
    endStateData: [],
    commandDetailData: [],
};

// ─── Pure JSON tree builder ──────────────────────────────────────────────────

function toFilter(text: string, searchText: string): boolean {
    if (!searchText || searchText.length <= 2) {
        return false;
    }
    text = (text + "").toLowerCase();
    return text.indexOf(searchText.toLowerCase()) === -1;
}

function getJSONAsString(
    parentChildren: JSONRenderItem[],
    key: string,
    json: any,
    searchText: string,
): string | null {
    if (json === null) return "null";
    if (json === undefined) return "undefined";

    if (typeof json === "number") {
        return Math.floor(json) === json ? json.toFixed(0) : json.toFixed(4);
    }
    if (typeof json === "string") return json;
    if (typeof json === "boolean") return json ? "true" : "false";

    if (json.length === 0) return "Empty Array";

    if (json.length) {
        const arrayResult: string[] = [];
        for (let i = 0; i < json.length; i++) {
            const resultItem = getJSONAsString(parentChildren, `${key}(${i.toFixed(0)})`, json[i], searchText);
            if (resultItem !== null) {
                arrayResult.push(resultItem);
            }
        }
        return arrayResult.length === 0 ? null : arrayResult.join(", ");
    }

    if (json.help) {
        parentChildren.push({ type: "help", key, value: json.name, help: json.help });
        return null;
    }

    if (json.__SPECTOR_Object_TAG) {
        return json.__SPECTOR_Object_TAG.displayText;
    }

    if (json.displayText) {
        return json.displayText;
    }

    if (typeof json === "object") {
        buildJSONGroup(parentChildren, key, json, searchText);
    }

    return null;
}

function buildJSON(parentChildren: JSONRenderItem[], json: any, searchText: string): void {
    if (json.VisualState) {
        parentChildren.push({ type: "visualState", visualState: json.VisualState });
    }

    for (const key in json) {
        if (key === "VisualState" || key === "analyserName" || key === "source" || key === "translatedSource") {
            continue;
        }

        const value = json[key];
        if (key === "visual") {
            for (const target in value) {
                if (value.hasOwnProperty(target) && value[target]) {
                    parentChildren.push({
                        type: "image",
                        key: target,
                        value: value[target],
                        pixelated: json["samplerMagFilter"] === "NEAREST" || json["magFilter"] === "NEAREST",
                    });
                }
            }
        } else {
            const result = getJSONAsString(parentChildren, key, value, searchText);
            if (result === null || result === undefined) {
                continue;
            } else if (toFilter(key, searchText) && toFilter(value, searchText)) {
                continue;
            }

            parentChildren.push({ type: "item", key, value: result });
        }

        if (value && value.__SPECTOR_Metadata) {
            buildJSONGroup(parentChildren, "Metadata", value.__SPECTOR_Metadata, searchText);
        }
    }
}

function buildJSONGroup(
    parentChildren: JSONRenderItem[],
    title: string,
    json: any,
    searchText: string,
): void {
    if (!json) return;

    const children: JSONRenderItem[] = [];
    buildJSON(children, json, searchText);
    if (children.length === 0) return;

    parentChildren.push({ type: "group", title, children });
}

// ─── Command detail builder (pure) ──────────────────────────────────────────

function buildCommandDetail(
    command: ICommandCapture,
    visualState: any,
): JSONRenderItem[] {
    const items: JSONRenderItem[] = [];

    // Visual state thumbnail at top
    if (visualState) {
        items.push({ type: "visualState", visualState });
    }

    // Status string
    let status: string = "Unknown";
    switch (command.status) {
        case CommandCaptureStatus.Deprecated: status = "Deprecated"; break;
        case CommandCaptureStatus.Unused: status = "Unused"; break;
        case CommandCaptureStatus.Disabled: status = "Disabled"; break;
        case CommandCaptureStatus.Redundant: status = "Redundant"; break;
        case CommandCaptureStatus.Valid: status = "Valid"; break;
    }

    // Global group with name+help link, duration, result, status
    const helpLink = MDNCommandLinkHelper.getMDNLink(command.name);
    if (command.result) {
        buildJSONGroup(items, "Global", {
            name: { help: helpLink, name: command.name },
            duration: command.commandEndTime - command.startTime,
            result: command.result,
            status,
        }, "");
    } else if (command.name !== "LOG") {
        buildJSONGroup(items, "Global", {
            name: { help: helpLink, name: command.name },
            duration: command.commandEndTime - command.startTime,
            status,
        }, "");
    }

    // All object-typed properties of the command (except VisualState and result)
    for (const key in command) {
        if (key === "VisualState" || key === "result") {
            continue;
        }
        if (typeof command[key] === "object") {
            buildJSONGroup(items, key, command[key], "");
        }
    }

    return items;
}

// ─── Adapter class ──────────────────────────────────────────────────────────

/**
 * React adapter for ResultView.
 *
 * Implements the exact same public API as the original MVX-based ResultView
 * so it can be swapped in as a drop-in replacement. All orchestration logic
 * (command/visual-state building, JSON trees, keyboard navigation, search)
 * is ported from the original 821-line resultView.ts.
 */
export class ReactResultView {
    // ─── Observables ──────────────────────────────────────────────────────
    public readonly onSourceCodeChanged: Observable<ISourceCodeChangeEvent>;

    // ─── React internals ──────────────────────────────────────────────────
    public readonly store: ExternalStore<ResultViewState>;
    private readonly _root: Root;
    private readonly _container: HTMLDivElement;
    private readonly _rootPlaceHolder: Element;

    // ─── Tracking ─────────────────────────────────────────────────────────
    private _currentCommandId: number = -1;

    constructor(rootPlaceHolder: Element = null) {
        this._rootPlaceHolder = rootPlaceHolder || document.body;

        this.onSourceCodeChanged = new Observable<ISourceCodeChangeEvent>();

        // ── Store ──
        this.store = new ExternalStore<ResultViewState>({ ...EMPTY_STATE });

        // ── Mount React tree (once) ──
        this._container = document.createElement("div");
        this._container.className = "spector-react-result-view";
        this._rootPlaceHolder.appendChild(this._container);
        this._root = createRoot(this._container);
        this._root.render(
            createElement(ResultViewContext.Provider, { value: this },
                createElement(ResultViewRoot),
            ),
        );

        // ── Keyboard navigation ──
        this._rootPlaceHolder.addEventListener("keydown", (event) => {
            const state = this.store.getSnapshot();
            if (state.menuStatus !== MenuStatus.Commands) return;

            const keyCode = (event as any).keyCode;
            if (keyCode === 38) {          // Up arrow
                event.preventDefault();
                event.stopPropagation();
                this._selectPreviousCommand();
            } else if (keyCode === 40) {   // Down arrow
                event.preventDefault();
                event.stopPropagation();
                this._selectNextCommand();
            } else if (keyCode === 33) {   // Page Up
                event.preventDefault();
                event.stopPropagation();
                this._selectPreviousVisualState();
            } else if (keyCode === 34) {   // Page Down
                event.preventDefault();
                event.stopPropagation();
                this._selectNextVisualState();
            }
        });
    }

    // ─── Public API (matches original ResultView) ─────────────────────────

    public display(): void {
        this.store.setState((prev) => ({ ...prev, visible: true }));
    }

    public hide(): void {
        this.store.setState((prev) => ({ ...prev, visible: false }));
    }

    public addCapture(capture: ICapture): number {
        this.store.setState((prev) => {
            const deactivated = prev.captures.map((entry) => ({
                capture: entry.capture,
                active: false,
            }));
            return {
                ...prev,
                captures: [{ capture, active: true }, ...deactivated],
                currentCapture: capture,
            };
        });
        this._currentCommandId = -1;
        this._displayCurrentCapture();
        return 0;
    }

    public selectCapture(captureIndex: number): void {
        this._currentCommandId = -1;
        this.store.setState((prev) => {
            const captures = prev.captures.map((entry, i) => ({
                capture: entry.capture,
                active: i === captureIndex,
            }));
            return {
                ...prev,
                captures,
                currentCapture: captures[captureIndex]?.capture ?? null,
            };
        });
        this._displayCurrentCapture();
    }

    public selectCommand(commandIndex: number): void {
        const state = this.store.getSnapshot();
        if (commandIndex < 0 || commandIndex >= state.commands.length) return;

        const cmd = state.commands[commandIndex];
        this._currentCommandId = cmd.capture.id;
        const visualStateIndex = cmd.visualStateIndex;

        const commandDetailData = this._buildCommandDetail(commandIndex, state.commands, state.visualStates);

        this.store.setState((prev) => ({
            ...prev,
            commands: prev.commands.map((c, i) => (c.active !== (i === commandIndex) ? { ...c, active: i === commandIndex } : c)),
            currentCommandIndex: commandIndex,
            visualStates: prev.visualStates.map((v, i) => (v.active !== (i === visualStateIndex) ? { ...v, active: i === visualStateIndex } : v)),
            currentVisualStateIndex: visualStateIndex,
            commandDetailData,
        }));
    }

    public selectVisualState(visualStateIndex: number): void {
        const state = this.store.getSnapshot();
        if (visualStateIndex < 0 || visualStateIndex >= state.visualStates.length) return;

        const vs = state.visualStates[visualStateIndex];
        const commandIndex = vs.commandIndex;

        // Handle special sentinel values for init/end state
        if (commandIndex === Number.MIN_VALUE) {
            this._displayInitState();
            return;
        }
        if (commandIndex === Number.MAX_VALUE) {
            this._displayEndState();
            return;
        }

        if (commandIndex >= 0) {
            this._currentCommandId = state.commands[commandIndex].capture.id;
        }

        const commandDetailData = commandIndex >= 0
            ? this._buildCommandDetail(commandIndex, state.commands, state.visualStates)
            : state.commandDetailData;

        this.store.setState((prev) => ({
            ...prev,
            visualStates: prev.visualStates.map((v, i) => (v.active !== (i === visualStateIndex) ? { ...v, active: i === visualStateIndex } : v)),
            currentVisualStateIndex: visualStateIndex,
            commands: commandIndex >= 0
                ? prev.commands.map((c, i) => (c.active !== (i === commandIndex) ? { ...c, active: i === commandIndex } : c))
                : prev.commands,
            currentCommandIndex: commandIndex >= 0 ? commandIndex : prev.currentCommandIndex,
            commandDetailData,
        }));
    }

    public showSourceCodeError(error: string): void {
        this.store.setState((prev) => ({
            ...prev,
            sourceCodeError: error,
        }));
    }

    public saveCapture(capture: ICapture): void {
        const captureInString = JSON.stringify(capture, null, 4);
        const blob = new Blob([captureInString], { type: "octet/stream" });
        const fileName = "capture " + new Date(capture.startTime).toTimeString().split(" ")[0] + ".json";

        const a = document.createElement("a");
        const url = window.URL.createObjectURL(blob);
        a.setAttribute("href", url);
        a.setAttribute("download", fileName);
        a.click();
    }

    // ─── Callbacks for React components ───────────────────────────────────

    /** Called by React when user selects a menu tab. */
    public handleMenuStatusChange = (status: MenuStatus): void => {
        const state = this.store.getSnapshot();
        if (!state.currentCapture) {
            // No capture — only allow switching to Captures tab
            this.store.setState((prev) => ({ ...prev, menuStatus: MenuStatus.Captures }));
            return;
        }
        switch (status) {
            case MenuStatus.Captures:
                this._displayCaptures();
                break;
            case MenuStatus.Commands:
                this._displayCurrentCapture();
                break;
            case MenuStatus.Information:
                this._displayInformation();
                break;
            case MenuStatus.InitState:
                this._displayInitState();
                break;
            case MenuStatus.EndState:
                this._displayEndState();
                break;
        }
    };

    /** Called by React when search text changes. */
    public handleSearchTextChange = (searchText: string): void => {
        this.store.setState((prev) => ({ ...prev, searchText }));
        this._search(searchText);
    };

    /** Called by React when user selects a command. */
    public handleCommandSelected = (commandIndex: number): void => {
        this.selectCommand(commandIndex);
    };

    /** Called by React when user selects a visual state. */
    public handleVisualStateSelected = (visualStateIndex: number): void => {
        this.selectVisualState(visualStateIndex);
    };

    /** Called by React when a shader link is clicked (vertex). */
    public handleVertexSelected = (commandIndex: number): void => {
        this.selectCommand(commandIndex);
        this._openShader(false);
    };

    /** Called by React when a shader link is clicked (fragment). */
    public handleFragmentSelected = (commandIndex: number): void => {
        this.selectCommand(commandIndex);
        this._openShader(true);
    };

    /** Called by React when source code is edited. */
    public handleSourceCodeChanged = (event: ISourceCodeChangeEvent): void => {
        this.onSourceCodeChanged.trigger(event);
    };

    /** Called by React when source code close button is clicked. */
    public handleSourceCodeClose = (): void => {
        this._displayCurrentCapture();
    };

    /** Called by React when source code tab changes. */
    public handleSourceCodeTabChange = (fragment: boolean, translated: boolean): void => {
        this.store.setState((prev) => {
            if (!prev.sourceCodeState) return prev;
            return {
                ...prev,
                sourceCodeState: { ...prev.sourceCodeState, fragment, translated },
            };
        });
    };

    /** Called by React when beautify checkbox changes. */
    public handleBeautifyChanged = (beautify: boolean): void => {
        this.store.setState((prev) => {
            if (!prev.sourceCodeState) return prev;
            return {
                ...prev,
                sourceCodeState: { ...prev.sourceCodeState, beautify },
            };
        });
    };

    /** Called by React when preprocess checkbox changes. */
    public handlePreprocessChanged = (preprocessed: boolean): void => {
        this.store.setState((prev) => {
            if (!prev.sourceCodeState) return prev;
            return {
                ...prev,
                sourceCodeState: { ...prev.sourceCodeState, preprocessed },
            };
        });
    };

    /** Called by React when save is requested on a capture. */
    public handleSaveRequested = (capture: ICapture): void => {
        this.saveCapture(capture);
    };

    /** Called by React when a capture is loaded (drag-drop). */
    public handleCaptureLoaded = (capture: ICapture): void => {
        this.addCapture(capture);
    };

    /** Called by React when user clicks close on the result view. */
    public handleClose = (): void => {
        this.hide();
    };

    // ─── Private: Display modes ──────────────────────────────────────────

    private _displayCaptures(): void {
        this.store.setState((prev) => ({
            ...prev,
            menuStatus: MenuStatus.Captures,
        }));
    }

    private _displayInformation(): void {
        const state = this.store.getSnapshot();
        const capture = state.currentCapture;
        if (!capture) return;

        const leftItems: JSONRenderItem[] = [];
        buildJSONGroup(leftItems, "Canvas", capture.canvas, state.searchText);
        buildJSONGroup(leftItems, "Context", capture.context, state.searchText);

        const rightItems: JSONRenderItem[] = [];
        for (const analysis of capture.analyses) {
            const title = analysis.analyserName === "Primitives" ? "Vertices count" : analysis.analyserName;
            buildJSONGroup(rightItems, title, analysis, state.searchText);
        }
        buildJSONGroup(rightItems, "Frame Memory Changes", capture.frameMemory, state.searchText);
        buildJSONGroup(rightItems, "Total Memory (seconds since application start: bytes)", capture.memory, state.searchText);

        this.store.setState((prev) => ({
            ...prev,
            menuStatus: MenuStatus.Information,
            commandCount: capture.commands.length,
            informationLeft: leftItems,
            informationRight: rightItems,
        }));
    }

    private _displayInitState(): void {
        const state = this.store.getSnapshot();
        const capture = state.currentCapture;
        if (!capture) return;

        const items: JSONRenderItem[] = [];
        buildJSON(items, capture.initState, state.searchText);

        this.store.setState((prev) => ({
            ...prev,
            menuStatus: MenuStatus.InitState,
            commandCount: capture.commands.length,
            initStateData: items,
        }));
    }

    private _displayEndState(): void {
        const state = this.store.getSnapshot();
        const capture = state.currentCapture;
        if (!capture) return;

        const items: JSONRenderItem[] = [];
        buildJSON(items, capture.endState, state.searchText);

        this.store.setState((prev) => ({
            ...prev,
            menuStatus: MenuStatus.EndState,
            commandCount: capture.commands.length,
            endStateData: items,
        }));
    }

    private _displayCurrentCapture(): void {
        const state = this.store.getSnapshot();
        const capture = state.currentCapture;
        if (!capture) return;

        const searchText = state.searchText;

        // Mark all captures inactive except current
        const captures = state.captures.map((entry) => ({
            capture: entry.capture,
            active: entry.capture === capture,
        }));

        // Build visual states array
        const visualStates: IVisualStateItem[] = [];
        // Init visual state (index 0)
        visualStates.push({
            VisualState: capture.initState.VisualState,
            time: capture.startTime,
            commandIndex: Number.MIN_VALUE,
            active: false,
            previousVisualStateIndex: -1,
            nextVisualStateIndex: -1,
        });

        // Build commands array
        const commands: ICommandListItemState[] = [];
        let currentVisualStateIdx = 0; // points to init visual state
        let visualStateSet = false;

        let autoSelectCommandIdx = -1;
        let autoSelectVisualStateIdx = -1;

        for (let i = 0; i < capture.commands.length; i++) {
            const commandCapture = capture.commands[i];

            // Filter check (matches original toFilter logic)
            if (toFilter(commandCapture.marker, searchText) &&
                toFilter(commandCapture.name, searchText) &&
                commandCapture.id !== this._currentCommandId &&
                (commandCapture.name !== "LOG" || toFilter(commandCapture.text, searchText))) {
                continue;
            }

            const cmdIdx = commands.length;

            const commandState: ICommandListItemState = {
                capture: commandCapture,
                previousCommandIndex: cmdIdx > 0 ? cmdIdx - 1 : -1,
                nextCommandIndex: -1, // will be updated by next command
                visualStateIndex: currentVisualStateIdx,
                active: false,
            };

            // Link previous command's nextCommandIndex
            if (cmdIdx > 0) {
                commands[cmdIdx - 1].nextCommandIndex = cmdIdx;
            }

            if (commandCapture.VisualState) {
                const vsIdx = visualStates.length;
                const prevVsIdx = visualStates.length - 1;

                const vs: IVisualStateItem = {
                    VisualState: commandCapture.VisualState,
                    time: commandCapture.endTime,
                    commandIndex: cmdIdx,
                    active: false,
                    previousVisualStateIndex: prevVsIdx,
                    nextVisualStateIndex: -1,
                };

                // Link previous visual state
                visualStates[prevVsIdx].nextVisualStateIndex = vsIdx;

                visualStates.push(vs);
                currentVisualStateIdx = vsIdx;
                visualStateSet = true;
            } else if (!visualStateSet) {
                // Before the first draw call, commands point to init visual state.
                // Update init visual state to point to the first command.
                visualStates[0].commandIndex = cmdIdx;
                visualStateSet = true;
            }

            commandState.visualStateIndex = currentVisualStateIdx;
            commands.push(commandState);

            // Auto-select logic: first command, or command matching currentCommandId
            if ((this._currentCommandId === -1 && cmdIdx === 0) ||
                (this._currentCommandId === commandCapture.id)) {
                autoSelectCommandIdx = cmdIdx;
                autoSelectVisualStateIdx = currentVisualStateIdx;
            }
        }

        // Apply auto-selection
        if (autoSelectCommandIdx >= 0) {
            commands[autoSelectCommandIdx].active = true;
            this._currentCommandId = commands[autoSelectCommandIdx].capture.id;
        }
        if (autoSelectVisualStateIdx >= 0) {
            visualStates[autoSelectVisualStateIdx].active = true;
        }

        // Build command detail for the selected command
        let commandDetailData: JSONRenderItem[] = [];
        if (autoSelectCommandIdx >= 0) {
            const selectedCmd = commands[autoSelectCommandIdx];
            const vsData = visualStates[selectedCmd.visualStateIndex];
            commandDetailData = buildCommandDetail(selectedCmd.capture, vsData?.VisualState);
        }

        this.store.setState((prev) => ({
            ...prev,
            captures,
            menuStatus: MenuStatus.Commands,
            commandCount: capture.commands.length,
            commands,
            currentCommandIndex: autoSelectCommandIdx,
            visualStates,
            currentVisualStateIndex: autoSelectVisualStateIdx,
            sourceCodeState: null,
            sourceCodeError: "",
            commandDetailData,
        }));
    }

    private _openShader(fragment: boolean): void {
        const state = this.store.getSnapshot();
        if (state.currentCommandIndex < 0 || state.currentCommandIndex >= state.commands.length) return;

        const commandState = state.commands[state.currentCommandIndex];
        const drawCall = commandState.capture.DrawCall;
        if (!drawCall || !drawCall.shaders || drawCall.shaders.length < 2) return;

        const sourceCodeState: ISourceCodeState = {
            programId: drawCall.programStatus.program.__SPECTOR_Object_TAG.id,
            nameVertex: drawCall.shaders[0].name,
            nameFragment: drawCall.shaders[1].name,
            sourceVertex: drawCall.shaders[0].source,
            sourceFragment: drawCall.shaders[1].source,
            translatedSourceVertex: drawCall.shaders[0].translatedSource,
            translatedSourceFragment: drawCall.shaders[1].translatedSource,
            fragment,
            translated: false,
            editable: drawCall.programStatus.RECOMPILABLE,
            beautify: true,
            preprocessed: false,
        };

        // Build command detail for the source code view
        const commandDetailData = this._buildCommandDetail(
            state.currentCommandIndex,
            state.commands,
            state.visualStates,
        );

        this.store.setState((prev) => ({
            ...prev,
            menuStatus: MenuStatus.SourceCode,
            sourceCodeState,
            sourceCodeError: "",
            commandDetailData,
        }));
    }

    private _buildCommandDetail(
        commandIndex: number,
        commands: ICommandListItemState[],
        visualStates: IVisualStateItem[],
    ): JSONRenderItem[] {
        if (commandIndex < 0 || commandIndex >= commands.length) return [];
        const cmd = commands[commandIndex];
        const vs = visualStates[cmd.visualStateIndex];
        return buildCommandDetail(cmd.capture, vs?.VisualState);
    }

    // ─── Private: Keyboard navigation ────────────────────────────────────

    private _selectPreviousCommand(): void {
        const state = this.store.getSnapshot();
        if (state.currentCommandIndex < 0) return;
        const cmd = state.commands[state.currentCommandIndex];
        if (cmd.previousCommandIndex < 0) return;
        this.selectCommand(cmd.previousCommandIndex);
    }

    private _selectNextCommand(): void {
        const state = this.store.getSnapshot();
        if (state.currentCommandIndex < 0) return;
        const cmd = state.commands[state.currentCommandIndex];
        if (cmd.nextCommandIndex < 0) return;
        this.selectCommand(cmd.nextCommandIndex);
    }

    private _selectPreviousVisualState(): void {
        const state = this.store.getSnapshot();
        if (state.currentVisualStateIndex < 0) return;
        const vs = state.visualStates[state.currentVisualStateIndex];
        if (vs.previousVisualStateIndex < 0) return;
        this.selectVisualState(vs.previousVisualStateIndex);
    }

    private _selectNextVisualState(): void {
        const state = this.store.getSnapshot();
        if (state.currentVisualStateIndex < 0) return;
        const vs = state.visualStates[state.currentVisualStateIndex];
        if (vs.nextVisualStateIndex < 0) return;
        this.selectVisualState(vs.nextVisualStateIndex);
    }

    // ─── Private: Search ─────────────────────────────────────────────────

    private _search(searchText: string): void {
        const state = this.store.getSnapshot();
        switch (state.menuStatus) {
            case MenuStatus.Captures:
            case MenuStatus.Commands:
                this._displayCurrentCapture();
                break;
            case MenuStatus.EndState:
                this._displayEndState();
                break;
            case MenuStatus.Information:
                this._displayInformation();
                break;
            case MenuStatus.InitState:
                this._displayInitState();
                break;
        }
        // The original resets searchText after rebuilding. Match that behavior.
        // Actually, reading the original more carefully: it sets this.searchText = text,
        // then rebuilds (which uses this.searchText), then sets this.searchText = "".
        // This means the search only applies during rebuild. We replicate by
        // NOT resetting searchText — in React the state stays and the user can
        // clear it themselves. The original behavior was odd (reset after use).
        // We'll match the original: reset after use.
        this.store.setState((prev) => ({ ...prev, searchText: "" }));
    }
}
