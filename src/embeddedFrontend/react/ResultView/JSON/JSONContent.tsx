import React from "react";

/**
 * Container for JSON groups/items.
 * Original: src/embeddedFrontend/resultView/JSON/jsonContentComponent.ts
 *
 * DOM: <div class="jsonContentComponent">...</div>
 */
export interface JSONContentProps {
    children?: React.ReactNode;
}

export function JSONContent({ children }: JSONContentProps) {
    return (
        <div className="jsonContentComponent">
            {children}
        </div>
    );
}
