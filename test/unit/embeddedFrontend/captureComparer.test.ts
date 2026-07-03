import { compareCaptures } from "../../../src/embeddedFrontend/react/shared/captureComparer";
import { ICapture } from "../../../src/shared/capture/capture";
import { ICommandCapture } from "../../../src/shared/capture/commandCapture";

// Minimal command factory: only `name` and `text` matter to the comparer.
function cmd(name: string, text: string): ICommandCapture {
    return { name, text } as ICommandCapture;
}

// Draw-call command with uniforms attached (for state-diff tests).
function drawCmd(text: string, uniforms: Array<{ name: string; value: any }>, uniformBlocks?: Array<{ name: string; value: any }>): ICommandCapture {
    return { name: "drawArrays", text, DrawCall: { uniforms, uniformBlocks } } as any;
}

// Command with arbitrary extra state groups attached (e.g. BlendState).
function stateCmd(name: string, text: string, extra: { [k: string]: any }): ICommandCapture {
    return Object.assign({ name, text }, extra) as any;
}

// A serialized Spector object-tag reference (as embedded in captured state).
function tag(typeName: string, id: number): any {
    return { __SPECTOR_Object_TAG: { typeName, id, displayText: typeName + " - ID: " + id } };
}

// Minimal capture wrapper around a command list.
function capture(commands: ICommandCapture[]): ICapture {
    return { commands } as ICapture;
}

describe("compareCaptures", () => {
    it("reports no differences for identical captures", () => {
        const a = capture([cmd("clear", "clear: 16384"), cmd("drawArrays", "drawArrays: 4, 0, 3")]);
        const b = capture([cmd("clear", "clear: 16384"), cmd("drawArrays", "drawArrays: 4, 0, 3")]);

        const diff = compareCaptures(a, b);
        expect(diff.summary).toEqual({ added: 0, removed: 0, changed: 0, unchanged: 2 });
        expect(diff.rows.every((r) => r.type === "unchanged")).toBe(true);
    });

    it("detects an added command", () => {
        const a = capture([cmd("clear", "clear: 16384")]);
        const b = capture([cmd("clear", "clear: 16384"), cmd("drawArrays", "drawArrays: 4, 0, 3")]);

        const diff = compareCaptures(a, b);
        expect(diff.summary.added).toBe(1);
        expect(diff.summary.unchanged).toBe(1);
        const added = diff.rows.find((r) => r.type === "added");
        expect(added!.name).toBe("drawArrays");
        expect(added!.currentText).toBe("drawArrays: 4, 0, 3");
        expect(added!.indexB).toBe(1);
    });

    it("carries the current-capture command id for linking (unchanged/added/changed)", () => {
        const a = capture([{ id: 10, name: "clear", text: "clear: X" } as any]);
        const b = capture([
            { id: 20, name: "clear", text: "clear: X" } as any,
            { id: 21, name: "drawArrays", text: "drawArrays: A" } as any,
        ]);

        const diff = compareCaptures(a, b);
        const unchanged = diff.rows.find((r) => r.type === "unchanged");
        const added = diff.rows.find((r) => r.type === "added");
        expect(unchanged!.commandId).toBe(20); // id from the CURRENT capture
        expect(added!.commandId).toBe(21);
    });

    it("detects a removed command", () => {
        const a = capture([cmd("clear", "clear: 16384"), cmd("drawArrays", "drawArrays: 4, 0, 3")]);
        const b = capture([cmd("clear", "clear: 16384")]);

        const diff = compareCaptures(a, b);
        expect(diff.summary.removed).toBe(1);
        expect(diff.summary.unchanged).toBe(1);
        const removed = diff.rows.find((r) => r.type === "removed");
        expect(removed!.name).toBe("drawArrays");
        expect(removed!.previousText).toBe("drawArrays: 4, 0, 3");
        expect(removed!.indexA).toBe(1);
    });

    it("collapses a same-name remove+add into a single changed row", () => {
        const a = capture([cmd("clear", "clear: 16384"), cmd("drawArrays", "drawArrays: 4, 0, 3")]);
        const b = capture([cmd("clear", "clear: 16384"), cmd("drawArrays", "drawArrays: 4, 0, 6")]);

        const diff = compareCaptures(a, b);
        expect(diff.summary).toEqual({ added: 0, removed: 0, changed: 1, unchanged: 1 });
        const changed = diff.rows.find((r) => r.type === "changed");
        expect(changed!.name).toBe("drawArrays");
        expect(changed!.previousText).toBe("drawArrays: 4, 0, 3");
        expect(changed!.currentText).toBe("drawArrays: 4, 0, 6");
        expect(changed!.indexA).toBe(1);
        expect(changed!.indexB).toBe(1);
    });

    it("keeps different-name changes as separate add and remove", () => {
        const a = capture([cmd("enable", "enable: BLEND")]);
        const b = capture([cmd("disable", "disable: BLEND")]);

        const diff = compareCaptures(a, b);
        expect(diff.summary.added).toBe(1);
        expect(diff.summary.removed).toBe(1);
        expect(diff.summary.changed).toBe(0);
    });

    it("handles an inserted call in the middle", () => {
        const a = capture([cmd("clear", "clear: X"), cmd("drawArrays", "drawArrays: A")]);
        const b = capture([cmd("clear", "clear: X"), cmd("useProgram", "useProgram: P"), cmd("drawArrays", "drawArrays: A")]);

        const diff = compareCaptures(a, b);
        expect(diff.summary).toEqual({ added: 1, removed: 0, changed: 0, unchanged: 2 });
        // Order is preserved: clear (unchanged), useProgram (added), drawArrays (unchanged)
        expect(diff.rows.map((r) => r.type)).toEqual(["unchanged", "added", "unchanged"]);
        expect(diff.rows[1].name).toBe("useProgram");
    });

    it("handles an empty previous capture (all added)", () => {
        const a = capture([]);
        const b = capture([cmd("clear", "clear: X"), cmd("drawArrays", "drawArrays: A")]);

        const diff = compareCaptures(a, b);
        expect(diff.summary).toEqual({ added: 2, removed: 0, changed: 0, unchanged: 0 });
    });

    it("handles an empty current capture (all removed)", () => {
        const a = capture([cmd("clear", "clear: X"), cmd("drawArrays", "drawArrays: A")]);
        const b = capture([]);

        const diff = compareCaptures(a, b);
        expect(diff.summary).toEqual({ added: 0, removed: 2, changed: 0, unchanged: 0 });
    });

    it("handles two empty captures", () => {
        const diff = compareCaptures(capture([]), capture([]));
        expect(diff.rows).toEqual([]);
        expect(diff.summary).toEqual({ added: 0, removed: 0, changed: 0, unchanged: 0 });
    });

    it("preserves current-capture order in the row list", () => {
        const a = capture([cmd("a", "a"), cmd("b", "b"), cmd("c", "c")]);
        const b = capture([cmd("a", "a"), cmd("c", "c"), cmd("d", "d")]);

        const diff = compareCaptures(a, b);
        // a unchanged, b removed, c unchanged, d added
        const types = diff.rows.map((r) => `${r.type}:${r.name}`);
        expect(types).toEqual(["unchanged:a", "removed:b", "unchanged:c", "added:d"]);
    });

    describe("uniform / state diffs (#155)", () => {
        it("flags a uniform value change on an otherwise-identical draw call", () => {
            const a = capture([drawCmd("drawArrays: POINTS, 0, 3", [{ name: "uColor", value: [1, 0, 0, 1] }])]);
            const b = capture([drawCmd("drawArrays: POINTS, 0, 3", [{ name: "uColor", value: [0, 1, 0, 1] }])]);

            const diff = compareCaptures(a, b);
            expect(diff.summary).toEqual({ added: 0, removed: 0, changed: 1, unchanged: 0 });
            const changed = diff.rows.find((r) => r.type === "changed");
            expect(changed!.fieldDiffs).toEqual([
                { path: "uniform uColor", previous: "[1,0,0,1]", current: "[0,1,0,1]" },
            ]);
            // Text is identical (the diff is only in the uniform).
            expect(changed!.previousText).toBe(changed!.currentText);
        });

        it("does not flag identical uniforms as changed", () => {
            const a = capture([drawCmd("drawArrays: POINTS, 0, 3", [{ name: "uColor", value: [1, 0, 0, 1] }])]);
            const b = capture([drawCmd("drawArrays: POINTS, 0, 3", [{ name: "uColor", value: [1, 0, 0, 1] }])]);

            const diff = compareCaptures(a, b);
            expect(diff.summary).toEqual({ added: 0, removed: 0, changed: 0, unchanged: 1 });
            expect(diff.rows[0].fieldDiffs).toBeUndefined();
        });

        it("reports multiple changed uniforms", () => {
            const a = capture([drawCmd("d", [{ name: "uA", value: 1 }, { name: "uB", value: 2 }])]);
            const b = capture([drawCmd("d", [{ name: "uA", value: 9 }, { name: "uB", value: 2 }, { name: "uC", value: 3 }])]);

            const diff = compareCaptures(a, b);
            const changed = diff.rows.find((r) => r.type === "changed");
            expect(changed!.fieldDiffs).toEqual([
                { path: "uniform uA", previous: "1", current: "9" },
                { path: "uniform uC", previous: "(absent)", current: "3" },
            ]);
        });

        it("attaches uniform diffs to a call whose args also changed", () => {
            const a = capture([drawCmd("drawArrays: POINTS, 0, 3", [{ name: "uColor", value: [1, 0, 0, 1] }])]);
            const b = capture([drawCmd("drawArrays: POINTS, 0, 6", [{ name: "uColor", value: [0, 1, 0, 1] }])]);

            const diff = compareCaptures(a, b);
            const changed = diff.rows.find((r) => r.type === "changed");
            expect(changed!.previousText).not.toBe(changed!.currentText); // args differ
            expect(changed!.fieldDiffs).toEqual([
                { path: "uniform uColor", previous: "[1,0,0,1]", current: "[0,1,0,1]" },
            ]);
        });

        it("diffs uniform blocks by name", () => {
            const a = capture([drawCmd("d", [], [{ name: "Scene", value: { time: 1 } }])]);
            const b = capture([drawCmd("d", [], [{ name: "Scene", value: { time: 2 } }])]);

            const diff = compareCaptures(a, b);
            const changed = diff.rows.find((r) => r.type === "changed");
            expect(changed!.fieldDiffs).toEqual([
                { path: "uniformBlock Scene", previous: "{\"time\":1}", current: "{\"time\":2}" },
            ]);
        });

        it("ignores commands without DrawCall state", () => {
            const a = capture([cmd("clear", "clear: X")]);
            const b = capture([cmd("clear", "clear: X")]);
            const diff = compareCaptures(a, b);
            expect(diff.summary.unchanged).toBe(1);
            expect(diff.summary.changed).toBe(0);
        });
    });

    describe("draw-call state group diffs (#155)", () => {
        it("flags a changed GL state group value (BlendState.BLEND)", () => {
            const a = capture([stateCmd("drawArrays", "drawArrays: A", { BlendState: { BLEND: false, BLEND_SRC_RGB: "ONE" } })]);
            const b = capture([stateCmd("drawArrays", "drawArrays: A", { BlendState: { BLEND: true, BLEND_SRC_RGB: "ONE" } })]);

            const diff = compareCaptures(a, b);
            expect(diff.summary.changed).toBe(1);
            const changed = diff.rows.find((r) => r.type === "changed");
            expect(changed!.fieldDiffs).toEqual([
                { path: "BlendState.BLEND", previous: "false", current: "true" },
            ]);
        });

        it("does not flag identical state groups", () => {
            const groups = { DepthState: { DEPTH_TEST: true, DEPTH_FUNC: "LESS" }, CullState: { CULL_FACE: false } };
            const a = capture([stateCmd("drawArrays", "d", groups)]);
            const b = capture([stateCmd("drawArrays", "d", groups)]);

            const diff = compareCaptures(a, b);
            expect(diff.summary).toEqual({ added: 0, removed: 0, changed: 0, unchanged: 1 });
        });

        it("reports multiple state-group changes across groups", () => {
            const a = capture([stateCmd("drawArrays", "d", { DepthState: { DEPTH_FUNC: "LESS" }, CullState: { CULL_FACE: false } })]);
            const b = capture([stateCmd("drawArrays", "d", { DepthState: { DEPTH_FUNC: "LEQUAL" }, CullState: { CULL_FACE: true } })]);

            const diff = compareCaptures(a, b);
            const changed = diff.rows.find((r) => r.type === "changed");
            const paths = changed!.fieldDiffs!.map((f) => f.path).sort();
            expect(paths).toEqual(["CullState.CULL_FACE", "DepthState.DEPTH_FUNC"]);
        });

        it("normalises object tags: same type, different id -> not a diff", () => {
            const a = capture([stateCmd("drawArrays", "d", { DrawState: { CURRENT_PROGRAM: tag("Program", 5) } })]);
            const b = capture([stateCmd("drawArrays", "d", { DrawState: { CURRENT_PROGRAM: tag("Program", 12) } })]);

            const diff = compareCaptures(a, b);
            expect(diff.summary.changed).toBe(0);
            expect(diff.summary.unchanged).toBe(1);
        });

        it("flags object tags of a different type", () => {
            const a = capture([stateCmd("drawArrays", "d", { DrawState: { BOUND: tag("Texture", 1) } })]);
            const b = capture([stateCmd("drawArrays", "d", { DrawState: { BOUND: tag("Renderbuffer", 1) } })]);

            const diff = compareCaptures(a, b);
            const changed = diff.rows.find((r) => r.type === "changed");
            expect(changed!.fieldDiffs).toEqual([
                { path: "DrawState.BOUND", previous: "Texture", current: "Renderbuffer" },
            ]);
        });

        it("diffs nested array state values (BLEND_COLOR)", () => {
            const a = capture([stateCmd("drawArrays", "d", { BlendState: { BLEND_COLOR: [0, 0, 0, 0] } })]);
            const b = capture([stateCmd("drawArrays", "d", { BlendState: { BLEND_COLOR: [1, 0, 0, 1] } })]);

            const diff = compareCaptures(a, b);
            const changed = diff.rows.find((r) => r.type === "changed");
            expect(changed!.fieldDiffs).toEqual([
                { path: "BlendState.BLEND_COLOR.0", previous: "0", current: "1" },
                { path: "BlendState.BLEND_COLOR.3", previous: "0", current: "1" },
            ]);
        });

        it("combines uniform and state-group diffs on one row", () => {
            const a = capture([stateCmd("drawArrays", "d", { BlendState: { BLEND: false }, DrawCall: { uniforms: [{ name: "uA", value: 1 }] } })]);
            const b = capture([stateCmd("drawArrays", "d", { BlendState: { BLEND: true }, DrawCall: { uniforms: [{ name: "uA", value: 2 }] } })]);

            const diff = compareCaptures(a, b);
            const changed = diff.rows.find((r) => r.type === "changed");
            const paths = changed!.fieldDiffs!.map((f) => f.path).sort();
            expect(paths).toEqual(["BlendState.BLEND", "uniform uA"]);
        });
    });

    describe("texture input diffs (#155)", () => {
        // A sampler uniform with a bound texture (metadata + visual thumbnail).
        function samplerCmd(tex: any): ICommandCapture {
            return { name: "drawArrays", text: "drawArrays: T", DrawCall: { uniforms: [{ name: "uTex", value: 0, texture: tex }] } } as any;
        }

        it("flags a texture pixel-content change as an image diff", () => {
            const a = capture([samplerCmd({ width: 64, height: 64, visual: { TEXTURE_2D: "data:image/png;base64,AAAA" } })]);
            const b = capture([samplerCmd({ width: 64, height: 64, visual: { TEXTURE_2D: "data:image/png;base64,BBBB" } })]);

            const diff = compareCaptures(a, b);
            expect(diff.summary.changed).toBe(1);
            const changed = diff.rows.find((r) => r.type === "changed");
            expect(changed!.fieldDiffs).toEqual([
                {
                    path: "uniform uTex texture (TEXTURE_2D)",
                    previous: "(image)",
                    current: "(image)",
                    previousImage: "data:image/png;base64,AAAA",
                    currentImage: "data:image/png;base64,BBBB",
                },
            ]);
        });

        it("does not flag identical textures", () => {
            const tex = { width: 64, height: 64, visual: { TEXTURE_2D: "data:image/png;base64,AAAA" } };
            const diff = compareCaptures(capture([samplerCmd(tex)]), capture([samplerCmd(tex)]));
            expect(diff.summary).toEqual({ added: 0, removed: 0, changed: 0, unchanged: 1 });
        });

        it("flags a texture metadata change (dimensions)", () => {
            const a = capture([samplerCmd({ width: 64, height: 64, format: "RGBA", visual: { TEXTURE_2D: "data:X" } })]);
            const b = capture([samplerCmd({ width: 128, height: 64, format: "RGBA", visual: { TEXTURE_2D: "data:X" } })]);

            const diff = compareCaptures(a, b);
            const changed = diff.rows.find((r) => r.type === "changed");
            expect(changed!.fieldDiffs).toEqual([
                { path: "uniform uTex texture width", previous: "64", current: "128" },
            ]);
        });

        it("handles a texture appearing in only one capture", () => {
            const a = capture([{ name: "drawArrays", text: "drawArrays: T", DrawCall: { uniforms: [{ name: "uTex", value: 0 }] } } as any]);
            const b = capture([samplerCmd({ width: 64, height: 64, visual: { TEXTURE_2D: "data:image/png;base64,BBBB" } })]);

            const diff = compareCaptures(a, b);
            const changed = diff.rows.find((r) => r.type === "changed");
            const img = changed!.fieldDiffs!.find((f) => f.currentImage);
            expect(img).toBeDefined();
            expect(img!.previous).toBe("(absent)");
            expect(img!.previousImage).toBeUndefined();
            expect(img!.currentImage).toBe("data:image/png;base64,BBBB");
        });

        it("compares texture arrays by index", () => {
            const mk = (v: string) => ({ name: "drawArrays", text: "drawArrays: T", DrawCall: { uniforms: [{ name: "uTex", value: [0, 1], textures: [{ visual: { TEXTURE_2D: "same" } }, { visual: { TEXTURE_2D: v } }] }] } }) as any;
            const diff = compareCaptures(capture([mk("old")]), capture([mk("new")]));
            const changed = diff.rows.find((r) => r.type === "changed");
            expect(changed!.fieldDiffs).toEqual([
                {
                    path: "uniform uTex texture[1] (TEXTURE_2D)",
                    previous: "(image)",
                    current: "(image)",
                    previousImage: "old",
                    currentImage: "new",
                },
            ]);
        });
    });
});
