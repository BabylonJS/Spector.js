/**
 * Tests for moduleWorkerInjector.js — import rewriting logic.
 *
 * We load the injector in a jsdom-like environment and test the
 * rewriteImports / resolveSpecifier functions directly.
 */

// Load the module injector — it attaches to window.__SPECTOR_ModuleInjector
require("../../../extensions/moduleWorkerInjector");

const injector = (window as any).__SPECTOR_ModuleInjector;

describe("SpectorModuleInjector", () => {
    describe("resolveSpecifier", () => {
        const base = "https://example.com/app/worker.js";

        it("resolves ./ relative specifiers", () => {
            expect(injector.resolveSpecifier("./engine.js", base))
                .toBe("https://example.com/app/engine.js");
        });

        it("resolves ../ relative specifiers", () => {
            expect(injector.resolveSpecifier("../utils/math.js", base))
                .toBe("https://example.com/utils/math.js");
        });

        it("leaves absolute URLs untouched", () => {
            expect(injector.resolveSpecifier("https://cdn.example.com/lib.js", base))
                .toBe("https://cdn.example.com/lib.js");
        });

        it("leaves bare specifiers untouched", () => {
            expect(injector.resolveSpecifier("three", base)).toBe("three");
            expect(injector.resolveSpecifier("@babylonjs/core", base)).toBe("@babylonjs/core");
        });
    });

    describe("rewriteImports", () => {
        const base = "https://example.com/app/worker.js";

        it("rewrites static named imports", () => {
            const src = `import { Engine } from './engine.js';`;
            const result = injector.rewriteImports(src, base);
            expect(result).toBe(`import { Engine } from 'https://example.com/app/engine.js';`);
        });

        it("rewrites static default imports", () => {
            const src = `import Scene from "../scene.js";`;
            const result = injector.rewriteImports(src, base);
            expect(result).toBe(`import Scene from "https://example.com/scene.js";`);
        });

        it("rewrites side-effect imports", () => {
            const src = `import './polyfill.js';`;
            const result = injector.rewriteImports(src, base);
            expect(result).toBe(`import 'https://example.com/app/polyfill.js';`);
        });

        it("rewrites export-from statements", () => {
            const src = `export { render } from './renderer.js';`;
            const result = injector.rewriteImports(src, base);
            expect(result).toBe(`export { render } from 'https://example.com/app/renderer.js';`);
        });

        it("rewrites export-star statements", () => {
            const src = `export * from '../utils.js';`;
            const result = injector.rewriteImports(src, base);
            expect(result).toBe(`export * from 'https://example.com/utils.js';`);
        });

        it("rewrites dynamic imports", () => {
            const src = `const m = await import('./module.js');`;
            const result = injector.rewriteImports(src, base);
            expect(result).toBe(`const m = await import('https://example.com/app/module.js');`);
        });

        it("leaves absolute URL imports unchanged", () => {
            const src = `import { x } from 'https://cdn.example.com/lib.js';`;
            const result = injector.rewriteImports(src, base);
            expect(result).toBe(src);
        });

        it("leaves bare specifiers unchanged", () => {
            const src = `import * as THREE from 'three';`;
            const result = injector.rewriteImports(src, base);
            expect(result).toBe(src);
        });

        it("handles multiple imports in one source", () => {
            const src = [
                `import { Engine } from './engine.js';`,
                `import Scene from '../scene.js';`,
                `import 'https://cdn.example.com/polyfill.js';`,
                `const m = await import('./lazy.js');`,
            ].join("\n");

            const result = injector.rewriteImports(src, base);
            expect(result).toContain("'https://example.com/app/engine.js'");
            expect(result).toContain("'https://example.com/scene.js'");
            expect(result).toContain("'https://cdn.example.com/polyfill.js'");
            expect(result).toContain("'https://example.com/app/lazy.js'");
        });

        it("preserves non-import code", () => {
            const src = `const x = 42;\nconsole.log('hello');\nimport { y } from './y.js';`;
            const result = injector.rewriteImports(src, base);
            expect(result).toContain("const x = 42;");
            expect(result).toContain("console.log('hello');");
            expect(result).toContain("'https://example.com/app/y.js'");
        });

        it("handles double-quoted specifiers", () => {
            const src = `import { x } from "./foo.js";`;
            const result = injector.rewriteImports(src, base);
            expect(result).toBe(`import { x } from "https://example.com/app/foo.js";`);
        });
    });
});
