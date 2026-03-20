import React, { useCallback } from "react";
import { ICapture } from "../../../../shared/capture/capture";

/**
 * Single capture list thumbnail item.
 * Original: src/embeddedFrontend/resultView/captureList/captureListItemComponent.ts
 *
 * DOM:
 * <li class="[active?]">
 *   <img src="..." /> (per attachment)  OR  <span>FrameBufferStatus</span>
 *   <span>HH:MM:SS <a class="captureListItemSave" href="#"></a></span>
 * </li>
 */
export interface CaptureListItemProps {
    capture: ICapture;
    active: boolean;
    onCaptureSelected: () => void;
    onSaveRequested: () => void;
}

export function CaptureListItem({ capture, active, onCaptureSelected, onSaveRequested }: CaptureListItemProps) {
    const handleSave = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onSaveRequested();
    }, [onSaveRequested]);

    const handleSelect = useCallback(() => {
        onCaptureSelected();
    }, [onCaptureSelected]);

    const timeStr = new Date(capture.startTime).toTimeString().split(" ")[0];

    return (
        <li className={active ? "active" : ""} onClick={handleSelect}>
            {capture.endState.VisualState.Attachments ? (
                capture.endState.VisualState.Attachments.map((imageState: any, i: number) => (
                    <img key={i} src={encodeURI(imageState.src)} />
                ))
            ) : (
                <span>{capture.endState.VisualState.FrameBufferStatus}</span>
            )}
            <span>
                {timeStr}
                <a
                    href="#"
                    className="captureListItemSave"
                    commandName="onSaveRequested"
                    onClick={handleSave}
                />
            </span>
        </li>
    );
}
