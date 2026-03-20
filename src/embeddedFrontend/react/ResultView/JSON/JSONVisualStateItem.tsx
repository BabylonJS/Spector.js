import React from "react";

/**
 * Visual state image in JSON context.
 * Original: src/embeddedFrontend/resultView/JSON/jsonVisualStateItemComponent.ts
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
    return (
        <div className="jsonVisualStateItemComponent">
            {visualState.Attachments ? (
                visualState.Attachments.map((imageState: any, i: number) => {
                    if (!imageState.src) { return null; }
                    return (
                        <React.Fragment key={i}>
                            <img src={encodeURI(imageState.src)} />
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
