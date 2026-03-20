import { useStore } from "../shared/ExternalStore";
import { useCaptureMenu } from "./CaptureMenuContext";

/**
 * Displays the current FPS counter.
 * Original: src/embeddedFrontend/captureMenu/fpsCounterComponent.ts
 * Output: <span class="fpsCounterComponent">XX.XX Fps</span>
 */
export function FpsCounter() {
    const adapter = useCaptureMenu();
    const state = useStore(adapter.store);

    return (
        <span className="fpsCounterComponent">{state.fps.toFixed(2)} Fps</span>
    );
}
