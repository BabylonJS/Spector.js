import * as React from "react";
import * as ReactDOM from "react-dom";

// Import application Styles.
import "../styles/captureMenu.scss";

import * as Constants from "./captureMenuConstants";
import { Observable } from "../../shared/utils/observable";
import { CaptureMenuComponent } from "./captureMenuComponent";
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

export class CaptureMenu {
    public readonly onCanvasSelected: Observable<ICanvasInformation>;
    public readonly onCaptureRequested: Observable<ICanvasInformation>;
    public readonly onPauseRequested: Observable<ICanvasInformation>;
    public readonly onPlayRequested: Observable<ICanvasInformation>;
    public readonly onPlayNextFrameRequested: Observable<ICanvasInformation>;

    private readonly rootPlaceHolder: Element;

    private readonly captureMenuComponent: CaptureMenuComponent;

    constructor(options: ICaptureMenuOptions = {}) {
        this.rootPlaceHolder = options.rootPlaceHolder || document.body.appendChild(document.createElement("div"));

        this.onCanvasSelected = new Observable<ICanvasInformation>();
        this.onCaptureRequested = new Observable<ICanvasInformation>();
        this.onPauseRequested = new Observable<ICanvasInformation>();
        this.onPlayRequested = new Observable<ICanvasInformation>();
        this.onPlayNextFrameRequested = new Observable<ICanvasInformation>();

        const captureComponentElement = React.createElement(CaptureMenuComponent, {
            hideLog: !!options.hideLog,

            onCaptureRequested: this.onCaptureRequested,
            onPlayRequested: this.onPlayRequested,
            onPauseRequested: this.onPauseRequested,
            onPlayNextFrameRequested: this.onPlayNextFrameRequested,
            onCanvasSelected: this.onCanvasSelected,
        });
        this.captureMenuComponent = ReactDOM.render(captureComponentElement, this.rootPlaceHolder);
    }

    public getSelectedCanvasInformation(): ICanvasInformation {
        return this.captureMenuComponent.state.currentCanvasInformation;
    }

    public trackPageCanvases(): void {
        this.captureMenuComponent.trackPageCanvases();
    }

    public updateCanvasesList(canvases: NodeListOf<HTMLCanvasElement>): void {
        this.captureMenuComponent.updateCanvasesListInformationInternal(canvases, (info) => {
            return {
                id: info.id,
                width: info.width,
                height: info.height,
                ref: info,
            };
        });
    }

    public updateCanvasesListInformation(canvasesInformation: ICanvasInformation[]): void {
        this.captureMenuComponent.updateCanvasesListInformationInternal(canvasesInformation, (info) => {
            return {
                id: info.id,
                width: info.width,
                height: info.height,
                ref: info.ref,
            };
        });
    }

    public display(): void {
        this.captureMenuComponent.updateMenuStateVisibility(true);
    }

    public hide(): void {
        this.captureMenuComponent.updateMenuStateVisibility(false);
    }

    public captureComplete(errorText: string): void {
        if (errorText) {
            this.captureMenuComponent.updateMenuStateLog(LogLevel.error, errorText);
        }
        else {
            this.captureMenuComponent.updateMenuStateLog(LogLevel.info, Constants.ActionsHelpText);
        }
    }

    public setFPS(fps: number): void {
        this.captureMenuComponent.setFps(fps);
    }
}
