import * as React from "react";
import { Observable } from "../../shared/utils/observable";
import { ICanvasInformation } from "./captureMenu";

interface ICaptureMenuActionsComponentProps {
    readonly currentCanvasInformation: ICanvasInformation;

    readonly onCaptureRequested: Observable<ICanvasInformation>;
    readonly onPlayRequested: Observable<ICanvasInformation>;
    readonly onPauseRequested: Observable<ICanvasInformation>;
    readonly onPlayNextFrameRequested: Observable<ICanvasInformation>;
}

interface ICaptureMenuActionsComponentState {
    readonly isPaused: boolean;
}

export class CaptureMenuActionsComponent extends React.Component<ICaptureMenuActionsComponentProps, ICaptureMenuActionsComponentState> {
    constructor(props: ICaptureMenuActionsComponentProps) {
        super(props);
        this.state = {
            isPaused: false,
        };
    }

    public shouldComponentUpdate(nextProps: ICaptureMenuActionsComponentProps, nextState: ICaptureMenuActionsComponentState): boolean {
        return nextProps.onCaptureRequested !== this.props.onCaptureRequested ||
            nextProps.onPlayRequested !== this.props.onPlayRequested ||
            nextProps.onPauseRequested !== this.props.onPauseRequested ||
            nextProps.onPlayNextFrameRequested !== this.props.onPlayNextFrameRequested ||
            nextState.isPaused !== this.state.isPaused;

    }

    private onPause() {
        this.setState({
            isPaused: true,
        });
        this.props.onPauseRequested.trigger(this.props.currentCanvasInformation);
    }

    private onPlay() {
        this.setState({
            isPaused: false,
        });
        this.props.onPlayRequested.trigger(this.props.currentCanvasInformation);
    }

    private onPlayNextFrameRequested() {
        this.props.onPlayNextFrameRequested.trigger(this.props.currentCanvasInformation);
    }

    private onCaptureRequested() {
        this.props.onCaptureRequested.trigger(this.props.currentCanvasInformation);
    };

    public render(): JSX.Element {
        return (
            <div className="captureMenuActionsComponent">
                <div onClick={() => this.onCaptureRequested()} className="captureRequested"></div>
                {
                    this.state.isPaused ?
                    <React.Fragment>
                        <div onClick={() => this.onPlay()} className="playRequested"></div>
                        <div onClick={() => this.onPlayNextFrameRequested()} className="playNextFrameRequested"></div>
                    </React.Fragment>
                    :
                    <div onClick={() => this.onPause()} className="pauseRequested"></div>
                }
            </div>
        );
    }
}
