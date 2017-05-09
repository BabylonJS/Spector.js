namespace SPECTOR.EmbeddedFrontend {
    export class JSONItemImageComponent extends BaseComponent<IJSONItemState> {
        public render(state: IJSONItemState, stateId: number): Element {
            const htmlString = this.htmlTemplate`
            <li class="jsonItemImageHolder"><div class="jsonItemImage"><img src="${state.value}"/><span>${state.key}</span></div></li>`;

            return this.renderElementFromTemplate(htmlString, state, stateId);
        }
    }
}
