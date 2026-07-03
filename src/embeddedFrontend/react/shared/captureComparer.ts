import { ICapture } from "../../../shared/capture/capture";
import { ICommandCapture } from "../../../shared/capture/commandCapture";

/** Classification of a single row in a capture-to-capture command diff. */
export type CommandDiffType = "unchanged" | "added" | "removed" | "changed";

/**
 * A single differing field between two matched commands — typically a uniform
 * or uniform-block member whose value changed between the two captures.
 */
export interface ICommandFieldDiff {
    /** Human-readable path, e.g. `"uniform uColor"` or `"uniformBlock Scene.time"`. */
    path: string;
    /** Stringified value from the previous capture (or `"(absent)"`). */
    previous: string;
    /** Stringified value from the current capture (or `"(absent)"`). */
    current: string;
    /** For texture visual diffs: previous-capture thumbnail as a data URL. */
    previousImage?: string;
    /** For texture visual diffs: current-capture thumbnail as a data URL. */
    currentImage?: string;
}

/**
 * One row of a capture comparison.
 *
 * - `unchanged`: the command is identical in both captures.
 * - `added`:     the command exists only in the current (B) capture.
 * - `removed`:   the command exists only in the previous (A) capture.
 * - `changed`:   a command with the same name whose arguments and/or captured
 *                state (e.g. uniform values) differ.
 */
export interface ICommandDiffRow {
    type: CommandDiffType;
    name: string;
    /** Rendered command text from the previous capture (A), when present. */
    previousText?: string;
    /** Rendered command text from the current capture (B), when present. */
    currentText?: string;
    /** Index into the previous capture's `commands`, when present. */
    indexA?: number;
    /** Index into the current capture's `commands`, when present. */
    indexB?: number;
    /**
     * Id of the current-capture command (present for `unchanged`, `added`, and
     * `changed` rows). Used to jump to the command in the Commands view.
     */
    commandId?: number;
    /**
     * Field-level differences (uniforms / uniform blocks) for matched commands.
     * Present on `changed` rows whose deep state differs.
     */
    fieldDiffs?: ICommandFieldDiff[];
}

/** Aggregate counts for a capture comparison. */
export interface ICaptureDiffSummary {
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
}

/** Full result of comparing two captures. */
export interface ICaptureDiff {
    rows: ICommandDiffRow[];
    summary: ICaptureDiffSummary;
}

/**
 * Compare two captures of (ideally) the same page and produce a command-level
 * diff.
 *
 * The algorithm is a longest-common-subsequence (LCS) diff over the commands'
 * rendered text (`ICommandCapture.text`, e.g. `"drawArrays: TRIANGLES, 0, 3"`),
 * which is a stable, human-meaningful signature. Anchored on identical calls,
 * the gaps between anchors hold the removed (A-only) and added (B-only) calls.
 * Within a gap, a removed+added pair that share the same command *name* is
 * collapsed into a single `changed` row (a modified call) rather than shown as
 * an unrelated remove/add.
 *
 * Pure and side-effect free so it can be unit-tested without a browser.
 */
export function compareCaptures(previous: ICapture, current: ICapture): ICaptureDiff {
    const a = (previous && previous.commands) || [];
    const b = (current && current.commands) || [];

    const rows = diffCommands(a, b);
    const summary: ICaptureDiffSummary = { added: 0, removed: 0, changed: 0, unchanged: 0 };
    for (const row of rows) {
        summary[row.type]++;
    }
    return { rows, summary };
}

/** Signature used for LCS matching. */
function signatureOf(command: ICommandCapture): string {
    // `text` already encodes "name: arg, arg, ...". Fall back to name when absent.
    return (command && (command.text || command.name)) || "";
}

/**
 * LCS-based command diff. Returns rows in generated (current-capture) order,
 * with removed rows inserted at their original relative positions.
 */
function diffCommands(a: ICommandCapture[], b: ICommandCapture[]): ICommandDiffRow[] {
    const n = a.length;
    const m = b.length;

    const sigA = a.map(signatureOf);
    const sigB = b.map(signatureOf);

    // Build LCS length table. Guard against pathological sizes to keep the UI
    // responsive; captures of the same page are typically comparable in length.
    const lcs: number[][] = [];
    for (let row = 0; row <= n; row++) {
        lcs.push(new Array(m + 1).fill(0));
    }
    for (let ai = n - 1; ai >= 0; ai--) {
        for (let bj = m - 1; bj >= 0; bj--) {
            lcs[ai][bj] = sigA[ai] === sigB[bj]
                ? lcs[ai + 1][bj + 1] + 1
                : Math.max(lcs[ai + 1][bj], lcs[ai][bj + 1]);
        }
    }

    // Walk the table to produce an ordered edit script.
    const rows: ICommandDiffRow[] = [];
    let pendingRemovals: ICommandDiffRow[] = [];

    const flushRemovals = () => {
        for (const r of pendingRemovals) {
            rows.push(r);
        }
        pendingRemovals = [];
    };

    let i = 0;
    let j = 0;
    while (i < n && j < m) {
        if (sigA[i] === sigB[j]) {
            flushRemovals();
            // Same rendered text — but the captured state (e.g. uniform values)
            // may still differ. Deep-compare and upgrade to `changed` if so.
            const fieldDiffs = computeFieldDiffs(a[i], b[j]);
            if (fieldDiffs.length > 0) {
                rows.push({
                    type: "changed",
                    name: b[j].name,
                    previousText: a[i].text,
                    currentText: b[j].text,
                    indexA: i,
                    indexB: j,
                    commandId: b[j].id,
                    fieldDiffs,
                });
            } else {
                rows.push({
                    type: "unchanged",
                    name: b[j].name,
                    previousText: a[i].text,
                    currentText: b[j].text,
                    indexA: i,
                    indexB: j,
                    commandId: b[j].id,
                });
            }
            i++;
            j++;
        } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
            // Removal from A.
            pendingRemovals.push({
                type: "removed",
                name: a[i].name,
                previousText: a[i].text,
                indexA: i,
            });
            i++;
        } else {
            // Addition in B — try to pair with a pending removal of the same name
            // to represent a "changed" call instead of remove+add.
            const paired = takePairedRemoval(pendingRemovals, b[j].name);
            if (paired) {
                rows.push({
                    type: "changed",
                    name: b[j].name,
                    previousText: paired.previousText,
                    currentText: b[j].text,
                    indexA: paired.indexA,
                    indexB: j,
                    commandId: b[j].id,
                    fieldDiffs: computeFieldDiffs(a[paired.indexA as number], b[j]),
                });
            } else {
                flushRemovals();
                rows.push({
                    type: "added",
                    name: b[j].name,
                    currentText: b[j].text,
                    indexB: j,
                    commandId: b[j].id,
                });
            }
            j++;
        }
    }

    while (i < n) {
        pendingRemovals.push({
            type: "removed",
            name: a[i].name,
            previousText: a[i].text,
            indexA: i,
        });
        i++;
    }
    while (j < m) {
        const paired = takePairedRemoval(pendingRemovals, b[j].name);
        if (paired) {
            rows.push({
                type: "changed",
                name: b[j].name,
                previousText: paired.previousText,
                currentText: b[j].text,
                indexA: paired.indexA,
                indexB: j,
                commandId: b[j].id,
                fieldDiffs: computeFieldDiffs(a[paired.indexA as number], b[j]),
            });
        } else {
            flushRemovals();
            rows.push({
                type: "added",
                name: b[j].name,
                currentText: b[j].text,
                indexB: j,
                commandId: b[j].id,
            });
        }
        j++;
    }
    flushRemovals();

    return rows;
}

/**
 * Compute field-level differences between two matched commands, focusing on the
 * captured GPU state most useful for spotting "same call, different result"
 * bugs: uniform values and uniform-block members.
 *
 * Only stable value fields are compared (a uniform's `value`), never Spector
 * object tags or visual thumbnails, so sampler uniforms (whose value is the
 * texture unit) don't produce false positives.
 */
function computeFieldDiffs(a: ICommandCapture, b: ICommandCapture): ICommandFieldDiff[] {
    const diffs: ICommandFieldDiff[] = [];
    if (!a || !b) {
        return diffs;
    }

    const drawA = (a as any).DrawCall;
    const drawB = (b as any).DrawCall;

    // Nicely-labelled by-name diffs for uniforms and uniform blocks.
    compareNamedValues("uniform", drawA && drawA.uniforms, drawB && drawB.uniforms, diffs);
    compareNamedValues("uniformBlock", drawA && drawA.uniformBlocks, drawB && drawB.uniformBlocks, diffs);

    // Generic deep diff over every other captured state group on the command
    // (BlendState, DepthState, CullState, StencilState, DrawState, the rest of
    // DrawCall, etc.). Object references are normalised to their type so that
    // per-object id churn (e.g. across a page reload) does not create noise.
    const keys = unionKeys(a, b);
    for (const key of keys) {
        if (TOP_LEVEL_SKIP[key]) {
            continue;
        }
        const va = (a as any)[key];
        const vb = (b as any)[key];
        // Only compare structured state groups, not scalar bookkeeping fields.
        if (!isObject(va) && !isObject(vb)) {
            continue;
        }
        deepDiff(va, vb, key, diffs);
    }

    return diffs;
}

/** Top-level command keys that are bookkeeping, not comparable draw-call state. */
const TOP_LEVEL_SKIP: { [key: string]: boolean } = {
    id: true, name: true, commandArguments: true, result: true, status: true,
    marker: true, text: true, startTime: true, commandEndTime: true, endTime: true,
    stackTrace: true, consumeCommandId: true, VisualState: true,
};

/**
 * Keys skipped anywhere in the state tree: Spector object metadata, visual
 * thumbnails, unstable object locations, large shader source blobs, and the
 * uniforms/uniformBlocks arrays (handled by name above). `length` is skipped so
 * arrays are compared by element, not by their `length` property.
 */
const DEEP_SKIP: { [key: string]: boolean } = {
    __SPECTOR_Object_TAG: true, __SPECTOR_Object_CustomData: true, __SPECTOR_Metadata: true,
    customData: true, visual: true, VisualState: true, texture: true, sampler: true,
    location: true, source: true, translatedSource: true, analyserName: true,
    uniforms: true, uniformBlocks: true, length: true,
};

/** Maximum recursion depth for the generic state diff (guards against cycles). */
const MAX_DEPTH = 8;

function isObject(value: any): boolean {
    return value !== null && typeof value === "object";
}

/** If a value is (or wraps) a Spector object tag, return its stable type name. */
function tagTypeName(value: any): string | null {
    if (!isObject(value)) {
        return null;
    }
    const tag = value.__SPECTOR_Object_TAG || (typeof value.typeName === "string" && "id" in value ? value : null);
    if (tag && typeof tag.typeName === "string") {
        return tag.typeName;
    }
    return null;
}

function unionKeys(a: any, b: any): string[] {
    const keys: string[] = [];
    const seen: { [k: string]: boolean } = {};
    const add = (obj: any) => {
        if (isObject(obj)) {
            for (const k in obj) {
                if (obj.hasOwnProperty(k) && !seen[k]) { seen[k] = true; keys.push(k); }
            }
        }
    };
    add(a);
    add(b);
    return keys;
}

/**
 * Recursively diff two state values, appending a {@link ICommandFieldDiff} for
 * every differing leaf. Object references are compared by type name only.
 */
function deepDiff(a: any, b: any, path: string, out: ICommandFieldDiff[], depth: number = 0): void {
    // Object-tag references: compare by stable type, ignoring per-object id.
    const ta = tagTypeName(a);
    const tb = tagTypeName(b);
    if (ta !== null || tb !== null) {
        const sa = ta !== null ? ta : "(absent)";
        const sb = tb !== null ? tb : "(absent)";
        if (sa !== sb) {
            out.push({ path, previous: sa, current: sb });
        }
        return;
    }

    const aObj = isObject(a);
    const bObj = isObject(b);

    if (!aObj && !bObj) {
        const sa = stringifyValue(a);
        const sb = stringifyValue(b);
        if (sa !== sb) {
            out.push({ path, previous: sa, current: sb });
        }
        return;
    }

    if (aObj !== bObj || depth >= MAX_DEPTH) {
        // Structural mismatch or depth cap: fall back to a coarse value compare.
        const sa = stringifyValue(a);
        const sb = stringifyValue(b);
        if (sa !== sb) {
            out.push({ path, previous: sa, current: sb });
        }
        return;
    }

    for (const key of unionKeys(a, b)) {
        if (DEEP_SKIP[key]) {
            continue;
        }
        deepDiff(a ? a[key] : undefined, b ? b[key] : undefined, path + "." + key, out, depth + 1);
    }
}

/**
 * Compare two arrays of `{ name, value }` entries by name, appending a diff for
 * every entry whose value differs (or that exists in only one side).
 */
function compareNamedValues(
    label: string,
    listA: any[] | undefined,
    listB: any[] | undefined,
    out: ICommandFieldDiff[],
): void {
    const mapA = indexByName(listA);
    const mapB = indexByName(listB);

    const names: string[] = [];
    const seen: { [name: string]: boolean } = {};
    for (const name in mapA) {
        if (mapA.hasOwnProperty(name) && !seen[name]) { seen[name] = true; names.push(name); }
    }
    for (const name in mapB) {
        if (mapB.hasOwnProperty(name) && !seen[name]) { seen[name] = true; names.push(name); }
    }

    for (const name of names) {
        const entryA = mapA.hasOwnProperty(name) ? mapA[name] : undefined;
        const entryB = mapB.hasOwnProperty(name) ? mapB[name] : undefined;

        const strA = entryA ? stringifyValue(entryA.value) : "(absent)";
        const strB = entryB ? stringifyValue(entryB.value) : "(absent)";
        if (strA !== strB) {
            out.push({ path: label + " " + name, previous: strA, current: strB });
        }

        compareUniformTextures(label + " " + name, entryA, entryB, out);
    }
}

/**
 * Compare the texture(s) bound to a single sampler uniform between two captures.
 * Handles both the single `texture` and the `textures` array forms. (Uniform
 * blocks never carry these fields, so this is a no-op for them.)
 */
function compareUniformTextures(
    pathPrefix: string,
    entryA: any,
    entryB: any,
    out: ICommandFieldDiff[],
): void {
    const texA = entryA && entryA.texture;
    const texB = entryB && entryB.texture;
    if (isObject(texA) || isObject(texB)) {
        compareTextureState(pathPrefix + " texture", texA, texB, out);
    }

    const listTexA = entryA && entryA.textures;
    const listTexB = entryB && entryB.textures;
    const lenA = Array.isArray(listTexA) ? listTexA.length : 0;
    const lenB = Array.isArray(listTexB) ? listTexB.length : 0;
    const len = Math.max(lenA, lenB);
    for (let ti = 0; ti < len; ti++) {
        compareTextureState(
            pathPrefix + " texture[" + ti + "]",
            lenA > 0 ? listTexA[ti] : undefined,
            lenB > 0 ? listTexB[ti] : undefined,
            out,
        );
    }
}

/** Texture metadata fields compared as plain values. */
const TEXTURE_META_KEYS = ["width", "height", "depth", "format", "internalFormat", "textureType"];

/**
 * Compare the state of a texture bound to a sampler uniform between two
 * captures: dimensions/format as value diffs, and the captured pixel thumbnails
 * (`visual`) as image diffs so the UI can show a before/after preview.
 */
function compareTextureState(
    pathPrefix: string,
    texA: any,
    texB: any,
    out: ICommandFieldDiff[],
): void {
    if (!isObject(texA) && !isObject(texB)) {
        return;
    }
    compareTextureMeta(pathPrefix, texA, texB, out);
    compareTextureVisual(pathPrefix, texA && texA.visual, texB && texB.visual, out);
}

function compareTextureMeta(pathPrefix: string, texA: any, texB: any, out: ICommandFieldDiff[]): void {
    for (const key of TEXTURE_META_KEYS) {
        const va = texA ? texA[key] : undefined;
        const vb = texB ? texB[key] : undefined;
        if (va === undefined && vb === undefined) {
            continue;
        }
        const sa = stringifyValue(va);
        const sb = stringifyValue(vb);
        if (sa !== sb) {
            out.push({ path: pathPrefix + " " + key, previous: sa, current: sb });
        }
    }
}

function compareTextureVisual(pathPrefix: string, visA: any, visB: any, out: ICommandFieldDiff[]): void {
    if (!isObject(visA) && !isObject(visB)) {
        return;
    }
    for (const key of unionKeys(visA, visB)) {
        const imgA = visA ? visA[key] : undefined;
        const imgB = visB ? visB[key] : undefined;
        const strImgA = typeof imgA === "string";
        const strImgB = typeof imgB === "string";
        if ((strImgA || strImgB) && imgA !== imgB) {
            out.push({
                path: pathPrefix + " (" + key + ")",
                previous: strImgA ? "(image)" : "(absent)",
                current: strImgB ? "(image)" : "(absent)",
                previousImage: strImgA ? imgA : undefined,
                currentImage: strImgB ? imgB : undefined,
            });
        }
    }
}

function indexByName(list: any[] | undefined): { [name: string]: any } {
    const map: { [name: string]: any } = {};
    if (Array.isArray(list)) {
        for (const entry of list) {
            if (entry && typeof entry.name === "string") {
                map[entry.name] = entry;
            }
        }
    }
    return map;
}

/** Stable, compact stringification of a state value for comparison/display. */
function stringifyValue(value: any): string {
    if (value === undefined) {
        return "(absent)";
    }
    if (value === null) {
        return "null";
    }
    try {
        return JSON.stringify(value);
    } catch {
        return String(value);
    }
}

/**
 * Remove and return the first pending removal whose command name matches, so it
 * can be reported as a `changed` row. Returns `null` when there is no match.
 */
function takePairedRemoval(pendingRemovals: ICommandDiffRow[], name: string): ICommandDiffRow | null {
    for (let k = 0; k < pendingRemovals.length; k++) {
        if (pendingRemovals[k].name === name) {
            const [removed] = pendingRemovals.splice(k, 1);
            return removed;
        }
    }
    return null;
}
