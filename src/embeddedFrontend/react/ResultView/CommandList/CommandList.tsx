import React from "react";

/**
 * Container for command list items.
 * Original: src/embeddedFrontend/resultView/commandList/commandListComponent.ts
 *
 * DOM:
 * <div class="commandListComponent">
 *   <ul>...</ul>
 * </div>
 */
export interface CommandListProps {
    children?: React.ReactNode;
}

export function CommandList({ children }: CommandListProps) {
    return (
        <div className="commandListComponent">
            <ul>{children}</ul>
        </div>
    );
}
