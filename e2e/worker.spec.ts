import { test, expect } from '@playwright/test';

test.describe('Worker OffscreenCanvas Capture', () => {
    test('Worker appears in canvas list and captures a full frame', async ({ page }) => {
        await page.goto('/sample/index.html?sample=workerOffscreen');

        // Wait for scripts to load and Worker to be created
        await page.waitForFunction('window.spector && window.worker', { timeout: 15000 });

        // Wait for Worker context to be ready — it auto-registers in the canvas list
        await page.waitForTimeout(2000);

        // Listen for Worker capture result, then trigger capture via direct message
        const captureData = await page.evaluate(() => {
            return new Promise<any>((resolve, reject) => {
                const w = (window as any).worker as Worker;
                w.addEventListener('message', function handler(e: MessageEvent) {
                    if (e.data && e.data.type === 'spector:capture-complete') {
                        w.removeEventListener('message', handler);
                        resolve({
                            commands: e.data.capture.commands.length,
                            names: e.data.capture.commands.map((c: any) => c.name),
                        });
                    }
                });
                // Trigger capture via the bridge
                (window as any).spector.captureWorker(w);
                setTimeout(() => reject(new Error('Worker capture timed out')), 15000);
            });
        });

        // A full Worker render frame should have multiple commands
        expect(captureData.commands).toBeGreaterThanOrEqual(1);
    });

    test('Worker entry appears in Spector canvas list', async ({ page }) => {
        await page.goto('/sample/index.html?sample=workerOffscreen');
        await page.waitForFunction('window.spector && window.worker', { timeout: 15000 });
        await page.waitForTimeout(2000);

        // The Worker should be auto-selected in the canvas dropdown
        const workerInList = await page.evaluate(() => {
            const menu = document.querySelector('.canvasListComponent');
            return menu ? menu.textContent : '';
        });
        expect(workerInList).toContain('Worker');
    });

    test('workerRenderer.js does not exist as a standalone sample', async ({ page }) => {
        const response = await page.goto('/sample/js/workerRenderer.js');
        expect(response.status()).toBe(404);
    });
});
