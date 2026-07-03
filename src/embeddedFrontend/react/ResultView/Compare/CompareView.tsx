import React, { useEffect, useState } from "react";
import { useStore } from "../../shared/ExternalStore";
import { useResultView } from "../ResultViewContext";
import { ICommandDiffRow, ICommandFieldDiff } from "../../shared/captureComparer";

/**
 * "Compare" tab (#155): shows a command-level diff between the currently
 * selected capture and the immediately previous one.
 *
 * The layout mirrors the Commands tab (legend rail · list · detail panel) so it
 * feels native to the rest of the app: the middle column lists every differing
 * call, and selecting one reveals its field-level changes (uniforms, state and
 * texture thumbnails) in the right-hand detail panel as JSON-style groups.
 *
 * DOM structure:
 * <div class="compareViewComponent">
 *   <div class="compareViewHeader"> summary + toggle </div>
 *   <div class="compareViewBody">
 *     <div class="compareViewLegend"> ... </div>
 *     <ul class="compareViewList"><li class="compareRow added|removed|changed|unchanged"/></ul>
 *     <div class="compareViewDetail"> selected row detail </div>
 *   </div>
 * </div>
 */
const SIGN: { [type: string]: string } = {
    added: "+",
    removed: "-",
    changed: "~",
    unchanged: " ",
};

/** Stable identity for a diff row so the selection survives filter/data changes. */
function rowKey(row: ICommandDiffRow): string {
    const a = row.indexA === undefined ? "_" : String(row.indexA);
    const b = row.indexB === undefined ? "_" : String(row.indexB);
    return row.type + "#" + a + "#" + b;
}

/** True when a field diff carries texture thumbnails rather than plain values. */
function isImageDiff(field: ICommandFieldDiff): boolean {
    return !!(field.previousImage || field.currentImage);
}

export function CompareView() {
    const adapter = useResultView();
    const state = useStore(adapter.store);
    const [selectedKey, setSelectedKey] = useState<string | null>(null);

    // Reset the selection whenever a fresh comparison is computed (a new capture
    // pair produces a new `compareRows` array) so a stale key can't highlight an
    // unrelated row. Toggling "Differences only" keeps the same `compareRows`
    // reference, so the selection is preserved across filtering.
    useEffect(() => {
        setSelectedKey(null);
    }, [state.compareRows]);

    if (!state.canCompare) {
        return (
            <div className="compareViewComponent">
                <div className="compareViewEmpty">
                    Capture the same page at least twice, then select a capture to compare
                    it against the previous one.
                </div>
            </div>
        );
    }

    const { added, removed, changed, unchanged } = state.compareSummary;
    const rows = state.compareOnlyDifferences
        ? state.compareRows.filter((r) => r.type !== "unchanged")
        : state.compareRows;

    // Resolve the selected row (falling back to the first visible row) so the
    // detail panel always mirrors a concrete list entry.
    const selectedRow =
        rows.find((r) => rowKey(r) === selectedKey) || (rows.length > 0 ? rows[0] : null);
    const selectedRowKey = selectedRow ? rowKey(selectedRow) : "";

    return (
        <div className="compareViewComponent">
            <div className="compareViewHeader">
                <span className="compareViewLabel">{state.compareLabel}</span>
                <span className="compareViewSummary">
                    <span className="added">+{added}</span>
                    <span className="removed">-{removed}</span>
                    <span className="changed">~{changed}</span>
                    <span className="unchanged">={unchanged}</span>
                </span>
                <label className="compareViewToggle">
                    <input
                        type="checkbox"
                        checked={state.compareOnlyDifferences}
                        onChange={(e) => adapter.handleCompareOnlyDifferencesChange(e.target.checked)}
                    />
                    Differences only
                </label>
            </div>
            <div className="compareViewBody">
                <CompareLegend />
                <ul className="compareViewList">
                    {rows.length === 0 ? (
                        <li className="compareViewEmptyRow">No differences between these two captures.</li>
                    ) : (
                        rows.map((row) => {
                            const key = rowKey(row);
                            return (
                                <CompareListRow
                                    key={key}
                                    row={row}
                                    selected={key === selectedRowKey}
                                    onSelect={() => setSelectedKey(key)}
                                />
                            );
                        })
                    )}
                </ul>
                <div className="compareViewDetail">
                    {selectedRow ? (
                        <CompareDetail row={selectedRow} onSelectCommand={adapter.handleCompareCommandSelected} />
                    ) : (
                        <div className="compareDetailEmpty">Select a call to see its details.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

/** Colour key for the diff row types, mirroring the command-list conventions. */
function CompareLegend() {
    return (
        <div className="compareViewLegend">
            <div className="compareLegendRow added"><span className="compareLegendChip" /> Added</div>
            <div className="compareLegendRow removed"><span className="compareLegendChip" /> Removed</div>
            <div className="compareLegendRow changed"><span className="compareLegendChip" /> Changed</div>
            <div className="compareLegendRow unchanged"><span className="compareLegendChip" /> Unchanged</div>
        </div>
    );
}

/** A single, compact row in the middle diff list (click to inspect). */
function CompareListRow(props: { row: ICommandDiffRow; selected: boolean; onSelect: () => void }) {
    const { row, selected, onSelect } = props;
    const fullText = row.type === "removed" ? row.previousText : row.currentText;
    const rest = fullText && fullText.indexOf(row.name) === 0 ? fullText.slice(row.name.length) : "";
    const className = "compareRow " + row.type + (selected ? " selected" : "");
    return (
        <li className={className} onClick={onSelect} title={fullText}>
            <span className="compareSign">{SIGN[row.type]}</span>
            <span className="compareRowText">
                <span className="compareCmdName">{row.name}</span>{rest}
            </span>
        </li>
    );
}

/** Right-hand detail panel: the selected row's changes as JSON-style groups. */
function CompareDetail(props: { row: ICommandDiffRow; onSelectCommand: (commandId: number) => void }) {
    const { row, onSelectCommand } = props;
    const fields = row.fieldDiffs || [];
    const valueFields = fields.filter((f) => !isImageDiff(f));
    const imageFields = fields.filter(isImageDiff);
    const textChanged = row.type === "changed" && row.previousText !== row.currentText;
    const callText = row.type === "removed" ? row.previousText : row.currentText;

    return (
        <div className="compareDetail">
            <div className="compareDetailGroup">
                <div className="compareDetailTitle">Command</div>
                <ul>
                    <li>
                        <span className="compareDetailKey">name</span>:{" "}
                        <span className={"compareCmdName " + row.type}>{row.name}</span>
                    </li>
                    <li>
                        <span className="compareDetailKey">call</span>:{" "}
                        {textChanged ? (
                            <span className="compareTextChange">
                                <span className="compareOld">{row.previousText}</span>
                                <span className="compareArrow"> → </span>
                                <span className="compareNew">{row.currentText}</span>
                            </span>
                        ) : (
                            <span className="compareNew">{callText}</span>
                        )}
                    </li>
                    {row.commandId !== undefined && (
                        <li>
                            <a
                                href="#"
                                className="compareCommandLink"
                                title="Show this command in the Commands view"
                                onClick={(e) => { e.preventDefault(); onSelectCommand(row.commandId as number); }}
                            >Show in Commands view →</a>
                        </li>
                    )}
                </ul>
            </div>

            {valueFields.length > 0 && (
                <div className="compareDetailGroup">
                    <div className="compareDetailTitle">Uniform &amp; state changes</div>
                    <ul>
                        {valueFields.map((f, i) => (
                            <li key={i}>
                                <span className="compareDetailKey">{f.path}</span>:{" "}
                                <span className="compareOld">{f.previous}</span>
                                <span className="compareArrow"> → </span>
                                <span className="compareNew">{f.current}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {imageFields.length > 0 && (
                <div className="compareDetailGroup">
                    <div className="compareDetailTitle">Texture changes</div>
                    <ul>
                        {imageFields.map((f, i) => (
                            <li key={i} className="compareTextureItem">
                                <span className="compareDetailKey">{f.path}</span>
                                <div className="compareImageDiff">
                                    {f.previousImage ? (
                                        <img className="compareThumb" src={f.previousImage} />
                                    ) : (
                                        <span className="compareOld">{f.previous}</span>
                                    )}
                                    <span className="compareArrow"> → </span>
                                    {f.currentImage ? (
                                        <img className="compareThumb" src={f.currentImage} />
                                    ) : (
                                        <span className="compareNew">{f.current}</span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
