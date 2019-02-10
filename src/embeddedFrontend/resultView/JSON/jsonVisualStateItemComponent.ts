import { BaseComponent } from "../../mvx/baseComponent";

export class JSONVisualStateItemComponent extends BaseComponent<string> {
    public render(state: any, stateId: number): Element {
        const divHolder = document.createElement("div");
        divHolder.className = "jsonVisualStateItemComponent";
        if (state.Attachments) {
            for (const imageState of state.Attachments) {
                if (!imageState.src) {
                    continue;
                }

                const img = document.createElement("img");
                img.src = encodeURI(imageState.src);
                divHolder.appendChild(img);

                if (state.Attachments.length > 1) {
                    const attachment = document.createElement("span");
                    attachment.innerText = imageState.attachmentName;
                    divHolder.appendChild(attachment);
                }
            }
        }
        else {
            const status = document.createElement("span");
            status.innerText = state.FrameBufferStatus;
            divHolder.appendChild(status);
        }
        const fbo = document.createElement("span");
        fbo.innerText = state.FrameBuffer ? state.FrameBuffer.__SPECTOR_Object_TAG.displayText : "Canvas frame buffer";
        divHolder.appendChild(fbo);

        return divHolder;
    }
}
