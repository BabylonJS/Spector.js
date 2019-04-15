import * as React from "react";

import { Observable } from "../../shared/utils/observable";

import { LogLevel } from "../../shared/utils/logger";

import * as Constants from "./captureMenuConstants";

export interface ILogInformation {
    readonly logText: string;
    readonly logLevel: LogLevel;
    readonly logVisible?: boolean;
}

interface ILogComponentProps {
    readonly hideLog: boolean;
    readonly onLogChanged: Observable<ILogInformation>;
}

interface ILogComponentState extends ILogInformation { }

export class LogComponent extends React.Component<ILogComponentProps, ILogComponentState> {
    private logChangedObserver: number;

    constructor(props: ILogComponentProps) {
        super(props);
        this.state = {
            logLevel: LogLevel.info,
            logText: Constants.SelectCanvasHelpText,
            logVisible: !this.props.hideLog,
        };
    }

    public shouldComponentUpdate(nextProps: ILogComponentProps, nextState: ILogComponentState): boolean {
        return nextProps.onLogChanged !== this.props.onLogChanged ||
            nextState.logText !== this.state.logText ||
            nextState.logLevel !== this.state.logLevel ||
            nextState.logVisible !== this.state.logVisible;
    }

    public componentDidMount(): void {
        this.logChangedObserver = this.props.onLogChanged.add((logInformation: ILogInformation) => {
            this.setState(logInformation)
        });
    }

    public componentWillUnmount(): void {
        this.props.onLogChanged.remove(this.logChangedObserver);
    }

    public render(): JSX.Element {
        const state = this.state;
        return (
            <div className={state.logVisible ? "captureMenuLogComponent active" : "captureMenuLogComponent"}>
                <span className={state.logLevel === LogLevel.error ? "error" : ""}>{state.logText}</span>
            </div>
        );
    }
}

