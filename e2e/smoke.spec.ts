import { test, expect } from '@playwright/test';

test.describe('Spector.js E2E Smoke Test', () => {
    test('sample page loads and has a canvas', async ({ page }) => {
        await page.goto('/sample/index.html');

        // Wait for the canvas to be present
        const canvas = page.locator('canvas#renderCanvas');
        await expect(canvas).toBeVisible({ timeout: 10000 });
    });

    test('Spector bundle is loaded by sample page', async ({ page }) => {
        await page.goto('/sample/index.html');

        // The sample page's loader asynchronously loads .temp/spector.bundle.js
        // which defines window.SPECTOR (UMD library). Wait for it.
        await page.waitForFunction(
            () => typeof (window as any).SPECTOR !== 'undefined',
            { timeout: 15000 },
        );

        // Verify the Spector constructor is available
        const hasSpectorClass = await page.evaluate(
            () => typeof (window as any).SPECTOR.Spector === 'function',
        );
        expect(hasSpectorClass).toBe(true);
    });
});
