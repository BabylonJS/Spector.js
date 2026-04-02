/**
 * Manages the Playwright browser lifecycle for the Spector.js MCP server.
 *
 * All mutable browser state (the browser instance, page, console logs,
 * selected canvas index) is encapsulated in the {@link BrowserManager} class
 * so that it can be tested and replaced without module-level singletons.
 */

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import {
    NAVIGATION_TIMEOUT_MS,
    CANVAS_WAIT_TIMEOUT_MS,
    POST_NAVIGATION_DELAY_MS,
    PLAYGROUND_READY_TIMEOUT_MS,
    POST_PLAYGROUND_DELAY_MS,
} from "./constants.js";
import { NavigationError } from "./errors.js";
import type { ConsoleEntry, CanvasInfo } from "./types.js";

/** Optional configuration for {@link BrowserManager}. */
export interface BrowserManagerConfig {
    /** Launch the browser in headless mode (default: `true`). */
    headless?: boolean;
    /** Viewport dimensions (default: 1920×1080). */
    viewport?: { width: number; height: number };
}

/**
 * Owns the Playwright browser, context, and page.
 *
 * Only one page is active at a time. Navigation resets console logs and the
 * selected canvas index.
 */
export class BrowserManager {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private consoleLogs: ConsoleEntry[] = [];
    private selectedCanvasIndex = 0;
    private readonly config: Required<BrowserManagerConfig>;
    /** Guards against concurrent `ensureBrowser()` calls launching multiple browsers. */
    private launchPromise: Promise<Page> | null = null;

    constructor(config?: BrowserManagerConfig) {
        this.config = {
            headless: config?.headless ?? true,
            viewport: config?.viewport ?? { width: 1920, height: 1080 },
        };
    }

    // ── Browser lifecycle ────────────────────────────────────────

    /**
     * Return the active page, launching a browser if necessary.
     *
     * Uses a promise-based lock to prevent concurrent callers from launching
     * multiple browser instances (TOCTOU race).
     */
    async ensureBrowser(): Promise<Page> {
        if (this.page && !this.page.isClosed()) return this.page;
        if (this.launchPromise) return this.launchPromise;

        this.launchPromise = this.launchBrowser();
        try {
            return await this.launchPromise;
        } finally {
            this.launchPromise = null;
        }
    }

    private async launchBrowser(): Promise<Page> {
        this.browser = await chromium.launch({
            headless: this.config.headless,
            args: [
                "--enable-webgl",
                "--enable-webgl2",
                "--use-gl=angle",
                "--ignore-gpu-blocklist",
                "--enable-gpu-rasterization",
            ],
        });
        this.context = await this.browser.newContext({
            viewport: this.config.viewport,
        });
        this.page = await this.context.newPage();

        this.consoleLogs = [];
        this.page.on("console", (msg) => {
            this.consoleLogs.push({
                level: msg.type(),
                message: msg.text(),
                source: msg.location().url || "",
            });
        });

        this.page.on("pageerror", (err) => {
            this.consoleLogs.push({
                level: "error",
                message: err.message,
                source: err.stack || "",
            });
        });

        return this.page;
    }

    /** Close the browser and release all resources. */
    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close().catch(() => {});
            this.browser = null;
            this.context = null;
            this.page = null;
            this.consoleLogs = [];
        }
    }

    // ── Navigation ───────────────────────────────────────────────

    /**
     * Navigate to an arbitrary URL and wait for at least one canvas.
     *
     * @throws {NavigationError} when the navigation itself fails.
     */
    async navigateToUrl(url: string): Promise<{ title: string; canvasCount: number }> {
        const pg = await this.ensureBrowser();
        this.consoleLogs = [];
        this.selectedCanvasIndex = 0;

        try {
            await pg.goto(url, { waitUntil: "load", timeout: NAVIGATION_TIMEOUT_MS });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            throw new NavigationError(`Failed to load ${url}: ${msg}`);
        }

        // Wait for at least one canvas to appear (WebGL sites often create
        // canvases dynamically)
        await pg
            .waitForSelector("canvas", { timeout: CANVAS_WAIT_TIMEOUT_MS })
            .catch(() => null);

        // Give the page time to initialise WebGL context and render a frame
        await pg.waitForTimeout(POST_NAVIGATION_DELAY_MS);

        const title = await pg.title();
        const canvasCount = await pg.evaluate(
            () => document.querySelectorAll("canvas").length,
        );

        return { title, canvasCount };
    }

    /**
     * Navigate to a Babylon.js Playground by snippet ID and extract source.
     *
     * @throws {NavigationError} when the playground fails to load.
     */
    async navigateToPlayground(snippetId: string): Promise<{ code: string | null }> {
        const pg = await this.ensureBrowser();
        this.consoleLogs = [];
        this.selectedCanvasIndex = 0;

        // Normalise snippet ID: strip leading # or full URL
        let id = snippetId.trim();
        if (id.startsWith("https://playground.babylonjs.com/")) {
            id = id.replace("https://playground.babylonjs.com/", "");
        }
        id = id.replace(/^#+/, "");

        const url = `https://playground.babylonjs.com/#${id}`;
        try {
            await pg.goto(url, { waitUntil: "load", timeout: NAVIGATION_TIMEOUT_MS });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            throw new NavigationError(`Failed to load playground ${id}: ${msg}`);
        }

        // Wait for the Babylon engine to be created and a scene to be ready
        await pg
            .waitForFunction(
                () => {
                    const w = window as any;
                    const eng = w.engine || w.BABYLON?.Engine?.LastCreatedEngine;
                    if (!eng) return false;
                    const scene = eng.scenes?.[0];
                    return scene != null;
                },
                { timeout: PLAYGROUND_READY_TIMEOUT_MS },
            )
            .catch(() => null);

        // Give the scene a couple frames to stabilise rendering
        await pg.waitForTimeout(POST_PLAYGROUND_DELAY_MS);

        // Extract code from the Monaco editor (most reliable in the playground)
        let code: string | null = null;
        try {
            code = await pg.evaluate(() => {
                const w = window as any;
                if (w.monaco) {
                    const editors = w.monaco.editor.getEditors();
                    if (editors.length > 0) return editors[0].getValue() as string;
                }
                return null;
            });
        } catch {
            code = null;
        }

        // Fallback: try the snippet server
        if (!code) {
            try {
                code = await pg.evaluate(async (snippetId: string) => {
                    try {
                        const resp = await fetch(
                            `https://snippet.babylonjs.com/${snippetId.replace(/#/g, "/")}`,
                        );
                        if (!resp.ok) return null;
                        const data = await resp.json();
                        if (data.jsonPayload) {
                            try {
                                const parsed = JSON.parse(data.jsonPayload);
                                return (parsed.code as string) || data.jsonPayload;
                            } catch {
                                return data.jsonPayload;
                            }
                        }
                        return data.payload || null;
                    } catch {
                        return null;
                    }
                }, id);
            } catch {
                code = null;
            }
        }

        return { code };
    }

    // ── Canvas management ────────────────────────────────────────

    /** Enumerate all `<canvas>` elements on the current page. */
    async listCanvases(): Promise<CanvasInfo[]> {
        const pg = this.getPage();
        if (!pg) return [];

        return await pg.evaluate(() => {
            const canvases = Array.from(document.querySelectorAll("canvas"));
            return canvases.map((canvas, index) => {
                const rect = canvas.getBoundingClientRect();
                let contextType: "webgl2" | "webgl" | "none" = "none";

                const gl2 = canvas.getContext("webgl2");
                if (gl2) {
                    contextType = "webgl2";
                } else {
                    const gl1 = canvas.getContext("webgl");
                    if (gl1) {
                        contextType = "webgl";
                    }
                }

                return {
                    index,
                    id: canvas.id || "",
                    width: canvas.width,
                    height: canvas.height,
                    contextType,
                    isVisible: rect.width > 0 && rect.height > 0,
                };
            });
        });
    }

    /** Set the canvas index that will be used for the next capture. */
    setSelectedCanvas(index: number): void {
        this.selectedCanvasIndex = index;
    }

    /** Get the currently selected canvas index. */
    getSelectedCanvas(): number {
        return this.selectedCanvasIndex;
    }

    // ── Page access ──────────────────────────────────────────────

    /** Return the active page, or `null` if no page is open. */
    getPage(): Page | null {
        return this.page && !this.page.isClosed() ? this.page : null;
    }

    // ── Console logs ─────────────────────────────────────────────

    /** Return a shallow copy of all captured console entries. */
    getConsoleLogs(): ConsoleEntry[] {
        return [...this.consoleLogs];
    }

    /** Clear the console log buffer. */
    clearConsoleLogs(): void {
        this.consoleLogs = [];
    }
}

// ── Singleton convenience ────────────────────────────────────────

let defaultInstance: BrowserManager | null = null;

/**
 * Return (and lazily create) the default shared {@link BrowserManager}.
 *
 * Use this in production; in tests, instantiate `BrowserManager` directly.
 */
export function getDefaultBrowserManager(): BrowserManager {
    if (!defaultInstance) {
        defaultInstance = new BrowserManager();
    }
    return defaultInstance;
}
