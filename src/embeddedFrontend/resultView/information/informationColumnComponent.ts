import { BaseComponent } from "../../mvx/baseComponent";

export class InformationColumnComponent extends BaseComponent<boolean> {
    public render(state: boolean, stateId: number): Element {
        const htmlString = this.htmlTemplate`
                <div childrenContainer="true" class="${state ? "informationColumnLeftComponent" : "informationColumnRightComponent"}"></div>`;

        return this.renderElementFromTemplate(htmlString, state, stateId);
    }
}
