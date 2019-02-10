import { BaseComponent } from "../../mvx/baseComponent";

export interface IJSONHelpItemState {
    key: string;
    value: string;
    help: string;
}

export class JSONHelpItemComponent extends BaseComponent<IJSONHelpItemState> {
    public render(state: IJSONHelpItemState, stateId: number): Element {
        const htmlString = this.htmlTemplate`
            <li><span class="jsonItemComponentKey">${state.key}: </span>
                <span class="jsonItemComponentValue">${state.value} (<a href="${state.help}" target="_blank" class="jsonSourceItemComponentOpen">Open help page</a>)
                </span>
            <li>`;

        return this.renderElementFromTemplate(htmlString, state, stateId);
    }
}
