# Implementation Plan: Full OffscreenCanvas Support for Spector.js

## Problem Statement

Spector.js is a WebGL debugging tool that captures and inspects WebGL frames. It currently supports `HTMLCanvasElement` and has **partial** support for `OffscreenCanvas` on the main thread, but **completely fails** when WebGL runs inside a Web Worker via `canvas.transferControlToOffscreen()`.

Two scenarios must be supported:

1. **Main-thread OffscreenCanvas** — `new OffscreenCanvas(w, h)` used directly on the main thread. The existing code *almost* works but crashes when the visual state capture code calls `document.createElement("canvas")` and `.toDataURL()`, which don't exist on OffscreenCanvas contexts.

2. **Worker-transferred OffscreenCanvas** — `canvas.transferControlToOffscreen()` transfers canvas control to a Web Worker. This is increasingly common in production (Three.js, Babylon.js, Google Maps). Spector's entire backend must run inside the Worker (where the GL context lives), but results must be communicated back to the main thread for display.

### Why This Matters

Worker-based rendering is a growing pattern for performance-critical WebGL applications. Without this support, Spector.js cannot debug an increasingly large class of real-world applications. The extension becomes useless on these pages.

---

## Current State Analysis

### What ALREADY works for OffscreenCanvas

| Component | File | Status | Notes |
|-----------|------|--------|-------|
| CanvasSpy | `src/backend/spies/canvasSpy.ts` | ✅ Ready | Hooks both `HTMLCanvasElement.prototype.getContext()` and `OffscreenCanvas.prototype.getContext()` |
| All Recorders | `src/backend/recorders/` | ✅ Ready | Pure WebGL calls, zero DOM dependencies |
| WebGL State queries | `src/backend/states/information/` | ✅ Ready | Pure GL parameter queries |
| Spector public API | `src/spector.ts` | ✅ Ready | Already accepts `OffscreenCanvas` in type signatures |
| Extension detection | `extensions/contentScript.js` | ✅ Partial | Detects OffscreenCanvas.getContext() calls, tracks them in `__SPECTOR_Canvases` |
| Context commands | `src/backend/spies/commandSpy.ts` | ✅ Ready | Operates on GL context, not DOM |

### What BREAKS — Critical Blockers

| # | Component | File:Line | Problem | Severity |
|---|-----------|-----------|---------|----------|
| 1 | **Time** | `src/shared/utils/time.ts:8` | `window.performance` — `window` doesn't exist in Workers | 🔴 Crash |
| 2 | **TimeSpy** | `src/backend/spies/timeSpy.ts:38` | `spiedScope \|\| window` — `window` doesn't exist in Workers | 🔴 Crash |
| 3 | **TimeSpy** | `src/backend/spies/timeSpy.ts:102-106` | `this.spiedScope["VRDisplay"]` + `.addEventListener()` — not in Workers | 🟡 Crash on init |
| 4 | **VisualState** | `src/backend/states/context/visualState.ts:29-32` | `document.createElement("canvas")` — `document` doesn't exist in Workers | 🔴 Crash |
| 5 | **VisualState** | `src/backend/states/context/visualState.ts:302` | `.toDataURL()` — not available on `OffscreenCanvas` | 🔴 Crash |
| 6 | **DrawCallTextureInputState** | `src/backend/states/drawCalls/drawCallTextureInputState.ts:31-34` | `document.createElement("canvas")` — same as VisualState | 🔴 Crash |
| 7 | **DrawCallTextureInputState** | `src/backend/states/drawCalls/drawCallTextureInputState.ts:204` | `.toDataURL()` — same as VisualState | 🔴 Crash |
| 8 | **ContextSpy** | `src/backend/spies/contextSpy.ts:269` | `navigator.userAgent` — exists in Workers but should guard | 🟢 Safe (already guarded) |
| 9 | **Extension comms** | `extensions/contentScript.js:96` | `document.dispatchEvent()` — not available in Workers | 🔴 No Worker comm |
| 10 | **No Worker injection** | N/A | No mechanism to inject Spector into Worker scripts | 🔴 Missing feature |

---

## Proposed Approach

### Architecture

The solution is layered into 7 phases, from foundation fixes through full extension integration:

```
┌─────────────────────────────────────────────────────────────────┐
│                        MAIN THREAD                               │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐                  │
│  │ Extension │  │ Spector  │  │  WorkerSpy    │                  │
│  │ content   │◄─┤ (UI +   │  │ (intercepts   │                  │
│  │ scripts   │  │  core)   │  │  new Worker)  │                  │
│  └──────────┘  └────┬─────┘  └───────┬───────┘                  │
│                     │                │                            │
│              ┌──────┴────────────────┴──────┐                    │
│              │       WorkerBridge(s)         │                    │
│              │  (one per monitored Worker)   │                    │
│              └──────────────┬───────────────┘                    │
│                             │ postMessage()                       │
├─────────────────────────────┼───────────────────────────────────┤
│                        WEB WORKER                                │
│                             │                                    │
│              ┌──────────────┴───────────────┐                    │
│              │    WorkerMessageSender        │                    │
│              └──────────────┬───────────────┘                    │
│                             │                                    │
│              ┌──────────────┴───────────────┐                    │
│              │       WorkerSpector           │                    │
│              │  (headless Spector instance)  │                    │
│              │  ├── CanvasSpy               │                    │
│              │  ├── ContextSpy              │                    │
│              │  ├── TimeSpy (Worker-adapted)│                    │
│              │  ├── Recorders (unchanged)   │                    │
│              │  └── States (DOM-free)       │                    │
│              └──────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **CanvasFactory abstraction** — Single point of change for canvas creation. Detects environment (DOM available vs Worker) and returns appropriate canvas type. This keeps VisualState and DrawCallTextureInputState changes minimal.

2. **WorkerSpector is a headless Spector** — It reuses the same spies, recorders, and states (after DOM fixes), but strips out all UI components. It communicates exclusively via postMessage.

3. **One WorkerBridge per Worker** — The main-thread Spector holds a collection of WorkerBridge instances, one for each monitored Worker. This allows capturing from multiple Workers simultaneously.

4. **Auto-inject via Worker constructor interception** — The WorkerSpy patches `globalThis.Worker` to wrap the script URL with a blob that imports Spector's worker bundle alongside the original script. This is the same pattern used by other devtools (e.g., PixiJS devtools, Three.js inspector).

5. **Manual API as primary, auto-inject as convenience** — Developers can explicitly call `spector.spyWorker(myWorker)` for full control, or `spector.spyWorkers()` for automatic interception. The manual API is more reliable and debuggable.

6. **Synchronous toDataURL replacement** — `OffscreenCanvas.convertToBlob()` is async. For VisualState/DrawCallTextureInputState, we convert pixels to data URL synchronously using `ImageData` → manual base64 encoding of raw pixel data, avoiding the async `convertToBlob()` path entirely. This preserves the synchronous capture pipeline.

---

## Task Breakdown

### Phase 1: Foundation — Remove DOM Dependencies (4 tasks, parallelizable)

These tasks make the core capture pipeline work in environments without DOM access. They are the prerequisite for everything else.

---

#### Task `p1-canvas-factory`: Create CanvasFactory Abstraction

**File:** `src/backend/utils/canvasFactory.ts` (NEW)

**Description:** Create a utility that abstracts canvas creation and data URL conversion, working in both DOM and Worker environments.

**Implementation Details:**
```typescript
export class CanvasFactory {
    // Returns HTMLCanvasElement if DOM available, OffscreenCanvas otherwise
    static createCanvas(width?: number, height?: number): HTMLCanvasElement | OffscreenCanvas;
    
    // Gets 2D rendering context (works for both canvas types)
    static getContext2D(canvas: HTMLCanvasElement | OffscreenCanvas): 
        CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    
    // Converts canvas to data URL synchronously
    // HTMLCanvasElement: uses native toDataURL()
    // OffscreenCanvas: reads pixels via getImageData(), manually encodes to base64 PNG
    static toDataURL(canvas: HTMLCanvasElement | OffscreenCanvas, 
                     context2D?: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D): string;
    
    // Environment detection
    static get isDOMAvailable(): boolean;
}
```

**Key consideration for `toDataURL` on OffscreenCanvas:** Since `OffscreenCanvas` doesn't have `toDataURL()`, and `convertToBlob()` is async (unacceptable for the synchronous capture pipeline), we must:
1. Read pixel data via `context2D.getImageData()`
2. Encode to a BMP or uncompressed PNG data URI synchronously using manual byte construction
3. This produces larger data URIs than PNG but avoids async complexity

**Alternative (preferred if performance allows):** Use a synchronous pixel-to-base64 conversion helper that builds a minimal BMP data URI from raw RGBA pixels. BMP format is trivially simple to construct synchronously.

**Acceptance Criteria:**
- [ ] `createCanvas()` returns `OffscreenCanvas` when `typeof document === 'undefined'`
- [ ] `createCanvas()` returns `HTMLCanvasElement` when DOM is available
- [ ] `toDataURL()` returns valid `data:image/...;base64,...` string for both canvas types
- [ ] 2D context operations (createImageData, putImageData, drawImage, scale, translate) work on returned canvas
- [ ] No references to `document` or `window` anywhere in the file
- [ ] Existing capture quality is not degraded for HTMLCanvasElement path

**Dependencies:** None (root task)

---

#### Task `p1-fix-time`: Fix Time Class for Worker Scope

**File:** `src/shared/utils/time.ts` (MODIFY)

**Current code (broken in Workers):**
```typescript
constructor() {
    if (window.performance && window.performance.now) {  // 🔴 window undefined in Worker
        this.nowFunction = this.dateBasedPerformanceNow.bind(this);
    }
}
private dateBasedPerformanceNow(): number {
    return performance.timing.navigationStart + performance.now();  // 🔴 timing undefined in Worker
}
```

**Fix:**
```typescript
constructor() {
    if (typeof performance !== 'undefined' && performance.now) {
        if (typeof performance.timing !== 'undefined' && performance.timing.navigationStart) {
            this.nowFunction = this.dateBasedPerformanceNow.bind(this);
        } else {
            // Workers: performance.now() exists but performance.timing does not
            this.nowFunction = () => performance.now();
        }
    } else {
        const date = new Date();
        this.nowFunction = date.getTime.bind(date);
    }
}
```

**Acceptance Criteria:**
- [ ] `Time.now` returns a number in both main thread and Worker contexts
- [ ] No reference to `window` in the file
- [ ] `performance.timing` absence is handled gracefully
- [ ] Existing main-thread behavior unchanged (same time base)

**Dependencies:** None

---

#### Task `p1-fix-timeSpy`: Fix TimeSpy for Worker Scope

**File:** `src/backend/spies/timeSpy.ts` (MODIFY)

**Changes:**
1. **Line 38:** `this.spiedScope = spiedScope || window;` → `this.spiedScope = spiedScope || (typeof globalThis !== 'undefined' ? globalThis : self);`
2. **Lines 102-106:** Guard `VRDisplay` check:
   ```typescript
   if (this.spiedScope["VRDisplay"] && typeof this.spiedScope.addEventListener === 'function') {
       this.spiedScope.addEventListener("vrdisplaypresentchange", ...);
   }
   ```
3. No other changes needed — Workers have `setTimeout`/`setInterval` on `self`, so the existing `spySetTimer()` works for Worker frame loops.

**Acceptance Criteria:**
- [ ] TimeSpy can be constructed without `window` in scope
- [ ] Default `spiedScope` resolves to `globalThis` or `self` 
- [ ] `setTimeout`/`setInterval` spying works in Worker-like scope
- [ ] VRDisplay code path doesn't crash when VRDisplay/addEventListener unavailable
- [ ] Existing main-thread behavior unchanged

**Dependencies:** None

---

#### Task `p1-fix-visualState`: Fix VisualState DOM Dependencies

**File:** `src/backend/states/context/visualState.ts` (MODIFY)

**Changes:**
1. **Lines 21-24:** Change member types to union types:
   ```typescript
   private readonly workingCanvas: HTMLCanvasElement | OffscreenCanvas;
   private readonly captureCanvas: HTMLCanvasElement | OffscreenCanvas;
   private readonly workingContext2D: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
   private readonly captureContext2D: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
   ```
2. **Lines 29-32:** Replace `document.createElement("canvas")` with `CanvasFactory.createCanvas()`:
   ```typescript
   this.workingCanvas = CanvasFactory.createCanvas();
   this.workingContext2D = CanvasFactory.getContext2D(this.workingCanvas);
   this.captureCanvas = CanvasFactory.createCanvas();
   this.captureContext2D = CanvasFactory.getContext2D(this.captureCanvas);
   ```
3. **Line 302:** Replace `.toDataURL()` with `CanvasFactory.toDataURL(this.captureCanvas, this.captureContext2D)`
4. **Lines 33-37:** Keep image smoothing settings but cast context appropriately (OffscreenCanvasRenderingContext2D supports `imageSmoothingEnabled` natively).

**Acceptance Criteria:**
- [ ] VisualState constructs without error in both DOM and Worker environments
- [ ] Visual state capture produces valid base64 image data URIs in both environments
- [ ] Pixel readback → 2D canvas → resize → data URL pipeline works end-to-end
- [ ] Y-flip via scale/translate still works correctly
- [ ] No references to `document` in the file
- [ ] Existing main-thread capture quality preserved

**Dependencies:** `p1-canvas-factory`

---

#### Task `p1-fix-drawCallTexture`: Fix DrawCallTextureInputState DOM Dependencies

**File:** `src/backend/states/drawCalls/drawCallTextureInputState.ts` (MODIFY)

**Changes:** Identical pattern to VisualState:
1. **Lines 21-24:** Update member types to union types
2. **Lines 31-34:** Replace `document.createElement("canvas")` with `CanvasFactory.createCanvas()`
3. **Line 204:** Replace `.toDataURL()` with `CanvasFactory.toDataURL()`

**Acceptance Criteria:**
- [ ] DrawCallTextureInputState constructs without error in Worker environments
- [ ] Texture visual capture produces valid base64 data URIs
- [ ] Cubemap, 3D texture, 2D array texture captures work
- [ ] No references to `document` in the file

**Dependencies:** `p1-canvas-factory`

---

#### Task `p1-fix-contextSpy`: Guard ContextSpy Navigator Access

**File:** `src/backend/spies/contextSpy.ts` (MODIFY)

**Changes:**
- **Line 269:** Already has `navigator ?` guard. Change to be more explicit:
  ```typescript
  browserAgent: typeof navigator !== 'undefined' ? navigator.userAgent : "",
  ```
- **Lines 137-138:** Already have `|| this.context.canvas.width` fallback. No change needed but add a comment explaining this is the Worker path.

**Acceptance Criteria:**
- [ ] ContextSpy initializes without error in Worker environments
- [ ] `clientWidth`/`clientHeight` fallback to canvas dimensions when HTMLCanvasElement properties unavailable
- [ ] Browser agent is empty string in Worker (acceptable behavior)

**Dependencies:** None

---

### Phase 2: Main-Thread OffscreenCanvas Validation (3 tasks)

These tasks validate that Scenario 1 works end-to-end after Phase 1 fixes.

---

#### Task `p2-tsconfig-worker`: Add Worker Types to tsconfig

**File:** `src/tsconfig.json` (MODIFY)

**Change:** Add explicit `lib` array:
```json
{
  "compilerOptions": {
    "lib": ["ES2015", "DOM", "DOM.Iterable", "WebWorker"],
    ...
  }
}
```

This gives TypeScript knowledge of `OffscreenCanvas`, `OffscreenCanvasRenderingContext2D`, `DedicatedWorkerGlobalScope`, `self` in Worker scope, and `globalThis`.

**Acceptance Criteria:**
- [ ] TypeScript compiles without errors after adding lib types
- [ ] `OffscreenCanvas` type is recognized without `any` casts
- [ ] No new type conflicts between DOM and WebWorker lib types
- [ ] Build (`npm run build`) succeeds

**Dependencies:** `p1-canvas-factory`

---

#### Task `p2-sample-offscreen`: Create Main-Thread OffscreenCanvas Sample

**Files:**
- `sample/offscreen.html` (NEW)
- `sample/js/offscreen.js` (NEW)

**Description:** A sample page that creates an `OffscreenCanvas` on the main thread, gets a WebGL2 context, renders a rotating colored triangle, and wires up Spector for capture.

**offscreen.html structure:**
```html
<h1>Spector.js - Main-Thread OffscreenCanvas Test</h1>
<canvas id="display" width="640" height="480"></canvas>
<button id="capture">Capture Frame</button>
<script src="../dist/spector.bundle.js"></script>
<script src="js/offscreen.js"></script>
```

**offscreen.js behavior:**
1. Create `new OffscreenCanvas(640, 480)` 
2. Get WebGL2 context, set up simple shader program, draw rotating triangle via rAF
3. Blit OffscreenCanvas to visible canvas each frame (so user sees output)
4. Create `new SPECTOR.Spector()`, call `spector.spyCanvases()`
5. Button click triggers `spector.captureCanvas(offscreenCanvas)`
6. `spector.onCapture.add(capture => console.log(capture))`

**Acceptance Criteria:**
- [ ] Page loads without console errors
- [ ] Rotating triangle renders on visible canvas
- [ ] Clicking "Capture" triggers Spector capture
- [ ] Capture data contains WebGL commands
- [ ] Capture data contains visual state with non-null `src` (base64 image)
- [ ] Capture data `canvas` dimensions match OffscreenCanvas dimensions

**Dependencies:** All Phase 1 tasks + `p2-tsconfig-worker`

---

#### Task `p2-verify-mainthread`: Verify Main-Thread OffscreenCanvas Capture

**Type:** Manual verification (Tester task)

**Steps:**
1. Run `npm run build`
2. Serve sample/ directory via HTTP server
3. Open sample/offscreen.html in Chrome
4. Verify triangle renders
5. Click Capture, verify capture JSON in console
6. Verify visual state thumbnails are valid images (paste base64 into browser)
7. Verify command list includes draw calls
8. Test in Firefox and Edge

**Acceptance Criteria:**
- [ ] Build succeeds without errors or new warnings
- [ ] Sample renders correctly in Chrome, Firefox, Edge
- [ ] Capture produces valid ICapture data with commands
- [ ] Visual state thumbnails are valid base64 images showing the rendered scene
- [ ] No regressions in existing HTMLCanvasElement sample (sample/index.html)

**Dependencies:** `p2-sample-offscreen`

---

### Phase 3: Worker Communication Bridge (4 tasks)

These tasks create the bidirectional communication layer between Workers and the main thread.

---

#### Task `p3-message-protocol`: Define Worker↔Main Message Protocol

**File:** `src/backend/bridge/messageProtocol.ts` (NEW)

**Description:** TypeScript interfaces and constants for all messages exchanged between Worker-hosted Spector and main thread.

```typescript
// Message direction: Main → Worker
export const enum MainToWorkerMessageType {
    TriggerCapture = 'spector:trigger-capture',
    Pause = 'spector:pause',
    Play = 'spector:play',
    PlayNextFrame = 'spector:play-next-frame',
    SetMarker = 'spector:set-marker',
    ClearMarker = 'spector:clear-marker',
    RequestCanvasList = 'spector:request-canvas-list',
}

// Message direction: Worker → Main  
export const enum WorkerToMainMessageType {
    CaptureComplete = 'spector:capture-complete',
    CaptureStarted = 'spector:capture-started',
    Error = 'spector:error',
    FPS = 'spector:fps',
    CanvasList = 'spector:canvas-list',
    ContextReady = 'spector:context-ready',
}

export interface SpectorMessage<T = any> {
    type: MainToWorkerMessageType | WorkerToMainMessageType;
    payload: T;
}

// Typed payload interfaces for each message type
export interface TriggerCapturePayload {
    canvasIndex: number;
    commandCount: number;
    quickCapture: boolean;
    fullCapture: boolean;
}

export interface CaptureCompletePayload {
    capture: ICapture;  // The full capture data (serializable)
}

export interface CanvasListPayload {
    canvases: Array<{ id: string; width: number; height: number; index: number }>;
}

// ... (additional payload types)

// Type guard helpers
export function isSpectorMessage(data: any): data is SpectorMessage { ... }
```

**Key constraint:** All payload data must survive `postMessage()` structured cloning. `ICapture` already uses plain objects, arrays, and strings — it's already serializable. Visual state base64 strings survive structured clone.

**Acceptance Criteria:**
- [ ] All message types are defined with TypeScript interfaces
- [ ] Type guards work for message discrimination
- [ ] All payload types are structured-clone compatible (no functions, DOM nodes, etc.)
- [ ] Message type strings are namespaced with `spector:` prefix to avoid collisions

**Dependencies:** `p1-canvas-factory` (imports shared types)

---

#### Task `p3-worker-sender`: Create Worker-Side Message Sender

**File:** `src/backend/bridge/workerMessageSender.ts` (NEW)

**Description:** Runs INSIDE the Worker. Sends Spector results to the main thread via `self.postMessage()`. Receives commands from main thread via `self.onmessage`.

```typescript
export class WorkerMessageSender {
    constructor() {
        // Listen for incoming commands from main thread
        self.addEventListener('message', this.handleMessage.bind(this));
    }

    // Observables for received commands
    readonly onTriggerCapture: Observable<TriggerCapturePayload>;
    readonly onPause: Observable<void>;
    readonly onPlay: Observable<void>;
    readonly onPlayNextFrame: Observable<void>;
    
    // Send methods
    sendCapture(capture: ICapture): void {
        self.postMessage({ type: WorkerToMainMessageType.CaptureComplete, payload: { capture } });
    }
    sendError(error: string): void { ... }
    sendFps(fps: number): void { ... }
    sendCanvasList(canvases: CanvasListPayload): void { ... }
    sendContextReady(): void { ... }
    
    private handleMessage(event: MessageEvent): void {
        if (!isSpectorMessage(event.data)) return;
        // Dispatch to appropriate observable based on message type
    }
}
```

**Acceptance Criteria:**
- [ ] `sendCapture()` calls `self.postMessage()` with correct message shape
- [ ] Incoming messages from main thread are correctly parsed and dispatched
- [ ] Non-Spector messages are ignored (doesn't interfere with app's own Worker messages)
- [ ] No DOM references anywhere

**Dependencies:** `p3-message-protocol`

---

#### Task `p3-worker-bridge`: Create Main-Thread Worker Bridge

**File:** `src/backend/bridge/workerBridge.ts` (NEW)

**Description:** Runs on MAIN THREAD. One instance per monitored Worker. Wraps `Worker.postMessage()` for commands, listens to `Worker.onmessage` for results.

```typescript
export class WorkerBridge {
    readonly onCapture: Observable<ICapture>;
    readonly onError: Observable<string>;
    readonly onFps: Observable<number>;
    readonly onCanvasList: Observable<CanvasListPayload>;
    readonly onContextReady: Observable<void>;
    
    constructor(private readonly worker: Worker) {
        // Intercept worker.onmessage without breaking existing handlers
        // Use addEventListener to avoid overwriting app's onmessage
        this.worker.addEventListener('message', this.handleMessage.bind(this));
    }
    
    // Command methods
    triggerCapture(payload: TriggerCapturePayload): void {
        this.worker.postMessage({ type: MainToWorkerMessageType.TriggerCapture, payload });
    }
    pause(): void { ... }
    play(): void { ... }
    playNextFrame(): void { ... }
    requestCanvasList(): void { ... }
    
    dispose(): void {
        this.worker.removeEventListener('message', this.handleMessage);
    }
    
    private handleMessage(event: MessageEvent): void {
        if (!isSpectorMessage(event.data)) return;
        // Route to appropriate observable
    }
}
```

**Critical design note:** We use `addEventListener` (not setting `onmessage`) so we don't break the application's own Worker communication. Spector messages are distinguished by the `spector:` prefix in the type field.

**Acceptance Criteria:**
- [ ] WorkerBridge sends typed commands via `worker.postMessage()`
- [ ] WorkerBridge receives and dispatches typed results
- [ ] Non-Spector messages pass through unaffected
- [ ] Multiple WorkerBridge instances can coexist (one per Worker)
- [ ] `dispose()` cleanly removes listener

**Dependencies:** `p3-message-protocol`

---

#### Task `p3-worker-spector`: Create WorkerSpector Entry Point

**File:** `src/backend/bridge/workerSpector.ts` (NEW)

**Description:** A headless Spector instance designed to run inside Workers. Reuses CanvasSpy, ContextSpy, TimeSpy (with Worker-adapted scope), Recorders, and States, but has no UI components. Communicates via WorkerMessageSender.

```typescript
export class WorkerSpector {
    private readonly timeSpy: TimeSpy;
    private readonly messageSender: WorkerMessageSender;
    private readonly contexts: ContextSpy[];
    private canvasSpy: CanvasSpy;
    
    constructor() {
        // TimeSpy with Worker's global scope (self)
        this.timeSpy = new TimeSpy(self);
        this.messageSender = new WorkerMessageSender();
        this.contexts = [];
        
        // Wire up frame events
        this.timeSpy.onFrameStart.add(this.onFrameStart, this);
        this.timeSpy.onFrameEnd.add(this.onFrameEnd, this);
        
        // Wire up incoming commands from main thread
        this.messageSender.onTriggerCapture.add(this.handleCapture, this);
        this.messageSender.onPause.add(() => this.timeSpy.changeSpeedRatio(0));
        this.messageSender.onPlay.add(() => this.timeSpy.changeSpeedRatio(1));
        this.messageSender.onPlayNextFrame.add(() => this.timeSpy.playNextFrame());
        
        // Auto-spy canvases in Worker scope
        this.spyCanvases();
        
        // Periodically send FPS
        setInterval(() => this.messageSender.sendFps(this.timeSpy.getFps()), 1500);
    }
    
    spyCanvases(): void { ... }
    
    private handleCapture(payload: TriggerCapturePayload): void {
        // Trigger capture on specified canvas
        // On completion, send result via messageSender
    }
    
    private onFrameStart(): void { ... }  // Same logic as Spector.onFrameStart
    private onFrameEnd(): void { ... }    // Capture → messageSender.sendCapture()
}
```

**Key differences from main Spector class:**
- No `CaptureMenu`, `ResultView`, or any UI
- No `displayUI()`, `getCaptureUI()`, `getResultUI()`
- Uses `WorkerMessageSender` instead of observables for output
- Constructor takes `self` as spied scope for TimeSpy
- Uses `setInterval` for FPS reporting (no DOM-based intervals)

**Acceptance Criteria:**
- [ ] WorkerSpector constructs without error inside a Worker
- [ ] Spy/capture lifecycle works: spy → capture request → frame capture → send result
- [ ] FPS reporting works via setInterval + postMessage
- [ ] Pause/play/playNextFrame commands work
- [ ] No references to `window`, `document`, or any DOM API
- [ ] Reuses existing CanvasSpy, ContextSpy, StateSpy, RecorderSpy classes

**Dependencies:** `p3-worker-sender`, `p1-fix-time`, `p1-fix-timeSpy`, `p1-fix-visualState`, `p1-fix-drawCallTexture`

---

### Phase 4: Worker Injection & Public API (4 tasks)

These tasks enable injecting Spector into Workers and expose the API to users.

---

#### Task `p4-worker-spy`: Create WorkerSpy for Auto-Injection

**File:** `src/backend/spies/workerSpy.ts` (NEW)

**Description:** Runs on MAIN THREAD. Intercepts the `Worker` constructor to inject Spector's worker bundle into every new Worker.

**Injection Strategy:**
```typescript
export class WorkerSpy {
    readonly onWorkerCreated: Observable<{ worker: Worker, bridge: WorkerBridge }>;
    
    constructor(private readonly workerBundleUrl: string) {
        this.patchWorkerConstructor();
    }
    
    private patchWorkerConstructor(): void {
        const OriginalWorker = globalThis.Worker;
        const self = this;
        
        globalThis.Worker = function(scriptURL: string | URL, options?: WorkerOptions) {
            // Create a wrapper script that imports both Spector and the original script
            const wrapperCode = `
                importScripts('${self.workerBundleUrl}');
                importScripts('${scriptURL}');
            `;
            const blob = new Blob([wrapperCode], { type: 'application/javascript' });
            const blobURL = URL.createObjectURL(blob);
            
            const worker = new OriginalWorker(blobURL, options);
            URL.revokeObjectURL(blobURL);
            
            const bridge = new WorkerBridge(worker);
            self.onWorkerCreated.trigger({ worker, bridge });
            
            return worker;
        } as any;
    }
    
    restore(): void { /* Restore original Worker constructor */ }
}
```

**Edge cases to handle:**
- **Module workers** (`{ type: 'module' }`): Use `import()` instead of `importScripts()`
- **Blob URL workers**: Fetch blob content, prepend Spector import
- **Relative URLs**: Resolve against page origin
- **Workers that don't use WebGL**: Spector bundle is inert (no canvas = no spying = no overhead)

**Acceptance Criteria:**
- [ ] `new Worker('script.js')` creates a Worker with Spector injected
- [ ] Original Worker script still executes correctly
- [ ] WorkerBridge is created and wired up for each new Worker
- [ ] `restore()` returns Worker constructor to original
- [ ] Workers that don't call getContext() incur minimal overhead
- [ ] Handles relative and absolute script URLs

**Dependencies:** `p3-worker-bridge`, `p3-worker-spector`

---

#### Task `p4-worker-entry`: Create Worker Bundle Entry Point

**File:** `src/workerSpector.ts` (NEW)

**Description:** Webpack entry point that produces `spector.worker.bundle.js` — a self-contained, auto-initializing script for Workers.

```typescript
// src/workerSpector.ts
import { WorkerSpector } from "./backend/bridge/workerSpector";

// Auto-initialize when loaded in a Worker
if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
    (self as any).__SPECTOR_WorkerSpector = new WorkerSpector();
}

export { WorkerSpector };
```

**Key constraint:** This bundle must NOT include:
- `CaptureMenu`, `ResultView` (UI components)
- `document`, `window` references
- Ace editor vendor code
- CSS/SCSS styles

**Acceptance Criteria:**
- [ ] Bundle produces functional JavaScript loadable via `importScripts()`
- [ ] Auto-initializes WorkerSpector when loaded in a Worker context
- [ ] Does NOT auto-initialize when loaded in main thread (guard check)
- [ ] Bundle size is reasonable (no UI code included)

**Dependencies:** `p3-worker-spector`

---

#### Task `p4-webpack-worker`: Add Worker Bundle to Webpack Config

**File:** `tools/webpack.config.js` (MODIFY)

**Changes:**
- Add a second webpack configuration for the worker bundle
- Entry: `./src/workerSpector.ts`
- Output: `dist/spector.worker.bundle.js` (prod) / `.temp/spector.worker.bundle.js` (dev)
- Library: UMD with name `SPECTOR_WORKER`
- Target: `webworker` (tells webpack to use Worker-compatible globals)
- Loaders: `ts-loader` only (no CSS/SCSS loaders needed)
- No Ace editor vendor entry

**Also update `package.json` build scripts:**
- `build:bundle` should build both main and worker bundles
- Add `build:copy:worker-bundle` to copy worker bundle to extensions/
- Add `build:concatWorkerBundleFunc` to create `.func.js` wrapper for extension injection

**Acceptance Criteria:**
- [ ] `npm run build` produces both `spector.bundle.js` and `spector.worker.bundle.js`
- [ ] Worker bundle is significantly smaller than main bundle (no UI)
- [ ] Worker bundle loads correctly via `importScripts()`
- [ ] Worker bundle copied to extensions/ directory

**Dependencies:** `p4-worker-entry`

---

#### Task `p4-manual-api`: Add Worker API to Spector Class

**File:** `src/spector.ts` (MODIFY)

**New public methods:**
```typescript
export class Spector {
    // Existing members...
    private readonly workerBridges: Map<Worker, WorkerBridge>;
    private workerSpy: WorkerSpy;
    
    /**
     * Manually spy on a specific Worker that uses OffscreenCanvas.
     * The Worker must already have the Spector worker bundle loaded.
     */
    public spyWorker(worker: Worker): WorkerBridge {
        const bridge = new WorkerBridge(worker);
        this.workerBridges.set(worker, bridge);
        bridge.onCapture.add(this.onCapture.trigger.bind(this.onCapture));
        bridge.onError.add(this.onError.trigger.bind(this.onError));
        return bridge;
    }
    
    /**
     * Automatically intercept all new Workers and inject Spector.
     * @param workerBundleUrl URL to spector.worker.bundle.js
     */
    public spyWorkers(workerBundleUrl?: string): void {
        this.workerSpy = new WorkerSpy(workerBundleUrl || 'spector.worker.bundle.js');
        this.workerSpy.onWorkerCreated.add(({ worker, bridge }) => {
            this.workerBridges.set(worker, bridge);
            bridge.onCapture.add(this.onCapture.trigger.bind(this.onCapture));
            bridge.onError.add(this.onError.trigger.bind(this.onError));
        });
    }
    
    /**
     * Get all contexts including Worker-hosted ones.
     */
    public getAvailableContexts(): IAvailableContext[] {
        return [...this.contexts];
    }
    
    /**
     * Trigger capture on a Worker-hosted canvas.
     */
    public captureWorker(worker: Worker, options?: TriggerCapturePayload): void {
        const bridge = this.workerBridges.get(worker);
        if (bridge) {
            bridge.triggerCapture(options || { canvasIndex: 0, commandCount: 0, quickCapture: false, fullCapture: false });
        }
    }
}
```

**Acceptance Criteria:**
- [ ] `spyWorker(worker)` creates bridge and wires capture events
- [ ] `spyWorkers()` auto-intercepts new Workers
- [ ] Captures from Workers trigger the same `onCapture` observable as main-thread captures
- [ ] `captureWorker()` sends capture command to specific Worker
- [ ] Existing API methods still work unchanged
- [ ] Worker bridges are tracked and can be enumerated

**Dependencies:** `p3-worker-bridge`, `p4-worker-spy`

---

### Phase 5: Extension Updates (3 tasks)

These tasks make the browser extension aware of Worker-based canvases.

---

#### Task `p5-extension-worker-intercept`: Extension Worker Constructor Interception

**File:** `extensions/contentScript.js` (MODIFY)

**Changes:**
Add a new IIFE block that intercepts the `Worker` constructor when Spector is loaded:

```javascript
(function() {
    if (typeof Worker === 'undefined') return;
    
    var OriginalWorker = Worker;
    window.__SPECTOR_Workers = [];
    
    Worker = function(scriptURL, options) {
        // Create wrapper that imports Spector worker bundle first
        var spectorUrl = /* URL to spector.worker.bundle.func.js */;
        var wrapper = 'importScripts("' + spectorUrl + '");\nimportScripts("' + scriptURL + '");';
        var blob = new Blob([wrapper], { type: 'application/javascript' });
        var blobUrl = URL.createObjectURL(blob);
        
        var worker = new OriginalWorker(blobUrl, options);
        URL.revokeObjectURL(blobUrl);
        
        // Listen for Spector messages from Worker
        worker.addEventListener('message', function(e) {
            if (e.data && e.data.type && e.data.type.indexOf('spector:') === 0) {
                // Forward to extension via CustomEvent
                var myEvent = new CustomEvent("SpectorWorkerEvent", { detail: e.data });
                document.dispatchEvent(myEvent);
            }
        });
        
        window.__SPECTOR_Workers.push(worker);
        return worker;
    };
    Worker.prototype = OriginalWorker.prototype;
})();
```

**Acceptance Criteria:**
- [ ] New Workers on instrumented pages have Spector worker bundle injected
- [ ] Worker messages with `spector:` prefix are forwarded to extension
- [ ] Non-Spector Worker messages pass through unaffected
- [ ] Workers are tracked in `__SPECTOR_Workers` array
- [ ] Works with the existing `captureOffScreen` mode

**Dependencies:** `p4-worker-spy`, `p4-webpack-worker`

---

#### Task `p5-extension-worker-bridge`: Extension Worker Message Relay

**File:** `extensions/contentScriptProxy.js` (MODIFY)

**Changes:**
1. Listen for `SpectorWorkerEvent` CustomEvents from contentScript.js
2. Handle Worker canvas discovery — when extension requests canvas list, include Worker-hosted canvases
3. Route capture commands to the correct Worker when user selects a Worker canvas
4. Forward Worker capture results to extension storage/popup

**Acceptance Criteria:**
- [ ] Extension popup shows Worker-hosted canvases alongside DOM canvases
- [ ] Clicking capture on a Worker canvas triggers capture in the correct Worker
- [ ] Worker capture results appear in extension result view
- [ ] FPS from Worker canvases is displayed

**Dependencies:** `p5-extension-worker-intercept`

---

#### Task `p5-extension-bundle`: Include Worker Bundle in Extension

**Files:**
- `package.json` (MODIFY) — add build steps
- `extensions/manifest.json` (MODIFY) — add web_accessible_resources

**Changes:**
1. Build step copies `dist/spector.worker.bundle.js` → `extensions/spector.worker.bundle.js`
2. Build step creates `extensions/spector.worker.bundle.func.js` (wrapped version)
3. `manifest.json` adds `spector.worker.bundle.func.js` to `web_accessible_resources` so Workers can load it
4. Content script declaration includes the worker bundle as needed

**Acceptance Criteria:**
- [ ] `npm run build` produces worker bundle in extensions/
- [ ] Extension manifest declares worker bundle as web-accessible resource
- [ ] Worker scripts on any page can load the bundle via `importScripts()`

**Dependencies:** `p4-webpack-worker`, `p5-extension-worker-intercept`

---

### Phase 6: Test Infrastructure (9 tasks)

---

#### Task `p6-jest-setup`: Set Up Jest Unit Test Infrastructure

**Files:**
- `jest.config.js` (NEW)
- `package.json` (MODIFY)

**Install:** `npm install --save-dev jest ts-jest @types/jest`

**jest.config.js:**
```javascript
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/test/unit/**/*.test.ts'],
    moduleFileExtensions: ['ts', 'tsx', 'js'],
    transform: { '^.+\\.ts$': 'ts-jest' },
    globals: { 'ts-jest': { tsconfig: 'src/tsconfig.json' } },
};
```

**package.json:** Add `"test:unit": "jest"`, update `"test"` to `"jest && playwright test"`

**Acceptance Criteria:**
- [ ] `npm run test:unit` executes and finds test files
- [ ] ts-jest transforms TypeScript correctly
- [ ] A canary test (`src/__tests__/canary.test.ts`) passes: `test('canary', () => expect(1+1).toBe(2))`

**Dependencies:** None

---

#### Tasks `p6-unit-*` (5 unit test tasks)

Each creates unit tests for the corresponding module. See task descriptions in the todo table above. All depend on `p6-jest-setup` + the module they test.

**Common patterns:**
- Mock `document` as undefined for Worker environment tests
- Mock `self` with `postMessage` and `addEventListener` for Worker message tests
- Use jest's `spyOn` for verifying `postMessage` calls
- Test both "DOM available" and "DOM unavailable" code paths

---

#### Task `p6-playwright-setup`: Set Up Playwright E2E Infrastructure

**Files:**
- `playwright.config.ts` (NEW)
- `test/e2e/` directory (NEW)
- `package.json` (MODIFY)

**Install:** `npm install --save-dev @playwright/test`

**playwright.config.ts:**
```typescript
import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: './test/e2e',
    use: {
        browserName: 'chromium',
        headless: true,
    },
    webServer: {
        command: 'npx http-server . -p 8081 -c-1',
        port: 8081,
        reuseExistingServer: true,
    },
});
```

**Acceptance Criteria:**
- [ ] `npm run test:e2e` launches Playwright with Chromium
- [ ] Local HTTP server serves sample/ and dist/ directories
- [ ] A canary E2E test loads a page successfully

**Dependencies:** `p6-jest-setup`

---

#### Task `p6-e2e-mainthread-offscreen`: E2E Test — Main-Thread OffscreenCanvas

**File:** `test/e2e/offscreen.spec.ts` (NEW)

**Test scenarios:**
1. Load `sample/offscreen.html`
2. Wait for canvas to render (check for non-blank pixels)
3. Inject Spector via page.evaluate(), trigger capture
4. Verify capture object structure (commands array non-empty)
5. Verify visual state contains base64 image data
6. Verify canvas dimensions in capture match OffscreenCanvas size

**Dependencies:** `p6-playwright-setup`, `p2-sample-offscreen`

---

#### Task `p6-e2e-worker-offscreen`: E2E Test — Worker OffscreenCanvas

**File:** `test/e2e/worker.spec.ts` (NEW)

**Test scenarios:**
1. Load `sample/worker.html`
2. Verify rendering occurs (Worker is active)
3. Trigger capture via page.evaluate() on main-thread Spector
4. Wait for capture event (from Worker via postMessage → WorkerBridge)
5. Verify capture has commands and visual state
6. Verify capture originated from Worker context

**Dependencies:** `p6-playwright-setup`, `p7-sample-worker`, `p4-manual-api`

---

### Phase 7: Samples & Documentation (4 tasks)

---

#### Task `p7-sample-worker`: Create Worker OffscreenCanvas Sample

**Files:**
- `sample/worker.html` (NEW) — host page
- `sample/js/workerHost.js` (NEW) — main-thread setup
- `sample/js/workerRenderer.js` (NEW) — Worker WebGL script

**workerHost.js:**
```javascript
const canvas = document.getElementById('display');
const offscreen = canvas.transferControlToOffscreen();
const worker = new Worker('js/workerRenderer.js');
worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen]);

const spector = new SPECTOR.Spector();
spector.spyWorker(worker);
document.getElementById('capture').onclick = () => spector.captureWorker(worker);
spector.onCapture.add(capture => console.log('Capture from Worker:', capture));
```

**workerRenderer.js:**
```javascript
importScripts('../../dist/spector.worker.bundle.js');
self.onmessage = function(e) {
    if (e.data.type === 'init') {
        const canvas = e.data.canvas;
        const gl = canvas.getContext('webgl2');
        // Set up shaders, buffers, draw rotating cube
        function render() {
            // ... draw commands ...
            requestAnimationFrame(render);  // rAF exists in modern Worker with OffscreenCanvas
        }
        render();
    }
};
```

**Acceptance Criteria:**
- [ ] Worker receives transferred OffscreenCanvas and renders WebGL scene
- [ ] Main thread creates Spector and spies on the Worker
- [ ] Capture button triggers capture in Worker, results display on main thread
- [ ] Page works in Chrome (Firefox OffscreenCanvas Worker support varies)

**Dependencies:** `p4-manual-api`, `p4-webpack-worker`

---

#### Tasks `p7-doc-*` (3 documentation tasks)

See task descriptions in the todo table. These create:
- Updated README with OffscreenCanvas section
- JSDoc on all new public API methods
- Architecture documentation with diagrams

**Dependencies:** All implementation tasks complete

---

## Dependency Graph (Execution Order)

```
Phase 1 (Parallel foundation):
  p1-canvas-factory ─────┬─→ p1-fix-visualState
  p1-fix-time             │─→ p1-fix-drawCallTexture  
  p1-fix-timeSpy          │
  p1-fix-contextSpy       │
                          │
Phase 2 (Validation):     │
  p2-tsconfig-worker ◄────┘
  p2-sample-offscreen ◄── all Phase 1
  p2-verify-mainthread ◄─ p2-sample-offscreen

Phase 3 (Bridge, parallel with Phase 2):
  p3-message-protocol ◄── p1-canvas-factory
  p3-worker-sender ◄───── p3-message-protocol
  p3-worker-bridge ◄───── p3-message-protocol
  p3-worker-spector ◄──── p3-worker-sender + Phase 1

Phase 4 (Injection):
  p4-worker-spy ◄──────── p3-worker-bridge + p3-worker-spector
  p4-worker-entry ◄────── p3-worker-spector
  p4-webpack-worker ◄──── p4-worker-entry
  p4-manual-api ◄──────── p3-worker-bridge + p4-worker-spy

Phase 5 (Extension):
  p5-extension-worker-intercept ◄── p4-worker-spy + p4-webpack-worker
  p5-extension-worker-bridge ◄───── p5-extension-worker-intercept
  p5-extension-bundle ◄──────────── p4-webpack-worker + p5-extension-worker-intercept

Phase 6 (Tests, partially parallel):
  p6-jest-setup (no deps)
  p6-unit-* ◄──── p6-jest-setup + corresponding module
  p6-playwright-setup ◄── p6-jest-setup
  p6-e2e-* ◄──── p6-playwright-setup + samples

Phase 7 (Docs, last):
  p7-sample-worker ◄── p4-manual-api
  p7-doc-* ◄── all implementation
```

**Maximum parallelism available:**
- Start: `p1-canvas-factory`, `p1-fix-time`, `p1-fix-timeSpy`, `p1-fix-contextSpy`, `p6-jest-setup` (5 parallel)
- After Phase 1: `p2-tsconfig-worker`, `p3-message-protocol`, `p1-fix-visualState`, `p1-fix-drawCallTexture` (4 parallel)
- Phase 2 and Phase 3 can proceed in parallel

---

## Risk Areas & Mitigation

### Risk 1: Synchronous `toDataURL()` Replacement (HIGH)

**Problem:** `OffscreenCanvas` doesn't have `toDataURL()`. `convertToBlob()` is async but the capture pipeline is synchronous.

**Mitigation:** Build a synchronous pixel-to-data-URI converter:
- Read pixels via `getImageData()` (synchronous)
- Encode as BMP data URI (BMP format is trivially simple: header + raw RGBA pixels)
- BMP data URIs are larger than PNG but avoid async complexity
- **Fallback:** If BMP size is unacceptable, restructure capture pipeline to support async visual state capture (larger change)

### Risk 2: Worker Constructor Interception (MEDIUM)

**Problem:** Wrapping `new Worker()` with blob URLs can break:
- Content Security Policy (CSP) may block blob URLs
- Module workers use `import` not `importScripts`
- Some bundlers inline worker code

**Mitigation:**
- Manual API (`spyWorker`) always works regardless of injection method
- Document CSP requirements (`blob:` source needed)
- Detect module workers via `options.type === 'module'` and use dynamic `import()` instead
- Provide `spector.worker.bundle.js` as a regular URL for manual inclusion

### Risk 3: Structured Clone Limitations (LOW)

**Problem:** `postMessage()` uses structured clone algorithm. If capture data contains non-cloneable values, it will throw.

**Mitigation:** ICapture already uses plain objects, arrays, numbers, and strings. Base64 data URIs are strings. WebGL constants are numbers. The only risk is `commandArguments` which might contain typed arrays — these are structured-clone compatible.

### Risk 4: OffscreenCanvas Browser Support (LOW)

**Problem:** OffscreenCanvas support varies:
- Chrome: Full support (main thread + Worker)
- Firefox: Partial (Worker support flagged in older versions)  
- Safari: Limited

**Mitigation:** Feature detection at every entry point. Clear documentation of browser requirements. Graceful fallback — if OffscreenCanvas unavailable, existing behavior unchanged.

### Risk 5: `requestAnimationFrame` in Workers (MEDIUM)

**Problem:** `requestAnimationFrame` is only available in Workers that have an OffscreenCanvas with `transferControlToOffscreen()`. Not all Worker rendering loops use rAF — some use `setTimeout`/`setInterval`.

**Mitigation:** TimeSpy already spies on both `requestAnimationFrame` AND `setTimeout`/`setInterval`. The existing frame detection logic handles both patterns. Workers using custom tick mechanisms can use the manual `setSpiedScope()` API.

---

## Out of Scope

These items are explicitly NOT part of this implementation:

1. **SharedWorker support** — SharedWorkers have different communication patterns (MessagePort) and are rarely used for WebGL. Can be added later.
2. **Service Worker support** — Service Workers don't have canvas access. Not relevant.
3. **WebGPU support** — WebGPU has its own debugging story. Separate project.
4. **Safari support** — Safari's OffscreenCanvas support is too limited. We'll document this.
5. **Async capture pipeline** — Restructuring the entire capture pipeline to be async would unlock better `convertToBlob()` support but is a massive refactor. Using synchronous BMP encoding instead.
6. **Worker DevTools panel** — A dedicated DevTools panel for Worker inspection. The current approach routes Worker captures through the existing extension UI.
7. **Source map support for Worker scripts** — Injected Worker bundles may break source maps. Documenting this limitation.
8. **Performance profiling** — This plan adds capture support, not performance profiling in Workers.

---

## Open Questions

1. **BMP vs PNG for synchronous data URIs:** BMP is trivially simple to encode synchronously but produces ~4x larger data URIs than PNG. For the typical 256×256 thumbnail, this means ~260KB per thumbnail vs ~65KB. Is this acceptable for capture data size? **Decision needed before implementing `p1-canvas-factory`.**

   > **Recommendation:** Use BMP. Capture data is transient (displayed once, not stored long-term), and 260KB per thumbnail is acceptable for a debugging tool. If size becomes an issue later, we can add a pure-JS PNG encoder.

2. **Module Worker support priority:** How important is `{ type: 'module' }` Worker support? It requires a different injection strategy (`import()` instead of `importScripts()`). **Can be deferred to a follow-up if non-module Workers cover the primary use case.**

3. **Worker bundle size budget:** The main Spector bundle is ~500KB. The worker bundle should be much smaller (no UI). Is there a target? **Estimate: ~100-150KB** (spies + states + recorders + bridge, no Ace editor, no CSS).

4. **Extension review/publication:** Does the extension need to be republished to the Chrome Web Store after these changes? Who handles that process?

---

## Estimated Effort

| Phase | Tasks | Estimated Effort | Parallelism |
|-------|-------|-----------------|-------------|
| Phase 1: Foundation | 6 | 2-3 days | High (4 independent tasks) |
| Phase 2: Validation | 3 | 1 day | Sequential |
| Phase 3: Bridge | 4 | 2-3 days | Medium (protocol first, then parallel) |
| Phase 4: Injection | 4 | 2-3 days | Medium |
| Phase 5: Extension | 3 | 2 days | Sequential |
| Phase 6: Tests | 9 | 3-4 days | High (unit tests parallel) |
| Phase 7: Docs & Samples | 4 | 1-2 days | High |
| **Total** | **33** | **~13-18 days** | |

**Critical path:** Phase 1 → Phase 3 → Phase 4 → Phase 5 (~9-12 days)

**Recommended team allocation:**
- **Developer 1:** Phases 1-4 (core implementation)
- **Developer 2:** Phase 6 test infrastructure (can start immediately with `p6-jest-setup`)
- **Both:** Phase 5 (extension), Phase 7 (docs)
