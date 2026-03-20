import { test, expect } from '@playwright/test';

test.describe('Worker OffscreenCanvas Capture', () => {
    test('captures a frame from Worker WebGL context', async ({ page }) => {
        // Navigate to the worker sample
        await page.goto('/sample/worker.html');

        // Wait for Worker to be ready
        const statusEl = page.locator('#status');
        await expect(statusEl).toContainText('Worker ready', { timeout: 15000 });

        // Click capture button
        await page.click('#captureBtn');

        // Wait for capture to complete
        await expect(statusEl).toContainText('Capture complete', { timeout: 15000 });

        // Verify commands were captured
        const statusText = await statusEl.textContent();
        const match = statusText!.match(/(\d+) commands/);
        expect(match).not.toBeNull();
        const commandCount = parseInt(match![1], 10);
        expect(commandCount).toBeGreaterThan(0);
    });
});
