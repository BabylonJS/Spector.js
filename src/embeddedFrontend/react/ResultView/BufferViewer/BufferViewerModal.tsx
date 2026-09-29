import React, { useEffect, useMemo } from "react";
import { useStore } from "../../shared/ExternalStore";
import { useResultView } from "../ResultViewContext";
import { IBufferViewerState } from "../../shared/types";
import { IBufferDataCapture } from "../../../../shared/capture/bufferDataCapture";
import { decodeBase64Bytes, decodeVertexRows, decodeIndices, IDecodedRows } from "../../shared/bufferView";

const MAX_ROWS = 2000;

export function BufferViewerModal() {
    const adapter = useResultView();
    const state = useStore(adapter.store);
    const viewer = state.bufferViewer;
    if (!viewer.open) {
        return null;
    }
    const captured = state.currentCapture?.buffers?.[viewer.bufferId];
    return <BufferViewerContent viewer={viewer} captured={captured} onClose={adapter.closeBufferViewer} />;
}

function BufferViewerContent(props: { viewer: IBufferViewerState; captured?: IBufferDataCapture; onClose: () => void }) {
    const { viewer, captured, onClose } = props;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { onClose(); } };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const decoded = useMemo<IDecodedRows | null>(() => {
        if (!captured || !viewer.layout) { return null; }
        const bytes = decodeBase64Bytes(captured.data);
        return viewer.layout.kind === "index"
            ? decodeIndices(bytes, viewer.layout.indexType, MAX_ROWS)
            : decodeVertexRows(bytes, viewer.layout, MAX_ROWS);
    }, [captured, viewer.layout]);

    return (
        <div className="bufferViewerOverlay" onClick={onClose}>
            <div className="bufferViewerModal" onClick={(e) => e.stopPropagation()}>
                <div className="bufferViewerHeader">
                    <span className="bufferViewerTitle">{viewer.label}</span>
                    <span className="bufferViewerMeta">
                        {captured ? captured.byteLength + " bytes" : "not captured"}
                        {captured && captured.capped ? " · truncated" : ""}
                    </span>
                    <span className="bufferViewerClose" title="Close (Esc)" onClick={onClose}>&#x2715;</span>
                </div>
                <div className="bufferViewerBody">
                    {!captured && <div className="bufferViewerEmpty">This buffer was not captured this frame.</div>}
                    {captured && decoded && <BufferTable decoded={decoded} />}
                </div>
            </div>
        </div>
    );
}

function BufferTable({ decoded }: { decoded: IDecodedRows }) {
    return (
        <table className="bufferViewerTable">
            <thead>
                <tr>{decoded.header.map((h, i) => <th key={i}>{h}</th>)}</tr>
            </thead>
            <tbody>
                {decoded.rows.map((row, r) => (
                    <tr key={r}>{row.map((cell, c) => <td key={c}>{cell}</td>)}</tr>
                ))}
                {decoded.truncated && (
                    <tr className="bufferViewerMore">
                        <td colSpan={decoded.header.length}>Showing first {decoded.rows.length} rows.</td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}
