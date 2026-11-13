import React from "react";
import { useResultView } from "../ResultViewContext";
import { IBufferLayout } from "../../shared/types";

/**
 * "View buffer" affordance in the JSON view. Opens the buffer
 * viewer modal for a captured vertex/index buffer.
 *
 * DOM:
 * <li class="jsonItemBuffer">
 *   <span class="jsonItemBufferButton">View buffer</span>
 *   <span>label</span>
 * </li>
 */
export interface JSONBufferItemProps {
    label: string;
    bufferId: number;
    layout: IBufferLayout;
}

export function JSONBufferItem({ label, bufferId, layout }: JSONBufferItemProps) {
    const adapter = useResultView();
    return (
        <li className="jsonItemBuffer">
            <span
                className="jsonItemBufferButton"
                title="Open in buffer viewer"
                onClick={() => adapter.openBufferViewer({ label, bufferId, layout })}
            >View buffer</span>
            <span>{label}</span>
        </li>
    );
}
