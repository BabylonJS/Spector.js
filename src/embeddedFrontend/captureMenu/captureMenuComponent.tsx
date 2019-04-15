import * as React from "react";

import { LogLevel } from "../../shared/utils/logger";

import { ICanvasInformation } from "./captureMenu";
import { CaptureMenuActionsComponent } from "./captureMenuActionsComponent";
import { CanvasListComponent } from "./canvasListComponent";
import { FpsCounterComponent } from "./fpsCounterComponent";
import { ILogInformation, LogComponent } from "./logComponent";
import * as Constants from "./captureMenuConstants";
import { Observable } from "../../shared/utils/observable";

export interface ICaptureMenuComponentProps {
    readonly hideLog: boolean;

    readonly onCaptureRequested: Observable<ICanvasInformation>;
    readonly onPlayRequested: Observable<ICanvasInformation>;
    readonly onPauseRequested: Observable<ICanvasInformation>;
    readonly onPlayNextFrameRequested: Observable<ICanvasInformation>;
    readonly onCanvasSelected: Observable<ICanvasInformation>;
}

export interface ICaptureMenuComponentState {
    readonly visible: boolean;

    readonly isTrackingCanvas: boolean;

    readonly currentCanvasInformation: ICanvasInformation;
    readonly availableCanvasInformation: ICanvasInformation[];
}

export class CaptureMenuComponent extends React.Component<ICaptureMenuComponentProps, ICaptureMenuComponentState> {
    private captureRequestedObserver = 0;
    private readonly onLogChanged: Observable<ILogInformation>;
    private readonly onFpsChanged: Observable<number>;

    constructor(props: ICaptureMenuComponentProps) {
        super(props);

        this.onLogChanged = new Observable<ILogInformation>();
        this.onFpsChanged = new Observable<number>();

        this.state = {
            visible: true,
            isTrackingCanvas : false,
            currentCanvasInformation: null,
            availableCanvasInformation: [],
        };
    }

    public componentDidMount(): void {
        this.captureRequestedObserver = this.props.onCaptureRequested.add((canvas) => {
            if (canvas) {
                this.updateMenuStateLog(LogLevel.info, Constants.PleaseWaitHelpText);
            }
        });
    }

    public componentWillUnmount(): void {
        this.props.onCaptureRequested.remove(this.captureRequestedObserver);
    }

    public setFps(fps: number) {
        this.onFpsChanged.trigger(fps);
    }

    public updateMenuStateVisibility(visible: boolean) {
        this.setState({
            visible,
        });
    }

    public updateMenuStateLog(logLevel: LogLevel, logText: string) {
        this.onLogChanged.trigger({
            logLevel,
            logText,
        });
    }

    public selectCanvas(canvas: ICanvasInformation) {
        this.onLogChanged.trigger({
            logLevel: LogLevel.info,
            logVisible: canvas ? !this.props.hideLog : false,
            logText: canvas ? Constants.ActionsHelpText : Constants.SelectCanvasHelpText,
        });

        this.setState({
            currentCanvasInformation: canvas,
        });

        this.props.onCanvasSelected.trigger(canvas);
    }

    public trackPageCanvases(): void {
        this.setState({
            isTrackingCanvas: true,
        });
    }

    public updateCanvasesListInformationInternal<T>(canvasesInformation: ArrayLike<T>, convertToListInfo: (info: T) => ICanvasInformation): void {
        // Create a consumable information list for the view.
        const canvasesInformationClone: ICanvasInformation[] = [];
        for (let i = 0; i < canvasesInformation.length; i++) {
            const canvas = canvasesInformation[i];
            const canvasInformationClone = convertToListInfo(canvas);
            canvasesInformationClone.push(canvasInformationClone);
        }

        this.setState({
            availableCanvasInformation: canvasesInformationClone,
        });
    }

    public componentDidUpdate(_: ICaptureMenuComponentProps, prevState: ICaptureMenuComponentState) {
        if (prevState.isTrackingCanvas !== this.state.isTrackingCanvas) {
            this.populateCanvasListFromDOM();
        }
    }

    public render(): JSX.Element {
        const props = this.props;
        const state = this.state;
        return (
            <React.Fragment>
                <div className={state.visible ? "captureMenuComponent active" : "captureMenuComponent"}>
                    <CanvasListComponent
                        currentCanvasInformation={state.currentCanvasInformation}
                        availableCanvasInformation={state.availableCanvasInformation}
                        onCanvasSelected={(canvas) => this.selectCanvas(canvas)}
                        populateCanvasListFromDOM={() => this.populateCanvasListFromDOM()} />
                    <CaptureMenuActionsComponent
                        currentCanvasInformation={state.currentCanvasInformation}
                        onCaptureRequested={props.onCaptureRequested}
                        onPlayRequested={props.onPlayRequested}
                        onPauseRequested={props.onPauseRequested}
                        onPlayNextFrameRequested={props.onPlayNextFrameRequested} />
                    <FpsCounterComponent onFpsChanged={this.onFpsChanged} />
                </div>
                <LogComponent onLogChanged={this.onLogChanged} hideLog={this.props.hideLog} />
            </React.Fragment>
        );
    }

    private populateCanvasListFromDOM() {
        if (!this.state.isTrackingCanvas) {
            return;
        }

        if (document.body) {
            const canvases = document.body.querySelectorAll("canvas");
            this.updateCanvasesListInformationInternal(canvases, (info) => {
                return {
                    id: info.id,
                    width: info.width,
                    height: info.height,
                    ref: info,
                };
            });
        }
    }
}
