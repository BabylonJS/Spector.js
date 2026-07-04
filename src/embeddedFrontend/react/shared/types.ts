/**
 * Shared types for the React migration layer.
 * These are parallel definitions used by adapter classes and React components.
 * Domain types (ICapture, ICommandCapture, etc.) are imported from their original locations.
 */

import { ICapture } from "../../../shared/capture/capture";
import { ICommandCapture } from "../../../shared/capture/commandCapture";
import { LogLevel } from "../../../shared/utils/logger";
import { ICommandDiffRow, ICaptureDiffSummary } from "./captureComparer";

// ─── CaptureMenu types ──────────────────────────────────────────────────────

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

// ─── ResultView types ────────────────────────────────────────────────────────

export const enum MenuStatus {
    Captures = 0,
    Information = 10,
    InitState = 20,
    EndState = 30,
    Commands = 40,
    SourceCode = 50,
    Compare = 60,
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

// ─── JSON render tree types ──────────────────────────────────────────────────

/** Non-premultiplied raw texel data preserved for the texture viewer (#183). */
export interface IRawImagePixels {
    /** Base64 of RGBA bytes, top-down, row-major (`width * height * 4` long). */
    data: string;
    width: number;
    height: number;
}

export type JSONRenderItem =
    | { type: "group"; title: string; children: JSONRenderItem[] }
    | { type: "item"; key: string; value: string }
    | { type: "image"; key: string; value: string; pixelated: boolean; raw?: IRawImagePixels }
    | { type: "help"; key: string; value: string; help: string }
    | { type: "visualState"; visualState: any };

// ─── Texture viewer (#183) ───────────────────────────────────────────────────

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

// ─── ResultView state ────────────────────────────────────────────────────────

export interface ResultViewState {
    visible: boolean;
    menuStatus: MenuStatus;
    searchText: string;
    captures: { capture: ICapture; active: boolean }[];
    currentCapture: ICapture | null;
    commands: ICommandListItemState[];
    currentCommandIndex: number;
    visualStates: IVisualStateItem[];
    currentVisualStateIndex: number;
    sourceCodeState: ISourceCodeState | null;
    sourceCodeError: string;
    commandCount: number;
    // Content data for non-command tabs
    informationLeft: JSONRenderItem[];
    informationRight: JSONRenderItem[];
    initStateData: JSONRenderItem[];
    endStateData: JSONRenderItem[];
    commandDetailData: JSONRenderItem[];
    // Compare tab (#155): capture-to-capture command diff
    compareRows: ICommandDiffRow[];
    compareSummary: ICaptureDiffSummary;
    compareOnlyDifferences: boolean;
    /** True when there is a previous capture to diff the current one against. */
    canCompare: boolean;
    /** Human label describing which two captures are being compared. */
    compareLabel: string;
    // Texture viewer (#183): full-screen channel/alpha/pixel inspector modal
    textureViewer: ITextureViewerState;
}
