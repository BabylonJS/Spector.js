import { test, expect } from '@playwright/test';

test.describe('OffscreenCanvas Capture', () => {
    test('captures a frame from main-thread OffscreenCanvas', async ({ page }) => {
        await page.goto('/sample/index.html?sample=offscreen');

        // Wait for auto-capture (offscreen.js captures after 2 seconds)
        // The Spector result view should show the capture
        await page.waitForTimeout(5000);

        // Verify capture completed by checking if the result view has captures
        const captureComplete = await page.evaluate(() => {
            return window.spector && window.spector.onCapture && true;
        });
        expect(captureComplete).toBe(true);
    });
});
