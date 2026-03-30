import React from "react";

/**
 * JSON group with title.
 * Original: src/embeddedFrontend/resultView/JSON/jsonGroupComponent.ts
 *
 * DOM:
 * <div class="jsonGroupComponent">
 *   <div class="jsonGroupComponentTitle">Spaced Title</div>
 *   <ul>...</ul>
 * </div>
 *
 * Title transforms camelCase to "Camel Case" via regex.
 */
export interface JSONGroupProps {
    title: string;
    children?: React.ReactNode;
}

export function JSONGroup({ title, children }: JSONGroupProps) {
    const displayTitle = title ? title.replace(/([A-Z])/g, " $1").trim() : "";
    return (
        <div className="jsonGroupComponent">
            <div className="jsonGroupComponentTitle">{displayTitle}</div>
            <ul>{children}</ul>
        </div>
    );
}
