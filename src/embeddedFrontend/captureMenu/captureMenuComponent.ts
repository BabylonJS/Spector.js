namespace SPECTOR.EmbeddedFrontend {
    export interface ICaptureMenuComponentState {
        readonly visible: boolean;
    }

    export class CaptureMenuComponent extends BaseComponent<boolean> {

        public render(state: boolean, stateId: number): Element {

            const htmlString = this.htmlTemplate`<div childrenContainer="true" class="captureMenuComponent ${state ? "active" : ""}">
            </div>`;

            return this.renderElementFromTemplate(htmlString, state, stateId);
        }
    }
}
