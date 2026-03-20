import React from "react";

/**
 * Two-column layout container for information view.
 * Original: src/embeddedFrontend/resultView/information/informationColumnComponent.ts
 *
 * DOM:
 * <div class="informationColumnLeftComponent">...</div>   (when left=true)
 * <div class="informationColumnRightComponent">...</div>  (when left=false)
 */
export interface InformationColumnProps {
    left: boolean;
    children?: React.ReactNode;
}

export function InformationColumn({ left, children }: InformationColumnProps) {
    return (
        <div className={left ? "informationColumnLeftComponent" : "informationColumnRightComponent"}>
            {children}
        </div>
    );
}
