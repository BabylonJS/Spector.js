import { BaseComponent } from "../../mvx/baseComponent";

export class ResultViewContentComponent extends BaseComponent<any> {
    public render(state: any, stateId: number): Element {
        const htmlString = '<div childrenContainer="true" class="resultViewContentComponent"></div>';

        return this.renderElementFromTemplate(htmlString, state, stateId);
    }
}
