import { BaseComponent } from "../../mvx/baseComponent";

export class CommandDetailComponent extends BaseComponent<any> {
    public render(state: any, stateId: number): Element {
        const htmlString = this.htmlTemplate`
        <div class="commandDetailComponent" childrenContainer="true">
        </div>`;

        return this.renderElementFromTemplate(htmlString, state, stateId);
    }
}
