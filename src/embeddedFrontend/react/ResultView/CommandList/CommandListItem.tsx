import React, { useCallback, useEffect, useRef } from "react";
import { ICommandListItemState } from "../../shared/types";
import { CommandCaptureStatus } from "../../../../shared/capture/commandCapture";

/**
 * Single command list row.
 * Original: src/embeddedFrontend/resultView/commandList/commandListItemComponent.ts
 *
 * IMPORTANT behavioral notes from original:
 * - className assignment is sequential: drawCall is set first, active OVERWRITES it.
 *   This is preserved intentionally (existing behavior).
 * - Markers render as bold spans with status + "marker important" classes.
 * - LOG commands render differently (bold span with capture.text).
 * - Non-clear draw calls show vertex/fragment shader links.
 * - Active items auto-scroll into view via setTimeout(1).
 */
export interface CommandListItemProps {
    command: ICommandListItemState;
    onCommandSelected: () => void;
    onVertexSelected?: () => void;
    onFragmentSelected?: () => void;
}

function getStatusString(status: CommandCaptureStatus): string {
    switch (status) {
        case CommandCaptureStatus.Deprecated: return "deprecated";
        case CommandCaptureStatus.Unused: return "unused";
        case CommandCaptureStatus.Disabled: return "disabled";
        case CommandCaptureStatus.Redundant: return "redundant";
        case CommandCaptureStatus.Valid: return "valid";
        default: return "unknown";
    }
}

export function CommandListItem({ command, onCommandSelected, onVertexSelected, onFragmentSelected }: CommandListItemProps) {
    const ref = useRef<HTMLLIElement>(null);
    const capture = command.capture;
    const status = getStatusString(capture.status);
    const hasVisualState = !!(capture as any).VisualState;

    // Preserve original className assignment behavior:
    // drawCall is set first, then active OVERWRITES it (not additive).
    let className = "";
    if (hasVisualState) {
        className = " drawCall";
    }
    if (command.active) {
        className = " active";
    }

    useEffect(() => {
        if (command.active && ref.current) {
            setTimeout(() => ref.current?.scrollIntoView({ block: "nearest" }), 1);
        }
    }, [command.active]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        onCommandSelected();
    }, [onCommandSelected]);

    const handleVertexClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onVertexSelected?.();
    }, [onVertexSelected]);

    const handleFragmentClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onFragmentSelected?.();
    }, [onFragmentSelected]);

    // Render shader links for non-clear draw calls
    let shaderLinks: React.ReactNode = null;
    if (hasVisualState && capture.name !== "clear") {
        try {
            const vertexShader = capture.DrawCall.shaders[0];
            const fragmentShader = capture.DrawCall.shaders[1];
            shaderLinks = (
                <>
                    <a href="#" onClick={handleVertexClick}>{vertexShader.name}</a>
                    <a href="#" onClick={handleFragmentClick}>{fragmentShader.name}</a>
                </>
            );
        } catch (_e) {
            // Do nothing but prevent crashing — matches original.
        }
    }

    return (
        <li ref={ref} className={className} onClick={handleClick} commandName="onCommandSelected">
            {capture.marker && (
                <span
                    className={`${status} marker important`}
                    style={{ fontWeight: 1000 }}
                >{capture.marker + " "}</span>
            )}
            {capture.name === "LOG" ? (
                <span
                    className={`${status} marker important`}
                    style={{ fontWeight: 1000 }}
                >{capture.text + " "}</span>
            ) : (
                <span dangerouslySetInnerHTML={{
                    __html: capture.text.replace(
                        capture.name,
                        `<span class=" ${status} important">${capture.name}</span>`,
                    ),
                }} />
            )}
            {shaderLinks}
        </li>
    );
}
