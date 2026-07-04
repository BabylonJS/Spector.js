import { ICommandCapture, CommandCaptureStatus } from "../../../shared/capture/commandCapture";
import { JSONRenderItem, IRawImagePixels } from "../shared/types";
import { MDNCommandLinkHelper } from "../shared/mdnCommandLinkHelper";
import { WebGLParameterNameHelper } from "../shared/webglParameterNameHelper";

/**
 * Pure builders that turn captured GL state (init/end state, command detail,
 * information columns) into the {@link JSONRenderItem} tree the React JSON
 * components render. Extracted from `ReactResultView` to keep the adapter file
 * within its size budget and to isolate this side-effect-free logic.
 */

/** Command-state keys that are never rendered as JSON nodes. */
const SKIP_KEYS: { [key: string]: boolean } = {
    VisualState: true,
    analyserName: true,
    source: true,
    translatedSource: true,
    // Raw texel data (#183) is large and consumed by the texture viewer, not shown as JSON.
    visualPixels: true,
};

/** True when `text` should be filtered out by the current search term. */
export function toFilter(text: string, searchText: string): boolean {
    if (!searchText || searchText.length <= 2) {
        return false;
    }
    text = (text + "").toLowerCase();
    return text.indexOf(searchText.toLowerCase()) === -1;
}

function getJSONAsString(
    parentChildren: JSONRenderItem[],
    key: string,
    json: any,
    searchText: string,
): string | null {
    if (json === null) { return "null"; }
    if (json === undefined) { return "undefined"; }

    if (typeof json === "number") {
        return Math.floor(json) === json ? json.toFixed(0) : json.toFixed(4);
    }
    if (typeof json === "string") { return json; }
    if (typeof json === "boolean") { return json ? "true" : "false"; }

    if (json.length === 0) { return "Empty Array"; }

    if (json.length) {
        const arrayResult: string[] = [];
        for (let i = 0; i < json.length; i++) {
            const resultItem = getJSONAsString(parentChildren, `${key}(${i.toFixed(0)})`, json[i], searchText);
            if (resultItem !== null) {
                arrayResult.push(resultItem);
            }
        }
        return arrayResult.length === 0 ? null : arrayResult.join(", ");
    }

    if (json.help) {
        parentChildren.push({ type: "help", key, value: json.name, help: json.help });
        return null;
    }

    if (json.__SPECTOR_Object_TAG) {
        return json.__SPECTOR_Object_TAG.displayText;
    }

    if (json.displayText) {
        return json.displayText;
    }

    if (typeof json === "object") {
        buildJSONGroup(parentChildren, key, json, searchText);
    }

    return null;
}

/** Non-premultiplied raw pixels for a given `visual` target, when captured (#183). */
function rawPixelsFor(json: any, target: string): IRawImagePixels | undefined {
    const map = json.visualPixels;
    return map && map[target] ? map[target] : undefined;
}

/** Emit an image item per `visual` target, carrying its raw pixels when present. */
function buildImageItems(parentChildren: JSONRenderItem[], json: any, value: any): void {
    const pixelated = json["samplerMagFilter"] === "NEAREST" || json["magFilter"] === "NEAREST";
    for (const target in value) {
        if (value.hasOwnProperty(target) && value[target]) {
            parentChildren.push({
                type: "image",
                key: target,
                value: value[target],
                pixelated,
                raw: rawPixelsFor(json, target),
            });
        }
    }
}

export function buildJSON(parentChildren: JSONRenderItem[], json: any, searchText: string): void {
    if (json.VisualState) {
        parentChildren.push({ type: "visualState", visualState: json.VisualState });
    }

    for (const key in json) {
        if (SKIP_KEYS[key]) {
            continue;
        }

        const value = json[key];
        if (key === "visual") {
            buildImageItems(parentChildren, json, value);
        } else {
            const result = getJSONAsString(parentChildren, key, value, searchText);
            if (result === null || result === undefined) {
                continue;
            } else if (toFilter(key, searchText) && toFilter(value, searchText)) {
                continue;
            }

            parentChildren.push({ type: "item", key, value: result });
        }

        if (value && value.__SPECTOR_Metadata) {
            buildJSONGroup(parentChildren, "Metadata", value.__SPECTOR_Metadata, searchText);
        }
    }
}

export function buildJSONGroup(
    parentChildren: JSONRenderItem[],
    title: string,
    json: any,
    searchText: string,
): void {
    if (!json) { return; }

    const children: JSONRenderItem[] = [];
    buildJSON(children, json, searchText);
    if (children.length === 0) { return; }

    parentChildren.push({ type: "group", title, children });
}

// ─── Command detail builder ──────────────────────────────────────────────────

export function buildCommandDetail(
    command: ICommandCapture,
    visualState: any,
    resolvedStackTrace?: string[],
): JSONRenderItem[] {
    const items: JSONRenderItem[] = [];

    // Visual state thumbnail at top
    if (visualState) {
        items.push({ type: "visualState", visualState });
    }

    // Status string
    let status: string = "Unknown";
    switch (command.status) {
        case CommandCaptureStatus.Deprecated: status = "Deprecated"; break;
        case CommandCaptureStatus.Unused: status = "Unused"; break;
        case CommandCaptureStatus.Disabled: status = "Disabled"; break;
        case CommandCaptureStatus.Redundant: status = "Redundant"; break;
        case CommandCaptureStatus.Valid: status = "Valid"; break;
    }

    // Global group with name+help link, duration, result, status
    const helpLink = MDNCommandLinkHelper.getMDNLink(command.name);
    if (command.result) {
        buildJSONGroup(items, "Global", {
            name: { help: helpLink, name: command.name },
            duration: command.commandEndTime - command.startTime,
            result: command.result,
            status,
        }, "");
    } else if (command.name !== "LOG") {
        buildJSONGroup(items, "Global", {
            name: { help: helpLink, name: command.name },
            duration: command.commandEndTime - command.startTime,
            status,
        }, "");
    }

    // All object-typed properties of the command (except VisualState and result)
    for (const key in command) {
        if (key === "VisualState" || key === "result") {
            continue;
        }
        // Relabel raw argument indices with their WebGL parameter names (#56).
        if (key === "commandArguments" && Array.isArray(command.commandArguments)) {
            buildCommandArgumentsGroup(items, command.name, command.commandArguments as any[]);
            continue;
        }
        // Use source-map-resolved frames for the stack trace when available (#98).
        if (key === "stackTrace" && Array.isArray(command.stackTrace)) {
            buildJSONGroup(items, "stackTrace", resolvedStackTrace || command.stackTrace, "");
            continue;
        }
        if (typeof command[key] === "object") {
            buildJSONGroup(items, key, command[key], "");
        }
    }

    return items;
}

/**
 * Build the "commandArguments" group, labelling each argument with its WebGL
 * parameter name (e.g. `index`, `size`, `type`) when known, falling back to the
 * numeric index for unknown functions or extra arguments.
 *
 * Fallback labels for unknown functions stay purely numeric so iteration order
 * is preserved; when names are present, unnamed trailing arguments use an
 * `argN` label (non-numeric) so the named keys keep their signature order.
 */
function buildCommandArgumentsGroup(
    parentChildren: JSONRenderItem[],
    functionName: string,
    args: any[],
): void {
    const names = WebGLParameterNameHelper.getNames(functionName, args.length);
    const labelled: { [key: string]: any } = {};
    for (let i = 0; i < args.length; i++) {
        const label = names
            ? (i < names.length ? names[i] : "arg" + i)
            : String(i);
        labelled[label] = args[i];
    }
    buildJSONGroup(parentChildren, "commandArguments", labelled, "");
}
