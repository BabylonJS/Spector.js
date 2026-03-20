# Spector.js — AI Working Spec

> This document describes the architecture, conventions, and patterns in the
> Spector.js embedded frontend so that AI coding assistants can make changes
> safely and consistently.

---

## 1. What Spector.js Is

Spector.js is a **WebGL debugger / inspector**. It intercepts WebGL calls on a
page, captures a frame of commands, and displays them in an embedded overlay UI.

The codebase has three layers. **Only the frontend layer** was recently
rewritten; the other two are untouched.

| Layer | Path | Description |
|-------|------|-------------|
| **Backend** | `src/backend/` | WebGL interception, context spying, command recording |
| **Shared** | `src/shared/` | Domain types (`ICapture`, `ICommandCapture`, `Observable`, `Logger`) |
| **Frontend** | `src/embeddedFrontend/react/` | React 18 UI (was a custom MVX framework, migrated March 2026) |

Entry point: `src/spector.ts` — creates the `Spector` class, wires backend
spies, and instantiates the frontend via `ReactCaptureMenu` and
`ReactResultView`.

Build output: `dist/spector.bundle.js` — a single UMD bundle (webpack,
includes React + ReactDOM + Ace editor + SCSS).

---

## 2. Frontend Architecture

### 2.1 Adapter Pattern

The frontend uses an **adapter pattern** to bridge React with the imperative
public API that `spector.ts` expects. Two adapter classes exist:

| Adapter | File | React Root |
|---------|------|------------|
| `ReactCaptureMenu` | `react/CaptureMenu/ReactCaptureMenu.ts` | `CaptureMenuRoot.tsx` |
| `ReactResultView` | `react/ResultView/ReactResultView.ts` | `ResultViewRoot.tsx` |

Each adapter:

1. Exposes the **exact same public methods and `Observable` properties** that
   `spector.ts` calls (e.g. `display()`, `hide()`, `setFPS()`, `addCapture()`).
2. Owns an `ExternalStore<State>` (see §2.2).
3. Mounts a React tree **once** via `createRoot()` in its constructor.
4. Translates imperative calls → `store.setState()` → React re-render.
5. Translates React event callbacks → `Observable.trigger()` → `spector.ts`.

**When modifying the public API**, update the adapter class — not the React
components. Components are purely presentational.

### 2.2 State Management — ExternalStore

File: `react/shared/ExternalStore.ts`

A minimal external store that bridges imperative code and React via
`useSyncExternalStore`. Key rules:

- **Never call `root.render()` repeatedly.** Mount once, update via
  `store.setState()`.
- `setState` takes an **updater function**: `(prev) => newState`. Always return
  a new object reference (spread operator) to trigger re-renders.
- Components subscribe via the `useStore(store)` hook.
- `getSnapshot` and `subscribe` are arrow functions (bound at construction)
  because React calls them without `this`.

### 2.3 Context Pattern

Each adapter passes itself to its React tree via a React Context:

```
CaptureMenuContext  →  useCaptureMenu()  →  adapter instance
ResultViewContext   →  useResultView()   →  adapter instance
```

Components call `const adapter = useCaptureMenu()` then read
`useStore(adapter.store)` for state and call `adapter.handleXxx()` for events.

### 2.4 Component Tree

```
src/embeddedFrontend/react/
├── shared/
│   ├── ExternalStore.ts          # State management bridge
│   ├── types.ts                  # All shared interfaces & enums
│   └── mdnCommandLinkHelper.ts   # WebGL command → MDN URL mapping
├── jsx-augments.d.ts             # TypeScript: allows commandName attribute in JSX
├── CaptureMenu/
│   ├── ReactCaptureMenu.ts       # Adapter (public API)
│   ├── CaptureMenuContext.ts     # React context
│   ├── CaptureMenuRoot.tsx       # Root component
│   ├── CanvasList.tsx            # Canvas selector dropdown
│   ├── CanvasListItem.tsx        # Single canvas entry
│   ├── CaptureMenuActions.tsx    # Capture/play/pause buttons
│   └── FpsCounter.tsx            # FPS display
└── ResultView/
    ├── ReactResultView.ts        # Adapter (public API + orchestration logic)
    ├── ResultViewContext.ts       # React context
    ├── ResultViewRoot.tsx         # Root component (tab routing)
    ├── Menu/ResultViewMenu.tsx    # Tab bar (Captures/Info/Init/Commands/End)
    ├── Content/ResultViewContent.tsx
    ├── CaptureList/
    │   ├── CaptureList.tsx       # Drag-drop capture loading
    │   └── CaptureListItem.tsx   # Capture thumbnail + save
    ├── CommandList/
    │   ├── CommandList.tsx        # Command list container
    │   ├── CommandListItem.tsx    # Single command (status colors, shader links)
    │   └── CommandDetail.tsx      # Command detail container
    ├── VisualStateList/
    │   ├── VisualStateList.tsx    # Visual state container
    │   └── VisualStateListItem.tsx  # Thumbnail + frame buffer info
    ├── JSON/
    │   ├── JSONContent.tsx        # JSON tree container
    │   ├── JSONGroup.tsx          # Collapsible group
    │   ├── JSONItem.tsx           # Key-value pair
    │   ├── JSONImageItem.tsx      # Image (supports pixelated rendering)
    │   ├── JSONHelpItem.tsx       # MDN help link
    │   ├── JSONVisualStateItem.tsx  # Visual state image
    │   └── JSONRenderTree.tsx     # Recursive renderer for JSONRenderItem[]
    ├── Information/
    │   └── InformationColumn.tsx  # Two-column layout
    └── SourceCode/
        └── SourceCode.tsx         # Ace editor wrapper
```

---

## 3. Key Types

All frontend types live in `react/shared/types.ts`. Key ones:

### CaptureMenuState
```typescript
interface CaptureMenuState {
    visible: boolean;
    logText: string;
    logLevel: LogLevel;      // from src/shared/utils/logger
    logVisible: boolean;
    canvases: ICanvasInformation[];
    selectedCanvas: ICanvasInformation | null;
    showCanvasList: boolean;
    isPlaying: boolean;
    fps: number;
}
```

### ResultViewState
```typescript
interface ResultViewState {
    visible: boolean;
    menuStatus: MenuStatus;  // enum: Captures | Information | InitState | EndState | Commands | SourceCode
    searchText: string;
    captures: Array<{ capture: ICapture; active: boolean }>;
    currentCapture: ICapture | null;
    commands: ICommandListItemState[];
    currentCommandIndex: number;
    visualStates: IVisualStateItem[];
    currentVisualStateIndex: number;
    sourceCodeState: ISourceCodeState | null;
    sourceCodeError: string;
    commandCount: number;
    informationLeft: JSONRenderItem[];     // JSON tree for Information tab (left column)
    informationRight: JSONRenderItem[];    // JSON tree for Information tab (right column)
    initStateData: JSONRenderItem[];       // JSON tree for Init State tab
    endStateData: JSONRenderItem[];        // JSON tree for End State tab
    commandDetailData: JSONRenderItem[];   // JSON tree for selected command detail
}
```

### JSONRenderItem (discriminated union)
```typescript
type JSONRenderItem =
    | { type: "group"; title: string; children: JSONRenderItem[] }
    | { type: "item"; key: string; value: string }
    | { type: "image"; key: string; value: string; pixelated: boolean }
    | { type: "help"; key: string; value: string; help: string }
    | { type: "visualState"; visualState: any };
```

The `JSONRenderTree` component recursively renders this union.

### Command linking
Commands and visual states use **array indices** (not IDs) for linked-list
navigation:

```typescript
interface ICommandListItemState {
    capture: ICommandCapture;
    active: boolean;
    visualStateIndex: number;
    previousCommandIndex: number;
    nextCommandIndex: number;
}
```

---

## 4. Styling Rules

Styles are in 3 SCSS files under `src/embeddedFrontend/styles/`:
- `_main.scss` — variables, mixins, checkerboard backgrounds
- `captureMenu.scss` — CaptureMenu layout
- `resultView.scss` — ResultView layout (all tabs)

### Critical: CSS class contract

The SCSS uses class-name and attribute selectors. React components **must**
output the exact same CSS classes and DOM attributes as the SCSS expects:

| Component | Required class | Required attributes |
|-----------|---------------|-------------------|
| CaptureMenuRoot | `.captureMenuComponent`, `.captureMenuLogComponent` | — |
| CanvasList | `.canvasListComponent` | `commandName="onCanvasSelection"` on `<span>` |
| CaptureMenuActions | `.captureMenuActionsComponent` | `commandName="onCaptureRequested"`, `onPauseRequested`, `onPlayRequested`, `onPlayNextFrameRequested` on `<div>` elements |
| FpsCounter | `.fpsCounterComponent` | — |
| ResultViewRoot | `.resultViewComponent` | — |
| ResultViewMenu | `.resultViewMenuComponent` | `commandName` on each tab `<a>` |
| CommandList | `.commandListComponent` | — |
| CommandListItem | `li.drawCall`, `li.active` | status classes: `deprecated`, `unused`, `disabled`, `redundant`, `valid` |
| VisualStateList | `.visualStateListComponent` | — |
| CaptureList | `.captureListComponent` | — |
| SourceCode | `.sourceCodeComponentContainer`, `.sourceCodeComponent`, `.sourceCodeMenuComponent` | `commandName` on tab links and checkboxes |

**The `commandName` attribute** is a custom HTML attribute used by SCSS selectors
like `[commandName=onCaptureRequested]` to style buttons. React passes unknown
attributes through to the DOM. TypeScript accepts it via `jsx-augments.d.ts`.

### CSS transition note

`_main.scss` defines `$transition-time: 0.3s` for hover effects. Visual tests
inject `* { transition: none !important; }` to avoid flakiness.

---

## 5. Ace Editor Integration

The `SourceCode.tsx` component wraps the vendored Ace editor:

- Ace is loaded as a global via `vendors/ace.js` (bundled by webpack with
  `exports-loader`)
- Declared as `declare const ace: { edit(el: Element): any }`
- Editor instance held in `useRef` — **never let React re-mount the editor**
- Content synced imperatively via `editor.setValue()` (only when value changes)
- Cleanup via `editor.destroy()` in `useEffect` return
- Theme: `monokai`, mode: `glsl`
- Error annotations via `editor.getSession().setAnnotations()`
- Beautify/preprocess are pure functions ported from the original codebase
- Change handler has 1500ms debounce before triggering recompilation

**Do NOT use React StrictMode** — Ace editor double-mounts and leaks.

---

## 6. Build & Test

### Build
```bash
npm run build:bundle    # webpack production build → dist/spector.bundle.js
npm run watch           # webpack dev build with watch
npm run start           # dev server + watch
```

Build config: `tools/webpack.config.js`  
TypeScript config: `src/tsconfig.json` (jsx: react-jsx, esModuleInterop: true)

### Visual Tests
```bash
npm run test:visual          # Run all 38 Playwright visual regression tests
npm run test:visual:update   # Regenerate screenshot baselines
```

Test config: `test/playwright.config.ts`  
Test fixtures: `test/fixtures/` (WebGL scene + pre-captured frame JSON)  
Test helpers: `test/helpers/` (spector-fixture.ts, capture-helper.ts)  
Screenshots: `test/screenshots/` (committed to git)

Playwright settings for deterministic rendering:
- Chromium only, SwiftShader for GPU
- `deviceScaleFactor: 1`
- `--disable-lcd-text`, `--font-render-hinting=none`
- CSS stabilization: transitions disabled, Ace cursor hidden

### Test files
| File | Tests | What it covers |
|------|-------|----------------|
| `smoke.spec.ts` | 3 | Canvas renders, Spector UI visible, page baseline |
| `capture-menu.spec.ts` | 10 | All CaptureMenu visual states |
| `result-view.spec.ts` | 13 | Commands tab, all tabs, search, close |
| `source-code.spec.ts` | 5 | Shader editor, tabs, beautify, close |
| `responsive.spec.ts` | 4 | 4 viewport sizes, responsive breakpoint |
| `visual-state-no-stray-text.spec.ts` | 2 | Regression: no stray numeric text nodes |
| `generate-capture.spec.ts` | 1 | Generates the capture fixture |

---

## 7. Common Pitfalls & Gotchas

### React-specific
1. **Falsy number rendering**: `{value && <span>...</span>}` renders `0` as
   visible text if `value` is `0`. Use `{!!value && ...}` or
   `{value != null && ...}`.
2. **commandName attribute**: Must be present on DOM elements for SCSS styling.
   TypeScript needs `jsx-augments.d.ts` to allow it.
3. **ExternalStore immutability**: Always spread (`{ ...prev, field: newVal }`)
   in `setState` updaters. Mutating the previous object won't trigger re-render.
4. **Ace editor lifecycle**: Only create the editor once in `useEffect([], [])`.
   Update content via `editor.setValue()`, not by remounting.

### Architecture-specific
5. **Adapter is the orchestrator**: All complex logic (building command lists,
   JSON trees, handling tab switches) lives in `ReactResultView.ts`, not in the
   React components. Components are presentational only.
6. **className overwrite behavior**: `CommandListItem` sets `className` to
   `"active"` when selected, which **replaces** any existing `"drawCall"` class.
   This is intentional legacy behavior — do not "fix" it.
7. **DOM structure matters**: SCSS uses descendant selectors like
   `.canvasListComponent ul li`. Don't add wrapper `<div>`s that break nesting.
8. **Search filter**: Only applies when `searchText.length > 2`. Filters on
   command name, marker, and LOG text.

### Backend (do not touch)
9. The `src/backend/` and `src/shared/` directories contain the WebGL
   interception engine. They are **not** part of the React migration and should
   not be modified unless fixing a capture bug.

---

## 8. How to Add a New Feature

### Adding a new tab to ResultView
1. Add a new `MenuStatus` enum value in `types.ts`
2. Add the tab button in `ResultViewMenu.tsx`
3. Add the content branch in `ResultViewRoot.tsx` (match the `{state.menuStatus === MenuStatus.X && (...)}` pattern)
4. Add any new state fields to `ResultViewState` in `types.ts`
5. Add the state initialization in `ReactResultView.ts` `EMPTY_STATE`
6. Add the data-building method in `ReactResultView.ts`
7. Add a visual test in `test/visual/`

### Adding a new CaptureMenu control
1. Add state field to `CaptureMenuState` in `types.ts`
2. Create the component in `react/CaptureMenu/`
3. Add it to `CaptureMenuRoot.tsx`
4. Add handler method to `ReactCaptureMenu.ts`
5. If it needs an Observable, add it to the adapter's public interface
6. Add a visual test

### Adding a new JSON display type
1. Add a new variant to the `JSONRenderItem` union in `types.ts`
2. Create a component in `react/ResultView/JSON/`
3. Add the rendering case to `JSONRenderTree.tsx`
4. Update `buildJSON()` in `ReactResultView.ts` to produce the new item type

---

## 9. File Quick Reference

| What | Where |
|------|-------|
| Entry point | `src/spector.ts` |
| Frontend adapter (CaptureMenu) | `src/embeddedFrontend/react/CaptureMenu/ReactCaptureMenu.ts` |
| Frontend adapter (ResultView) | `src/embeddedFrontend/react/ResultView/ReactResultView.ts` |
| All shared types | `src/embeddedFrontend/react/shared/types.ts` |
| State management | `src/embeddedFrontend/react/shared/ExternalStore.ts` |
| Styles | `src/embeddedFrontend/styles/` |
| Build config | `tools/webpack.config.js` |
| TS config | `src/tsconfig.json` |
| Test config | `test/playwright.config.ts` |
| Test fixtures | `test/fixtures/` |
| Screenshot baselines | `test/screenshots/` |
| Ace editor vendor | `vendors/ace.js` |
