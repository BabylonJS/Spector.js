import { useStore } from "../shared/ExternalStore";
import { useCaptureMenu } from "./CaptureMenuContext";
import { CanvasListItem } from "./CanvasListItem";

/**
 * Canvas selector dropdown.
 * Original: src/embeddedFrontend/captureMenu/canvasListComponent.ts
 *
 * DOM structure:
 * <div class="canvasListComponent">
 *   <span commandName="onCanvasSelection">label</span>
 *   <ul style="display:block|none; visibility:visible|hidden">
 *     <li>...</li>
 *   </ul>
 * </div>
 *
 * The commandName attribute is critical — SCSS uses [commandName=onCanvasSelection]
 * selectors for styling.
 */
export function CanvasList() {
    const adapter = useCaptureMenu();
    const state = useStore(adapter.store);

    const label = state.selectedCanvas
        ? `${state.selectedCanvas.id} (${state.selectedCanvas.width}*${state.selectedCanvas.height})`
        : "Choose Canvas...";

    return (
        <div className="canvasListComponent">
            <span commandName="onCanvasSelection" onClick={adapter.handleCanvasListToggle}>
                {label}
            </span>
            <ul style={{
                display: state.showCanvasList ? "block" : "none",
                visibility: state.showCanvasList ? "visible" : "hidden",
            }}>
                {state.canvases.map((canvas, i) => (
                    <CanvasListItem key={canvas.id || i} canvas={canvas} />
                ))}
            </ul>
        </div>
    );
}
