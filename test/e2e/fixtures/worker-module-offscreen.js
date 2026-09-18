import { startRendering } from "./worker-module-offscreen-renderer.js";

self.addEventListener("message", function(event) {
    if (event.data?.type === "init") {
        startRendering(event.data.canvas);
    }
});
