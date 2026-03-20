import React, { useCallback, useEffect, useRef } from "react";
import { IVisualStateItem } from "../../shared/types";

/**
 * Single visual state thumbnail item.
 * Original: src/embeddedFrontend/resultView/visualStateList/visualStateListItemComponent.ts
 *
 * DOM:
 * <li class="[active?]">
 *   <img src="..." /> per attachment (skips those without src)
 *   <span>attachmentName</span>  (if multiple attachments)
 *   <span>Layer: N</span>  (if textureLayer)
 *   <span>cubemapFace</span>  (if textureCubeMapFace)
 *   -- OR (no attachments) --
 *   <span>FrameBufferStatus</span>
 *   -- always --
 *   <span>Frame buffer: ID</span> or <span>Canvas frame buffer</span>
 * </li>
 */
export interface VisualStateListItemProps {
    item: IVisualStateItem;
    onVisualStateSelected: () => void;
}

export function VisualStateListItem({ item, onVisualStateSelected }: VisualStateListItemProps) {
    const ref = useRef<HTMLLIElement>(null);

    useEffect(() => {
        if (item.active && ref.current) {
            setTimeout(() => ref.current?.scrollIntoView({ block: "nearest" }), 1);
        }
    }, [item.active]);

    const handleClick = useCallback(() => {
        onVisualStateSelected();
    }, [onVisualStateSelected]);

    const vs = item.VisualState;

    return (
        <li ref={ref} className={item.active ? "active" : ""} onClick={handleClick} commandName="onVisualStateSelected">
            {vs.Attachments ? (
                vs.Attachments.map((imageState: any, i: number) => {
                    if (!imageState.src) { return null; }
                    return (
                        <React.Fragment key={i}>
                            <img src={encodeURI(imageState.src)} />
                            {vs.Attachments.length > 1 && (
                                <span>{imageState.attachmentName}</span>
                            )}
                            {!!imageState.textureLayer && (
                                <span>{"Layer: " + imageState.textureLayer}</span>
                            )}
                            {!!imageState.textureCubeMapFace && (
                                <span>{imageState.textureCubeMapFace}</span>
                            )}
                        </React.Fragment>
                    );
                })
            ) : (
                <span>{vs.FrameBufferStatus}</span>
            )}
            <span>
                {vs.FrameBuffer
                    ? "Frame buffer: " + vs.FrameBuffer.__SPECTOR_Object_TAG.id
                    : "Canvas frame buffer"}
            </span>
        </li>
    );
}
