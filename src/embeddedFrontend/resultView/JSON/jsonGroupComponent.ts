import { BaseComponent } from "../../mvx/baseComponent";

export class JSONGroupComponent extends BaseComponent<string> {
    public render(state: string, stateId: number): Element {
        const htmlString = this.htmlTemplate`
        <div class="jsonGroupComponent">
            <div class="jsonGroupComponentTitle">${state ? state.replace(/([A-Z])/g, " $1").trim() : ""}</div>
            <ul childrenContainer="true"></ul>
        </div>`;

        return this.renderElementFromTemplate(htmlString, state, stateId);
    }
}
