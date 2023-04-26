import { XRSessionSpector } from "../../polyfill/XRSessionSpector";
import { XRWebGLBindingSpector } from "../../polyfill/XRWebGLBindingSpector";
import { XRWebGLLayerSpector } from "../../polyfill/XRWebGLLayerSpector";
import { OriginFunctionHelper } from "../utils/originFunctionHelper";
import { TimeSpy } from "./timeSpy";

export class XRSpy {
    public currentXRSession: XRSessionSpector | undefined;
    private timeSpy: TimeSpy;
    constructor(timeSpy: TimeSpy) {
        this.timeSpy = timeSpy;
        this.init();
    }

    public spyXRSession(session: XRSessionSpector) {
        if (this.currentXRSession) {
            this.unspyXRSession();
        }
        for (const Spy of TimeSpy.requestAnimationFrameFunctions) {
            OriginFunctionHelper.resetOriginFunction(this.timeSpy.spiedWindow, Spy);
        }
        this.timeSpy.spyRequestAnimationFrame("requestAnimationFrame", session);
        this.currentXRSession = session;
    }

    public unspyXRSession() {
        if (!this.currentXRSession) {
            return;
        }

        OriginFunctionHelper.resetOriginFunction(this.currentXRSession, "requestAnimationFrame");
        this.currentXRSession = undefined;
        // listen to the regular frames again.
        for (const Spy of TimeSpy.requestAnimationFrameFunctions) {
            this.timeSpy.spyRequestAnimationFrame(Spy, this.timeSpy.spiedWindow);
        }
    }

    private init(): void {
        if (!navigator.xr) {
            return;
        }

        (window as any).XRWebGLLayer = XRWebGLLayerSpector;
        (window as any).XRWebGLBinding = XRWebGLBindingSpector;

        // polyfill request session so Spector gets access to the session object.
        const existingRequestSession = navigator.xr.requestSession;
        Object.defineProperty(navigator.xr, "requestSessionInternal", { writable: true });
        (navigator.xr as any).requestSessionInternal = existingRequestSession;

        const newRequestSession = (
            sessionMode: XRSessionMode,
            sessionInit?: any
        ): Promise<XRSession> => {
            const modifiedSessionPromise = (mode: XRSessionMode, init?: any): Promise<XRSession> => {
                return (navigator.xr as any).requestSessionInternal(mode, init).then((session: XRSession) => {
                    // listen to the XR Session here! When we do that, we'll stop listening to window.requestAnimationFrame
                    // and start listening to session.requestAnimationFrame

                    // Feed the gl context through the session
                    const spectorSession = session as XRSessionSpector;
                    spectorSession._updateRenderState = session.updateRenderState;
                    spectorSession.updateRenderState = async (
                        renderStateInit?: XRRenderStateInit
                    ): Promise<void> => {
                        if (renderStateInit.baseLayer) {
                            const polyfilledBaseLayer =
                                renderStateInit.baseLayer as XRWebGLLayerSpector;
                            spectorSession.glContext = polyfilledBaseLayer.getContext();
                        }

                        if (renderStateInit.layers) {
                            for (const layer of renderStateInit.layers) {
                                const layerAny: any = layer;
                                if (layerAny.glContext) {
                                    spectorSession.glContext = layerAny.glContext;
                                }
                            }
                        }
                        return spectorSession._updateRenderState(renderStateInit);
                    };

                    this.spyXRSession(spectorSession);
                    session.addEventListener("end", () => {
                        this.unspyXRSession();
                    });
                    return Promise.resolve(session);
                });
            };
            return modifiedSessionPromise(sessionMode, sessionInit);
        };


        Object.defineProperty(navigator.xr, "requestSession", { writable: true });
        (navigator.xr as any).requestSession = newRequestSession;
    }

}
