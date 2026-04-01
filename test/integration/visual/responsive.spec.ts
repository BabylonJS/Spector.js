import { test, expect } from "../helpers/spector-fixture";
import { loadCapturedFrame } from "../helpers/capture-helper";

test.describe("Responsive viewports", () => {
    test("desktop 1920x1080", async ({ spectorPage }) => {
        const { page } = spectorPage;
        // Default viewport is already 1920×1080 via playwright.config.ts.
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(200);

        await expect(page.locator(".resultViewComponent")).toHaveScreenshot(
            "responsive-1920x1080.png",
            { maxDiffPixels: 150 },
        );
    });

    test("laptop 1366x768", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await page.setViewportSize({ width: 1366, height: 768 });
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(200);

        await expect(page.locator(".resultViewComponent")).toHaveScreenshot(
            "responsive-1366x768.png",
            { maxDiffPixels: 150 },
        );
    });

    test("below breakpoint 1023x600", async ({ spectorPage }) => {
        const { page } = spectorPage;
        // Below the 1024px media query — triggers responsive/hamburger layout.
        await page.setViewportSize({ width: 1023, height: 600 });
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(200);

        await expect(page.locator(".resultViewComponent")).toHaveScreenshot(
            "responsive-1023x600.png",
            { maxDiffPixels: 150 },
        );
    });

    test("above breakpoint 1025x600", async ({ spectorPage }) => {
        const { page } = spectorPage;
        // Just above the 1024px breakpoint — desktop layout should be used.
        await page.setViewportSize({ width: 1025, height: 600 });
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(200);

        await expect(page.locator(".resultViewComponent")).toHaveScreenshot(
            "responsive-1025x600.png",
            { maxDiffPixels: 150 },
        );
    });
});
