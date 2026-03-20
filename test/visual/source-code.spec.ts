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

test.describe("SourceCode editor", () => {
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

        // Enable Beautify — the checkbox drives a re-render of the Ace
        // editor with re-formatted shader source.
        await page.click('[commandName="onBeautifyChanged"]');
        await page.waitForTimeout(200);

        await expect(page.locator(".resultViewContentComponent")).toHaveScreenshot(
            "source-code-beautify.png",
            { maxDiffPixels: 200 },
        );
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
