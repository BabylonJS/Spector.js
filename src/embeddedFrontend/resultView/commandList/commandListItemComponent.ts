namespace SPECTOR.EmbeddedFrontend {
    export interface ICommandListItemState {
        capture: ICommandCapture,
        active: boolean,
        visualStateId: number,
    }

    export class CommandListItemComponent extends BaseComponent<ICommandListItemState> {
        public onCommandSelected: IStateEvent<ICommandListItemState>;

        constructor(eventConstructor: EventConstructor, logger: ILogger) {
            super(eventConstructor, logger);
            this.onCommandSelected = this.createEvent("onCommandSelected");
        }

        public render(state: ICommandListItemState, stateId: number): Element {
            const liHolder = document.createElement("li");
            let status: string = "unknown";
            switch (state.capture.status) {
                case CommandCaptureStatus.Deprecated:
                    status = "deprecated"
                    break;
                case CommandCaptureStatus.Unused:
                    status = "unused"
                    break;
                case CommandCaptureStatus.Disabled:
                    status = "disabled"
                    break;
                case CommandCaptureStatus.Redundant:
                    status = "redundant"
                    break;
                case CommandCaptureStatus.Valid:
                    status = "valid"
                    break;
            }

            if (state.active) {
                liHolder.className = " active";
                setTimeout(() => { liHolder.scrollIntoView(); document.body.scrollIntoView(); }, 1);
            }

            const textElement = document.createElement("span");
            let text = state.capture.text;
            text = text.replace(state.capture.name, `<span class=" ${status} important">${state.capture.name}</span>`)

            textElement.innerHTML = text;
            liHolder.appendChild(textElement);

            this.mapEventListener(liHolder, "click", "onCommandSelected", state, stateId);

            return liHolder;
        }
    }
}
