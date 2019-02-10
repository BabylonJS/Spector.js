import { BaseComponent } from "../../mvx/baseComponent";

export interface IJSONItemState {
    key: string;
    value: string;
}

export class JSONItemComponent extends BaseComponent<IJSONItemState> {
    public render(state: IJSONItemState, stateId: number): Element {
        const htmlString = this.htmlTemplate`
            <li><span class="jsonItemComponentKey">${state.key}: </span><span class="jsonItemComponentValue">${state.value}</span><li>`;

        return this.renderElementFromTemplate(htmlString, state, stateId);
    }
}
