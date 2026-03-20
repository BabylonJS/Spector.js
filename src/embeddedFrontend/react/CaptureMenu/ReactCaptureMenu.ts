// tslint:disable-next-line:no-submodule-imports
import { createRoot, Root } from "react-dom/client";
import { createElement } from "react";
import { Observable } from "../../../shared/utils/observable";
import { LogLevel } from "../../../shared/utils/logger";
import { ExternalStore } from "../shared/ExternalStore";
import { ICanvasInformation, ICaptureMenuOptions, CaptureMenuState } from "../shared/types";
import { CaptureMenuRoot } from "./CaptureMenuRoot";
import { CaptureMenuContext } from "./CaptureMenuContext";

/**
 * React adapter for CaptureMenu.
 *
 * Implements the exact same public API as the original MVX-based CaptureMenu
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
export class ReactCaptureMenu {
    // ─── Static help text (matches original) ──────────────────────────────
    public static SelectCanvasHelpText = "Please, select a canvas in the list above.";
    public static ActionsHelpText = "Record with the red button, you can also pause or continue playing the current scene.";
    public static PleaseWaitHelpText = "Capturing, be patient (this can take up to 3 minutes)...";

    // ─── Observables (same shape as original CaptureMenu) ─────────────────
    public readonly onCanvasSelected: Observable<ICanvasInformation>;
    public readonly onCaptureRequested: Observable<ICanvasInformation>;
    public readonly onPauseRequested: Observable<ICanvasInformation>;
    public readonly onPlayRequested: Observable<ICanvasInformation>;
    public readonly onPlayNextFrameRequested: Observable<ICanvasInformation>;

    // ─── React internals ──────────────────────────────────────────────────
    public readonly store: ExternalStore<CaptureMenuState>;
    private readonly _root: Root;
    private readonly _container: HTMLDivElement;
    private readonly _rootPlaceHolder: Element;

    private _isTrackingCanvas: boolean;
    private readonly _hideLog: boolean;

    constructor(private readonly options: ICaptureMenuOptions = {}) {
        this._rootPlaceHolder = options.rootPlaceHolder || document.body;
        this._hideLog = !!options.hideLog;
        this._isTrackingCanvas = false;

        // ── Observables ──
        this.onCanvasSelected = new Observable<ICanvasInformation>();
        this.onCaptureRequested = new Observable<ICanvasInformation>();
        this.onPauseRequested = new Observable<ICanvasInformation>();
        this.onPlayRequested = new Observable<ICanvasInformation>();
        this.onPlayNextFrameRequested = new Observable<ICanvasInformation>();

        // ── Store ──
        this.store = new ExternalStore<CaptureMenuState>({
            visible: true,
            logText: ReactCaptureMenu.SelectCanvasHelpText,
            logLevel: LogLevel.info,
            logVisible: !this._hideLog,
            canvases: [],
            selectedCanvas: null,
            showCanvasList: false,
            isPlaying: true,
            fps: 0,
        });

        // ── Mount React tree (once) ──
        this._container = document.createElement("div");
        this._container.className = "spector-react-capture-menu";
        this._rootPlaceHolder.appendChild(this._container);
        this._root = createRoot(this._container);
        this._root.render(
            createElement(CaptureMenuContext.Provider, { value: this },
                createElement(CaptureMenuRoot),
            ),
        );
    }

    // ─── Public API (matches original CaptureMenu exactly) ────────────────

    public getSelectedCanvasInformation(): ICanvasInformation {
        return this.store.getSnapshot().selectedCanvas;
    }

    public trackPageCanvases(): void {
        this._isTrackingCanvas = true;
        if (document.body) {
            const canvases = document.body.querySelectorAll("canvas");
            this.updateCanvasesList(canvases);
        }
    }

    public updateCanvasesList(canvases: NodeListOf<HTMLCanvasElement>): void {
        const list: ICanvasInformation[] = [];
        for (let i = 0; i < canvases.length; i++) {
            const c = canvases[i];
            list.push({ id: c.id, width: c.width, height: c.height, ref: c });
        }
        this._updateCanvasesInternal(list);
    }

    public updateCanvasesListInformation(canvasesInformation: ICanvasInformation[]): void {
        const list: ICanvasInformation[] = [];
        for (let i = 0; i < canvasesInformation.length; i++) {
            const info = canvasesInformation[i];
            list.push({ id: info.id, width: info.width, height: info.height, ref: info.ref });
        }
        this._updateCanvasesInternal(list);
    }

    public display(): void {
        this.store.setState((prev) => ({ ...prev, visible: true }));
    }

    public hide(): void {
        this.store.setState((prev) => ({ ...prev, visible: false }));
    }

    public captureComplete(errorText: string): void {
        if (errorText) {
            this.store.setState((prev) => ({
                ...prev,
                logLevel: LogLevel.error,
                logText: errorText,
                logVisible: !this._hideLog,
            }));
        } else {
            this.store.setState((prev) => ({
                ...prev,
                logLevel: LogLevel.info,
                logText: ReactCaptureMenu.ActionsHelpText,
                logVisible: !this._hideLog,
            }));
        }
    }

    public setFPS(fps: number): void {
        this.store.setState((prev) => ({ ...prev, fps }));
    }

    // ─── Callbacks for React components ───────────────────────────────────
    // These will be passed to the React tree as props/context in the next phase.

    /** Called by React component when user clicks the canvas selector toggle. */
    public handleCanvasListToggle = (): void => {
        const state = this.store.getSnapshot();
        this.store.setState((prev) => ({
            ...prev,
            selectedCanvas: null,
            showCanvasList: !prev.showCanvasList,
            logLevel: LogLevel.info,
            logText: ReactCaptureMenu.SelectCanvasHelpText,
            logVisible: prev.showCanvasList ? false : !this._hideLog,
        }));
        this.onCanvasSelected.trigger(null);
        if (this._isTrackingCanvas) {
            this.trackPageCanvases();
        }
    }

    /** Called by React component when user selects a specific canvas. */
    public handleCanvasSelected = (canvas: ICanvasInformation): void => {
        this.store.setState((prev) => ({
            ...prev,
            selectedCanvas: canvas,
            showCanvasList: false,
            logLevel: LogLevel.info,
            logText: ReactCaptureMenu.ActionsHelpText,
            logVisible: !this._hideLog,
        }));
        this.onCanvasSelected.trigger(canvas);
    }

    /** Called by React component when user clicks the capture button. */
    public handleCaptureRequested = (): void => {
        const canvas = this.getSelectedCanvasInformation();
        if (canvas) {
            this.store.setState((prev) => ({
                ...prev,
                logLevel: LogLevel.info,
                logText: ReactCaptureMenu.PleaseWaitHelpText,
                logVisible: !this._hideLog,
            }));
        }
        // Defer to ensure the log displays (matches original behavior).
        setTimeout(() => {
            this.onCaptureRequested.trigger(canvas);
        }, 200);
    }

    /** Called by React component when user clicks pause. */
    public handlePauseRequested = (): void => {
        this.onPauseRequested.trigger(this.getSelectedCanvasInformation());
        this.store.setState((prev) => ({ ...prev, isPlaying: false }));
    }

    /** Called by React component when user clicks play. */
    public handlePlayRequested = (): void => {
        this.onPlayRequested.trigger(this.getSelectedCanvasInformation());
        this.store.setState((prev) => ({ ...prev, isPlaying: true }));
    }

    /** Called by React component when user clicks play next frame. */
    public handlePlayNextFrameRequested = (): void => {
        this.onPlayNextFrameRequested.trigger(this.getSelectedCanvasInformation());
    }

    // ─── Private ──────────────────────────────────────────────────────────

    private _updateCanvasesInternal(canvases: ICanvasInformation[]): void {
        const prevState = this.store.getSnapshot();
        const wasListVisible = prevState.showCanvasList;

        if (!wasListVisible) {
            if (canvases.length === 1) {
                // Auto-select single canvas (matches original behavior).
                this.store.setState((prev) => ({
                    ...prev,
                    canvases,
                    selectedCanvas: canvases[0],
                    logLevel: LogLevel.info,
                    logText: ReactCaptureMenu.ActionsHelpText,
                    logVisible: !this._hideLog,
                }));
                this.onCanvasSelected.trigger(canvases[0]);
            } else {
                this.store.setState((prev) => ({
                    ...prev,
                    canvases,
                    selectedCanvas: null,
                    logLevel: LogLevel.info,
                    logText: ReactCaptureMenu.SelectCanvasHelpText,
                    logVisible: !this._hideLog,
                }));
                this.onCanvasSelected.trigger(null);
            }
        } else {
            this.store.setState((prev) => ({ ...prev, canvases }));
        }
    }
}
