import { test, expect, Page } from "@playwright/test";

/**
 * End-to-end visual coverage for the texture viewer modal (#183).
 *
 * The scene binds a texture whose centre is fully transparent but hides an RGB
 * gradient. The capture preserves the non-premultiplied texels, so forcing the
 * viewer opaque must reveal that hidden colour. The modal renders from the
 * deterministic raw pixel data (not a GPU frame), so the snapshot is stable.
 */
async function captureAndOpenViewer(page: Page): Promise<void> {
    await page.goto("/test/integration/fixtures/texture-scene.html", { waitUntil: "domcontentloaded" });
    await page.waitForFunction(
        () => !!(window as any).__spector && !!(window as any).__canvas,
        { timeout: 20_000 },
    );
    await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
    await page.addStyleTag({ content: "* { transition: none !important; animation: none !important; }" });

    // Trigger a capture and wait for the onCapture observable.
    await page.evaluate(() => new Promise<void>((resolve, reject) => {
        const spector = (window as any).__spector;
        const canvas = (window as any).__canvas;
        const timeout = setTimeout(() => reject(new Error("capture timed out")), 30_000);
        spector.onCapture.add(() => { clearTimeout(timeout); resolve(); });
        spector.captureNextFrame(canvas);
    }));

    await page.waitForSelector(".resultViewComponent.active", { state: "visible", timeout: 30_000 });

    // Select the draw call so its detail (with the bound texture) is shown.
    await page.locator(".commandListComponent li", { hasText: "drawArrays" }).first().click();

    // Open the texture viewer from the thumbnail.
    const thumb = page.locator(".commandDetailComponent .jsonItemImageClickable img").first();
    await thumb.waitFor({ state: "visible", timeout: 10_000 });
    await thumb.click();
    await page.waitForSelector(".textureViewerModal", { state: "visible", timeout: 10_000 });
    await page.waitForTimeout(300);
}

test.describe("Texture viewer (#183)", () => {
    test("opens on a transparent texture", async ({ page }) => {
        await captureAndOpenViewer(page);

        // Raw pixels were preserved, so the header shows real dimensions (no "thumbnail").
        await expect(page.locator(".textureViewerMeta")).toContainText("64");
        await expect(page.locator(".textureViewerMeta")).not.toContainText("thumbnail");

        await expect(page.locator(".textureViewerModal")).toHaveScreenshot("texture-viewer-default.png", {
            maxDiffPixels: 250,
        });
    });

    test("opaque reveals RGB hidden behind alpha", async ({ page }) => {
        await captureAndOpenViewer(page);

        await page.locator(".textureViewerToolbar .tvBtn", { hasText: "Opaque" }).click();
        await page.waitForTimeout(300);

        await expect(page.locator(".textureViewerModal")).toHaveScreenshot("texture-viewer-opaque.png", {
            maxDiffPixels: 250,
        });
    });
});
