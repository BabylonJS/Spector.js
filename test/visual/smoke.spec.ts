import { test, expect } from "../helpers/spector-fixture";

test.describe("Smoke tests", () => {
    test("canvas renders non-black pixels", async ({ spectorPage }) => {
        const { page } = spectorPage;

        // Use toDataURL which works with preserveDrawingBuffer: true.
        // More reliable than readPixels when Spector wraps the context.
        const hasContent = await page.evaluate(() => {
            const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
            if (!canvas) return false;

            // Create a temporary 2D canvas to read pixel data from the WebGL canvas.
            const tmp = document.createElement("canvas");
            tmp.width = canvas.width;
            tmp.height = canvas.height;
            const ctx2d = tmp.getContext("2d");
            if (!ctx2d) return false;

            ctx2d.drawImage(canvas, 0, 0);
            const imageData = ctx2d.getImageData(0, 0, tmp.width, tmp.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                if (data[i] > 0 || data[i + 1] > 0 || data[i + 2] > 0) {
                    return true;
                }
            }
            return false;
        });

        expect(hasContent).toBe(true);
    });

    test("spector UI is visible", async ({ spectorPage }) => {
        const { page } = spectorPage;

        // The capture menu should be rendered by displayUI().
        const captureMenu = page.locator(".captureMenuComponent");
        await expect(captureMenu).toBeAttached({ timeout: 10_000 });
    });

    test("page screenshot baseline", async ({ spectorPage }) => {
        const { page } = spectorPage;

        // Stabilize rendering for deterministic screenshots.
        await spectorPage.injectStabilizationCSS();

        // Small delay to ensure CSS is applied.
        await page.waitForTimeout(200);

        await expect(page).toHaveScreenshot("smoke-baseline.png", {
            maxDiffPixels: 100,
        });
    });
});
