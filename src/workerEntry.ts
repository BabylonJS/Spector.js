// Entry point for the Worker bundle.
// Instantiates a headless WorkerSpector inside the Worker.
import { WorkerSpector } from "./backend/bridge/workerSpector";

// Auto-initialize when the bundle loads inside a Worker
const workerSpector = new WorkerSpector();

// Export for manual usage
export { WorkerSpector };
