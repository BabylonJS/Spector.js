import React from "react";

/**
 * Container for result view tab content.
 * Original: src/embeddedFrontend/resultView/content/resultViewContentComponent.ts
 *
 * DOM: <div class="resultViewContentComponent">...</div>
 */
export interface ResultViewContentProps {
    children?: React.ReactNode;
}

export function ResultViewContent({ children }: ResultViewContentProps) {
    return (
        <div className="resultViewContentComponent">
            {children}
        </div>
    );
}
