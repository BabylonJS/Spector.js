import { BaseComponent } from "../../mvx/baseComponent";
import { IJSONItemState } from "./jsonItemComponent";

export interface IJSONImageState extends IJSONItemState {
    pixelated: boolean;
}

export class JSONImageItemComponent extends BaseComponent<IJSONImageState> {
    public render(state: IJSONImageState, stateId: number): Element {
        const htmlString = this.htmlTemplate`
        <li class="jsonItemImageHolder"><div class="jsonItemImage"><img src="${state.value}" style="${state.pixelated ? "image-rendering: pixelated;" : ""}" /><span>${state.key}</span></div></li>`;

        return this.renderElementFromTemplate(htmlString, state, stateId);
    }
}
