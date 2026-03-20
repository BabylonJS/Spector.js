import { useStore } from "../shared/ExternalStore";
import { useCaptureMenu } from "./CaptureMenuContext";

/**
 * Capture/play/pause action buttons.
 * Original: src/embeddedFrontend/captureMenu/captureMenuActionsComponent.ts
 *
 * DOM structure:
 * <div class="captureMenuActionsComponent">
 *   <div commandName="onCaptureRequested"></div>
 *   <!-- when playing: -->
 *   <div commandName="onPauseRequested"></div>
 *   <!-- when paused: -->
 *   <div commandName="onPlayRequested"></div>
 *   <div commandName="onPlayNextFrameRequested"></div>
 * </div>
 *
 * State in the original is `boolean` = isPlaying.
 * When isPlaying is false (paused), show Play + PlayNextFrame.
 * When isPlaying is true, show Pause.
 *
 * commandName attributes are required for SCSS [commandName=...] selectors
 * that render the red circle, play triangle, pause bars, etc.
 */
export function CaptureMenuActions() {
    const adapter = useCaptureMenu();
    const state = useStore(adapter.store);

    return (
        <div className="captureMenuActionsComponent">
            <div commandName="onCaptureRequested" onClick={adapter.handleCaptureRequested} />
            {!state.isPlaying ? (
                <>
                    <div commandName="onPlayRequested" onClick={adapter.handlePlayRequested} />
                    <div commandName="onPlayNextFrameRequested" onClick={adapter.handlePlayNextFrameRequested} />
                </>
            ) : (
                <div commandName="onPauseRequested" onClick={adapter.handlePauseRequested} />
            )}
        </div>
    );
}
