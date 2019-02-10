import { WebGlObjectTag } from "../webGlObjects/baseWebGlObject";

export type WebGLRenderingContexts = (WebGLRenderingContext | WebGL2RenderingContext);

export type ExtensionList = { [key: string]: any };

export interface IContextInformation {
    readonly context: WebGLRenderingContexts;
    readonly contextVersion: number;
    readonly toggleCapture?: (capture: boolean) => void;
    readonly tagWebGlObject?: (object: any) => WebGlObjectTag;
    readonly extensions?: ExtensionList;
}
