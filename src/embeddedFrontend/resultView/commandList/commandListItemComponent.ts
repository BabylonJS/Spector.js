namespace SPECTOR.EmbeddedFrontend {
    export interface ICommandListItemState {
        capture: ICommandCapture;
        active: boolean;
        visualStateId: number;

        previousCommandStateId: number;
        nextCommandStateId: number;
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
                    status = "deprecated";
                    break;
                case CommandCaptureStatus.Unused:
                    status = "unused";
                    break;
                case CommandCaptureStatus.Disabled:
                    status = "disabled";
                    break;
                case CommandCaptureStatus.Redundant:
                    status = "redundant";
                    break;
                case CommandCaptureStatus.Valid:
                    status = "valid";
                    break;
            }

            if ((state.capture as any).VisualState) {
                liHolder.className = " drawCall";
            }
            if (state.active) {
                liHolder.className = " active";

                setTimeout(() => {
                    ScrollIntoViewHelper.scrollIntoView(liHolder);
                }, 1);
            }

            if (state.capture.marker) {
                const markerElement = document.createElement("span");
                markerElement.className = status + " marker important";
                markerElement.innerText = state.capture.marker + " ";
                markerElement.style.fontWeight = "1000";
                liHolder.appendChild(markerElement);
            }

            const textElement = document.createElement("span");
            let text = state.capture.text;
            text = text.replace(state.capture.name, `<span class=" ${status} important">${state.capture.name}</span>`);

            textElement.innerHTML = text;
            liHolder.appendChild(textElement);

            this.mapEventListener(liHolder, "click", "onCommandSelected", state, stateId);

            return liHolder;
        }
    }
}
