import { ICapture } from "../../../shared/capture/capture";
import { BaseComponent, IStateEvent } from "../../mvx/baseComponent";

export interface ICaptureListItemState {
    capture: ICapture;
    active: boolean;
}

export class CaptureListItemComponent extends BaseComponent<ICaptureListItemState> {
    public onCaptureSelected: IStateEvent<ICaptureListItemState>;
    public onSaveRequested: IStateEvent<ICaptureListItemState>;

    constructor() {
        super();
        this.onCaptureSelected = this.createEvent("onCaptureSelected");
        this.onSaveRequested = this.createEvent("onSaveRequested");
    }

    public render(state: ICaptureListItemState, stateId: number): Element {
        const liHolder = document.createElement("li");
        if (state.active) {
            liHolder.className = "active";
        }

        if (state.capture.endState.VisualState.Attachments) {
            for (const imageState of state.capture.endState.VisualState.Attachments) {
                const img = document.createElement("img");
                img.src = encodeURI(imageState.src);
                liHolder.appendChild(img);
            }
        }
        else {
            const status = document.createElement("span");
            status.innerText = state.capture.endState.VisualState.FrameBufferStatus;
            liHolder.appendChild(status);
        }

        const text = document.createElement("span");
        text.innerText = new Date(state.capture.startTime).toTimeString().split(" ")[0];
        liHolder.appendChild(text);

        const save = document.createElement("a") as HTMLAnchorElement;
        save.href = "#";
        save.className = "captureListItemSave";
        this.mapEventListener(save, "click", "onSaveRequested", state, stateId, false, true);

        text.appendChild(save);

        this.mapEventListener(liHolder, "click", "onCaptureSelected", state, stateId);

        return liHolder;
    }
}
