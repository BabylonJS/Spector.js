import type { XRSessionSpector } from "../../polyfill/XRSessionSpector";
import { OriginFunctionHelper } from "../utils/originFunctionHelper";
import { TimeSpy } from "./timeSpy";

// tslint:disable:max-classes-per-file

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
        for (const Spy of TimeSpy.getRequestAnimationFrameFunctionNames()) {
            OriginFunctionHelper.resetOriginFunction(this.timeSpy.getSpiedScope(), Spy);
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
        for (const Spy of TimeSpy.getRequestAnimationFrameFunctionNames()) {
            this.timeSpy.spyRequestAnimationFrame(Spy, this.timeSpy.getSpiedScope());
        }
    }

    private init(): void {
        if (!navigator.xr) {
            return;
        }

        // define XR Polyfills.
        // we do them here in xrSpy.init so that we don't try to initialize them *unless* we are using WebXR,
        // since not all browsers will support experimental WebXR APIs.
        class XRWebGLLayerSpector extends XRWebGLLayer {
            private glContext: WebGLRenderingContext | WebGL2RenderingContext;
            constructor(
                session: XRSession,
                context: WebGLRenderingContext | WebGL2RenderingContext,
                layerInit?: XRWebGLLayerInit
            ) {
                super(session, context, layerInit);
                this.glContext = context;
            }

            public getContext() {
                return this.glContext;
            }
        }

        class XRWebGLBindingSpector extends XRWebGLBinding {
            private glContext: WebGLRenderingContext | WebGL2RenderingContext;
            constructor(session: XRSession, context: WebGLRenderingContext) {
                super(session, context);
                this.glContext = context;
            }

            public createProjectionLayer(init?: XRProjectionLayerInit): XRProjectionLayer {
                const layer = super.createProjectionLayer(init);
                (layer as any).glContext = this.glContext;
                return layer;
            }
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
                                renderStateInit.baseLayer as unknown as XRWebGLLayerSpector;
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
