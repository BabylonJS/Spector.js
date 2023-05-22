export interface XRSessionSpector extends XRSession {
    glContext: WebGLRenderingContext | WebGL2RenderingContext;

    _updateRenderState: typeof XRSession.prototype.updateRenderState;
}
