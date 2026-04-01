/**
 * One-time capture generation script.
 *
 * Run with:  npx playwright test generate-capture --config test/integration/playwright.config.ts
 *
 * This navigates to the test scene, triggers a Spector capture, and saves
 * the resulting JSON to test/fixtures/captured-frame.json.
 * The fixture is committed to git and used by all ResultView tests.
 */
import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const FIXTURE_DIR = path.join(__dirname);
const FIXTURE_PATH = path.join(FIXTURE_DIR, "captured-frame.json");

test("generate captured-frame.json fixture", async ({ page }) => {
    await page.goto("/test/integration/fixtures/test-scene.html", {
        waitUntil: "domcontentloaded",
    });

    // Wait for Spector + canvas globals.
    await page.waitForFunction(
        () =>
            typeof (window as any).__spector !== "undefined" &&
            typeof (window as any).__canvas !== "undefined",
        { timeout: 15_000 },
    );

    // Let at least one frame render.
    await page.evaluate(
        () => new Promise<void>((r) => requestAnimationFrame(() => r())),
    );

    // Trigger a capture and extract the data.
    const captureData = await page.evaluate(() => {
        return new Promise<unknown>((resolve, reject) => {
            const spector = (window as any).__spector;
            const canvas = (window as any).__canvas;
            const timeout = setTimeout(
                () => reject(new Error("Capture timed out after 30 s")),
                30_000,
            );
            spector.onCapture.add((data: unknown) => {
                clearTimeout(timeout);
                resolve(data);
            });
            spector.captureNextFrame(canvas);
        });
    });

    expect(captureData).toBeTruthy();
    expect(typeof captureData).toBe("object");

    // Verify essential fields exist.
    const capture = captureData as Record<string, unknown>;
    expect(capture.commands).toBeDefined();
    expect(Array.isArray(capture.commands)).toBe(true);
    expect((capture.commands as unknown[]).length).toBeGreaterThan(0);

    // Write to disk.
    const json = JSON.stringify(captureData, null, 2);
    fs.writeFileSync(FIXTURE_PATH, json, "utf-8");

    // Sanity: file was written and is valid JSON.
    const readBack = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf-8"));
    expect(readBack.commands).toBeDefined();
});
