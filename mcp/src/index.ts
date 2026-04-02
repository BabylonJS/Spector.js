/**
 * Spector.js MCP Server — entry point.
 *
 * Registers all MCP tools and connects to the stdio transport.
 * Tool names, descriptions, and schemas are the public API and must not change.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { BrowserManager } from "./browser-manager.js";
import { NO_PAGE_MSG } from "./constants.js";
import {
    captureFrame,
    getDrawCalls,
    getCommandDetails,
    getShaders,
    getTextures,
    getWebGLState,
    getContextInfo,
} from "./spector-bridge.js";
// ── Helpers ──────────────────────────────────────────────────────

/** Build an MCP error response. */
function errorResponse(message: string) {
    return { content: [{ type: "text" as const, text: message }], isError: true as const };
}

/** Build a plain-text MCP response. */
function textResponse(text: string) {
    return { content: [{ type: "text" as const, text }] };
}

// ── Bootstrap ────────────────────────────────────────────────────

const server = new McpServer({
    name: "spector-mcp",
    version: "1.1.0",
});

const mgr = new BrowserManager();

// ── Navigation ───────────────────────────────────────────────────

server.tool(
    "load_url",
    "Navigate to any URL and prepare for WebGL debugging. Injects Spector.js for frame capture. Works with any WebGL site (Three.js, Babylon.js, PlayCanvas, raw WebGL, etc.).",
    {
        url: z.string().url().describe("The URL to navigate to (e.g. 'https://threejs.org/examples/#webgl_animation_keyframes')"),
    },
    async ({ url }) => {
        try {
            const { title, canvasCount } = await mgr.navigateToUrl(url);

            const content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }> = [];

            let text = `**Page loaded:** ${title}\n`;
            text += `**URL:** ${url}\n`;
            text += `**Canvases found:** ${canvasCount}\n`;

            if (canvasCount === 0) {
                text += `\n⚠️ No canvas elements detected yet. The page may need more time to load, or it may not use WebGL.\n`;
                text += `You can still call capture_frame — Spector will be injected when needed.`;
            } else {
                text += `\nCanvas #0 is selected by default. Use list_canvases to see all canvases and select_canvas to switch.`;
                text += `\nReady for capture_frame.`;
            }

            content.push({ type: "text" as const, text });

            // Try to screenshot the page
            const page = mgr.getPage();
            if (page) {
                try {
                    const canvas = await page.$("canvas").catch(() => null);
                    if (canvas) {
                        const buf = await canvas.screenshot({ type: "png" });
                        content.push({
                            type: "image" as const,
                            data: buf.toString("base64"),
                            mimeType: "image/png",
                        });
                    }
                } catch { /* screenshot is best-effort */ }
            }

            return { content };
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            return errorResponse(`Error loading URL: ${msg}`);
        }
    },
);

server.tool(
    "load_playground",
    "Load a Babylon.js Playground scene by snippet ID. Returns the playground source code and a screenshot. Convenience shortcut — you can also use load_url with the full playground URL.",
    { snippetId: z.string().describe("Playground snippet ID, e.g. 'ABC123' or 'ABC123#5' for a specific revision") },
    async ({ snippetId }) => {
        try {
            const { code } = await mgr.navigateToPlayground(snippetId);
            const page = mgr.getPage();

            let screenshotBase64: string | null = null;
            if (page) {
                const canvas = await page.$("#renderCanvas").catch(() => null) ||
                    await page.$("canvas").catch(() => null);
                if (canvas) {
                    const buf = await canvas.screenshot({ type: "png" });
                    screenshotBase64 = buf.toString("base64");
                }
            }

            const content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }> = [];

            content.push({
                type: "text" as const,
                text: `Playground loaded: #${snippetId}\n\n` +
                    (code
                        ? `**Source Code:**\n\`\`\`javascript\n${code}\n\`\`\``
                        : "Could not retrieve source code. Try capture_frame to inspect the rendered scene."),
            });

            if (screenshotBase64) {
                content.push({
                    type: "image" as const,
                    data: screenshotBase64,
                    mimeType: "image/png",
                });
            }

            return { content };
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            return errorResponse(`Error loading playground: ${msg}`);
        }
    },
);

server.tool(
    "take_screenshot",
    "Take a screenshot of the current WebGL canvas.",
    {},
    async () => {
        const page = mgr.getPage();
        if (!page) return errorResponse(NO_PAGE_MSG);

        try {
            const canvas = await page.$("canvas").catch(() => null);
            if (!canvas) return errorResponse("No canvas element found on the page.");

            const buf = await canvas.screenshot({ type: "png" });
            return {
                content: [{
                    type: "image" as const,
                    data: buf.toString("base64"),
                    mimeType: "image/png",
                }],
            };
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            return errorResponse(`Screenshot failed: ${msg}`);
        }
    },
);

// ── Canvas Selection ─────────────────────────────────────────────

server.tool(
    "list_canvases",
    "List all canvas elements on the page with their WebGL context info. Use this when a page has multiple canvases to find the right one to debug.",
    {},
    async () => {
        const page = mgr.getPage();
        if (!page) return errorResponse(NO_PAGE_MSG);

        try {
            const canvases = await mgr.listCanvases();
            if (canvases.length === 0) {
                return textResponse("No canvas elements found on the page.");
            }

            const lines = canvases.map(
                (c) =>
                    `[${c.index}] ${c.id ? `id="${c.id}"` : "(no id)"} ${c.width}×${c.height} context=${c.contextType} visible=${c.isVisible}`,
            );

            return textResponse(
                `**Canvases (${canvases.length})**\n\`\`\`\n${lines.join("\n")}\n\`\`\`\nUse select_canvas to choose which one to debug.`,
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            return errorResponse(`Error: ${msg}`);
        }
    },
);

server.tool(
    "select_canvas",
    "Select which canvas to target for capture and inspection. Defaults to canvas #0. Use list_canvases to see available canvases.",
    { index: z.number().int().min(0).describe("Canvas index (from list_canvases)") },
    async ({ index }) => {
        const page = mgr.getPage();
        if (!page) return errorResponse(NO_PAGE_MSG);

        try {
            const canvases = await mgr.listCanvases();
            if (index >= canvases.length) {
                return errorResponse(`Invalid index ${index}. Only ${canvases.length} canvas(es) found.`);
            }

            mgr.setSelectedCanvas(index);
            const c = canvases[index];
            return textResponse(
                `Selected canvas #${index}: ${c.id ? `id="${c.id}"` : "(no id)"} ${c.width}×${c.height} context=${c.contextType}`,
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            return errorResponse(`Error: ${msg}`);
        }
    },
);

// ── Capture ──────────────────────────────────────────────────────

server.tool(
    "capture_frame",
    "Capture a single WebGL frame using Spector.js. Returns a summary including command count, draw calls, programs, and errors. Works on any WebGL website.",
    {
        quickCapture: z.boolean().optional().default(false)
            .describe("If true, skips thumbnail generation for faster capture"),
    },
    async ({ quickCapture }) => {
        const page = mgr.getPage();
        if (!page) return errorResponse(NO_PAGE_MSG);

        try {
            const summary = await captureFrame(page, mgr.getSelectedCanvas(), quickCapture);
            return textResponse(
                `**Frame Capture Summary**\n` +
                `- Total commands: ${summary.totalCommands}\n` +
                `- Draw calls: ${summary.drawCalls}\n` +
                `- Clear calls: ${summary.clearCalls}\n` +
                `- Shader programs: ${summary.programs}\n` +
                `- WebGL version: ${summary.contextVersion}\n` +
                `- Canvas: ${summary.canvasWidth}×${summary.canvasHeight}\n` +
                `- Duration: ${summary.durationMs}ms\n` +
                (summary.errors.length > 0
                    ? `- **Errors:** ${summary.errors.join(", ")}\n`
                    : "- No GL errors detected\n"),
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            return errorResponse(`Capture failed: ${msg}`);
        }
    },
);

// ── Inspection ───────────────────────────────────────────────────

server.tool(
    "get_draw_calls",
    "List all draw calls and clear commands from the last captured frame. Each entry includes the command ID, name, arguments, and status.",
    {},
    async () => {
        const page = mgr.getPage();
        if (!page) return errorResponse(NO_PAGE_MSG);

        try {
            const draws = await getDrawCalls(page);
            if (draws.length === 0) {
                return textResponse("No draw calls found. Make sure you've called capture_frame first.");
            }

            const lines = draws.map(
                (d) =>
                    `[${d.commandId}] ${d.name}(${d.args})${d.marker ? ` [marker: ${d.marker}]` : ""} status=${d.status}`,
            );

            return textResponse(
                `**Draw Calls (${draws.length})**\n\`\`\`\n${lines.join("\n")}\n\`\`\``,
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            return errorResponse(`Error: ${msg}`);
        }
    },
);

server.tool(
    "get_command_details",
    "Get full WebGL state and details for a specific command by its ID (from get_draw_calls). Includes GL state, bound textures, blend/depth settings, etc.",
    { commandId: z.number().describe("The command ID from the capture (see get_draw_calls)") },
    async ({ commandId }) => {
        const page = mgr.getPage();
        if (!page) return errorResponse(NO_PAGE_MSG);

        try {
            const details = await getCommandDetails(page, commandId);
            if (!details) {
                return errorResponse(`Command #${commandId} not found. Run capture_frame first.`);
            }

            return textResponse(
                `**Command #${commandId} Details**\n\`\`\`json\n${JSON.stringify(details, null, 2)}\n\`\`\``,
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            return errorResponse(`Error: ${msg}`);
        }
    },
);

server.tool(
    "get_shaders",
    "Get shader program source code (vertex + fragment) from the last capture. Optionally filter by program index.",
    {
        programIndex: z.number().optional()
            .describe("Specific program index to retrieve. Omit to get all programs."),
    },
    async ({ programIndex }) => {
        const page = mgr.getPage();
        if (!page) return errorResponse(NO_PAGE_MSG);

        try {
            const shaders = await getShaders(page, programIndex);
            if (shaders.length === 0) {
                return textResponse(
                    "No shader programs found in the capture. This can happen if shader sources aren't captured in single-frame mode. Try inspecting specific draw call commands with get_command_details.",
                );
            }

            const parts = shaders.map((s) => {
                let text = `### Program #${s.programIndex}\n`;
                text += `Link: ${s.linkStatus ? "✓" : "✗"}\n\n`;
                if (s.vertexSource) {
                    text += `**Vertex Shader** (compile: ${s.vertexCompileStatus ? "✓" : "✗"}):\n\`\`\`glsl\n${s.vertexSource}\n\`\`\`\n\n`;
                }
                if (s.fragmentSource) {
                    text += `**Fragment Shader** (compile: ${s.fragmentCompileStatus ? "✓" : "✗"}):\n\`\`\`glsl\n${s.fragmentSource}\n\`\`\`\n`;
                }
                if (!s.vertexSource && !s.fragmentSource) {
                    text += "_No shader source available for this program._\n";
                }
                return text;
            });

            return textResponse(
                `**Shader Programs (${shaders.length})**\n\n${parts.join("\n---\n\n")}`,
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            return errorResponse(`Error: ${msg}`);
        }
    },
);

server.tool(
    "get_textures",
    "List textures uploaded during the captured frame, including dimensions, format, and type.",
    {},
    async () => {
        const page = mgr.getPage();
        if (!page) return errorResponse(NO_PAGE_MSG);

        try {
            const textures = await getTextures(page);
            if (textures.length === 0) {
                return textResponse(
                    "No texture upload commands found in this frame capture. Textures may have been uploaded during initialization, before the captured frame.",
                );
            }

            const lines = textures.map(
                (t) =>
                    `[cmd ${t.commandId}] ${t.name}: ${t.width}×${t.height} format=${t.internalFormat} type=${t.type}`,
            );

            return textResponse(
                `**Textures (${textures.length})**\n\`\`\`\n${lines.join("\n")}\n\`\`\``,
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            return errorResponse(`Error: ${msg}`);
        }
    },
);

server.tool(
    "get_webgl_state",
    "Compare initial and final WebGL state for the captured frame. Shows properties that changed during the frame.",
    {},
    async () => {
        const page = mgr.getPage();
        if (!page) return errorResponse(NO_PAGE_MSG);

        try {
            const { diff, initial, final: finalState } = await getWebGLState(page);

            if (diff.length === 0 && Object.keys(initial).length === 0) {
                return textResponse("No WebGL state data available. Run capture_frame first.");
            }

            let text = `**WebGL State Diff** (${diff.length} properties changed)\n\n`;
            if (diff.length > 0) {
                text += "| Property | Initial | Final |\n|---|---|---|\n";
                for (const d of diff) {
                    text += `| ${d.property} | ${JSON.stringify(d.initial)} | ${JSON.stringify(d.final)} |\n`;
                }
            } else {
                text += "No state changes detected during this frame.\n";
            }

            return textResponse(text);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            return errorResponse(`Error: ${msg}`);
        }
    },
);

// ── Diagnostics ──────────────────────────────────────────────────

server.tool(
    "get_context_info",
    "Get WebGL context information including version, extensions, capabilities, and renderer details.",
    {},
    async () => {
        const page = mgr.getPage();
        if (!page) return errorResponse(NO_PAGE_MSG);

        try {
            const info = await getContextInfo(page, mgr.getSelectedCanvas());
            return textResponse(
                `**WebGL Context Info**\n\`\`\`json\n${JSON.stringify(info, null, 2)}\n\`\`\``,
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            return errorResponse(`Error: ${msg}`);
        }
    },
);

server.tool(
    "get_console_logs",
    "Get browser console messages (errors, warnings, logs) from the loaded page. Useful for detecting JavaScript errors or WebGL warnings.",
    {
        level: z.enum(["all", "error", "warning", "log"]).optional().default("all")
            .describe("Filter by log level"),
        clear: z.boolean().optional().default(false)
            .describe("Clear the log buffer after reading"),
    },
    async ({ level, clear }) => {
        const page = mgr.getPage();
        if (!page) return errorResponse(NO_PAGE_MSG);

        let logs = mgr.getConsoleLogs();
        if (level !== "all") {
            logs = logs.filter((l) => l.level === level);
        }
        if (clear) {
            mgr.clearConsoleLogs();
        }

        if (logs.length === 0) {
            return textResponse(
                `No console ${level === "all" ? "" : level + " "}messages captured.`,
            );
        }

        const lines = logs.map(
            (l) => `[${l.level.toUpperCase()}] ${l.message}${l.source ? ` (${l.source})` : ""}`,
        );

        return textResponse(
            `**Console Logs (${logs.length})**\n\`\`\`\n${lines.join("\n")}\n\`\`\``,
        );
    },
);

// ── Server Lifecycle ─────────────────────────────────────────────

process.on("SIGINT", async () => {
    await mgr.close();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await mgr.close();
    process.exit(0);
});

const transport = new StdioServerTransport();
await server.connect(transport);
