import { test as base, Page, expect } from "@playwright/test";

/** CSS injected to eliminate non-deterministic rendering artifacts. */
const STABILIZATION_CSS = `
* {
    transition: none !important;
    animation: none !important;
}
.ace_cursor {
    display: none !important;
}
`;

export interface SpectorPage {
    /** The underlying Playwright Page. */
    page: Page;
    /** Inject CSS that disables transitions, animations, and blinking cursors. */
    injectStabilizationCSS(): Promise<void>;
    /**
     * Wait for the Spector result view to be fully populated:
     * - `.resultViewComponent.active` is visible
     * - At least one command list item exists in the DOM
     * - All visual-state images are loaded
     */
    waitForCaptureReady(): Promise<void>;
    /**
     * Trigger a Spector capture on the canvas and wait for the
     * `onCapture` observable to fire. Returns the raw capture object.
     */
    triggerCapture(): Promise<unknown>;
}

export const test = base.extend<{ spectorPage: SpectorPage }>({
    spectorPage: async ({ page }, use) => {
        // Navigate to the test scene and wait for the canvas + Spector global.
        await page.goto("/test/integration/fixtures/test-scene.html", {
            waitUntil: "domcontentloaded",
        });

        // Wait for WebGL canvas to be present and Spector to be attached.
        await page.waitForFunction(
            () =>
                typeof (window as any).__spector !== "undefined" &&
                typeof (window as any).__canvas !== "undefined",
            { timeout: 15_000 },
        );

        // Wait one rAF so the first frame is guaranteed rendered.
        await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => r())));

        const spectorPage: SpectorPage = {
            page,

            async injectStabilizationCSS() {
                await page.addStyleTag({ content: STABILIZATION_CSS });
            },

            async waitForCaptureReady() {
                // 1. Result view container is active.
                await page.waitForSelector(".resultViewComponent.active", {
                    state: "visible",
                    timeout: 30_000,
                });

                // 2. At least one command item is present.
                // Command list items are plain <li> inside `.commandListComponent ul`.
                await page.waitForSelector(".commandListComponent li", {
                    state: "attached",
                    timeout: 10_000,
                });

                // 3. All visual-state images have loaded.
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
            },

            async triggerCapture() {
                const capture = await page.evaluate(() => {
                    return new Promise<unknown>((resolve, reject) => {
                        const spector = (window as any).__spector;
                        const canvas = (window as any).__canvas;
                        if (!spector || !canvas) {
                            reject(new Error("Spector or canvas not available"));
                            return;
                        }
                        const timeout = setTimeout(
                            () => reject(new Error("Capture timed out after 30 s")),
                            30_000,
                        );
                        spector.onCapture.add((captureData: unknown) => {
                            clearTimeout(timeout);
                            resolve(captureData);
                        });
                        spector.captureNextFrame(canvas);
                    });
                });
                return capture;
            },
        };

        await use(spectorPage);
    },
});

export { expect };
