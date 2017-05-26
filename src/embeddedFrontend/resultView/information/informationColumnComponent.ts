namespace SPECTOR.EmbeddedFrontend {

    export class InformationColumnComponent extends BaseComponent<boolean> {

        constructor(eventConstructor: EventConstructor, logger: ILogger) {
            super(eventConstructor, logger);
        }

        public render(state: boolean, stateId: number): Element {
            const htmlString = this.htmlTemplate`
                <div childrenContainer="true" class="${state ? "informationColumnLeftComponent" : "informationColumnRightComponent"}"></div>`;

            return this.renderElementFromTemplate(htmlString, state, stateId);
        }
    }
}
