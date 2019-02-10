import { BaseComponent } from "../mvx/baseComponent";

export class ResultViewComponent extends BaseComponent<boolean> {
    public render(state: boolean, stateId: number): Element {
        const htmlString = this.htmlTemplate`
            <div childrenContainer="true" class="resultViewComponent ${state ? "active" : ""}">
            </div>`;

        return this.renderElementFromTemplate(htmlString, state, stateId);
    }
}
