import { Observable } from "../../shared/utils/observable";
import { OriginFunctionHelper } from "../utils/originFunctionHelper";
import { IContextInformation } from "../types/contextInformation";

type CanvasConstructor = (new() => HTMLCanvasElement) | (new(...args: any[]) => OffscreenCanvas);

export class CanvasSpy {
    public readonly onContextRequested: Observable<IContextInformation>;

    constructor(private readonly canvas?: HTMLCanvasElement | OffscreenCanvas) {
        this.onContextRequested = new Observable<IContextInformation>();
        this.init();
    }

    private init(): void {
        // Needs both this.
        // tslint:disable-next-line
        const self = this;

        const getContextSpied = function (this: HTMLCanvasElement | OffscreenCanvas) {
            const OriginalCanvasConstructor: CanvasConstructor = this instanceof HTMLCanvasElement ?
                HTMLCanvasElement :
                OffscreenCanvas;

            const context = (self.canvas) ?
                OriginFunctionHelper.executeOriginFunction(this, "getContext", arguments) :
                OriginFunctionHelper.executePrototypeOriginFunction(this, OriginalCanvasConstructor, "getContext", arguments);

            if (arguments.length > 0 && arguments[0] === "2d") {
                return context;
            }

            if (context) {
                const contextAttributes = Array.prototype.slice.call(arguments);
                const isWebgl2 = (contextAttributes[0] === "webgl2" ||
                    contextAttributes[0] === "experimental-webgl2");

                const version = isWebgl2 ? 2 : 1;

                self.onContextRequested.trigger({
                    context,
                    contextVersion: version,
                });
            }

            return context;
        };

        if (this.canvas) {
            OriginFunctionHelper.storeOriginFunction(this.canvas, "getContext");
            this.canvas.getContext = getContextSpied;
        }
        else {
            OriginFunctionHelper.storePrototypeOriginFunction(HTMLCanvasElement, "getContext");
            (HTMLCanvasElement as any).prototype.getContext = getContextSpied;

            if (typeof OffscreenCanvas !== "undefined") {
                OriginFunctionHelper.storePrototypeOriginFunction(OffscreenCanvas, "getContext");
                (OffscreenCanvas as any).prototype.getContext = getContextSpied;
            }
        }
    }
}
