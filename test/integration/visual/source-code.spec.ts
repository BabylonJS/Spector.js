import { Page } from "@playwright/test";
import { test, expect } from "../helpers/spector-fixture";
import { loadCapturedFrame } from "../helpers/capture-helper";

/**
 * Open the shader editor by clicking the first vertex shader link in the
 * command list.  Draw-call items have class "drawCall" and contain <a> tags
 * for vertex/fragment shaders.
 *
 * Returns `true` if the editor opened successfully, `false` if no shader
 * links exist (caller should `test.skip()`).
 *
 * NOTE: `.sourceCodeComponentContainer` has zero height because all three
 * children use `position: absolute`.  We wait for `.sourceCodeComponent`
 * (the Ace editor div) which has explicit dimensions.
 */
async function openShaderEditor(page: Page): Promise<boolean> {
    // Draw-call <li> elements carry the class "drawCall" and contain
    // plain <a href="#"> children for vertex / fragment shaders.
    const shaderLink = page.locator("li.drawCall a[href='#']").first();

    if ((await shaderLink.count()) === 0) {
        return false;
    }

    await shaderLink.click();

    // Wait for the Ace editor container to appear (has explicit absolute-
    // positioning dimensions, unlike its zero-height wrapper).
    await page.waitForSelector(".sourceCodeComponent", {
        state: "visible",
        timeout: 10_000,
    });

    // Ace editor needs time to initialise (layout, syntax highlight, theme).
    await page.waitForTimeout(500);

    return true;
}

async function addShaderCommandCapture(page: Page): Promise<string> {
    return page.evaluate(() => {
        const spector = (window as any).__spector;
        const resultUI = spector.getResultUI();
        const currentCapture = resultUI.store.getSnapshot().currentCapture;
        const capture = JSON.parse(JSON.stringify(currentCapture));
        const shaderSource = [
            "precision mediump float;",
            "float saturate(float value){return clamp(value,0.,1.);}",
            "void main(){gl_FragColor=vec4(saturate(1.));}",
        ].join("\n");

        capture.startTime += 1;
        capture.commands.unshift({
            id: 10_000,
            startTime: 0,
            commandEndTime: 0.1,
            endTime: 0.2,
            name: "shaderSource",
            commandArguments: [
                {
                    __SPECTOR_Object_TAG: {
                        typeName: "WebGLShader",
                        id: 99,
                        displayText: "WebGLShader - ID: 99",
                    },
                },
                "Array Length: " + shaderSource.length,
            ],
            stackTrace: [],
            status: 40,
            text: "shaderSource: WebGLShader - ID: 99, " + shaderSource.length + " chars",
            marker: "",
            shader: {
                COMPILE_STATUS: null,
                shaderType: "FRAGMENT_SHADER",
                name: "Captured fragment",
                source: shaderSource,
                translatedSource: "",
                infoLog: "WARNING: 0:2: implicit conversion",
            },
        });
        resultUI.addCapture(capture);
        return shaderSource;
    });
}

test.describe("SourceCode editor", () => {
    test("opens shaderSource commands with diagnostics and formatting", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await loadCapturedFrame(page);
        const shaderSource = await addShaderCommandCapture(page);

        const shaderCommand = page.locator(".commandListComponent li").filter({ hasText: "shaderSource" }).first();
        await shaderCommand.click();

        const detailLink = page.locator('[commandName="onShaderSourceOpen"]');
        await expect(detailLink).toContainText("Open Captured fragment");
        await detailLink.click();
        await page.waitForSelector(".sourceCodeComponent .ace_content", {
            state: "visible",
            timeout: 5_000,
        });
        await page.waitForFunction(() => {
            const container = document.querySelector(".sourceCodeComponent") as any;
            const editor = container.env.editor;
            return editor.getValue().includes("\n    return clamp") &&
                editor.getSession().getAnnotations().length === 0;
        });

        const editorState = await page.evaluate(() => {
            const container = document.querySelector(".sourceCodeComponent") as any;
            const editor = container.env.editor;
            return {
                annotations: editor.getSession().getAnnotations(),
                readOnly: editor.getReadOnly(),
                value: editor.getValue(),
            };
        });
        expect(editorState.value).toContain([
            "float saturate(float value) {",
            "    return clamp(value, 0.0, 1.0);",
            "}",
            "",
            "void main() {",
        ].join("\n"));
        expect(editorState.readOnly).toBe(true);
        expect(editorState.annotations).toEqual([]);
        await expect(page.locator('[commandName="onBeautifyChanged"]')).toBeChecked();
        await expect(page.locator('[commandName="onVertexSourceClicked"]')).toHaveCount(0);
        await expect(page.locator('[commandName="onFragmentSourceClicked"]')).toHaveCount(1);
        await expect(page.locator(".sourceCodeDiagnosticsNotice")).toContainText("Captured diagnostics hidden");

        await page.click('[commandName="onShowCapturedDiagnostics"]');
        await page.waitForFunction((originalSource) => {
            const container = document.querySelector(".sourceCodeComponent") as any;
            return container.env.editor.getValue() === originalSource;
        }, shaderSource);
        await expect(page.locator('[commandName="onBeautifyChanged"]')).not.toBeChecked();
        const originalAnnotations = await page.evaluate(() => {
            const container = document.querySelector(".sourceCodeComponent") as any;
            return container.env.editor.getSession().getAnnotations();
        });
        expect(originalAnnotations).toEqual([
            expect.objectContaining({ row: 1, type: "warning" }),
        ]);
        expect(editorState.value.split("\n").every((line: string) => line.length <= 80)).toBe(true);
    });

    test("vertex shader view", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);

        const opened = await openShaderEditor(page);
        if (!opened) {
            test.skip();
            return;
        }

        // Wait for Ace editor to finish rendering (gutter line numbers, syntax
        // colouring).  The `.ace_content` layer is populated asynchronously.
        await page.waitForSelector(".sourceCodeComponent .ace_content", {
            state: "visible",
            timeout: 5_000,
        });

        // Screenshot the entire content area — `.sourceCodeComponentContainer`
        // has zero height (all children are position:absolute), so we use the
        // parent `.resultViewContentComponent` which has explicit dimensions.
        await expect(page.locator(".resultViewContentComponent")).toHaveScreenshot(
            "source-code-vertex.png",
            { maxDiffPixels: 200 },
        );
    });

    test("fragment shader view", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);

        const opened = await openShaderEditor(page);
        if (!opened) {
            test.skip();
            return;
        }

        // Switch to the Fragment tab.
        await page.click('[commandName="onFragmentSourceClicked"]');
        await page.waitForTimeout(200);

        await expect(page.locator(".resultViewContentComponent")).toHaveScreenshot(
            "source-code-fragment.png",
            { maxDiffPixels: 200 },
        );
    });

    test("shader tab bar", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);

        const opened = await openShaderEditor(page);
        if (!opened) {
            test.skip();
            return;
        }

        // `.sourceCodeMenuComponent` is the <ul> tab bar — always visible.
        await expect(page.locator(".sourceCodeMenuComponent")).toHaveScreenshot(
            "source-code-tab-bar.png",
            { maxDiffPixels: 100 },
        );
    });

    test("beautify toggle", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);

        const opened = await openShaderEditor(page);
        if (!opened) {
            test.skip();
            return;
        }

        // Beautify is enabled by default. Toggle it off and back on to verify
        // both views remain available before recording the formatted state.
        await expect(page.locator('[commandName="onBeautifyChanged"]')).toBeChecked();
        await page.click('[commandName="onBeautifyChanged"]');
        await page.click('[commandName="onBeautifyChanged"]');
        await page.waitForTimeout(200);

        await expect(page.locator(".resultViewContentComponent")).toHaveScreenshot(
            "source-code-beautify.png",
            { maxDiffPixels: 200 },
        );
    });

    test("editor survives shader tab switch", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);

        const opened = await openShaderEditor(page);
        if (!opened) {
            test.skip();
            return;
        }

        // Ace editor should be visible on the initial (Vertex) tab.
        const aceContent = page.locator(".sourceCodeComponent .ace_content");
        await expect(aceContent).toBeVisible({ timeout: 5_000 });

        // Switch to Fragment tab.
        await page.click('[commandName="onFragmentSourceClicked"]');
        await page.waitForTimeout(300);

        // Ace editor must still be visible after the tab switch.
        await expect(aceContent).toBeVisible({ timeout: 5_000 });

        // Switch back to Vertex tab.
        await page.click('[commandName="onVertexSourceClicked"]');
        await page.waitForTimeout(300);

        // Ace editor must still be visible after switching back.
        await expect(aceContent).toBeVisible({ timeout: 5_000 });
    });

    test("updates and clears compiler diagnostics after source edits", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.triggerCapture();
        await spectorPage.waitForCaptureReady();

        expect(await openShaderEditor(page)).toBe(true);
        await page.click('[commandName="onFragmentSourceClicked"]');
        await expect(page.locator('[commandName="onBeautifyChanged"]')).toBeChecked();
        await page.click('[commandName="onBeautifyChanged"]');

        const validSource = await page.evaluate(() => {
            const container = document.querySelector(".sourceCodeComponent") as any;
            const editor = container.env.editor;
            if (editor.getReadOnly()) {
                throw new Error("Captured shader is not editable");
            }
            return editor.getValue();
        });
        const invalidSource = validSource.replace(
            "gl_FragColor = vec4(vColor, 1.0);",
            "gl_FragColor = vec4(missingColor, 1.0);",
        );
        expect(invalidSource).not.toBe(validSource);

        await setEditorValue(page, invalidSource);
        await page.waitForFunction(() => {
            const spector = (window as any).__spector;
            const sourceError = spector.getResultUI().store.getSnapshot().sourceCodeError;
            const container = document.querySelector(".sourceCodeComponent") as any;
            const annotations = container.env.editor.getSession().getAnnotations();
            return !!sourceError && annotations.some((annotation: any) => annotation.type === "error");
        });

        const failedState = await page.evaluate(() => {
            const spector = (window as any).__spector;
            const container = document.querySelector(".sourceCodeComponent") as any;
            return {
                annotations: container.env.editor.getSession().getAnnotations(),
                error: spector.getResultUI().store.getSnapshot().sourceCodeError,
            };
        });
        expect(failedState.error).toBeTruthy();
        expect(failedState.annotations).toEqual(expect.arrayContaining([
            expect.objectContaining({
                row: 3,
                type: "error",
            }),
        ]));
        expect(failedState.annotations.every((annotation: any) => annotation.type === "error")).toBe(true);

        await setEditorValue(page, validSource);
        await page.waitForFunction(() => {
            const spector = (window as any).__spector;
            const sourceError = spector.getResultUI().store.getSnapshot().sourceCodeError;
            const container = document.querySelector(".sourceCodeComponent") as any;
            return !sourceError && container.env.editor.getSession().getAnnotations().length === 0;
        });
    });

    test("preserves both shader drafts across tab switches", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.triggerCapture();
        await spectorPage.waitForCaptureReady();

        expect(await openShaderEditor(page)).toBe(true);
        await page.click('[commandName="onFragmentSourceClicked"]');
        await page.click('[commandName="onBeautifyChanged"]');
        await page.evaluate(() => {
            const spector = (window as any).__spector;
            const original = spector.rebuildProgramFromProgramId.bind(spector);
            (window as any).__shaderRebuilds = [];
            spector.rebuildProgramFromProgramId = (
                programId: number,
                vertexSource: string,
                fragmentSource: string,
                onCompiled: (program: WebGLProgram) => void,
                onError: (error: string) => void,
            ) => {
                const rebuild = {
                    fragmentSource,
                    status: "pending",
                    vertexSource,
                };
                (window as any).__shaderRebuilds.push(rebuild);
                original(
                    programId,
                    vertexSource,
                    fragmentSource,
                    (program: WebGLProgram) => {
                        rebuild.status = "compiled";
                        onCompiled(program);
                    },
                    (error: string) => {
                        rebuild.status = "failed";
                        onError(error);
                    },
                );
            };
        });

        const fragmentSource = await getEditorValue(page);
        const editedFragmentSource = fragmentSource.replace(
            "gl_FragColor = vec4(vColor, 1.0);",
            "gl_FragColor = vec4(vColor.bgr, 1.0);",
        );
        expect(editedFragmentSource).not.toBe(fragmentSource);
        await setEditorValue(page, editedFragmentSource);
        await page.waitForFunction(() =>
            (window as any).__shaderRebuilds.length === 1 &&
            (window as any).__shaderRebuilds[0].status === "compiled");

        await page.click('[commandName="onVertexSourceClicked"]');
        const vertexSource = await getEditorValue(page);
        const editedVertexSource = vertexSource.replace(
            "vColor = aColor;",
            "vColor = aColor.bgr;",
        );
        expect(editedVertexSource).not.toBe(vertexSource);
        await setEditorValue(page, editedVertexSource);
        await page.waitForFunction(() =>
            (window as any).__shaderRebuilds.length === 2 &&
            (window as any).__shaderRebuilds[1].status === "compiled");

        const lastRebuild = await page.evaluate(() => (window as any).__shaderRebuilds[1]);
        expect(lastRebuild.vertexSource).toBe(editedVertexSource);
        expect(lastRebuild.fragmentSource).toBe(editedFragmentSource);

        await page.click('[commandName="onFragmentSourceClicked"]');
        expect(await getEditorValue(page)).toBe(editedFragmentSource);
    });

    test("applies formatting controls to an edited draft", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.triggerCapture();
        await spectorPage.waitForCaptureReady();

        expect(await openShaderEditor(page)).toBe(true);
        await page.click('[commandName="onFragmentSourceClicked"]');
        const draftSource = [
            "#define OUTPUT_COLOR vColor",
            "precision mediump float;",
            "varying vec3 vColor;",
            "void main(){gl_FragColor=vec4(OUTPUT_COLOR,1.0);}",
        ].join("\n");
        await setEditorValue(page, draftSource);
        await expect(page.locator('[commandName="onBeautifyChanged"]')).not.toBeChecked();
        await page.waitForFunction((source) => {
            const container = document.querySelector(".sourceCodeComponent") as any;
            return container.env.editor.getValue() === source;
        }, draftSource);

        await page.click('[commandName="onBeautifyChanged"]');
        await page.waitForFunction(() => {
            const container = document.querySelector(".sourceCodeComponent") as any;
            return container.env.editor.getValue().includes("\n    gl_FragColor");
        });
        expect(await getEditorValue(page)).toContain("#define OUTPUT_COLOR vColor");

        await page.click('[commandName="onBeautifyChanged"]');
        await page.waitForFunction((source) => {
            const container = document.querySelector(".sourceCodeComponent") as any;
            return container.env.editor.getValue() === source;
        }, draftSource);

        await page.click('[commandName="onPreprocessChanged"]');
        await page.waitForFunction(() => {
            const container = document.querySelector(".sourceCodeComponent") as any;
            return !container.env.editor.getValue().includes("#define OUTPUT_COLOR");
        });
        expect(await getEditorValue(page)).toContain("vec4(vColor,1.0)");

        await page.click('[commandName="onPreprocessChanged"]');
        await page.waitForFunction((source) => {
            const container = document.querySelector(".sourceCodeComponent") as any;
            return container.env.editor.getValue() === source;
        }, draftSource);
    });

    test("cancels a pending edit when the source program changes", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.triggerCapture();
        await spectorPage.waitForCaptureReady();

        expect(await openShaderEditor(page)).toBe(true);
        await page.click('[commandName="onBeautifyChanged"]');
        await page.evaluate(() => {
            const spector = (window as any).__spector;
            (window as any).__shaderRebuildCount = 0;
            spector.rebuildProgramFromProgramId = () => {
                (window as any).__shaderRebuildCount++;
            };
        });

        const source = await getEditorValue(page);
        await setEditorValue(page, source.replace(
            "vColor = aColor;",
            "vColor = aColor.bgr;",
        ));
        await page.evaluate(() => {
            const resultUI = (window as any).__spector.getResultUI();
            resultUI.store.setState((current: any) => ({
                ...current,
                sourceCodeState: {
                    ...current.sourceCodeState,
                    programId: current.sourceCodeState.programId + 1,
                },
            }));
        });
        await page.waitForTimeout(1_700);

        expect(await page.evaluate(() => (window as any).__shaderRebuildCount)).toBe(0);
    });

    test("close returns to commands", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);

        const opened = await openShaderEditor(page);
        if (!opened) {
            test.skip();
            return;
        }

        // Close the shader editor.
        await page.click('[commandName="onSourceCodeCloseClicked"]');
        await page.waitForTimeout(200);

        // The command list should be visible again.
        const commandList = page.locator(".commandListComponent");
        await expect(commandList).toBeVisible({ timeout: 5_000 });
    });
});

async function setEditorValue(page: Page, source: string): Promise<void> {
    await page.evaluate((nextSource) => {
        const container = document.querySelector(".sourceCodeComponent") as any;
        container.env.editor.setValue(nextSource, -1);
    }, source);
}

async function getEditorValue(page: Page): Promise<string> {
    return page.evaluate(() => {
        const container = document.querySelector(".sourceCodeComponent") as any;
        return container.env.editor.getValue();
    });
}
