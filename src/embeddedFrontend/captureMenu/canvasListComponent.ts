import { BaseComponent, IStateEvent } from "../mvx/baseComponent";
import { ICanvasInformation } from "./captureMenu";

export interface ICanvasListComponentState {
    currentCanvasInformation: ICanvasInformation;
    showList: boolean;
}

export class CanvasListComponent extends BaseComponent<ICanvasListComponentState> {
    public onCanvasSelection: IStateEvent<ICanvasListComponentState>;

    constructor() {
        super();
        this.onCanvasSelection = this.createEvent("onCanvasSelection");
    }

    public render(state: ICanvasListComponentState, stateId: number): Element {
        const htmlString = this.htmlTemplate`
        <div class="canvasListComponent">
            <span commandName="onCanvasSelection">
                ${state.currentCanvasInformation ? `${state.currentCanvasInformation.id} (${state.currentCanvasInformation.width}*${state.currentCanvasInformation.height})` : "Choose Canvas..."}
            </span>
            <ul childrenContainer="true" style="${state.showList ? "display:block;visibility:visible" : "display:none;visibility:hidden"}"></ul>
        </div>`;

        return this.renderElementFromTemplate(htmlString, state, stateId);
    }
}
