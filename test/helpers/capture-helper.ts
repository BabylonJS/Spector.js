import { Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const FIXTURE_PATH = path.join(__dirname, "..", "fixtures", "captured-frame.json");

/**
 * Load a pre-captured Spector frame JSON fixture and inject it into the
 * Spector ResultView UI on the given page.
 *
 * Prerequisites:
 *  - `window.__spector` must already exist (displayUI called).
 *  - `test/fixtures/captured-frame.json` must be present on disk.
 */
export async function loadCapturedFrame(page: Page): Promise<void> {
    if (!fs.existsSync(FIXTURE_PATH)) {
        throw new Error(
            `Captured frame fixture not found at ${FIXTURE_PATH}. ` +
            `Run "npx playwright test generate-capture" first.`,
        );
    }

    const captureJSON = fs.readFileSync(FIXTURE_PATH, "utf-8");

    // Inject the capture into the Spector ResultView.
    await page.evaluate((json: string) => {
        const spector = (window as any).__spector;
        if (!spector) {
            throw new Error("window.__spector is not defined");
        }
        const captureData = JSON.parse(json);
        const resultUI = spector.getResultUI();
        resultUI.display();
        resultUI.addCapture(captureData);
    }, captureJSON);

    // Wait for the UI to be populated.
    await page.waitForSelector(".resultViewComponent.active", {
        state: "visible",
        timeout: 30_000,
    });

    // Wait for at least one command item.
    // Command list items are plain <li> inside `.commandListComponent ul`.
    await page.waitForSelector(".commandListComponent li", {
        state: "attached",
        timeout: 10_000,
    });

    // Wait for all images to finish loading.
    await page.waitForFunction(
        () => {
            const imgs = Array.from(
                document.querySelectorAll(
                    ".visualStateListItemComponent img, .resultViewComponent img",
                ),
            ) as HTMLImageElement[];
            return imgs.length === 0 || imgs.every((img) => img.complete && img.naturalWidth > 0);
        },
        { timeout: 15_000 },
    );
}
