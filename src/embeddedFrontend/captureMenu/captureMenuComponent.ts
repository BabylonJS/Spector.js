import { LogLevel } from "../../shared/utils/logger";
import { BaseComponent } from "../mvx/baseComponent";

export interface ICaptureMenuComponentState {
    readonly visible: boolean;
    readonly logText: string;
    readonly logLevel: LogLevel;
    readonly logVisible: boolean;
}

export class CaptureMenuComponent extends BaseComponent<ICaptureMenuComponentState> {

    public render(state: ICaptureMenuComponentState, stateId: number): Element {

        const htmlString = this.htmlTemplate`<div>
            <div childrenContainer="true" class="captureMenuComponent ${state ? "active" : ""}">
            </div>
            <div class="captureMenuLogComponent ${state.logVisible ? "active" : ""}">
                <span class="${state.logLevel === LogLevel.error ? "error" : ""}">${state.logText}<span>
            </div>
        </div>`;

        return this.renderElementFromTemplate(htmlString, state, stateId);
    }
}
