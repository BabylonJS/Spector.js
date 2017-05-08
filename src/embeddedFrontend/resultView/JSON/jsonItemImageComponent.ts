namespace SPECTOR.EmbeddedFrontend {
    export class JSONItemImageComponent extends BaseComponent<IJSONItemState> {
        public render(state: IJSONItemState, stateId: number): Element {
            const htmlString = this.htmlTemplate`
            <li><img class="jsonItemImage" src="${state.value}"/><li>`;

            return this.renderElementFromTemplate(htmlString, state, stateId);
        }
    }
}
