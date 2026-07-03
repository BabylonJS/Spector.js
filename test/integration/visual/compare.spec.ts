import { test, expect } from "../helpers/spector-fixture";
import { loadTwoCapturesForCompare } from "../helpers/capture-helper";

/**
 * Visual coverage for the Compare tab (#155) three-panel layout: legend rail,
 * diff list, and the JSON-group detail panel (uniform/state/texture changes).
 *
 * The header timestamp is timezone-dependent, so it is masked out of every
 * screenshot to keep the snapshots machine-independent.
 */
test.describe("ResultView — Compare Tab", () => {
    async function openCompareWithDrawSelected(spectorPage: {
        page: import("@playwright/test").Page;
        injectStabilizationCSS(): Promise<void>;
    }): Promise<void> {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadTwoCapturesForCompare(page);

        // Switch to the Compare tab.
        await page.locator('[commandName="onCompareClicked"]').click();
        await page.waitForSelector(".compareViewComponent .compareRow", {
            state: "visible",
            timeout: 10_000,
        });

        // Select the changed draw call so the detail panel shows the full
        // treatment (uniform value, texture thumbnails, and state changes).
        const drawRow = page.locator(".compareViewList .compareRow", { hasText: "drawArrays" });
        await expect(drawRow).toHaveCount(1);
        await drawRow.click();

        // Wait for the before/after texture thumbnails to finish decoding.
        await page.waitForFunction(
            () => {
                const imgs = Array.from(document.querySelectorAll(".compareThumb")) as HTMLImageElement[];
                return imgs.length >= 2 && imgs.every((img) => img.complete && img.naturalWidth > 0);
            },
            { timeout: 10_000 },
        );
        await page.waitForTimeout(200);
    }

    test("compare tab 3-panel layout", async ({ spectorPage }) => {
        await openCompareWithDrawSelected(spectorPage);

        const compare = spectorPage.page.locator(".compareViewComponent");
        await expect(compare).toHaveScreenshot("result-view-compare-layout.png", {
            maxDiffPixels: 200,
            mask: [spectorPage.page.locator(".compareViewLabel")],
        });
    });

    test("compare detail panel", async ({ spectorPage }) => {
        await openCompareWithDrawSelected(spectorPage);

        const detail = spectorPage.page.locator(".compareViewDetail");
        await expect(detail).toHaveScreenshot("result-view-compare-detail.png", {
            maxDiffPixels: 100,
        });
    });
});
