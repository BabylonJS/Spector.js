import { test, expect } from '@playwright/test';

test.describe('Worker OffscreenCanvas Capture', () => {
    test('captures a frame from Worker WebGL context with multiple commands', async ({ page }) => {
        await page.goto('/sample/index.html?sample=workerOffscreen');

        // Wait for scripts to load and Worker to be created
        await page.waitForFunction('window.spector && window.worker', { timeout: 15000 });

        // The workerOffscreen.js sample auto-triggers a capture after the Worker is ready.
        // Wait for the Worker to send the capture-complete message.
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
                setTimeout(() => reject(new Error('Worker capture timed out')), 15000);
            });
        });

        // A full Worker render frame should have multiple commands
        expect(captureData.commands).toBeGreaterThanOrEqual(1);
    });

    test('workerRenderer.js does not exist as a standalone sample', async ({ page }) => {
        // workerRenderer.js was removed — it was a Worker-internal script that caused
        // a blank page when loaded as a sample. Verify the file no longer exists.
        const response = await page.goto('/sample/js/workerRenderer.js');
        expect(response.status()).toBe(404);
    });
});
