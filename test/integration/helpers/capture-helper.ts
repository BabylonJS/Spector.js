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

/** A deterministic 48×48 solid-colour thumbnail as an inline SVG data URL. */
function solidThumb(hex: string): string {
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48'>" +
        "<rect width='48' height='48' fill='" + hex + "'/></svg>";
    return "data:image/svg+xml," + encodeURIComponent(svg);
}

/**
 * Give a capture's `drawArrays` command a deterministic set of sampler/value
 * uniforms and a depth-test state so the Compare view has field-level changes
 * (uniform value, bound-texture thumbnail, and generic state) to diff.
 */
function decorateDrawCall(capture: any, color: number[], thumb: string, depthTest: boolean): void {
    const draw = (capture.commands as any[]).find((c) => c && c.name === "drawArrays");
    if (!draw) {
        throw new Error("Fixture has no drawArrays command to decorate");
    }
    draw.DrawCall = draw.DrawCall || {};
    draw.DrawCall.uniforms = [
        { name: "uColor", value: color },
        {
            name: "uTex",
            value: 0,
            texture: {
                width: 2, height: 2, format: "RGBA", internalFormat: "RGBA",
                textureType: "UNSIGNED_BYTE", visual: { TEXTURE_2D: thumb },
            },
        },
    ];
    draw.DepthState = draw.DepthState || {};
    draw.DepthState.DEPTH_TEST = depthTest;
}

/**
 * Inject two related captures of the test scene so the Compare tab (#155) has a
 * previous/current pair with a representative diff: a changed call (arguments),
 * a removed call, an added call, and a changed draw call whose uniform value,
 * bound texture, and depth-test state all differ.
 *
 * Prerequisites are the same as {@link loadCapturedFrame}.
 */
export async function loadTwoCapturesForCompare(page: Page): Promise<void> {
    if (!fs.existsSync(FIXTURE_PATH)) {
        throw new Error(
            `Captured frame fixture not found at ${FIXTURE_PATH}. ` +
            `Run "npx playwright test generate-capture" first.`,
        );
    }

    const base = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf-8"));

    // Previous capture (A): red texture, depth test off.
    const captureA = JSON.parse(JSON.stringify(base));
    captureA.startTime = 3_600_000;
    decorateDrawCall(captureA, [1, 0, 0, 1], solidThumb("#dd2222"), false);

    // Current capture (B): change clearColor args, drop `clear`, add `enable`,
    // and flip the draw call's uniform/texture/depth-test state.
    const captureB = JSON.parse(JSON.stringify(captureA));
    captureB.startTime = 3_601_000;
    const commands = captureB.commands as any[];
    commands[0].text = "clearColor: 0.2, 0.2, 0.3, 1";
    const clearIndex = commands.findIndex((c) => c && c.name === "clear");
    if (clearIndex >= 0) {
        const enable = JSON.parse(JSON.stringify(commands[clearIndex]));
        enable.id = 900;
        enable.name = "enable";
        enable.text = "enable: DEPTH_TEST";
        commands.splice(clearIndex, 1, enable);
    }
    decorateDrawCall(captureB, [0, 1, 0, 1], solidThumb("#22cc22"), true);

    await page.evaluate((payload: { a: unknown; b: unknown }) => {
        const spector = (window as any).__spector;
        if (!spector) {
            throw new Error("window.__spector is not defined");
        }
        const resultUI = spector.getResultUI();
        resultUI.display();
        resultUI.addCapture(payload.a);
        resultUI.addCapture(payload.b);
    }, { a: captureA, b: captureB });

    await page.waitForSelector(".resultViewComponent.active", {
        state: "visible",
        timeout: 30_000,
    });
}
