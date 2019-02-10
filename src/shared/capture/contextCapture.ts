export interface IContextCapture {
    version: number;
    contextAttributes: any;
    capabilities: { [name: string]: any };
    extensions: { [name: string]: boolean };
    compressedTextures: { [name: string]: any };
}
