import * as React from "react";

import { ICanvasInformation } from "./captureMenu";

interface ICanvasListItemComponentProps {
    readonly canvas: ICanvasInformation;
    readonly onCanvasSelected: (canvas: ICanvasInformation) => void;
}

export class CanvasListItemComponent extends React.Component<ICanvasListItemComponentProps> {
    public select() {
        this.props.onCanvasSelected(this.props.canvas);
    }

    public render(): JSX.Element {
        const { canvas } = this.props;
        return (
            <li onClick={() => this.select()}>
                <span>Id: {canvas.id} - Size: {canvas.width}*{canvas.height}</span>
            </li>
        );
    }
}
