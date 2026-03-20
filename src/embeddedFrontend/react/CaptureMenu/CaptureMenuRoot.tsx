import { LogLevel } from "../../../shared/utils/logger";
import { useStore } from "../shared/ExternalStore";
import { useCaptureMenu } from "./CaptureMenuContext";
import { CanvasList } from "./CanvasList";
import { CaptureMenuActions } from "./CaptureMenuActions";
import { FpsCounter } from "./FpsCounter";

/**
 * Root component for the React CaptureMenu.
 * Original: src/embeddedFrontend/captureMenu/captureMenuComponent.ts
 *
 * DOM structure:
 * <div>
 *   <div class="captureMenuComponent active">
 *     <CanvasList />
 *     <CaptureMenuActions />
 *     <FpsCounter />
 *   </div>
 *   <div class="captureMenuLogComponent active|""">
 *     <span class="error|""">log text</span>
 *   </div>
 * </div>
 *
 * Note: The original MVX version always outputs "active" because it checks
 * `${state ? "active" : ""}` where state is always truthy (an object).
 * The React version uses `state.visible` which actually makes hide() work.
 * This is a bug fix, not a regression.
 */
export function CaptureMenuRoot() {
    const adapter = useCaptureMenu();
    const state = useStore(adapter.store);

    return (
        <div>
            <div className={`captureMenuComponent ${state.visible ? "active" : ""}`}>
                <CanvasList />
                <CaptureMenuActions />
                <FpsCounter />
            </div>
            <div className={`captureMenuLogComponent ${state.logVisible ? "active" : ""}`}>
                <span className={state.logLevel === LogLevel.error ? "error" : ""}>
                    {state.logText}
                </span>
            </div>
        </div>
    );
}
