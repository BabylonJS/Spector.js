import React from "react";

/**
 * Key-value pair item in JSON view.
 * Original: src/embeddedFrontend/resultView/JSON/jsonItemComponent.ts
 *
 * DOM:
 * <li>
 *   <span class="jsonItemComponentKey">key: </span>
 *   <span class="jsonItemComponentValue">value</span>
 * </li>
 */
export interface JSONItemProps {
    itemKey: string;
    value: string;
}

export function JSONItem({ itemKey, value }: JSONItemProps) {
    return (
        <li>
            <span className="jsonItemComponentKey">{itemKey + ": "}</span>
            <span className="jsonItemComponentValue">{value}</span>
        </li>
    );
}
