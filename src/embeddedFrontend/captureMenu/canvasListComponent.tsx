import * as React from "react";

import { ICanvasInformation } from "./captureMenu";
import { CanvasListItemComponent } from "./canvasListItemComponent";

interface ICanvasListComponentProps {
    readonly currentCanvasInformation: ICanvasInformation;
    readonly availableCanvasInformation: ICanvasInformation[];

    readonly populateCanvasListFromDOM: () => void;
    readonly onCanvasSelected: (canvas: ICanvasInformation) => void;
}

interface ICanvasListComponentState {
    readonly showList: boolean;
}

export class CanvasListComponent extends React.Component<ICanvasListComponentProps, ICanvasListComponentState> {
    constructor(props: ICanvasListComponentProps) {
        super(props);
        this.state = {
            showList: false,
        };
    }

    public componentDidUpdate(prevProps: ICanvasListComponentProps, prevState: ICanvasListComponentState) {
        if (prevState.showList != this.state.showList) {
            if (this.state.showList) {
                this.props.populateCanvasListFromDOM();
                this.props.onCanvasSelected(null);
            }
        }
        else if (prevProps.availableCanvasInformation != this.props.availableCanvasInformation) {
            if (!this.state.showList) {
                // Auto Select in the list if only one canvas.
                const canvasesCount = this.props.availableCanvasInformation.length;
                if (canvasesCount === 1) {
                    const canvasToSelect = this.props.availableCanvasInformation[0];
                    this.props.onCanvasSelected(canvasToSelect);
                }
                else {
                    this.props.onCanvasSelected(null);
                }
            }
        }
    }

    public toggleList() {
        this.setState({
            showList: !this.state.showList
        });
    }

    public onCanvasSelected(canvas: ICanvasInformation) {
        this.setState({
            showList: false
        });
        this.props.onCanvasSelected(canvas);
    }

    public render(): JSX.Element {
        const title = this.props.currentCanvasInformation ? `${this.props.currentCanvasInformation.id} (${this.props.currentCanvasInformation.width}*${this.props.currentCanvasInformation.height})` : "Choose Canvas...";
        return (
            <div className="canvasListComponent">
                <span className="canvasSelection" onClick={() => this.toggleList()}>{title}</span>
                {
                    this.state.showList &&
                    <ul>
                        {
                            this.props.availableCanvasInformation.map((canvas) =>
                                <CanvasListItemComponent key={canvas.id} onCanvasSelected={(c) => this.onCanvasSelected(c)} canvas={canvas} />
                            )
                        }
                    </ul>
                }
            </div>
        );
    }
}
