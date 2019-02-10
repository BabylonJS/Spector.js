import { BaseComponent } from "../mvx/baseComponent";

export class FpsCounterComponent extends BaseComponent<number> {

    public render(state: number, stateId: number): Element {
        const textHolder = document.createElement("span");
        textHolder.className = "fpsCounterComponent";
        textHolder.innerText = state.toFixed(2) + " Fps";
        return textHolder;
    }
}
