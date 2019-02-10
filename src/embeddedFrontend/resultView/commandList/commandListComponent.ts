import { BaseComponent } from "../../mvx/baseComponent";

export class CommandListComponent extends BaseComponent<any> {
    public render(state: any, stateId: number): Element {
        const htmlString = this.htmlTemplate`
        <div class="commandListComponent">
            <ul childrenContainer="true"></ul>
        </div>`;

        const element = this.renderElementFromTemplate(htmlString, state, stateId);
        return element;
    }
}
