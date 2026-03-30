import { test, expect } from "../helpers/spector-fixture";
import { loadCapturedFrame } from "../helpers/capture-helper";

test.describe("ResultView — Commands Tab", () => {
    test("commands tab 3-panel layout", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(200);

        const resultView = page.locator(".resultViewComponent.active");
        await expect(resultView).toHaveScreenshot("result-view-commands-layout.png", {
            maxDiffPixels: 200,
        });
    });

    test("command list with items", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(200);

        const commandList = page.locator(".commandListComponent");
        await expect(commandList).toHaveScreenshot("result-view-command-list.png", {
            maxDiffPixels: 100,
        });
    });

    test("active command highlight", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(200);

        // Click the second command to change selection.
        await page.locator(".commandListComponent li").nth(1).click();
        await page.waitForTimeout(200);

        const commandList = page.locator(".commandListComponent");
        await expect(commandList).toHaveScreenshot("result-view-active-command.png", {
            maxDiffPixels: 100,
        });
    });

    test("command detail panel", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(200);

        // Select a command to populate the detail pane.
        await page.locator(".commandListComponent li").first().click();
        await page.waitForTimeout(200);

        const detail = page.locator(".commandDetailComponent");
        await expect(detail).toHaveScreenshot("result-view-command-detail.png", {
            maxDiffPixels: 100,
        });
    });

    test("visual state panel", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(200);

        const visualStates = page.locator(".visualStateListComponent");
        await expect(visualStates).toHaveScreenshot("result-view-visual-states.png", {
            maxDiffPixels: 200,
        });
    });
});

test.describe("ResultView — Menu Bar", () => {
    test("menu bar with active tab", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(200);

        const menu = page.locator(".resultViewMenuComponent");
        await expect(menu).toHaveScreenshot("result-view-menu-bar.png", {
            maxDiffPixels: 100,
        });
    });

    test("switch to Captures tab", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(200);

        await page.locator('[commandName="onCapturesClicked"]').click();
        await page.waitForTimeout(200);

        const content = page.locator(".resultViewContentComponent");
        await expect(content).toHaveScreenshot("result-view-captures-tab.png", {
            maxDiffPixels: 200,
        });
    });

    test("switch to Information tab", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(200);

        await page.locator('[commandName="onInformationClicked"]').click();
        await page.waitForTimeout(200);

        const content = page.locator(".resultViewContentComponent");
        await expect(content).toHaveScreenshot("result-view-information-tab.png", {
            maxDiffPixels: 100,
        });
    });

    test("switch to Init State tab", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(200);

        await page.locator('[commandName="onInitStateClicked"]').click();
        await page.waitForTimeout(200);

        const content = page.locator(".resultViewContentComponent");
        await expect(content).toHaveScreenshot("result-view-init-state-tab.png", {
            maxDiffPixels: 100,
        });
    });

    test("switch to End State tab", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(200);

        await page.locator('[commandName="onEndStateClicked"]').click();
        await page.waitForTimeout(200);

        const content = page.locator(".resultViewContentComponent");
        await expect(content).toHaveScreenshot("result-view-end-state-tab.png", {
            maxDiffPixels: 100,
        });
    });
});

test.describe("ResultView — Search", () => {
    test("search filtering", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(200);

        await page.locator('[commandName="onSearchTextChanged"]').fill("clear");
        await page.waitForTimeout(200);

        const commandList = page.locator(".commandListComponent");
        await expect(commandList).toHaveScreenshot("result-view-search-filter.png", {
            maxDiffPixels: 100,
        });
    });
});

test.describe("ResultView — Full Layout", () => {
    test("full ResultView screenshot", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(200);

        const resultView = page.locator(".resultViewComponent");
        await expect(resultView).toHaveScreenshot("result-view-full-layout.png", {
            maxDiffPixels: 200,
        });
    });
});

test.describe("ResultView — Close", () => {
    test("ResultView close removes active class", async ({ spectorPage }) => {
        const { page } = spectorPage;
        await spectorPage.injectStabilizationCSS();
        await loadCapturedFrame(page);
        await page.waitForTimeout(200);

        // Verify active before close.
        await expect(page.locator(".resultViewComponent.active")).toBeVisible();

        await page.locator('[commandName="onCloseClicked"]').click();
        await page.waitForTimeout(200);

        // After close, the component should no longer have the active class.
        await expect(page.locator(".resultViewComponent.active")).toHaveCount(0);
    });
});
