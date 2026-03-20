import React from "react";

/**
 * Image item in JSON view.
 * Original: src/embeddedFrontend/resultView/JSON/jsonImageItemComponent.ts
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
}

export function JSONImageItem({ itemKey, value, pixelated }: JSONImageItemProps) {
    return (
        <li className="jsonItemImageHolder">
            <div className="jsonItemImage">
                <img
                    src={value}
                    style={pixelated ? { imageRendering: "pixelated" } : undefined}
                />
                <span>{itemKey}</span>
            </div>
        </li>
    );
}
