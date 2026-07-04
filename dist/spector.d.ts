export as namespace SPECTOR;

// Ambient type from src/types.d.ts (not imported, so injected manually)
type WebGLObject = {};

export type WebGlObjectTag = {
    readonly typeName: string;
    readonly id: number;
    displayText?: string;
    customData?: any;
};
export declare class WebGlObjects {
    static getWebGlObjectTag(object: WebGLObject): WebGlObjectTag;
    static attachWebGlObjectTag(object: WebGLObject, tag: WebGlObjectTag): void;
    static stringifyWebGlObjectTag(tag: WebGlObjectTag): string;
    private static readonly SPECTOROBJECTTAGKEY;
}
export declare abstract class BaseWebGlObject {
    abstract get typeName(): string;
    get type(): Function;
    private id;
    constructor();
    tagWebGlObject(webGlObject: any): WebGlObjectTag;
    protected getNextId(): number;
}


export type WebGLRenderingContexts = (WebGLRenderingContext | WebGL2RenderingContext);
export type ExtensionList = {
    [key: string]: any;
};
export interface IContextInformation {
    readonly context: WebGLRenderingContexts;
    readonly contextVersion: number;
    readonly toggleCapture?: (capture: boolean) => void;
    readonly tagWebGlObject?: (object: any) => WebGlObjectTag;
    readonly extensions?: ExtensionList;
}


export interface IAnalysis {
    analyserName: string;
    [key: string]: any;
}


export interface ICanvasCapture {
    width: number;
    height: number;
    clientWidth: number;
    clientHeight: number;
    browserAgent: string;
}


export interface IContextCapture {
    version: number;
    contextAttributes: any;
    capabilities: {
        [name: string]: any;
    };
    extensions: {
        [name: string]: boolean;
    };
    compressedTextures: {
        [name: string]: any;
    };
}


export type State = {
    [stateName: string]: any;
};
export type CommandCapturedCallback = (command: ICommandCapture) => void;
export type CommandCapturedCallbacks = {
    [name: string]: CommandCapturedCallback[];
};
export declare const enum CommandCaptureStatus {
    Unknown = 0,
    Unused = 10,
    Disabled = 20,
    Redundant = 30,
    Valid = 40,
    Deprecated = 50
}
export interface ICommandCapture extends State {
    id: number;
    startTime: number;
    commandEndTime: number;
    endTime: number;
    name: string;
    commandArguments: IArguments;
    result: any;
    stackTrace: string[];
    status: CommandCaptureStatus;
    text: string;
    marker: string;
    consumeCommandId?: number;
    [stateName: string]: any;
}


export interface ICapture {
    canvas: ICanvasCapture;
    context: IContextCapture;
    initState: State;
    commands: ICommandCapture[];
    endState: State;
    startTime: number;
    listenCommandsStartTime: number;
    listenCommandsEndTime: number;
    endTime: number;
    analyses: IAnalysis[];
    frameMemory: {
        [objectName: string]: number;
    };
    memory: {
        [objectName: string]: {
            [second: number]: number;
        };
    };
}


export declare class Observable<T> {
    private callbacks;
    private counter;
    add(callback: (element: T) => void, context?: any): number;
    remove(id: number): void;
    clear(): void;
    trigger(value: T): void;
}


export type FunctionCallback = (functionInformation: IFunctionInformation) => void;
export type FunctionCallbacks = {
    [name: string]: FunctionCallback[];
};
export interface IFunctionInformation {
    readonly name: string;
    readonly arguments: IArguments;
    readonly result: any;
    readonly startTime: number;
    readonly endTime: number;
}


export type CommandSpyCallback = (command: CommandSpy, functionInformation: IFunctionInformation) => void;
export interface ICommandSpyOptions extends IContextInformation {
    readonly spiedCommandName: string;
    readonly spiedCommandRunningContext: any;
    readonly callback: CommandSpyCallback;
}
export declare class CommandSpy {
    private static customCommandsConstructors;
    readonly spiedCommandName: string;
    private readonly spiedCommand;
    private readonly spiedCommandRunningContext;
    private readonly callback;
    private readonly commandOptions;
    private command;
    private overloadedCommand;
    constructor(options: ICommandSpyOptions);
    spy(): void;
    unSpy(): void;
    createCapture(functionInformation: IFunctionInformation, commandCaptureId: number, marker: string): ICommandCapture;
    private initCommand;
    private getSpy;
    private initCustomCommands;
}


export interface IContextSpyOptions {
    context: WebGLRenderingContexts;
    version: number;
    recordAlways?: boolean;
}
export declare class ContextSpy {
    private readonly options;
    private static readonly unSpyableMembers;
    readonly context: WebGLRenderingContexts;
    readonly version: number;
    readonly onMaxCommand: Observable<ContextSpy>;
    private readonly contextInformation;
    private readonly commandSpies;
    private readonly stateSpy;
    private readonly recorderSpy;
    private readonly webGlObjectSpy;
    private marker;
    private capturing;
    private globalCapturing;
    private commandId;
    private currentCapture;
    private canvasCapture;
    private contextCapture;
    private analyser;
    private maxCommands;
    constructor(options: IContextSpyOptions);
    spy(): void;
    unSpy(): void;
    startCapture(maxCommands?: number, quickCapture?: boolean, fullCapture?: boolean): void;
    stopCapture(): ICapture;
    isCapturing(): boolean;
    setMarker(marker: string): void;
    clearMarker(): void;
    log(value: string): void;
    getNextCommandCaptureId(): number;
    onCommand(commandSpy: CommandSpy, functionInformation: IFunctionInformation): void;
    private spyContext;
    private initStaticCapture;
    private spyFunction;
    private toggleGlobalCapturing;
    private tagWebGlObject;
}


/**
 * Lightweight external store for bridging imperative API calls to React state.
 * Adapter classes call setState()/setSnapshot(); React components subscribe via useStore().
 *
 * Design notes:
 * - getSnapshot and subscribe are arrow functions (bound at construction) because
 *   React's useSyncExternalStore calls them without `this` context.
 * - setState takes an updater function to enable safe derived-state transitions.
 * - _listeners is a Set for O(1) add/delete — no linear scan on unsubscribe.
 * - No defensive copy in getSnapshot: callers must produce new references in setState
 *   to trigger re-renders (standard React immutability contract).
 */
export declare class ExternalStore<T> {
    private _state;
    private readonly _listeners;
    constructor(initialState: T);
    /** Called by React internally via useSyncExternalStore. */
    getSnapshot: () => T;
    /** Subscribe to state changes. Returns unsubscribe function. */
    subscribe: (listener: () => void) => (() => void);
    /** Update state via updater function. Must return a new reference to trigger re-render. */
    setState(updater: (prev: T) => T): void;
    /** Replace state entirely. */
    setSnapshot(state: T): void;
    private _emitChange;
}
/**
 * React hook to subscribe to an ExternalStore.
 * Components using this hook will re-render when setState/setSnapshot is called.
 */
export declare function useStore<T>(store: ExternalStore<T>): T;


export declare enum LogLevel {
    noLog = 0,
    error = 1,
    warning = 2,
    info = 3
}
export declare class Logger {
    static level: LogLevel;
    static error(msg: string, ...restOfMsg: string[]): void;
    static warn(msg: string, ...restOfMsg: string[]): void;
    static info(msg: string, ...restOfMsg: string[]): void;
}


/** Classification of a single row in a capture-to-capture command diff. */
export type CommandDiffType = "unchanged" | "added" | "removed" | "changed";
/**
 * A single differing field between two matched commands — typically a uniform
 * or uniform-block member whose value changed between the two captures.
 */
export interface ICommandFieldDiff {
    /** Human-readable path, e.g. `"uniform uColor"` or `"uniformBlock Scene.time"`. */
    path: string;
    /** Stringified value from the previous capture (or `"(absent)"`). */
    previous: string;
    /** Stringified value from the current capture (or `"(absent)"`). */
    current: string;
    /** For texture visual diffs: previous-capture thumbnail as a data URL. */
    previousImage?: string;
    /** For texture visual diffs: current-capture thumbnail as a data URL. */
    currentImage?: string;
}
/**
 * One row of a capture comparison.
 *
 * - `unchanged`: the command is identical in both captures.
 * - `added`:     the command exists only in the current (B) capture.
 * - `removed`:   the command exists only in the previous (A) capture.
 * - `changed`:   a command with the same name whose arguments and/or captured
 *                state (e.g. uniform values) differ.
 */
export interface ICommandDiffRow {
    type: CommandDiffType;
    name: string;
    /** Rendered command text from the previous capture (A), when present. */
    previousText?: string;
    /** Rendered command text from the current capture (B), when present. */
    currentText?: string;
    /** Index into the previous capture's `commands`, when present. */
    indexA?: number;
    /** Index into the current capture's `commands`, when present. */
    indexB?: number;
    /**
     * Id of the current-capture command (present for `unchanged`, `added`, and
     * `changed` rows). Used to jump to the command in the Commands view.
     */
    commandId?: number;
    /**
     * Field-level differences (uniforms / uniform blocks) for matched commands.
     * Present on `changed` rows whose deep state differs.
     */
    fieldDiffs?: ICommandFieldDiff[];
}
/** Aggregate counts for a capture comparison. */
export interface ICaptureDiffSummary {
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
}
/** Full result of comparing two captures. */
export interface ICaptureDiff {
    rows: ICommandDiffRow[];
    summary: ICaptureDiffSummary;
}
/**
 * Compare two captures of (ideally) the same page and produce a command-level
 * diff.
 *
 * The algorithm is a longest-common-subsequence (LCS) diff over the commands'
 * rendered text (`ICommandCapture.text`, e.g. `"drawArrays: TRIANGLES, 0, 3"`),
 * which is a stable, human-meaningful signature. Anchored on identical calls,
 * the gaps between anchors hold the removed (A-only) and added (B-only) calls.
 * Within a gap, a removed+added pair that share the same command *name* is
 * collapsed into a single `changed` row (a modified call) rather than shown as
 * an unrelated remove/add.
 *
 * Pure and side-effect free so it can be unit-tested without a browser.
 */
export declare function compareCaptures(previous: ICapture, current: ICapture): ICaptureDiff;


/**
 * Shared types for the React migration layer.
 * These are parallel definitions used by adapter classes and React components.
 * Domain types (ICapture, ICommandCapture, etc.) are imported from their original locations.
 */
export interface ICanvasInformation {
    id: string;
    width: number;
    height: number;
    ref: any;
}
export interface ICaptureMenuOptions {
    readonly rootPlaceHolder?: Element;
    readonly canvas?: HTMLCanvasElement;
    readonly hideLog?: boolean;
}
export interface CaptureMenuState {
    visible: boolean;
    logText: string;
    logLevel: LogLevel;
    logVisible: boolean;
    canvases: ICanvasInformation[];
    selectedCanvas: ICanvasInformation | null;
    showCanvasList: boolean;
    isPlaying: boolean;
    fps: number;
}
export declare const enum MenuStatus {
    Captures = 0,
    Information = 10,
    InitState = 20,
    EndState = 30,
    Commands = 40,
    SourceCode = 50,
    Compare = 60
}
export interface ISourceCodeChangeEvent {
    sourceVertex: string;
    sourceFragment: string;
    translatedSourceVertex: string;
    translatedSourceFragment: string;
    programId: number;
}
export interface ICommandListItemState {
    capture: ICommandCapture;
    active: boolean;
    visualStateIndex: number;
    previousCommandIndex: number;
    nextCommandIndex: number;
}
export interface IVisualStateItem {
    time: number;
    commandIndex: number;
    VisualState: any;
    active: boolean;
    previousVisualStateIndex: number;
    nextVisualStateIndex: number;
}
export interface ISourceCodeState extends ISourceCodeChangeEvent {
    nameVertex: string;
    nameFragment: string;
    fragment: boolean;
    translated: boolean;
    editable: boolean;
    beautify: boolean;
    preprocessed: boolean;
}
/** Non-premultiplied raw texel data preserved for the texture viewer (#183). */
export interface IRawImagePixels {
    /** Base64 of RGBA bytes, top-down, row-major (`width * height * 4` long). */
    data: string;
    width: number;
    height: number;
}
export type JSONRenderItem = {
    type: "group";
    title: string;
    children: JSONRenderItem[];
} | {
    type: "item";
    key: string;
    value: string;
} | {
    type: "image";
    key: string;
    value: string;
    pixelated: boolean;
    raw?: IRawImagePixels;
} | {
    type: "help";
    key: string;
    value: string;
    help: string;
} | {
    type: "visualState";
    visualState: any;
};
/** State of the full-screen texture viewer modal. */
export interface ITextureViewerState {
    /** Whether the modal is open. */
    open: boolean;
    /** The thumbnail data URL shown (and used as the fallback pixel source). */
    src: string;
    /** Human label (e.g. the sampler/target/attachment name). */
    label: string;
    /** Whether the texture uses nearest filtering (affects magnifier smoothing). */
    pixelated: boolean;
    /** Non-premultiplied raw pixels when available (lets "opaque" reveal hidden RGB). */
    raw: IRawImagePixels | null;
}
export interface ResultViewState {
    visible: boolean;
    menuStatus: MenuStatus;
    searchText: string;
    captures: {
        capture: ICapture;
        active: boolean;
    }[];
    currentCapture: ICapture | null;
    commands: ICommandListItemState[];
    currentCommandIndex: number;
    visualStates: IVisualStateItem[];
    currentVisualStateIndex: number;
    sourceCodeState: ISourceCodeState | null;
    sourceCodeError: string;
    commandCount: number;
    informationLeft: JSONRenderItem[];
    informationRight: JSONRenderItem[];
    initStateData: JSONRenderItem[];
    endStateData: JSONRenderItem[];
    commandDetailData: JSONRenderItem[];
    compareRows: ICommandDiffRow[];
    compareSummary: ICaptureDiffSummary;
    compareOnlyDifferences: boolean;
    /** True when there is a previous capture to diff the current one against. */
    canCompare: boolean;
    /** Human label describing which two captures are being compared. */
    compareLabel: string;
    textureViewer: ITextureViewerState;
}


/**
 * React adapter for ReactCaptureMenu.
 *
 * Implements the exact same public API as the original MVX-based ReactCaptureMenu
 * (src/embeddedFrontend/captureMenu/captureMenu.ts) so it can be swapped in
 * as a drop-in replacement. Internally uses ExternalStore + React 18 createRoot
 * instead of the MVX framework.
 *
 * State flow:
 *   Imperative API call (e.g. setFPS(60))
 *     → store.setState(prev => ({ ...prev, fps: 60 }))
 *       → React re-renders subscribed components
 *
 * Event flow:
 *   React component callback (e.g. onCaptureClick)
 *     → adapter method
 *       → Observable.trigger(canvasInfo)
 *         → external subscribers (spector.ts)
 */
export declare class ReactCaptureMenu {
    private readonly options;
    static SelectCanvasHelpText: string;
    static ActionsHelpText: string;
    static PleaseWaitHelpText: string;
    readonly onCanvasSelected: Observable<ICanvasInformation>;
    readonly onCaptureRequested: Observable<ICanvasInformation>;
    readonly onPauseRequested: Observable<ICanvasInformation>;
    readonly onPlayRequested: Observable<ICanvasInformation>;
    readonly onPlayNextFrameRequested: Observable<ICanvasInformation>;
    readonly store: ExternalStore<CaptureMenuState>;
    private readonly _root;
    private readonly _container;
    private readonly _rootPlaceHolder;
    private _isTrackingCanvas;
    private readonly _hideLog;
    private readonly _extraCanvasEntries;
    constructor(options?: ICaptureMenuOptions);
    getSelectedCanvasInformation(): ICanvasInformation;
    trackPageCanvases(): void;
    updateCanvasesList(canvases: NodeListOf<HTMLCanvasElement>): void;
    updateCanvasesListInformation(canvasesInformation: ICanvasInformation[]): void;
    /**
     * Appends a single canvas entry (e.g. a Worker OffscreenCanvas) to the
     * list without replacing existing entries, and auto-selects it.
     */
    addCanvasInformation(info: ICanvasInformation): void;
    display(): void;
    hide(): void;
    captureComplete(errorText: string): void;
    setFPS(fps: number): void;
    /** Called by React component when user clicks the canvas selector toggle. */
    handleCanvasListToggle: () => void;
    /** Called by React component when user selects a specific canvas. */
    handleCanvasSelected: (canvas: ICanvasInformation) => void;
    /** Called by React component when user clicks the capture button. */
    handleCaptureRequested: () => void;
    /** Called by React component when user clicks pause. */
    handlePauseRequested: () => void;
    /** Called by React component when user clicks play. */
    handlePlayRequested: () => void;
    /** Called by React component when user clicks play next frame. */
    handlePlayNextFrameRequested: () => void;
    private _updateCanvasesInternal;
}


/**
 * React adapter for ReactResultView.
 *
 * Implements the exact same public API as the original MVX-based ReactResultView
 * so it can be swapped in as a drop-in replacement. All orchestration logic
 * (command/visual-state building, JSON trees, keyboard navigation, search)
 * is ported from the original 821-line resultView.ts.
 */
export declare class ReactResultView {
    readonly onSourceCodeChanged: Observable<ISourceCodeChangeEvent>;
    readonly store: ExternalStore<ResultViewState>;
    private readonly _root;
    private readonly _container;
    private readonly _rootPlaceHolder;
    private _currentCommandId;
    private readonly _sourceMapResolver;
    private readonly _resolvedStackTraces;
    private readonly _resolvingStackTraces;
    constructor(rootPlaceHolder?: Element);
    display(): void;
    hide(): void;
    addCapture(capture: ICapture): number;
    selectCapture(captureIndex: number): void;
    selectCommand(commandIndex: number): void;
    selectVisualState(visualStateIndex: number): void;
    showSourceCodeError(error: string): void;
    saveCapture(capture: ICapture): void;
    /** Called by React when user selects a menu tab. */
    handleMenuStatusChange: (status: MenuStatus) => void;
    /** Called by React when search text changes. */
    handleSearchTextChange: (searchText: string) => void;
    /** Called by React when the Compare "Differences only" toggle changes (#155). */
    handleCompareOnlyDifferencesChange: (onlyDifferences: boolean) => void;
    /**
     * Called by React when a Compare row's command link is clicked (#155):
     * switch to the Commands view and select the corresponding command in the
     * current capture.
     */
    handleCompareCommandSelected: (commandId: number) => void;
    /** Called by React when user selects a command. */
    handleCommandSelected: (commandIndex: number) => void;
    /** Open the texture viewer modal for a displayed texture/attachment (#183). */
    openTextureViewer: (payload: {
        src: string;
        label: string;
        pixelated: boolean;
        raw: IRawImagePixels | null;
    }) => void;
    /** Close the texture viewer modal (#183). */
    closeTextureViewer: () => void;
    /** Called by React when user selects a visual state. */
    handleVisualStateSelected: (visualStateIndex: number) => void;
    /** Called by React when a shader link is clicked (vertex). */
    handleVertexSelected: (commandIndex: number) => void;
    /** Called by React when a shader link is clicked (fragment). */
    handleFragmentSelected: (commandIndex: number) => void;
    /** Called by React when source code is edited. */
    handleSourceCodeChanged: (event: ISourceCodeChangeEvent) => void;
    /** Called by React when source code close button is clicked. */
    handleSourceCodeClose: () => void;
    /** Called by React when source code tab changes. */
    handleSourceCodeTabChange: (fragment: boolean, translated: boolean) => void;
    /** Called by React when beautify checkbox changes. */
    handleBeautifyChanged: (beautify: boolean) => void;
    /** Called by React when preprocess checkbox changes. */
    handlePreprocessChanged: (preprocessed: boolean) => void;
    /** Called by React when save is requested on a capture. */
    handleSaveRequested: (capture: ICapture) => void;
    /** Called by React when a capture is loaded (drag-drop). */
    handleCaptureLoaded: (capture: ICapture) => void;
    /** Called by React when user clicks close on the result view. */
    handleClose: () => void;
    private _displayCaptures;
    /**
     * Build and show the capture-to-capture command diff (#155).
     *
     * Compares the currently selected capture against the immediately previous
     * one in the capture list (the next entry, since new captures are unshifted
     * to the front). When there is no previous capture, the tab shows guidance.
     */
    private _displayCompare;
    private static _captureLabel;
    private _displayInformation;
    private _displayInitState;
    private _displayEndState;
    private _displayCurrentCapture;
    private _openShader;
    private _buildCommandDetail;
    /**
     * Lazily resolve a command's stack-trace frames through source maps (#98).
     *
     * Runs off the capture hot path — only for the command currently being
     * inspected — then patches the detail panel in place when resolution
     * completes and the same command is still selected. Any failure leaves the
     * raw frames untouched.
     */
    private _resolveStackTraceAsync;
    private _selectPreviousCommand;
    private _selectNextCommand;
    private _selectPreviousVisualState;
    private _selectNextVisualState;
    private _search;
}


export interface IWorkerBridgeOptions {
    /** Timeout in milliseconds for capture responses. Default: 10000 (10s). */
    captureTimeout?: number;
}
export interface IWorkerContextInfo {
    canvasCount: number;
    canvasWidth: number;
    canvasHeight: number;
}
/**
 * Main-thread bridge that communicates with a WorkerSpector running inside a Worker.
 * Uses addEventListener (not onmessage) to avoid overwriting app communication.
 */
export declare class WorkerBridge {
    readonly onCapture: Observable<ICapture>;
    readonly onCaptureStarted: Observable<void>;
    readonly onError: Observable<string>;
    readonly onFps: Observable<number>;
    readonly onContextReady: Observable<IWorkerContextInfo>;
    private readonly worker;
    private readonly captureTimeout;
    private readonly messageHandler;
    private captureTimer;
    private disposed;
    constructor(worker: Worker, options?: IWorkerBridgeOptions);
    /** Request a capture from the Worker. */
    triggerCapture(canvasIndex?: number, commandCount?: number, quickCapture?: boolean, fullCapture?: boolean): void;
    /** Clean up all resources. */
    dispose(): void;
    private handleMessage;
    private clearCaptureTimer;
}


export interface IAvailableContext {
    readonly canvas: HTMLCanvasElement | OffscreenCanvas;
    readonly contextSpy: ContextSpy;
}
export declare const EmbeddedFrontend: {
    CaptureMenu: typeof ReactCaptureMenu;
    ResultView: typeof ReactResultView;
};
type SpectorInitOptions = {
    enableXRCapture?: boolean;
};
export declare class Spector {
    static getFirstAvailable3dContext(canvas: HTMLCanvasElement | OffscreenCanvas): WebGLRenderingContexts;
    private static tryGetContextFromHelperField;
    private static tryGetContextFromCanvas;
    readonly onCaptureStarted: Observable<any>;
    readonly onCapture: Observable<ICapture>;
    readonly onError: Observable<string>;
    private readonly timeSpy;
    private readonly xrSpy;
    private readonly contexts;
    private canvasSpy;
    private captureNextFrames;
    private captureNextCommands;
    private quickCapture;
    private fullCapture;
    private capturingContext;
    private captureMenu;
    private resultView;
    private retry;
    private noFrameTimeout;
    private marker;
    private readonly workerBridges;
    private options;
    constructor(options?: SpectorInitOptions);
    displayUI(disableTracking?: boolean): void;
    getResultUI(): ReactResultView;
    getCaptureUI(): ReactCaptureMenu;
    rebuildProgramFromProgramId(programId: number, vertexSourceCode: string, fragmentSourceCode: string, onCompiled: (program: WebGLProgram) => void, onError: (message: string) => void): void;
    rebuildProgram(program: WebGLProgram, vertexSourceCode: string, fragmentSourceCode: string, onCompiled: (program: WebGLProgram) => void, onError: (message: string) => void): void;
    referenceNewProgram(programId: number, program: WebGLProgram): void;
    pause(): void;
    play(): void;
    playNextFrame(): void;
    drawOnlyEveryXFrame(x: number): void;
    getFps(): number;
    spyCanvases(): void;
    spyCanvas(canvas: HTMLCanvasElement | OffscreenCanvas): void;
    getAvailableContexts(): IAvailableContext[];
    /**
     * Simulate slow asynchronous shader compilation.
     *
     * While a non-zero delay is set, any program queried via
     * `getProgramParameter(program, COMPLETION_STATUS_KHR)` reports `false`
     * (still compiling) for `delayMs` milliseconds after it is linked, then
     * reports its real completion status. This emulates a slow GPU driver so
     * loading screens, shader fallbacks, and hitch handling can be tested —
     * similar to the CPU/network throttling in browser developer tools.
     *
     * The throttle is installed globally on the WebGL prototypes, so it applies
     * to every context on the page without needing canvas spying to be active.
     * Only programs linked after the throttle is installed are affected.
     *
     * @param delayMs - Delay in milliseconds. Use `0` to disable.
     */
    setShaderCompileDelay(delayMs: number): void;
    /** Disable the simulated shader-compile delay. */
    clearShaderCompileDelay(): void;
    /** The current simulated shader-compile delay in milliseconds (0 = disabled). */
    getShaderCompileDelay(): number;
    captureCanvas(canvas: HTMLCanvasElement | OffscreenCanvas, commandCount?: number, quickCapture?: boolean, fullCapture?: boolean): void;
    captureContext(context: WebGLRenderingContexts, commandCount?: number, quickCapture?: boolean, fullCapture?: boolean): void;
    captureXRContext(commandCount?: number, quickCapture?: boolean, fullCapture?: boolean): void;
    captureContextSpy(contextSpy: ContextSpy, commandCount?: number, quickCapture?: boolean, fullCapture?: boolean): void;
    captureNextFrame(obj: HTMLCanvasElement | OffscreenCanvas | WebGLRenderingContexts, quickCapture?: boolean, fullCapture?: boolean): void;
    startCapture(obj: HTMLCanvasElement | OffscreenCanvas | WebGLRenderingContexts, commandCount: number, quickCapture?: boolean, fullCapture?: boolean): void;
    stopCapture(): ICapture;
    setMarker(marker: string): void;
    clearMarker(): void;
    addRequestAnimationFrameFunctionName(functionName: string): void;
    setSpiedScope(spiedScope: {
        [name: string]: any;
    }): void;
    log(value: string): void;
    /**
     * Intercept all new Worker() calls to auto-inject Spector.
     * Best-effort: will fail for CORS, CSP, or module Workers.
     * @param workerBundleUrl URL to spector.worker.bundle.js
     */
    spyWorkers(workerBundleUrl?: string): void;
    /**
     * Stop intercepting Worker construction.
     */
    stopSpyingWorkers(): void;
    /**
     * Manually spy on a specific Worker.
     * This is the primary, reliable API for Worker capture.
     * The Worker must already have the Spector worker bundle loaded.
     */
    spyWorker(worker: Worker): WorkerBridge;
    /**
     * Capture a frame from a Worker's WebGL context.
     * Uses direct postMessage to bypass the main-thread spy chain,
     * which ensures a full frame is captured.
     */
    captureWorker(worker: Worker, commandCount?: number, quickCapture?: boolean, fullCapture?: boolean): void;
    private captureFrames;
    private captureCommands;
    private spyContext;
    private getAvailableContextSpyByCanvas;
    private getXRContext;
    private onFrameStart;
    private onFrameEnd;
    private triggerCapture;
    private onErrorInternal;
}
