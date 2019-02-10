import { BaseComponent, IStateEvent } from "../mvx/baseComponent";
import { ICanvasInformation } from "./captureMenu";

export class CanvasListItemComponent extends BaseComponent<ICanvasInformation> {
    public onCanvasSelected: IStateEvent<ICanvasInformation>;

    constructor() {
        super();
        this.onCanvasSelected = this.createEvent("onCanvasSelected");
    }

    public render(state: ICanvasInformation, stateId: number): Element {
        const liHolder = document.createElement("li");
        const textHolder = document.createElement("span");
        textHolder.innerText = `Id: ${state.id} - Size: ${state.width}*${state.height}`;
        liHolder.appendChild(textHolder);

        this.mapEventListener(liHolder, "click", "onCanvasSelected", state, stateId);

        return liHolder;
    }
}
