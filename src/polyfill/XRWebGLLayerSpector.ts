export class XRWebGLLayerSpector extends XRWebGLLayer {
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
