// Import application Styles.
import "../styles/captureMenu.scss";

import { Observable } from "../../shared/utils/observable";
import { MVX } from "../mvx/mvx";
import { CaptureMenuComponent, ICaptureMenuComponentState } from "./captureMenuComponent";
import { CanvasListItemComponent } from "./canvasListItemComponent";
import { CaptureMenuActionsComponent } from "./captureMenuActionsComponent";
import { CanvasListComponent, ICanvasListComponentState } from "./canvasListComponent";
import { FpsCounterComponent } from "./fpsCounterComponent";
import { LogLevel } from "../../shared/utils/logger";

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

interface IArrayLike<T> {
    length: number;
    [index: number]: T;
}

export class CaptureMenu {
    public static SelectCanvasHelpText = "Please, select a canvas in the list above.";
    public static ActionsHelpText = "Record with the red button, you can also pause or continue playing the current scene.";
    public static PleaseWaitHelpText = "Capturing, be patient (this can take up to 3 minutes)...";

    public readonly onCanvasSelected: Observable<ICanvasInformation>;
    public readonly onCaptureRequested: Observable<ICanvasInformation>;
    public readonly onPauseRequested: Observable<ICanvasInformation>;
    public readonly onPlayRequested: Observable<ICanvasInformation>;
    public readonly onPlayNextFrameRequested: Observable<ICanvasInformation>;

    private readonly rootPlaceHolder: Element;
    private readonly mvx: MVX;

    private readonly captureMenuComponent: CaptureMenuComponent;
    private readonly canvasListItemComponent: CanvasListItemComponent;
    private readonly actionsComponent: CaptureMenuActionsComponent;
    private readonly canvasListComponent: CanvasListComponent;
    private readonly fpsCounterComponent: FpsCounterComponent;

    private readonly rootStateId: number;
    private readonly fpsStateId: number;
    private readonly actionsStateId: number;
    private readonly canvasListStateId: number;

    private isTrackingCanvas: boolean;

    constructor(private readonly options: ICaptureMenuOptions = {}) {
        this.rootPlaceHolder = options.rootPlaceHolder || document.body;
        this.mvx = new MVX(this.rootPlaceHolder);

        this.isTrackingCanvas = false;

        this.onCanvasSelected = new Observable<ICanvasInformation>();
        this.onCaptureRequested = new Observable<ICanvasInformation>();
        this.onPauseRequested = new Observable<ICanvasInformation>();
        this.onPlayRequested = new Observable<ICanvasInformation>();
        this.onPlayNextFrameRequested = new Observable<ICanvasInformation>();

        this.captureMenuComponent = new CaptureMenuComponent();
        this.canvasListComponent = new CanvasListComponent();
        this.canvasListItemComponent = new CanvasListItemComponent();
        this.actionsComponent = new CaptureMenuActionsComponent();
        this.fpsCounterComponent = new FpsCounterComponent();

        this.rootStateId = this.mvx.addRootState({
            visible: true,
            logLevel: LogLevel.info,
            logText: CaptureMenu.SelectCanvasHelpText,
            logVisible: !this.options.hideLog,
        }, this.captureMenuComponent);
        this.canvasListStateId = this.mvx.addChildState(this.rootStateId, { currentCanvasInformation: null, showList: false }, this.canvasListComponent);
        this.actionsStateId = this.mvx.addChildState(this.rootStateId, true, this.actionsComponent);
        this.fpsStateId = this.mvx.addChildState(this.rootStateId, 0, this.fpsCounterComponent);

        this.actionsComponent.onCaptureRequested.add(() => {
            const currentCanvasInformation = this.getSelectedCanvasInformation();
            if (currentCanvasInformation) {
                this.updateMenuStateLog(LogLevel.info, CaptureMenu.PleaseWaitHelpText, true);
            }

            // Defer to ensure the log displays.
            setTimeout(() => {
                this.onCaptureRequested.trigger(currentCanvasInformation);
            }, 200);
        });
        this.actionsComponent.onPauseRequested.add(() => {
            this.onPauseRequested.trigger(this.getSelectedCanvasInformation());
            this.mvx.updateState(this.actionsStateId, false);
        });
        this.actionsComponent.onPlayRequested.add(() => {
            this.onPlayRequested.trigger(this.getSelectedCanvasInformation());
            this.mvx.updateState(this.actionsStateId, true);
        });
        this.actionsComponent.onPlayNextFrameRequested.add(() => {
            this.onPlayNextFrameRequested.trigger(this.getSelectedCanvasInformation());
        });

        this.canvasListComponent.onCanvasSelection.add((eventArgs) => {
            this.mvx.updateState(this.canvasListStateId, {
                currentCanvasInformation: null,
                showList: !eventArgs.state.showList,
            });
            this.updateMenuStateLog(LogLevel.info, CaptureMenu.SelectCanvasHelpText);

            this.onCanvasSelected.trigger(null);
            if (this.isTrackingCanvas) {
                this.trackPageCanvases();
            }

            if (eventArgs.state.showList) {
                this.showMenuStateLog();
            }
            else {
                this.hideMenuStateLog();
            }
        });

        this.canvasListItemComponent.onCanvasSelected.add((eventArgs) => {
            this.mvx.updateState(this.canvasListStateId, {
                currentCanvasInformation: eventArgs.state,
                showList: false,
            });
            this.onCanvasSelected.trigger(eventArgs.state);
            this.updateMenuStateLog(LogLevel.info, CaptureMenu.ActionsHelpText);
            this.showMenuStateLog();
        });
    }

    public getSelectedCanvasInformation(): ICanvasInformation {
        const canvasListState = this.mvx.getGenericState<ICanvasListComponentState>(this.canvasListStateId);
        return canvasListState.currentCanvasInformation;
    }

    public trackPageCanvases(): void {
        this.isTrackingCanvas = true;
        if (document.body) {
            const canvases = document.body.querySelectorAll("canvas");
            this.updateCanvasesList(canvases);
        }
    }

    public updateCanvasesList(canvases: NodeListOf<HTMLCanvasElement>): void {
        this.updateCanvasesListInformationInternal(canvases, (info) => {
            return {
                id: info.id,
                width: info.width,
                height: info.height,
                ref: info,
            };
        });
    }

    public updateCanvasesListInformation(canvasesInformation: ICanvasInformation[]): void {
        this.updateCanvasesListInformationInternal(canvasesInformation, (info) => {
            return {
                id: info.id,
                width: info.width,
                height: info.height,
                ref: info.ref,
            };
        });
    }

    public display(): void {
        this.updateMenuStateVisibility(true);
    }

    public hide(): void {
        this.updateMenuStateVisibility(false);
    }

    public captureComplete(errorText: string): void {
        if (errorText) {
            this.updateMenuStateLog(LogLevel.error, errorText);
        }
        else {
            this.updateMenuStateLog(LogLevel.info, CaptureMenu.ActionsHelpText);
        }
    }

    public setFPS(fps: number): void {
        this.mvx.updateState(this.fpsStateId, fps);
    }

    private updateCanvasesListInformationInternal<T>(canvasesInformation: ArrayLike<T>, convertToListInfo: (info: T) => ICanvasInformation): void {
        // Create a consumable information list for the view.
        this.mvx.removeChildrenStates(this.canvasListStateId);
        const canvasesInformationClone: ICanvasInformation[] = [];
        for (let i = 0; i < canvasesInformation.length; i++) {
            const canvas = canvasesInformation[i];
            const canvasInformationClone = convertToListInfo(canvas);
            canvasesInformationClone.push(canvasInformationClone);
            this.mvx.addChildState(this.canvasListStateId, canvasInformationClone, this.canvasListItemComponent);
        }

        // Auto Select in the list if only one canvas.
        const canvasesCount = canvasesInformationClone.length;
        const canvasListState = this.mvx.getGenericState<ICanvasListComponentState>(this.canvasListStateId);
        const visible = canvasListState.showList;
        if (!visible) {
            if (canvasesCount === 1) {
                const canvasToSelect = canvasesInformationClone[0];
                this.mvx.updateState(this.canvasListStateId, {
                    currentCanvasInformation: canvasToSelect,
                    showList: visible,
                });
                this.updateMenuStateLog(LogLevel.info, CaptureMenu.ActionsHelpText);
                this.onCanvasSelected.trigger(canvasToSelect);
            }
            else {
                this.updateMenuStateLog(LogLevel.info, CaptureMenu.SelectCanvasHelpText);
                this.onCanvasSelected.trigger(null);
            }
        }
    }

    private hideMenuStateLog() {
        const menuState = this.mvx.getGenericState<ICaptureMenuComponentState>(this.rootStateId);
        this.mvx.updateState(this.rootStateId, {
            visible: menuState.visible,
            logLevel: menuState.logLevel,
            logText: menuState.logText,
            logVisible: false,
        });
    }

    private showMenuStateLog() {
        const menuState = this.mvx.getGenericState<ICaptureMenuComponentState>(this.rootStateId);
        this.mvx.updateState(this.rootStateId, {
            visible: menuState.visible,
            logLevel: menuState.logLevel,
            logText: menuState.logText,
            logVisible: !this.options.hideLog,
        });
    }

    private updateMenuStateLog(logLevel: LogLevel, logText: string, immediate = false) {
        const menuState = this.mvx.getGenericState<ICaptureMenuComponentState>(this.rootStateId);
        this.mvx.updateState(this.rootStateId, {
            visible: menuState.visible,
            logLevel,
            logText,
            logVisible: !this.options.hideLog,
        }, immediate);
    }

    private updateMenuStateVisibility(visible: boolean) {
        const menuState = this.mvx.getGenericState<ICaptureMenuComponentState>(this.rootStateId);
        this.mvx.updateState(this.rootStateId, {
            visible,
            logLevel: menuState.logLevel,
            logText: menuState.logText,
            logVisible: menuState.logVisible,
        });
    }
}
