# Copilot Instructions for Spector.js

## Build & Development Commands

```bash
npm start              # Compile + live reload dev server + watch (localhost:1337/sample/)
npm run build          # Production build (lint → bundle → copy → extension wrap)
npm run build:tslint   # Lint only (run before PRs)
npm run build:bundle   # Webpack bundle only
npm run clean          # Remove generated files
```

There is no test suite — `npm test` is a no-op. Validation is done via the sample pages at `http://localhost:1337/sample/index.html?sample=<name>` (e.g., `?sample=simple`, `?sample=lights`). Append `&noSpy=1` to test without the full spy enabled.

## Architecture

Spector.js is a **WebGL debugging inspector** that intercepts WebGL API calls at runtime via function wrapping, captures frame data, and renders results in a built-in UI. It ships as both an npm module (UMD bundle exported as `SPECTOR`) and a browser extension.

### Core Subsystems (in `src/`)

- **`backend/`** — Runtime interception engine
  - **`spies/`** — The interception layer. `ContextSpy` orchestrates capture by wrapping all WebGL methods. `CommandSpy` wraps individual functions. `StateSpy` tracks state changes. `TimeSpy` hooks `requestAnimationFrame`. `RecorderSpy` records resource data (textures, buffers, programs).
  - **`commands/`** — 38 command classes (one per WebGL function), all extending `BaseCommand`. Handle argument serialization and stack traces.
  - **`states/`** — 13+ state implementations extending `BaseState`. Each state type (blend, depth, stencil, visual, etc.) registers callbacks for the WebGL commands that affect it, then reads from the context on capture.
  - **`recorders/`** — Generic `BaseRecorder<T extends WebGLObject>` with concrete implementations for buffers, textures, programs, render buffers.
  - **`analysers/`** — Post-capture analysis (`CaptureAnalyser`, `CommandsAnalyser`, `PrimitivesAnalyser`).
  - **`webGlObjects/`** — Tagging system that attaches metadata to WebGL objects.

- **`embeddedFrontend/`** — Built-in UI
  - **`mvx/`** — Custom MVX (Model-View-Extension) UI framework (~5 core files). All UI components extend this framework.
  - **`resultView/`** — ~20 components for displaying capture results.
  - **`captureMenu/`** — Capture control UI.
  - **`styles/`** — SCSS stylesheets (bundled via sass-loader).

- **`shared/`** — Cross-cutting utilities
  - `Observable<T>` — Lightweight event system used throughout (`onCapture`, `onError`, etc.).
  - `Logger` — Logging utility.
  - `ICapture` / capture types — Capture data structures.

- **`polyfill/`** — XR Session polyfill.

### Entry Point & Data Flow

`src/spector.ts` is the main entry point exporting the `Spector` class. Capture flow:
1. `Spector` creates `ContextSpy` for a WebGL context
2. `ContextSpy.spy()` wraps all WebGL functions via `CommandSpy` instances
3. On each wrapped call, registered `BaseState` subclasses read relevant state
4. `RecorderSpy` captures resource data (textures, buffers)
5. `CaptureAnalyser` aggregates everything into an `ICapture` object
6. Results fire via `Observable<ICapture>` to the UI or consumer

### Browser Extension (`extensions/`)

The extension wraps the core library for Chrome/Firefox. Key files:
- `background.js` — Service worker managing tab state
- `contentScript.js` / `contentScriptProxy.js` — Injected into pages, communicate via browser messaging
- `spector.bundle.js` — Auto-copied from `dist/` during build
- `spector.bundle.func.js` — Bundle wrapped with header/footer for extension injection

### Vendor Dependencies (`vendors/`)

Ace editor files (editor, GLSL mode, Monokai theme, search) are bundled as webpack entry points for the shader editor UI.

## Code Conventions

- **TypeScript** targeting ES2015, ES6 modules, bundled to UMD via webpack.
- **File naming**: `camelCase.ts` — one class per file (e.g., `contextSpy.ts`, `baseCommand.ts`).
- **Class naming**: `PascalCase`. Spy classes use `*Spy` suffix, recorders use `*Recorder`, components use `*Component`.
- **Interfaces**: Prefixed with `I` (e.g., `IContextInformation`, `ICapture`, `IFunctionInformation`).
- **Member access**: Always explicit (`public`/`private`/`protected` required by linter).
- **Strings**: Double quotes (enforced by tslint).
- **Semicolons**: Always required.
- **Max line length**: 200 characters.
- **Bitwise operators**: Allowed (needed for WebGL constants).
- **Strict mode**: `noImplicitAny`, `noImplicitReturns`, `noImplicitThis` enabled.
- **Extending the command system**: Add a new class extending `BaseCommand` in `src/backend/commands/`.
- **Extending state tracking**: Add a new class extending `BaseState` in `src/backend/states/`, implementing `getConsumeCommands()` and `readFromContext()`.
- **Adding samples**: Create a JS file in `sample/js/`, access via `?sample=fileName` (without `.js`).
