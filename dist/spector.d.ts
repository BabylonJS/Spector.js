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
    SourceCode = 50
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
} | {
    type: "help";
    key: string;
    value: string;
    help: string;
} | {
    type: "visualState";
    visualState: any;
};
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
    constructor(options?: ICaptureMenuOptions);
    getSelectedCanvasInformation(): ICanvasInformation;
    trackPageCanvases(): void;
    updateCanvasesList(canvases: NodeListOf<HTMLCanvasElement>): void;
    updateCanvasesListInformation(canvasesInformation: ICanvasInformation[]): void;
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
    /** Called by React when user selects a command. */
    handleCommandSelected: (commandIndex: number) => void;
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
    private _displayInformation;
    private _displayInitState;
    private _displayEndState;
    private _displayCurrentCapture;
    private _openShader;
    private _buildCommandDetail;
    private _selectPreviousCommand;
    private _selectNextCommand;
    private _selectPreviousVisualState;
    private _selectNextVisualState;
    private _search;
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
