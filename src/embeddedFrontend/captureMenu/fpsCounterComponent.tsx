import * as React from "react";

import { Observable } from "../../shared/utils/observable";

export interface IFpsCounterComponentProps {
    readonly onFpsChanged: Observable<number>;
}

interface IFpsCounterComponentState {
    readonly fps: number;
}

export class FpsCounterComponent extends React.Component<IFpsCounterComponentProps, IFpsCounterComponentState> {
    private fpsChangedObserver: number;

    constructor(props: IFpsCounterComponentProps) {
        super(props);
        this.state = {
            fps: 0,
        };
    }

    public shouldComponentUpdate(nextProps: IFpsCounterComponentProps, nextState: IFpsCounterComponentState): boolean {
        return nextProps.onFpsChanged !== this.props.onFpsChanged ||
            nextState.fps !== this.state.fps;

    }

    public componentDidMount(): void {
        this.fpsChangedObserver = this.props.onFpsChanged.add((fps: number) => {
            this.setState({
                fps,
            });
        });
    }

    public componentWillUnmount(): void {
        this.props.onFpsChanged.remove(this.fpsChangedObserver);
    }

    public render(): JSX.Element {
        return (<span className="fpsCounterComponent">{this.state.fps.toFixed(2)} Fps</span>);
    }
}
