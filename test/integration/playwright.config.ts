import { defineConfig, devices } from "@playwright/test";
import path from "path";

const PORT = 7777;

export default defineConfig({
    testDir: __dirname,
    testMatch: ["visual/**/*.spec.ts", "fixtures/**/*.spec.ts"],
    snapshotDir: path.join(__dirname, "screenshots"),
    outputDir: path.join(__dirname, "test-results"),
    fullyParallel: false,
    retries: 0,
    workers: 1,
    reporter: "html",
    use: {
        baseURL: `http://localhost:${PORT}`,
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        launchOptions: {
            args: [
                "--disable-lcd-text",
                "--disable-font-subpixel-positioning",
                "--font-render-hinting=none",
                "--use-gl=swiftshader",
            ],
        },
        screenshot: "only-on-failure",
    },
    expect: {
        toHaveScreenshot: {
            maxDiffPixels: 100,
        },
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    webServer: {
        command: `npx http-server "${path.join(__dirname, "..", "..")}" -p ${PORT} --silent -c-1`,
        port: PORT,
        reuseExistingServer: !process.env.CI,
        timeout: 10_000,
    },
});
