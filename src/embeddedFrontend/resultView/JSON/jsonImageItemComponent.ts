namespace SPECTOR.EmbeddedFrontend {
    export interface IJSONImageItemState {
        key: string;
        thumbnail: string;
        realSize: string;
    }

    export class JSONImageItemComponent extends BaseComponent<IJSONImageItemState> {
        public render(state: IJSONImageItemState, stateId: number): Element {
            let htmlString = "";
            if (state.realSize !== null) {
                htmlString = this.htmlTemplate`
                <li class="jsonItemImageHolder">
                    <div class="jsonItemImage">
                        <a href="${state.realSize}" download="${state.key}" target="_blank" title="Click image to download" class="jsonSourceItemComponentOpen">
                            <img src="${state.thumbnail}"/>
                            <span>${state.key}</span>
                        </a>
                    </div>
                </li>`;
            } else {
                htmlString = this.htmlTemplate`
                <li class="jsonItemImageHolder">
                    <div class="jsonItemImage">
                        <img src="${state.thumbnail}"/>
                        <span>${state.key}</span>
                    </div>
                </li>`;
            }

            return this.renderElementFromTemplate(htmlString, state, stateId);
        }
    }
}
