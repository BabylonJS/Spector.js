namespace SPECTOR.EmbeddedFrontend {

    export class ResultViewContentComponent extends BaseComponent<any> {

        constructor(eventConstructor: EventConstructor, logger: ILogger) {
            super(eventConstructor, logger);  
        }

        public render(state: any, stateId: number): Element {
            const htmlString = '<div childrenContainer="true" class="resultViewContentComponent"></div>';

            return this.renderElementFromTemplate(htmlString, state, stateId);
        }
    }
}