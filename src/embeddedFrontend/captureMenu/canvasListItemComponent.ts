namespace SPECTOR.EmbeddedFrontend {
    export class CanvasListItemComponent extends BaseComponent<ICanvasInformation> {
        public onCanvasSelected: IStateEvent<ICanvasInformation>;

        constructor(eventConstructor: EventConstructor, logger: ILogger) {
            super(eventConstructor, logger);
            this.onCanvasSelected = this.createEvent("onCanvasSelected");
        }

        public render(state: ICanvasInformation, stateId: number): Element {
            const liHolder = document.createElement("li");
            const textHolder = document.createElement("span");
            textHolder.innerText = `Id: ${state.id} - Size: ${state.width}*${state.height}`;
            liHolder.appendChild(textHolder);

            this.mapEventListener(liHolder, "click", "onCanvasSelected", state, stateId);

            return liHolder;
        }
    }
}
