import { readFileSync } from "fs";
import { join } from "path";
import { runInNewContext } from "vm";

describe("Module Worker native fallback", () => {
    const source = readFileSync(join(__dirname, "../../../extensions/moduleWorkerInjector.js"), "utf8");

    it("does not inspect inputs, fetch source, wrap messages, or generate blobs", () => {
        const world: any = {};
        runInNewContext(source, world);
        const scriptURL = { toString() { throw new Error("Unexpected conversion"); } };
        const options = { get type() { throw new Error("Unexpected options read"); } };
        const worker = {};
        const OriginalWorker = jest.fn(() => worker);

        expect(world.SpectorModuleInjector.injectModuleWorker(scriptURL, options, "", OriginalWorker))
            .toEqual({ worker, injected: false });
        expect(OriginalWorker).toHaveBeenCalledTimes(1);
        expect(OriginalWorker).toHaveBeenCalledWith(scriptURL, options);
    });

    it("propagates native constructor errors without retrying", () => {
        const world: any = {};
        runInNewContext(source, world);
        const error = new TypeError("native error");
        const OriginalWorker = jest.fn(() => { throw error; });

        expect(() => world.SpectorModuleInjector.injectModuleWorker("", {}, "", OriginalWorker)).toThrow(error);
        expect(OriginalWorker).toHaveBeenCalledTimes(1);
    });
});
