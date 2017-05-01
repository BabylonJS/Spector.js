namespace SPECTOR.EmbeddedFrontend {

    export class ResultViewComponent extends BaseComponent<boolean> {

        constructor(eventConstructor: EventConstructor, logger: ILogger) {
            super(eventConstructor, logger);
        }

        public render(state: boolean, stateId: number): Element {
            const htmlString = this.htmlTemplate`
            <div childrenContainer="true" class="resultViewComponent ${state ? "active" : ""}">
            </div>`;

            return this.renderElementFromTemplate(htmlString, state, stateId);
        }
    }
}
