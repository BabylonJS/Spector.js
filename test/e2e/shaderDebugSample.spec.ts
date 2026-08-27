import { test, expect } from "@playwright/test";

interface IShaderCommandSummary {
    name: string;
    text: string;
    source: string;
    compileStatus: boolean | null;
    infoLog: string;
}

interface IShaderSampleSummary {
    scenario: string;
    commandNames: string[];
    shaderCommands: IShaderCommandSummary[];
    programCommands: Array<{
        name: string;
        text: string;
        linkStatus: boolean;
        infoLog: string;
        shaderSources: string[];
    }>;
    stringResults: Array<{ name: string; result: string }>;
    outcome: Record<string, boolean | string>;
}

declare global {
    interface Window {
        shaderDebugSample: {
            lastSummary: IShaderSampleSummary | null;
            ready: boolean;
            runScenario(name: string): IShaderSampleSummary;
        };
    }
}

test.describe("Shader debugging sample", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/sample/index.html?sample=shaderDebug&scenario=valid&dist=true");
        await page.waitForFunction(() =>
            window.shaderDebugSample?.ready &&
            window.shaderDebugSample.lastSummary?.scenario === "valid",
        );
    });

    test("captures valid, failed, replaced, and link-failed shaders", async ({ page }) => {
        const valid = await getLastSummary(page);
        const validSource = valid.shaderCommands.find((command) => command.name === "shaderSource");
        expect(valid.outcome.vertexCompiled).toBe(true);
        expect(valid.outcome.fragmentCompiled).toBe(true);
        expect(valid.outcome.linked).toBe(true);
        expect(validSource?.text).toContain("chars");
        expect(validSource?.text).not.toContain("void main");
        expect(validSource?.source).toContain("void main");

        const error = await runScenario(page, "error");
        const failedCompile = error.shaderCommands.find((command) =>
            command.name === "compileShader" && command.compileStatus === false,
        );
        expect(error.outcome.fragmentCompiled).toBe(false);
        expect(failedCompile?.infoLog.length).toBeGreaterThan(0);
        expect(failedCompile?.source).toContain("missingBlue");

        const replacement = await runScenario(page, "replace");
        const fragmentCompiles = replacement.shaderCommands.filter((command) =>
            command.name === "compileShader" &&
            command.source.includes("precision mediump float"),
        );
        expect(replacement.outcome.firstCompiled).toBe(false);
        expect(replacement.outcome.secondCompiled).toBe(true);
        expect(fragmentCompiles.map((command) => command.compileStatus)).toEqual([false, true]);
        expect(fragmentCompiles[0].source).toContain("missingBlue");
        expect(fragmentCompiles[1].source).not.toContain("missingBlue");

        const link = await runScenario(page, "link");
        const programLog = link.stringResults.find((command) =>
            command.name === "getProgramInfoLog",
        );
        expect(link.outcome.vertexCompiled).toBe(true);
        expect(link.outcome.fragmentCompiled).toBe(true);
        expect(link.outcome.linked).toBe(false);
        expect(programLog?.result.length).toBeGreaterThan(0);
        const failedLink = link.programCommands.find((command) => command.name === "linkProgram");
        expect(failedLink?.text).toContain("-> failed");
        expect(failedLink?.linkStatus).toBe(false);
        expect(failedLink?.infoLog.length).toBeGreaterThan(0);
        expect(failedLink?.shaderSources).toHaveLength(2);

        const linkCommand = page.locator(".commandListComponent li").filter({ hasText: "linkProgram" }).first();
        await linkCommand.click();
        const shaderLinks = page.locator('[commandName="onShaderSourceOpen"]');
        await expect(shaderLinks).toHaveCount(2);
        await shaderLinks.nth(1).click();
        await expect(page.locator('[commandName="onShowCapturedDiagnostics"]')).toBeVisible();
    });
});

async function getLastSummary(page: import("@playwright/test").Page): Promise<IShaderSampleSummary> {
    return page.evaluate(() => window.shaderDebugSample.lastSummary!);
}

async function runScenario(
    page: import("@playwright/test").Page,
    scenario: string,
): Promise<IShaderSampleSummary> {
    return page.evaluate((name) => window.shaderDebugSample.runScenario(name), scenario);
}
