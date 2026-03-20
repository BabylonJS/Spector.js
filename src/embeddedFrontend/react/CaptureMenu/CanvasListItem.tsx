import { useCaptureMenu } from "./CaptureMenuContext";
import type { ICanvasInformation } from "../shared/types";

/**
 * A single canvas entry in the dropdown list.
 * Original: src/embeddedFrontend/captureMenu/canvasListItemComponent.ts
 * Output: <li><span>Id: X - Size: WxH</span></li>
 *
 * Click triggers handleCanvasSelected on the adapter, which fires the
 * onCanvasSelected observable for spector.ts subscribers.
 */
export function CanvasListItem({ canvas }: { canvas: ICanvasInformation }) {
    const adapter = useCaptureMenu();

    return (
        <li onClick={() => adapter.handleCanvasSelected(canvas)}>
            <span>{`Id: ${canvas.id} - Size: ${canvas.width}*${canvas.height}`}</span>
        </li>
    );
}
