/**
 * Regression test: VisualStateListItem must NOT render stray numeric text
 * nodes (e.g. "0") next to the thumbnail images.
 *
 * Root cause: `{imageState.textureLayer && <span>...</span>}` renders the
 * falsy number `0` as visible text in React. The fix must use an explicit
 * null-check instead of a truthiness check.
 */
import { test, expect } from "../helpers/spector-fixture";
import { loadCapturedFrame } from "../helpers/capture-helper";

test.describe("VisualStateListItem — no stray text", () => {
    test("visual state items contain no bare numeric text nodes", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(300);

        // Collect every direct text node inside each <li> in the visual state list.
        const strayTexts = await page.evaluate(() => {
            const items = document.querySelectorAll(".visualStateListComponent li");
            const results: string[] = [];
            items.forEach((li) => {
                li.childNodes.forEach((node) => {
                    // nodeType 3 = TEXT_NODE
                    if (node.nodeType === 3) {
                        const text = (node.textContent ?? "").trim();
                        if (text.length > 0) {
                            results.push(text);
                        }
                    }
                });
            });
            return results;
        });

        // There should be zero bare text nodes — all text should be inside
        // <span> or <img> elements, not loose in the <li>.
        expect(strayTexts).toEqual([]);
    });

    test("visual state list screenshot has no stray numbers", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(300);

        await expect(page.locator(".visualStateListComponent")).toHaveScreenshot(
            "visual-state-no-stray-text.png",
            { maxDiffPixels: 200 },
        );
    });
});
