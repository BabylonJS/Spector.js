import React from "react";
import { useResultView } from "../ResultViewContext";
import { IRawImagePixels } from "../../shared/types";

/**
 * Image item in JSON view.
 * Original: src/embeddedFrontend/resultView/JSON/jsonImageItemComponent.ts
 *
 * The thumbnail is clickable and opens the full texture viewer modal (#183),
 * passing the preserved non-premultiplied pixels when available.
 *
 * DOM:
 * <li class="jsonItemImageHolder">
 *   <div class="jsonItemImage">
 *     <img src="..." style="image-rendering: pixelated;" />
 *     <span>key</span>
 *   </div>
 * </li>
 */
export interface JSONImageItemProps {
    itemKey: string;
    value: string;
    pixelated: boolean;
    raw?: IRawImagePixels;
}

export function JSONImageItem({ itemKey, value, pixelated, raw }: JSONImageItemProps) {
    const adapter = useResultView();
    return (
        <li className="jsonItemImageHolder">
            <div className="jsonItemImage jsonItemImageClickable">
                <img
                    src={value}
                    style={pixelated ? { imageRendering: "pixelated" } : undefined}
                    title="Open in texture viewer"
                    onClick={() => adapter.openTextureViewer({ src: value, label: itemKey, pixelated, raw: raw || null })}
                />
                <span>{itemKey}</span>
            </div>
        </li>
    );
}
