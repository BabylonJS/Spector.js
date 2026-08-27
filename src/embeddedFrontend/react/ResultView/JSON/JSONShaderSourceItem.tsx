import React, { useCallback } from "react";
import { IShaderCapture } from "../../../../shared/capture/programCapture";

export interface JSONShaderSourceItemProps {
    itemKey: string;
    shader: IShaderCapture;
    programLog?: string;
    onOpen?: (shader: IShaderCapture, programLog?: string) => void;
}

/** Link from command details to a captured shader in the source editor. */
export function JSONShaderSourceItem({ itemKey, shader, programLog, onOpen }: JSONShaderSourceItemProps) {
    const handleClick = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        onOpen?.(shader, programLog);
    }, [onOpen, programLog, shader]);

    const sourceLength = shader.source ? shader.source.length : 0;
    const label = `${shader.name || "Shader"} (${sourceLength} chars)`;

    return (
        <li>
            <span className="jsonItemComponentKey">{itemKey + ": "}</span>
            <a
                href="#"
                role="button"
                className="jsonSourceItemComponentOpen"
                commandName="onShaderSourceOpen"
                onClick={handleClick}
            >Open {label}</a>
        </li>
    );
}
