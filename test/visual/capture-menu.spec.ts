import { test, expect } from "../helpers/spector-fixture";
import { Page } from "@playwright/test";

/**
 * Compute a page-level clip that covers both the menu bar and log area.
 * The parent wrapper div has zero dimensions (children are position:absolute),
 * so we union the bounding boxes of the two visible child components.
 */
async function getMenuClip(page: Page) {
    const menuBox = await page.locator(".captureMenuComponent").boundingBox();
    const logBox = await page.locator(".captureMenuLogComponent").boundingBox();
    if (!menuBox || !logBox) {
        throw new Error("CaptureMenu elements not found — are they visible?");
    }
    const x = Math.min(menuBox.x, logBox.x);
    const y = Math.min(menuBox.y, logBox.y);
    const right = Math.max(menuBox.x + menuBox.width, logBox.x + logBox.width);
    const bottom = Math.max(menuBox.y + menuBox.height, logBox.y + logBox.height);
    return { x, y, width: right - x, height: bottom - y };
}

test.describe("CaptureMenu visual regression", () => {

    test("default state with auto-selected canvas", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await page.waitForTimeout(200);

        // Verify canvas auto-selected (single canvas → auto-select)
        await expect(page.locator(".canvasListComponent [commandName=onCanvasSelection]"))
            .toContainText("renderCanvas (800*600)");

        // Verify log shows actions help text (not "select a canvas")
        await expect(page.locator(".captureMenuLogComponent span").first())
            .toContainText("Record with the red button");

        // Screenshot both menu bar + log via page clip (parent div has zero height)
        const clip = await getMenuClip(page);
        await expect(page).toHaveScreenshot("capture-menu-default.png", { clip });
    });

    test("canvas dropdown open", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await page.waitForTimeout(200);

        // Click canvas selector to open the dropdown list
        await page.locator(".canvasListComponent [commandName=onCanvasSelection]").click();
        await page.waitForTimeout(200);

        // The <ul> should now be visible with at least one canvas item
        const dropdown = page.locator(".canvasListComponent ul");
        await expect(dropdown).toBeVisible();
        await expect(dropdown.locator("li")).toContainText("renderCanvas");

        // Screenshot the dropdown (position:absolute, so screenshot the element directly)
        await expect(dropdown).toHaveScreenshot("capture-menu-dropdown-open.png");
    });

    test("playing state actions", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await page.waitForTimeout(200);

        // Default state after auto-select: actions state = true (playing)
        // Pause button should be in DOM; play/next-frame should NOT be
        await expect(page.locator("[commandName=onPauseRequested]")).toBeAttached();
        await expect(page.locator("[commandName=onPlayRequested]")).not.toBeAttached();
        await expect(page.locator("[commandName=onPlayNextFrameRequested]")).not.toBeAttached();

        await expect(page.locator(".captureMenuActionsComponent"))
            .toHaveScreenshot("capture-menu-playing.png");
    });

    test("paused state actions", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await page.waitForTimeout(200);

        // Click pause to switch to paused state (actions state = false)
        await page.locator("[commandName=onPauseRequested]").click();
        await page.waitForTimeout(200);

        // Play and next-frame buttons should now be in DOM; pause should NOT
        await expect(page.locator("[commandName=onPlayRequested]")).toBeAttached();
        await expect(page.locator("[commandName=onPlayNextFrameRequested]")).toBeAttached();
        await expect(page.locator("[commandName=onPauseRequested]")).not.toBeAttached();

        await expect(page.locator(".captureMenuActionsComponent"))
            .toHaveScreenshot("capture-menu-paused.png");
    });

    test("FPS counter display", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await page.waitForTimeout(200);

        // Override getFps so the 1-second setInterval doesn't clobber our value
        await page.evaluate(() => {
            const spector = (window as any).__spector;
            spector.getFps = () => 60;
            spector.getCaptureUI().setFPS(60);
        });
        await page.waitForTimeout(200);

        // FPS renders as state.toFixed(2) + " Fps"
        await expect(page.locator(".fpsCounterComponent")).toContainText("60.00 Fps");

        await expect(page.locator(".fpsCounterComponent")).toHaveScreenshot(
            "capture-menu-fps.png",
            { maxDiffPixels: 50 },
        );
    });

    test("info log message", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await page.waitForTimeout(200);

        // Default state has info-level log (no error class on the span)
        const logSpan = page.locator(".captureMenuLogComponent span").first();
        await expect(logSpan).not.toHaveClass(/error/);
        await expect(logSpan).toContainText("Record with the red button");

        await expect(page.locator(".captureMenuLogComponent"))
            .toHaveScreenshot("capture-menu-info-log.png");
    });

    test("error log message", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await page.waitForTimeout(200);

        // Trigger error log via public API
        await page.evaluate(() => {
            (window as any).__spector.getCaptureUI().captureComplete("Test error message");
        });
        await page.waitForTimeout(200);

        // The span should now have the "error" class and display error text
        const logSpan = page.locator(".captureMenuLogComponent span").first();
        await expect(logSpan).toHaveClass(/error/);
        await expect(logSpan).toContainText("Test error message");

        await expect(page.locator(".captureMenuLogComponent"))
            .toHaveScreenshot("capture-menu-error-log.png");
    });

    test("capture in progress please wait", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await page.waitForTimeout(200);

        // Prevent actual capture from completing (which resets the log text).
        // The click handler sets the log immediately (immediate=true in MVX),
        // then defers captureCanvas via 200ms setTimeout.
        await page.evaluate(() => {
            (window as any).__spector.captureCanvas = () => {};
        });

        await page.locator("[commandName=onCaptureRequested]").click();

        // The log text changes synchronously to "Capturing, be patient..."
        const logSpan = page.locator(".captureMenuLogComponent span").first();
        await expect(logSpan).toContainText("Capturing", { timeout: 2000 });

        await expect(page.locator(".captureMenuLogComponent"))
            .toHaveScreenshot("capture-menu-please-wait.png");
    });

    test("menu hidden state", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await page.waitForTimeout(200);

        await page.evaluate(() => {
            (window as any).__spector.getCaptureUI().hide();
        });
        await page.waitForTimeout(200);

        // React version correctly hides the menu (fixes the old MVX bug where
        // the template used `${state ? "active" : ""}` and state was always truthy).
        // Verify the wrapper element exists but the active class is removed.
        const wrapper = page.locator(".captureMenuComponent");
        await expect(wrapper).toBeAttached();
        await expect(wrapper).not.toHaveClass(/active/);
    });

    test("full menu bar layout baseline", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await page.waitForTimeout(200);

        // Primary layout regression baseline — captures the complete menu
        // bar plus log area in the default auto-selected state.
        const clip = await getMenuClip(page);
        await expect(page).toHaveScreenshot("capture-menu-full.png", { clip });
    });
});
