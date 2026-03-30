import React from "react";

/**
 * Help item with MDN link in JSON view.
 * Original: src/embeddedFrontend/resultView/JSON/jsonHelpItemComponent.ts
 *
 * DOM:
 * <li>
 *   <span class="jsonItemComponentKey">key: </span>
 *   <span class="jsonItemComponentValue">
 *     value (<a href="..." target="_blank" class="jsonSourceItemComponentOpen">Open help page</a>)
 *   </span>
 * </li>
 */
export interface JSONHelpItemProps {
    itemKey: string;
    value: string;
    help: string;
}

export function JSONHelpItem({ itemKey, value, help }: JSONHelpItemProps) {
    return (
        <li>
            <span className="jsonItemComponentKey">{itemKey + ": "}</span>
            <span className="jsonItemComponentValue">
                {value + " ("}
                <a href={help} target="_blank" className="jsonSourceItemComponentOpen">Open help page</a>
                {")"}
            </span>
        </li>
    );
}
