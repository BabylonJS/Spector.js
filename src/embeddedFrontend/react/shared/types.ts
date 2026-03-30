/**
 * Shared types for the React migration layer.
 * These are parallel definitions used by adapter classes and React components.
 * Domain types (ICapture, ICommandCapture, etc.) are imported from their original locations.
 */

import { ICapture } from "../../../shared/capture/capture";
import { ICommandCapture } from "../../../shared/capture/commandCapture";
import { LogLevel } from "../../../shared/utils/logger";

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

export type JSONRenderItem =
    | { type: "group"; title: string; children: JSONRenderItem[] }
    | { type: "item"; key: string; value: string }
    | { type: "image"; key: string; value: string; pixelated: boolean }
    | { type: "help"; key: string; value: string; help: string }
    | { type: "visualState"; visualState: any };

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
}
