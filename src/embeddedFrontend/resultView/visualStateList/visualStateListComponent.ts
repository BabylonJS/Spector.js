import { BaseComponent } from "../../mvx/baseComponent";

export class VisualStateListComponent extends BaseComponent<any> {
    public render(state: any, stateId: number): Element {
        const htmlString = this.htmlTemplate`
        <div class="visualStateListComponent">
            <ul childrenContainer="true"></ul>
        </div>`;

        return this.renderElementFromTemplate(htmlString, state, stateId);
    }
}
