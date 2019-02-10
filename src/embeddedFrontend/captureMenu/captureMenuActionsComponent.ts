import { BaseComponent, IStateEvent } from "../mvx/baseComponent";

export class CaptureMenuActionsComponent extends BaseComponent<boolean> {
    public onCaptureRequested: IStateEvent<boolean>;
    public onPlayRequested: IStateEvent<boolean>;
    public onPauseRequested: IStateEvent<boolean>;
    public onPlayNextFrameRequested: IStateEvent<boolean>;

    constructor() {
        super();
        this.onCaptureRequested = this.createEvent("onCaptureRequested");
        this.onPlayRequested = this.createEvent("onPlayRequested");
        this.onPauseRequested = this.createEvent("onPauseRequested");
        this.onPlayNextFrameRequested = this.createEvent("onPlayNextFrameRequested");
    }

    public render(state: boolean, stateId: number): Element {

        const htmlString = this.htmlTemplate`
        <div class="captureMenuActionsComponent">
            <div commandName="onCaptureRequested">
            </div>
            $${!state ?
                `<div commandName="onPlayRequested">
                </div>
                <div commandName="onPlayNextFrameRequested">
                </div>`
                :
                `<div commandName="onPauseRequested">
                </div>`
            }
        </div>`;

        return this.renderElementFromTemplate(htmlString, state, stateId);
    }
}
