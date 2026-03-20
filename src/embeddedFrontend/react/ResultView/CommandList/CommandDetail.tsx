import React from "react";

/**
 * Container for command detail panel.
 * Original: src/embeddedFrontend/resultView/commandList/commandDetailComponent.ts
 *
 * DOM: <div class="commandDetailComponent">...</div>
 */
export interface CommandDetailProps {
    children?: React.ReactNode;
}

export function CommandDetail({ children }: CommandDetailProps) {
    return (
        <div className="commandDetailComponent">
            {children}
        </div>
    );
}
