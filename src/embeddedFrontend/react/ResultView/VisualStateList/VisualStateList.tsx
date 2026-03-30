import React from "react";

/**
 * Container for visual state list items.
 * Original: src/embeddedFrontend/resultView/visualStateList/visualStateListComponent.ts
 *
 * DOM:
 * <div class="visualStateListComponent">
 *   <ul>...</ul>
 * </div>
 */
export interface VisualStateListProps {
    children?: React.ReactNode;
}

export function VisualStateList({ children }: VisualStateListProps) {
    return (
        <div className="visualStateListComponent">
            <ul>{children}</ul>
        </div>
    );
}
