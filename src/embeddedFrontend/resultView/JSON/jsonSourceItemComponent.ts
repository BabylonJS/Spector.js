import { BaseComponent, IStateEvent } from "../../mvx/baseComponent";
import { IJSONItemState } from "./jsonItemComponent";

export class JSONSourceItemComponent extends BaseComponent<IJSONItemState> {
    public onOpenSourceClicked: IStateEvent<IJSONItemState>;

    constructor() {
        super();
        this.onOpenSourceClicked = this.createEvent("onOpenSourceClicked");
    }

    public render(state: IJSONItemState, stateId: number): Element {
        const htmlString = this.htmlTemplate`
        <li commandName="onOpenSourceClicked"><span class="jsonItemComponentKey">${state.key}: </span><span class="jsonSourceItemComponentOpen">Click to Open.</span><li>`;

        return this.renderElementFromTemplate(htmlString, state, stateId);
    }
}
