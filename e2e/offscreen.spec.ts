import { test, expect } from '@playwright/test';

test.describe('Main-thread OffscreenCanvas Capture', () => {
    test('captures a frame from OffscreenCanvas', async ({ page }) => {
        // Navigate to the offscreen sample
        await page.goto('/sample/offscreen.html');

        // Wait for the page to render (the OffscreenCanvas scene)
        await page.waitForTimeout(2000);

        // Click capture button
        await page.click('#captureBtn');

        // Wait for capture to complete
        const statusEl = page.locator('#status');
        await expect(statusEl).toContainText('Capture complete', { timeout: 15000 });

        // Verify the capture has commands
        const statusText = await statusEl.textContent();
        const match = statusText!.match(/(\d+) commands/);
        expect(match).not.toBeNull();
        const commandCount = parseInt(match![1], 10);
        expect(commandCount).toBeGreaterThan(0);
    });

    test('capture data contains visual state', async ({ page }) => {
        await page.goto('/sample/offscreen.html');
        await page.waitForTimeout(2000);

        // Capture and get the data via page.evaluate
        const capture = await page.evaluate(() => {
            return new Promise((resolve, reject) => {
                const spector = new (window as any).SPECTOR.Spector();
                const offscreen = new OffscreenCanvas(200, 200);
                const gl = offscreen.getContext('webgl2')!;

                // Simple render
                gl.clearColor(1, 0, 0, 1);
                gl.clear(gl.COLOR_BUFFER_BIT);

                spector.onCapture.add((cap: any) => resolve(cap));
                spector.onError.add((err: any) => reject(err));
                spector.captureCanvas(offscreen);

                // Need to trigger a frame for capture to complete
                requestAnimationFrame(() => {
                    gl.clearColor(0, 1, 0, 1);
                    gl.clear(gl.COLOR_BUFFER_BIT);
                });
            });
        });

        expect(capture).toBeDefined();
        expect((capture as any).commands.length).toBeGreaterThan(0);
    });
});
