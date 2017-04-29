namespace SPECTOR.EmbeddedFrontend {
    export class JSONContentComponent extends BaseComponent<any> {
        public render(state: any, stateId: number): Element {
            const htmlString = this.htmlTemplate`
            <div class="jsonContentComponent" childrenContainer="true">                
            </div>`;

            return this.renderElementFromTemplate(htmlString, state, stateId);
        }
    }
}