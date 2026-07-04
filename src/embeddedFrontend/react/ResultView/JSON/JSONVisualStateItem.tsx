import React from "react";
import { useResultView } from "../ResultViewContext";

/**
 * Visual state image in JSON context.
 * Original: src/embeddedFrontend/resultView/JSON/jsonVisualStateItemComponent.ts
 *
 * Each attachment image is clickable and opens the texture viewer modal (#183),
 * passing the preserved non-premultiplied pixels when available.
 *
 * DOM:
 * <div class="jsonVisualStateItemComponent">
 *   <img src="..." /> per attachment (skips without src)
 *   <span>attachmentName</span> (if multiple attachments)
 *   -- OR (no attachments) --
 *   <span>FrameBufferStatus</span>
 *   -- always --
 *   <span>displayText or "Canvas frame buffer"</span>
 * </div>
 */
export interface JSONVisualStateItemProps {
    visualState: any;
}

export function JSONVisualStateItem({ visualState }: JSONVisualStateItemProps) {
    const adapter = useResultView();
    return (
        <div className="jsonVisualStateItemComponent">
            {visualState.Attachments ? (
                visualState.Attachments.map((imageState: any, i: number) => {
                    if (!imageState.src) { return null; }
                    return (
                        <React.Fragment key={i}>
                            <img
                                className="jsonItemImageClickable"
                                src={encodeURI(imageState.src)}
                                title="Open in texture viewer"
                                onClick={() => adapter.openTextureViewer({
                                    src: imageState.src,
                                    label: imageState.attachmentName || "Attachment",
                                    pixelated: false,
                                    raw: imageState.raw || null,
                                })}
                            />
                            {visualState.Attachments.length > 1 && (
                                <span>{imageState.attachmentName}</span>
                            )}
                        </React.Fragment>
                    );
                })
            ) : (
                <span>{visualState.FrameBufferStatus}</span>
            )}
            <span>
                {visualState.FrameBuffer
                    ? visualState.FrameBuffer.__SPECTOR_Object_TAG.displayText
                    : "Canvas frame buffer"}
            </span>
        </div>
    );
}
